/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This replicates lodash's once functionality for our purposes.
 */
export default function (func: any) {
  let called = false;
  let result: any;
  return function (this: never, ...args: any) {
    if (called) {
      return result;
    }
    called = true;
    result = func.apply(this, args);
    return result;
  };
}
