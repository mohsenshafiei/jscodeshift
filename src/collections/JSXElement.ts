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
const requiresModule = require("./VariableDeclarator").filters.requiresModule;

const types = recast.types.namedTypes;
const JSXElement = types.JSXElement;
const JSXAttribute = types.JSXAttribute;
const Literal = types.Literal;

/**
 * Contains filter methods and mutation methods for processing JSXElements.
 * @mixin
 */
const globalMethods = {
  /**
   * Finds all JSXElements optionally filtered by name
   *
   * @param {string} name
   * @return {Collection}
   */
  findJSXElements: function (name: any): any {
    const nameFilter = name && { openingElement: { name: { name: name } } };
    // @ts-ignore
    return this.find(JSXElement, nameFilter);
  },

  /**
   * Finds all JSXElements by module name. Given
   *
   *     var Bar = require('Foo');
   *     <Bar />
   *
   * findJSXElementsByModuleName('Foo') will find <Bar />, without having to
   * know the variable name.
   */
  findJSXElementsByModuleName: function (moduleName: any): any {
    assert.ok(
      moduleName && typeof moduleName === "string",
      "findJSXElementsByModuleName(...) needs a name to look for"
    );

    // @ts-ignore
    return this.find(types.VariableDeclarator)
      .filter(requiresModule(moduleName))
      .map(function (path: any) {
        const id = path.value.id.name;
        if (id) {
          return (
            Collection.fromPaths([path])
              // @ts-ignore
              .closestScope()
              .findJSXElements(id)
              .paths()
          );
        }
      });
  },
};

const filterMethods = {
  /**
   * Filter method for attributes.
   *
   * @param {Object} attributeFilter
   * @return {function}
   */
  hasAttributes: function (attributeFilter: any) {
    const attributeNames = Object.keys(attributeFilter);
    return function filter(path: any) {
      if (!JSXElement.check(path.value)) {
        return false;
      }
      const elementAttributes = Object.create(null);
      path.value.openingElement.attributes.forEach(function (attr: any) {
        // @ts-ignore
        if (!JSXAttribute.check(attr) || !(attr.name.name in attributeFilter)) {
          return;
        }
        // @ts-ignore
        elementAttributes[attr.name.name] = attr;
      });

      return attributeNames.every(function (name) {
        if (!(name in elementAttributes)) {
          return false;
        }

        const value = elementAttributes[name].value;
        const expected = attributeFilter[name];

        // Only when value is truthy access it's properties
        const actual = !value
          ? value
          : Literal.check(value)
          ? value.value
          : value.expression;

        if (typeof expected === "function") {
          return expected(actual);
        }

        // Literal attribute values are always strings
        return String(expected) === actual;
      });
    };
  },

  /**
   * Filter elements which contain a specific child type
   *
   * @param {string} name
   * @return {function}
   */
  hasChildren: function (name: any) {
    return function filter(path: any) {
      return (
        JSXElement.check(path.value) &&
        path.value.children.some(
          (child: any) =>
            // @ts-ignore
            JSXElement.check(child) && child.openingElement.name.name === name
        )
      );
    };
  },
};

/**
 * @mixin
 */
const traversalMethods = {
  /**
   * Returns all child nodes, including literals and expressions.
   *
   * @return {Collection}
   */
  childNodes: function () {
    const paths: any = [];
    // @ts-ignore
    this.forEach(function (path: any) {
      const children = path.get("children");
      const l = children.value.length;
      for (let i = 0; i < l; i++) {
        paths.push(children.get(i));
      }
    });
    return Collection.fromPaths(paths, this);
  },

  /**
   * Returns all children that are JSXElements.
   *
   * @return {JSXElementCollection}
   */
  childElements: function () {
    const paths: any = [];
    // @ts-ignore
    this.forEach(function (path: any) {
      const children = path.get("children");
      const l = children.value.length;
      for (let i = 0; i < l; i++) {
        if (types.JSXElement.check(children.value[i])) {
          paths.push(children.get(i));
        }
      }
    });
    return Collection.fromPaths(paths, this, JSXElement);
  },

  /**
   * Returns all children that are of jsxElementType.
   *
   * @return {Collection<jsxElementType>}
   */
  childNodesOfType: function (jsxChildElementType: any) {
    const paths: any = [];
    // @ts-ignore
    this.forEach(function (path: any) {
      const children = path.get("children");
      const l = children.value.length;
      for (let i = 0; i < l; i++) {
        if (jsxChildElementType.check(children.value[i])) {
          paths.push(children.get(i));
        }
      }
    });
    return Collection.fromPaths(paths, this, jsxChildElementType);
  },
};

const mappingMethods = {
  /**
   * Given a JSXElement, returns its "root" name. E.g. it would return "Foo" for
   * both <Foo /> and <Foo.Bar />.
   *
   * @param {NodePath} path
   * @return {string}
   */
  getRootName: function (path: any) {
    let name = path.value.openingElement.name;
    while (types.JSXMemberExpression.check(name)) {
      name = name.object;
    }

    return (name && name.name) || null;
  },
};

function registerer() {
  NodeCollection.registerer();
  Collection.registerMethods(globalMethods, types.Node);
  Collection.registerMethods(traversalMethods, JSXElement);
}

export const register = once(registerer);
export const filters = filterMethods;
export const mappings = mappingMethods;
