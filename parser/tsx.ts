/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as babylon from "@babel/parser";
import baseOptions from "./tsOptions";
import { ParserOptions } from "../src/types/parsers";

const options: any = Object.assign({}, baseOptions);
options.plugins = ["jsx"].concat(baseOptions.plugins as any);

/**
 * Doesn't accept custom options because babylon should be used directly in
 * that case.
 */
export default function () {
  return {
    parse(code: any) {
      return babylon.parse(code, options);
    },
  };
}
