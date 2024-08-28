/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import assert from "assert";
import intersection from "./utils/intersection";
import * as recast from "recast";
import union from "./utils/union";

import * as ASTTypes from "ast-types/lib/types";
import * as CollectionType from "./types/Collection";
import { JSCodeshift, Options } from "./types/core";

const astTypes = recast.types;
var types = astTypes.namedTypes;
const NodePath = astTypes.NodePath;
const Node = types.Node;

/**
 * This represents a generic collection of node paths. It only has a generic
 * API to access and process the elements of the list. It doesn't know anything
 * about AST types.
 *
 * @mixes traversalMethods
 * @mixes mutationMethods
 * @mixes transformMethods
 * @mixes globalMethods
 */
class Collection<N> {
  /**
   * @param {Array} paths An array of AST paths
   * @param {Collection} parent A parent collection
   * @param {Array} types An array of types all the paths in the collection
   *  have in common. If not passed, it will be inferred from the paths.
   * @return {Collection}
   */

  public __paths: Array<CollectionType.ASTPath<N>>;
  private _parent: any;
  private _types: Array<ASTTypes.Type<any>> | undefined;

  constructor(
    paths: Array<CollectionType.ASTPath<N>>,
    parent: CollectionType.Collection<any>,
    types?: Array<ASTTypes.Type<any>>
  ) {
    assert.ok(Array.isArray(paths), "Collection is passed an array");
    assert.ok(
      paths.every((p) => p instanceof NodePath),
      "Array contains only paths"
    );
    this._parent = parent;
    this.__paths = paths;
    if (types && !Array.isArray(types)) {
      types = _toTypeArray(types);
    } else if (!types || (Array.isArray(types) && types.length === 0)) {
      types = _inferTypes(paths);
    }
    this._types = types && types.length === 0 ? _defaultType : types;
  }

  /**
   * Returns a new collection containing the nodes for which the callback
   * returns true.
   *
   * @param {function} callback
   * @return {Collection}
   */
  filter<S extends N>(
    callback: (
      path: CollectionType.ASTPath<N>,
      i: number,
      paths: Array<CollectionType.ASTPath<N>>
    ) => path is CollectionType.ASTPath<S>
  ) {
    // @ts-ignore
    return new this.constructor(this.__paths.filter(callback), this);
  }

  /**
   * Executes callback for each node/path in the collection.
   *
   * @param {function} callback
   * @return {Collection} The collection itself
   */
  forEach(
    callback: (
      path: CollectionType.ASTPath<N>,
      i: number,
      paths: Array<CollectionType.ASTPath<N>>
    ) => void
  ) {
    this.__paths.forEach(
      (
        path: CollectionType.ASTPath<N>,
        i: number,
        paths: Array<CollectionType.ASTPath<N>>
      ) => callback.call(path, path, i, paths)
    );
    return this;
  }

  /**
   * Tests whether at-least one path passes the test implemented by the provided callback.
   *
   * @param {function} callback
   * @return {boolean}
   */
  some(
    callback: (
      path: CollectionType.ASTPath<N>,
      i: number,
      paths: Array<CollectionType.ASTPath<N>>
    ) => boolean
  ) {
    return this.__paths.some(
      (
        path: CollectionType.ASTPath<N>,
        i: number,
        paths: Array<CollectionType.ASTPath<N>>
      ) => callback.call(path, path, i, paths)
    );
  }

  /**
   * Tests whether all paths pass the test implemented by the provided callback.
   *
   * @param {function} callback
   * @return {boolean}
   */
  every(
    callback: (
      path: CollectionType.ASTPath<N>,
      i: number,
      paths: Array<CollectionType.ASTPath<N>>
    ) => boolean
  ) {
    return this.__paths.every((path, i, paths) =>
      callback.call(path, path, i, paths)
    );
  }

  /**
   * Executes the callback for every path in the collection and returns a new
   * collection from the return values (which must be paths).
   *
   * The callback can return null to indicate to exclude the element from the
   * new collection.
   *
   * If an array is returned, the array will be flattened into the result
   * collection.
   *
   * @param {function} callback
   * @param {Type} type Force the new collection to be of a specific type
   */
  map<T = ASTTypes.ASTNode>(
    callback: (
      path: CollectionType.ASTPath<N>,
      i: number,
      paths: Array<CollectionType.ASTPath<N>>
    ) =>
      | CollectionType.ASTPath<T>
      | Array<CollectionType.ASTPath<T>>
      | null
      | undefined,
    type: ASTTypes.Type<any>
  ) {
    const paths: Array<CollectionType.ASTPath<T>> = [];
    this.forEach(function (path: CollectionType.ASTPath<N>) {
      /*jshint eqnull:true*/
      let result:
        | CollectionType.ASTPath<T>
        | Array<CollectionType.ASTPath<T>>
        | null
        // @ts-ignore
        | undefined = callback.apply(path, arguments);
      if (result == null) return;
      if (!Array.isArray(result)) {
        result = [result];
      }
      for (let i = 0; i < result.length; i++) {
        if (paths.indexOf(result[i]) === -1) {
          paths.push(result[i]);
        }
      }
    });
    return fromPaths(paths, this, type);
  }

  /**
   * Returns the number of elements in this collection.
   *
   * @return {number}
   */
  size(): number {
    return this.__paths.length;
  }

  /**
   * Returns the number of elements in this collection.
   *
   * @return {number}
   */
  get length(): number {
    return this.__paths.length;
  }

  /**
   * Returns an array of AST nodes in this collection.
   *
   * @return {Array}
   */
  nodes(): N[] {
    return this.__paths.map((p) => p.value);
  }

  paths(): Array<CollectionType.ASTPath<N>> {
    return this.__paths;
  }

  getAST(): Array<CollectionType.ASTPath<any>> {
    if (this._parent) {
      return this._parent.getAST();
    }
    return this.__paths;
  }

  toSource(this: JSCodeshift, options: Options) {
    if (this._parent) {
      return this._parent.toSource(options);
    }
    if (this.__paths.length === 1) {
      return recast.print(this.__paths[0], options).code;
    } else {
      return this.__paths.map(
        (p: CollectionType.ASTPath<N>) => recast.print(p as any, options).code
      );
    }
  }

  /**
   * Returns a new collection containing only the element at position index.
   *
   * In case of a negative index, the element is taken from the end:
   *
   *   .at(0)  - first element
   *   .at(-1) - last element
   *
   * @param {number} index
   * @return {Collection}
   */
  at(index: number) {
    return fromPaths(
      this.__paths.slice(index, index === -1 ? undefined : index + 1),
      this
    );
  }

  /**
   * Proxies to NodePath#get of the first path.
   *
   * @param {string|number} ...fields
   */
  get() {
    const path = this.__paths[0];
    if (!path) {
      throw Error(
        'You cannot call "get" on a collection with no paths. ' +
          'Instead, check the "length" property first to verify at least 1 path exists.'
      );
    }

    // @ts-ignore
    return path.get.apply(path, arguments);
  }

  /**
   * Returns the type(s) of the collection. This is only used for unit tests,
   * I don't think other consumers would need it.
   *
   * @return {Array<string>}
   */
  getTypes(): ASTTypes.Type<any>[] | undefined {
    return this._types;
  }

  /**
   * Returns true if this collection has the type 'type'.
   *
   * @param {Type} type
   * @return {boolean}
   */
  isOfType(type: ASTTypes.Type<any>): boolean | undefined {
    return (
      !!type && this._types && this._types.indexOf(type.toString() as any) > -1
    );
  }
}

/**
 * Given a set of paths, this infers the common types of all paths.
 * @private
 * @param {Array} paths An array of paths.
 * @return {Type} type An AST type
 */
function _inferTypes<N>(paths: Array<CollectionType.ASTPath<N>>) {
  let _types: Array<ASTTypes.Type<any>> = [];

  if (paths.length > 0 && Node.check(paths[0].node)) {
    // @ts-ignore
    const nodeType = types[paths[0].node.type];
    const sameType =
      paths.length === 1 ||
      paths.every((path: CollectionType.ASTPath<N>) =>
        nodeType.check(path.node)
      );

    if (sameType) {
      _types = [nodeType.toString()].concat(
        astTypes.getSupertypeNames(nodeType.toString())
      );
    } else {
      // try to find a common type
      // @ts-ignore
      _types = intersection(
        paths.map((path: CollectionType.ASTPath<any>) =>
          astTypes.getSupertypeNames(path.node.type)
        )
      );
    }
  }

  return _types;
}

export type ICollection = typeof Collection;

function _toTypeArray(value: any) {
  value = !Array.isArray(value) ? [value] : value;
  value = value.map((v: any) => v.toString());
  if (value.length > 1) {
    return union([value].concat(intersection(value.map(_getSupertypeNames))));
  } else {
    return value.concat(_getSupertypeNames(value[0]));
  }
}

function _getSupertypeNames(type: string) {
  try {
    return astTypes.getSupertypeNames(type);
  } catch (error: any) {
    if (error.message === "") {
      // Likely the case that the passed type wasn't found in the definition
      // list. Maybe a typo. ast-types doesn't throw a useful error in that
      // case :(
      throw new Error(
        '"' + type + '" is not a known AST node type. Maybe a typo?'
      );
    }
    throw error;
  }
}

/**
 * Creates a new collection from an array of node paths.
 *
 * If type is passed, it will create a typed collection if such a collection
 * exists. The nodes or path values must be of the same type.
 *
 * Otherwise it will try to infer the type from the path list. If every
 * element has the same type, a typed collection is created (if it exists),
 * otherwise, a generic collection will be created.
 *
 * @ignore
 * @param {Array} paths An array of paths
 * @param {Collection} parent A parent collection
 * @param {Type} type An AST type
 * @return {Collection}
 */
export function fromPaths<N>(
  paths: Array<CollectionType.ASTPath<N>>,
  parent?: any,
  type?: any
) {
  assert.ok(
    paths.every((n: CollectionType.ASTPath<N>) => n instanceof NodePath),
    "Every element in the array should be a NodePath"
  );

  return new Collection(paths, parent, type);
}

/**
 * Creates a new collection from an array of nodes. This is a convenience
 * method which converts the nodes to node paths first and calls
 *
 *    Collections.fromPaths(paths, parent, type)
 *
 * @ignore
 * @param {Array} nodes An array of AST nodes
 * @param {Collection} parent A parent collection
 * @param {Type} type An AST type
 * @return {Collection}
 */
export function fromNodes(nodes: any, parent?: any, type?: ASTTypes.Type<any>) {
  assert.ok(
    nodes.every((n: any) => Node.check(n)),
    "Every element in the array should be a Node"
  );
  return fromPaths(
    nodes.map((n: any) => new NodePath(n)),
    parent,
    type
  );
}

const CPt: any = Collection.prototype;

/**
 * This function adds the provided methods to the prototype of the corresponding
 * typed collection. If no type is passed, the methods are added to
 * Collection.prototype and are available for all collections.
 *
 * @param {Object} methods Methods to add to the prototype
 * @param {Type=} type Optional type to add the methods to
 */
export function registerMethods(methods: any, type?: any) {
  for (const methodName in methods) {
    if (!methods.hasOwnProperty(methodName)) {
      return;
    }
    if (hasConflictingRegistration(methodName, type)) {
      let msg = `There is a conflicting registration for method with name "${methodName}".\nYou tried to register an additional method with `;

      if (type) {
        msg += `type "${type.toString()}".`;
      } else {
        msg += "universal type.";
      }

      msg += "\nThere are existing registrations for that method with ";

      const conflictingRegistrations = CPt[methodName].typedRegistrations;

      if (conflictingRegistrations) {
        msg += `type ${Object.keys(conflictingRegistrations).join(", ")}.`;
      } else {
        msg += "universal type.";
      }

      throw Error(msg);
    }
    if (!type) {
      CPt[methodName] = methods[methodName];
    } else {
      type = type.toString();
      if (!CPt.hasOwnProperty(methodName)) {
        installTypedMethod(methodName);
      }
      var registrations = CPt[methodName].typedRegistrations;
      registrations[type] = methods[methodName];
      astTypes.getSupertypeNames(type).forEach(function (name: any) {
        registrations[name] = false;
      });
    }
  }
}

function installTypedMethod(methodName: any) {
  if (CPt.hasOwnProperty(methodName)) {
    throw new Error(
      `Internal Error: "${methodName}" method is already installed`
    );
  }

  const registrations: any = {};

  function typedMethod() {
    const types = Object.keys(registrations);

    for (let i = 0; i < types.length; i++) {
      const currentType = types[i];
      // @ts-ignore
      if (registrations[currentType] && this.isOfType(currentType)) {
        // @ts-ignore
        return registrations[currentType].apply(this, arguments);
      }
    }

    throw Error(
      // @ts-ignore
      `You have a collection of type [${this.getTypes()}]. ` +
        `"${methodName}" is only defined for one of [${types.join("|")}].`
    );
  }

  typedMethod.typedRegistrations = registrations;

  CPt[methodName] = typedMethod;
}

export function hasConflictingRegistration(methodName: any, type: any) {
  if (!type) {
    return CPt.hasOwnProperty(methodName);
  }

  if (!CPt.hasOwnProperty(methodName)) {
    return false;
  }

  const registrations = CPt[methodName] && CPt[methodName].typedRegistrations;

  if (!registrations) {
    return true;
  }

  type = type.toString();

  if (registrations.hasOwnProperty(type)) {
    return true;
  }

  return astTypes.getSupertypeNames(type.toString()).some(function (name) {
    return !!registrations[name];
  });
}

var _defaultType: Array<ASTTypes.Type<any>> | undefined = [];

/**
 * Sets the default collection type. In case a collection is created form an
 * empty set of paths and no type is specified, we return a collection of this
 * type.
 *
 * @ignore
 * @param {Type} type
 */
export function setDefaultCollectionType(type: ASTTypes.Type<any>) {
  _defaultType = _toTypeArray(type);
}
