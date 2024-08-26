/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function union<T>(arrays: T[][]): T[] {
  const result = new Set<T>(arrays[0]);

  let i: number, j: number, array: T[];
  for (i = 1; i < arrays.length; i++) {
    array = arrays[i];
    for (j = 0; j < array.length; j++) {
      result.add(array[j]);
    }
  }

  return Array.from(result);
}

export default union;
