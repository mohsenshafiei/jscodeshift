/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

function hasOwn(obj: object, key: string | symbol | number): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isNode(value: any): value is object {
  return value !== null && typeof value === "object";
}

export function matchNode<T>(haystack: T, needle: T): boolean {
  if (typeof needle === "function") {
    return (needle as (value: T) => boolean)(haystack);
  }

  if (isNode(needle) && isNode(haystack)) {
    return Object.keys(needle).every((property) => {
      return (
        hasOwn(haystack, property) &&
        matchNode((haystack as any)[property], (needle as any)[property])
      );
    });
  }

  if (typeof haystack === typeof needle) {
    return haystack === needle;
  }

  return false;
}
