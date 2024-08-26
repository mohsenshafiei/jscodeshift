/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as Collection from "../Collection";

import { matchNode } from "../matchNode";
import once from "../utils/once";
import recast from "recast";

const Node = recast.types.namedTypes.Node;
var types = recast.types.namedTypes;

/**
 * @mixin
 */
const traversalMethods = {
  /**
   * Find nodes of a specific type within the nodes of this collection.
   *
   * @param {type}
   * @param {filter}
   * @return {Collection}
   */
  find: function (type: any, filter: any) {
    const paths: any = [];
    const visitorMethodName = "visit" + type;

    const visitor = {};
    function visit(path: any) {
      /*jshint validthis:true */
      if (!filter || matchNode(path.value, filter)) {
        paths.push(path);
      }
      // @ts-ignore
      this.traverse(path);
    }
    // @ts-ignore
    this.__paths.forEach(function (p: any, i: any) {
      // @ts-ignore
      const self = this;
      // @ts-ignore
      visitor[visitorMethodName] = function (path: any) {
        if (self.__paths[i] === path) {
          // @ts-ignore
          this.traverse(path);
        } else {
          return visit.call(this, path);
        }
      };
      recast.visit(p, visitor);
    }, this);

    return Collection.fromPaths(paths, this, type);
  },

  /**
   * Returns a collection containing the paths that create the scope of the
   * currently selected paths. Dedupes the paths.
   *
   * @return {Collection}
   */
  closestScope: function (): any {
    // @ts-ignore
    return this.map((path: any) => path.scope && path.scope.path);
  },

  /**
   * Traverse the AST up and finds the closest node of the provided type.
   *
   * @param {Collection}
   * @param {filter}
   * @return {Collection}
   */
  closest: function (type: any, filter: any): any {
    // @ts-ignore
    return this.map(function (path: any) {
      let parent = path.parent;
      while (
        parent &&
        !(
          type.check(parent.value) &&
          (!filter || matchNode(parent.value, filter))
        )
      ) {
        parent = parent.parent;
      }
      return parent || null;
    });
  },

  /**
   * Finds the declaration for each selected path. Useful for member expressions
   * or JSXElements. Expects a callback function that maps each path to the name
   * to look for.
   *
   * If the callback returns a falsey value, the element is skipped.
   *
   * @param {function} nameGetter
   *
   * @return {Collection}
   */
  getVariableDeclarators: function (nameGetter: any): any {
    // @ts-ignore
    return this.map(function (path: any) {
      /*jshint curly:false*/
      let scope = path.scope;
      if (!scope) return;
      const name = nameGetter.apply(path, arguments);
      if (!name) return;
      scope = scope.lookup(name);
      if (!scope) return;
      const bindings = scope.getBindings()[name];
      if (!bindings) return;
      // @ts-ignore
      const decl = Collection.fromPaths(bindings).closest(
        types.VariableDeclarator
      );
      if (decl.length === 1) {
        return decl.paths()[0];
      }
    }, types.VariableDeclarator);
  },
};

function toArray(value: any) {
  return Array.isArray(value) ? value : [value];
}

/**
 * @mixin
 */
const mutationMethods = {
  /**
   * Simply replaces the selected nodes with the provided node. If a function
   * is provided it is executed for every node and the node is replaced with the
   * functions return value.
   *
   * @param {Node|Array<Node>|function} nodes
   * @return {Collection}
   */
  replaceWith: function (nodes: any): any {
    // @ts-ignore
    return this.forEach(function (path: any, i: any) {
      const newNodes =
        typeof nodes === "function" ? nodes.call(path, path, i) : nodes;
      path.replace.apply(path, toArray(newNodes));
    });
  },

  /**
   * Inserts a new node before the current one.
   *
   * @param {Node|Array<Node>|function} insert
   * @return {Collection}
   */
  insertBefore: function (insert: any): any {
    // @ts-ignore
    return this.forEach(function (path: any, i: any) {
      const newNodes =
        typeof insert === "function" ? insert.call(path, path, i) : insert;
      path.insertBefore.apply(path, toArray(newNodes));
    });
  },

  /**
   * Inserts a new node after the current one.
   *
   * @param {Node|Array<Node>|function} insert
   * @return {Collection}
   */
  insertAfter: function (insert: any): any {
    // @ts-ignore
    return this.forEach(function (path: any, i: any) {
      const newNodes =
        typeof insert === "function" ? insert.call(path, path, i) : insert;
      path.insertAfter.apply(path, toArray(newNodes));
    });
  },

  remove: function (): any {
    // @ts-ignore
    return this.forEach((path: any) => path.prune());
  },
};

export function registerer() {
  Collection.registerMethods(traversalMethods, Node);
  Collection.registerMethods(mutationMethods, Node);
  Collection.setDefaultCollectionType(Node);
}

export const register = once(registerer);
