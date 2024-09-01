/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This replicates lodash's once functionality for our purposes.
 */
export function once<T extends (...args: string[]) => ReturnType<T>>(
  func: T
): T {
  let called = false;
  let result: ReturnType<T>;
  return function (this: never, ...args: Parameters<T>): ReturnType<T> {
    if (called) {
      return result;
    }
    called = true;
    result = func.apply(this, args);
    return result;
  } as T;
}

export default once;
