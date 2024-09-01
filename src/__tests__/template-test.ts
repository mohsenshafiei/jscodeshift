/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import core from "../core";
import { JSCodeshift } from "../types/core";
import flowParser from "../../parser/flow";
import temp from "../template";

import * as CoreTypes from "../../src/types/core";
import recast from "recast";

describe("Templates", () => {
  let statements: <T>(args: TemplateStringsArray, ...values: T[]) => string;
  let statement: <T>(args: TemplateStringsArray, ...values: T[]) => string;
  let expression: <T>(args: TemplateStringsArray, ...values: T[]) => string;
  let asyncExpression: <T>(
    args: TemplateStringsArray,
    ...values: T[]
  ) => string;
  let jscodeshift: JSCodeshift;

  beforeEach(() => {
    jscodeshift = core;
    const template = jscodeshift.template;
    expression = template.expression;
    statement = template.statement;
    statements = template.statements;
    asyncExpression = template.asyncExpression;
  });

  it("interpolates expression nodes with source code", () => {
    let input = `var foo = bar;
if(bar) {
  console.log(42);
}`;

    let expected = `var foo = alert(bar);
if(alert(bar)) {
  console.log(42);
}`;

    const x = jscodeshift(input);

    expect(
      jscodeshift(input)
        .find("Identifier", { name: "bar" })
        .replaceWith(
          (path: CoreTypes.ASTPath<any>) => expression`alert(${path.node})`
        )
        .toSource()
    ).toEqual(expected);
  });

  it("interpolates statement nodes with source code", () => {
    let input = `for (var i = 0; i < 10; i++) {
  console.log(i);
  console.log(i / 2);
}`;

    let expected = `var i = 0;
while (i < 10) {
  console.log(i);
  console.log(i / 2);
  i++;
}`;

    expect(
      jscodeshift(input)
        .find("ForStatement")
        .replaceWith(
          (p: CoreTypes.ASTPath<any>) => statements`
            ${p.node.init};
            while (${p.node.test}) {
              ${p.node.body.body}
              ${p.node.update};
            }`
        )
        .toSource()
    ).toEqual(expected);
  });

  it("can be used with a different parser", async () => {
    const parser = flowParser();
    const template = temp(parser);
    const node = { type: "Literal", value: 41 };

    expect(
      jscodeshift(template.expression`1 + ${node}`, { parser }).toSource()
    ).toEqual("1 + 41");
  });

  it("handles out-of-order traversal", () => {
    const input = "var x";
    const expected = "class X extends a {f(b) {}}";

    const a = jscodeshift.identifier("a");
    const b = jscodeshift.identifier("b");

    const classDecl = statement`
      class X extends ${a} {f(${b}) {}}
    `;

    expect(
      jscodeshift(input)
        .find("VariableDeclaration")
        .replaceWith(classDecl)
        .toSource()
    ).toEqual(expected);
  });
  it("correctly parses expressions without any interpolation", () => {
    const expected = "function() {}";
    expect(jscodeshift(expression`function() {}`).toSource()).toEqual(expected);
  });

  it.each(["babel", "babylon", "flow", "ts", "tsx"])(
    "asyncExpression correctly parses expressions with await -- %s",
    (parser: string) => {
      const expected = "{\n  bar: await baz\n}";
      const j = jscodeshift.withParser(parser);

      expect(
        jscodeshift(asyncExpression`{\n  bar: await baz\n}`).toSource()
      ).toEqual(expected);
    }
  );

  describe("explode arrays", () => {
    it("explodes arrays in function definitions", () => {
      let input = "var foo = [a, b];";
      let expected = "var foo = function foo(a, b, c) {};";

      expect(
        jscodeshift(input)
          .find("ArrayExpression")
          .replaceWith(
            (p: CoreTypes.ASTPath<any>) =>
              expression`function foo(${p.node.elements}, c) {}`
          )
          .toSource()
      ).toEqual(expected);

      expected = "var foo = function(a, b, c) {};";

      expect(
        jscodeshift(input)
          .find("ArrayExpression")
          .replaceWith(
            (p: CoreTypes.ASTPath<any>) =>
              expression`function(${p.node.elements}, c) {}`
          )
          .toSource()
      ).toEqual(expected);

      expected = "var foo = (a, b) => {};";

      expect(
        jscodeshift(input)
          .find("ArrayExpression")
          .replaceWith(
            (p: CoreTypes.ASTPath<any>) => expression`${p.node.elements} => {}`
          )
          .toSource()
      ).toEqual(expected);

      expected = "var foo = (a, b, c) => {};";

      expect(
        jscodeshift(input)
          .find("ArrayExpression")
          .replaceWith(
            (p: CoreTypes.ASTPath<any>) =>
              expression`(${p.node.elements}, c) => {}`
          )
          .toSource()
      ).toEqual(expected);
    });

    it("explodes arrays in variable declarations", () => {
      let input = "var foo = [a, b];";
      let expected = "var foo, a, b;";
      expect(
        jscodeshift(input)
          .find("VariableDeclaration")
          // Need to use a block here because the arrow doesn't seem to be
          // compiled with a line break after the return statement. Can't repro
          // outside here though
          .replaceWith((p: CoreTypes.ASTPath<any>) => {
            const node = p.node.declarations[0];
            return statement`var ${node.id}, ${node.init.elements};`;
          })
          .toSource()
      ).toEqual(expected);
    });

    it("explodes arrays in array expressions", () => {
      let input = "var foo = [a, b];";
      let expected = "var foo = [a, b, c];";
      expect(
        jscodeshift(input)
          .find("ArrayExpression")
          .replaceWith(
            (p: CoreTypes.ASTPath<any>) => expression`[${p.node.elements}, c]`
          )
          .toSource()
      ).toEqual(expected);
    });

    it("explodes arrays in object expressions", () => {
      let input = "var foo = {a, b};";
      let expected = /var foo = \{\s*a,\s*b,\s*c: 42\s*};/;
      expect(
        jscodeshift(input)
          .find("ObjectExpression")
          .replaceWith(
            (p: CoreTypes.ASTPath<any>) =>
              expression`{${p.node.properties}, c: 42}`
          )
          .toSource()
      ).toMatch(expected);
    });

    it("explodes arrays in call expressions", () => {
      let input = "var foo = [a, b];";
      let expected = "var foo = bar(a, b, c);";

      expect(
        jscodeshift(input)
          .find("ArrayExpression")
          .replaceWith(
            (p: CoreTypes.ASTPath<any>) =>
              expression`bar(${p.node.elements}, c)`
          )
          .toSource()
      ).toEqual(expected);
    });
  });
});
