/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as Collection from "../Collection";
import * as NodeCollection from "./Node";
import once from "../utils/once";
import * as recast from "recast";

const astNodesAreEquivalent = recast.types.astNodesAreEquivalent;
const b = recast.types.builders;
var types = recast.types.namedTypes;

const VariableDeclarator = recast.types.namedTypes.VariableDeclarator;

// Types
type ASTNode = recast.types.namedTypes.Node;
interface NodePath<N = ASTNode, V = any> {
  node: N;
  value: V;
  scope: any;
  parent: any;
  get(...fields: (string | number)[]): any;
}

/**
 * @mixin
 */
const globalMethods = {
  /**
   * Finds all variable declarators, optionally filtered by name.
   *
   * @param {string} name
   * @return {Collection}
   */
  findVariableDeclarators: function (name: string): Collection.CollectionType {
    const filter = name ? { id: { name: name } } : null;
    // @ts-ignore
    return this.find(VariableDeclarator, filter);
  },
};

const filterMethods = {
  /**
   * Returns a function that returns true if the provided path is a variable
   * declarator and requires one of the specified module names.
   *
   * @param {string|Array} names A module name or an array of module names
   * @return {Function}
   */
  requiresModule: function (names: string[]) {
    if (names && !Array.isArray(names)) {
      names = [names];
    }
    const requireIdentifier = b.identifier("require");
    return function (path: NodePath) {
      const node = path.value;
      if (
        !VariableDeclarator.check(node) ||
        !types.CallExpression.check(node.init) ||
        !astNodesAreEquivalent(node.init.callee, requireIdentifier)
      ) {
        return false;
      }
      return (
        !names ||
        names.some((n: string) =>
          // @ts-ignore
          astNodesAreEquivalent(node.init.arguments[0], b.literal(n))
        )
      );
    };
  },
};

/**
 * @mixin
 */
const transformMethods = {
  /**
   * Renames a variable and all its occurrences.
   *
   * @param {string} newName
   * @return {Collection}
   */
  renameTo: function (newName: string): any {
    // TODO: Include JSXElements
    // @ts-ignore
    return this.forEach(function (path: NodePath) {
      const node = path.value;
      const oldName = node.id.name;
      const rootScope = path.scope;
      const rootPath = rootScope.path;
      Collection.fromPaths([rootPath])
        // @ts-ignore
        .find(types.Identifier, { name: oldName })
        .filter(function (path: NodePath) {
          // ignore non-variables
          const parent = path.parent.node;

          if (
            types.MemberExpression.check(parent) &&
            parent.property === path.node &&
            !parent.computed
          ) {
            // obj.oldName
            return false;
          }

          if (
            types.Property.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // { oldName: 3 }
            return false;
          }

          if (
            types.ObjectProperty.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // { oldName: 3 }
            return false;
          }

          if (
            types.ObjectMethod.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // { oldName() {} }
            return false;
          }

          if (
            types.MethodDefinition.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // class A { oldName() {} }
            return false;
          }

          if (
            types.ClassMethod.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // class A { oldName() {} }
            return false;
          }

          if (
            types.ClassProperty.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // class A { oldName = 3 }
            return false;
          }

          if (
            types.JSXAttribute.check(parent) &&
            parent.name === path.node &&
            // @ts-ignore
            !parent.computed
          ) {
            // <Foo oldName={oldName} />
            return false;
          }

          return true;
        })
        .forEach(function (path: NodePath) {
          let scope = path.scope;
          while (scope && scope !== rootScope) {
            if (scope.declares(oldName)) {
              return;
            }
            scope = scope.parent;
          }
          if (scope) {
            // identifier must refer to declared variable
            // It may look like we filtered out properties,
            // but the filter only ignored property "keys", not "value"s
            // In shorthand properties, "key" and "value" both have an
            // Identifier with the same structure.
            const parent = path.parent.node;
            if (
              types.Property.check(parent) &&
              parent.shorthand &&
              !parent.method
            ) {
              path.parent.get("shorthand").replace(false);
            }

            path.get("name").replace(newName);
          }
        });
    });
  },
};

function registerer() {
  NodeCollection.registerer();
  Collection.registerMethods(globalMethods);
  Collection.registerMethods(transformMethods, VariableDeclarator);
}

export const register = once(registerer);
export const filters = filterMethods;
