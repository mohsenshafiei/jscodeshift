/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as Collection from "../Collection";
import * as NodeCollection from "./Node";

import assert from "assert";
import once from "../utils/once";
import * as recast from "recast";

const types = recast.types.namedTypes;

const globalMethods = {
  /**
   * Inserts an ImportDeclaration at the top of the AST
   *
   * @param {string} sourcePath
   * @param {Array} specifiers
   */
  insertImportDeclaration: function (sourcePath: any, specifiers: any): any {
    assert.ok(
      sourcePath && typeof sourcePath === "string",
      "insertImportDeclaration(...) needs a source path"
    );

    assert.ok(
      specifiers && Array.isArray(specifiers),
      "insertImportDeclaration(...) needs an array of specifiers"
    );

    if (this.hasImportDeclaration(sourcePath)) {
      return this;
    }

    const importDeclaration = recast.types.builders.importDeclaration(
      specifiers,
      recast.types.builders.stringLiteral(sourcePath)
    );

    // @ts-ignore
    return this.forEach((path: any) => {
      if (path.value.type === "Program") {
        path.value.body.unshift(importDeclaration);
      }
    });
  },
  /**
   * Finds all ImportDeclarations optionally filtered by name
   *
   * @param {string} sourcePath
   * @return {Collection}
   */
  findImportDeclarations: function (sourcePath: any): any {
    assert.ok(
      sourcePath && typeof sourcePath === "string",
      "findImportDeclarations(...) needs a source path"
    );

    // @ts-ignore
    return this.find(types.ImportDeclaration, {
      source: { value: sourcePath },
    });
  },

  /**
   * Determines if the collection has an ImportDeclaration with the given sourcePath
   *
   * @param {string} sourcePath
   * @returns {boolean}
   */
  hasImportDeclaration: function (sourcePath: any) {
    assert.ok(
      sourcePath && typeof sourcePath === "string",
      "findImportDeclarations(...) needs a source path"
    );

    return this.findImportDeclarations(sourcePath).length > 0;
  },

  /**
   * Renames all ImportDeclarations with the given name
   *
   * @param {string} sourcePath
   * @param {string} newSourcePath
   * @return {Collection}
   */
  renameImportDeclaration: function (sourcePath: any, newSourcePath: any) {
    assert.ok(
      sourcePath && typeof sourcePath === "string",
      "renameImportDeclaration(...) needs a name to look for"
    );

    assert.ok(
      newSourcePath && typeof newSourcePath === "string",
      "renameImportDeclaration(...) needs a new name to rename to"
    );

    return this.findImportDeclarations(sourcePath).forEach((path: any) => {
      path.value.source.value = newSourcePath;
    });
  },
};

function register() {
  NodeCollection.registerer();
  Collection.registerMethods(globalMethods, types.Node);
}

exports.register = once(register);
