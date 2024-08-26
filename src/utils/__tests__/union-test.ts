/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import union from "../union";

interface TestCase<T, U> {
  input: T[][];
  output: U[];
}

interface TestCases<T, U> {
  [key: string]: TestCase<T, U>;
}

function test<T, U>(testCases: TestCases<T, U>) {
  for (const testName in testCases) {
    const testCase = testCases[testName];
    it(testName, function () {
      expect(union(testCase.input)).toEqual(testCase.output);
    });
  }
}

describe("union", function () {
  test({
    "unions string values": {
      input: [
        ["foo", "bar", "baz"],
        ["foo", "bar"],
        ["bar", "baz"],
      ],
      output: ["foo", "bar", "baz"],
    },

    "understands empty input arrays": {
      input: [[], ["foo"], ["bar"]],
      output: ["foo", "bar"],
    },
  });
});
