"use strict";

import type { Options, Parser } from "./types/core";
import type { ParserOptions, FlowParserOptions } from "./types/parsers";
import babylon from "../parser/babylon";
import flow from "../parser/flow";
import ts from "../parser/ts";
import tsx from "../parser/tsx";
import babelCompat from "../parser/babel5Compat";

export function getParser(
  parserName?: string,
  options?: ParserOptions | FlowParserOptions
): Parser {
  switch (parserName) {
    case "babylon":
      return babylon(options as ParserOptions);
    case "flow":
      return flow(options as FlowParserOptions);
    case "ts":
      return ts();
    case "tsx":
      return tsx();
    case "babel":
    default:
      return babelCompat();
  }
}

export default getParser;
