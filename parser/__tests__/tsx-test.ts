/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*global jest, describe, it, expect*/

"use strict";

jest.mock("@babel/parser");
import * as babylon from "@babel/parser";

import tsxParser from "../tsx";

describe("tsxParser", function () {
  describe("parse", function () {
    it("extends the ts config with jsx support", function () {
      const parser = tsxParser();
      parser.parse('"mock content";');

      expect(babylon.parse).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(babylon.parse.mock.calls[0]).toMatchSnapshot();
    });
  });
});
