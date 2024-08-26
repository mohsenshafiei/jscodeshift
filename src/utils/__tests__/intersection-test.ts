/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import intersection from "../intersection";

function test(testCases: any) {
  for (const testName in testCases) {
    const testCase = testCases[testName];
    it(testName, function () {
      expect(intersection(testCase.input)).toEqual(testCase.output);
    });
  }
}

describe("intersection", function () {
  test({
    "intersects string values": {
      input: [
        ["foo", "bar", "baz"],
        ["foo", "bar"],
        ["bar", "baz"],
      ],
      output: ["bar"],
    },

    "returns empty list if no intersection": {
      input: [["foo", "bar", "baz"], ["foo"], ["bar"]],
      output: [],
    },
  });
});
