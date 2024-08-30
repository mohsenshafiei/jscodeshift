/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as recast from "recast";
import * as CoreTypes from "./types/core";
import { NodeWithLocation, Template } from "./types/template";

const builders = recast.types.builders;
const types = recast.types.namedTypes;

function splice<T>(arr: T[], element: T, replacement: T | T[]): void {
  const index = arr.indexOf(element);
  if (index !== -1) {
    arr.splice(
      index,
      1,
      ...(Array.isArray(replacement) ? replacement : [replacement])
    );
  }
}

function cleanLocation(node: NodeWithLocation) {
  delete node.start;
  delete node.end;
  delete node.loc;
  return node;
}

function ensureStatement(node: any) {
  return types.Statement.check(node)
    ? // Removing the location information seems to ensure that the node is
      // correctly reprinted with a trailing semicolon
      cleanLocation(node as any)
    : builders.expressionStatement(node);
}

function getVistor(varNames: any, nodes: any) {
  return {
    visitIdentifier: function (path: any) {
      // @ts-ignore
      this.traverse(path);
      const node = path.node;
      const parent = path.parent.node;

      // If this identifier is not one of our generated ones, do nothing
      const varIndex = varNames.indexOf(node.name);
      if (varIndex === -1) {
        return;
      }

      let replacement = nodes[varIndex];
      nodes[varIndex] = null;

      // If the replacement is an array, we need to explode the nodes in context
      if (Array.isArray(replacement)) {
        if (types.Function.check(parent) && parent.params.indexOf(node) > -1) {
          // Function parameters: function foo(${bar}) {}
          splice(parent.params, node, replacement);
        } else if (types.VariableDeclarator.check(parent)) {
          // Variable declarations: var foo = ${bar}, baz = 42;
          splice(path.parent.parent.node.declarations, parent, replacement);
        } else if (types.ArrayExpression.check(parent)) {
          // Arrays: var foo = [${bar}, baz];
          splice(parent.elements, node, replacement);
        } else if (types.Property.check(parent) && parent.shorthand) {
          // Objects: var foo = {${bar}, baz: 42};
          splice(path.parent.parent.node.properties, parent, replacement);
        } else if (
          types.CallExpression.check(parent) &&
          parent.arguments.indexOf(node) > -1
        ) {
          // Function call arguments: foo(${bar}, baz)
          splice(parent.arguments, node, replacement);
        } else if (types.ExpressionStatement.check(parent)) {
          // Generic sequence of statements: { ${foo}; bar; }
          path.parent.replace.apply(
            path.parent,
            replacement.map(ensureStatement)
          );
        } else {
          // Every else, let recast take care of it
          path.replace.apply(path, replacement);
        }
      } else if (types.ExpressionStatement.check(parent)) {
        path.parent.replace(ensureStatement(replacement));
      } else {
        path.replace(replacement);
      }
    },
  };
}

function replaceNodes(
  src: string,
  varNames: any,
  nodes: CoreTypes.ASTNode,
  parser: CoreTypes.Parser
) {
  const ast = recast.parse(src, { parser });
  recast.visit(ast, getVistor(varNames, nodes));
  return ast;
}

let varNameCounter = 0;
function getUniqueVarName() {
  return `$jscodeshift${varNameCounter++}$`;
}

export function withParser(parser: CoreTypes.Parser): Template {
  function statements(template: any /*, ...nodes*/) {
    template = Array.from(template);
    const nodes: any = Array.from(arguments).slice(1);
    const varNames: any = nodes.map(() => getUniqueVarName());
    const src: any = template.reduce(
      (result: any, elem: any, i: number) => result + varNames[i - 1] + elem
    );

    return replaceNodes(src, varNames, nodes, parser).program.body;
  }

  function statement(/*template, ...nodes*/) {
    // @ts-ignore
    return statements.apply(null, arguments)[0];
  }

  function expression(template: any /*, ...nodes*/) {
    // wrap code in `(...)` to force evaluation as expression
    template = Array.from(template);
    if (template.length > 0) {
      template[0] = "(" + template[0];
      template[template.length - 1] += ")";
    }

    const expression = statement.apply(
      null,
      // @ts-ignore
      [template].concat(Array.from(arguments).slice(1))
    ).expression;

    // Remove added parens
    if (expression.extra) {
      expression.extra.parenthesized = false;
    }

    return expression;
  }

  function asyncExpression(template: any /*, ...nodes*/) {
    template = Array.from(template);
    if (template.length > 0) {
      template[0] = "async () => (" + template[0];
      template[template.length - 1] += ")";
    }

    const expression = statement.apply(
      null,
      // @ts-ignore
      [template].concat(Array.from(arguments).slice(1))
    ).expression.body;

    // Remove added parens
    if (expression.extra) {
      expression.extra.parenthesized = false;
    }
    return expression;
  }
  return { statements, statement, expression, asyncExpression };
}

export default withParser;
