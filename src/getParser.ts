/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import type { Options, Parser } from "./types/core";
import type { ParserOptions, FlowParserOptions } from "./types/parsers";

export async function getParser(
  parserName?: string,
  options?: ParserOptions | FlowParserOptions
): Promise<Parser> {
  switch (parserName) {
    case "babylon":
      return (await import("../parser/babylon")).default(
        options as ParserOptions
      );
    case "flow":
      return (await import("../parser/flow")).default(
        options as FlowParserOptions
      );
    case "ts":
      return (await import("../parser/ts")).default();
    case "tsx":
      return (await import("../parser/tsx")).default();
    case "babel":
    default:
      return (await import("../parser/babel5Compat")).default();
  }
}

export default getParser;
