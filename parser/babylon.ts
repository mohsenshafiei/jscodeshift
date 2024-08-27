/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as babylon from "@babel/parser";

interface ParserPluginOptions {
  all?: boolean;
  decoratorsBeforeExport?: boolean;
  proposal?: string;
}

interface ParserOptions {
  sourceType: "module";
  allowImportExportEverywhere: boolean;
  allowReturnOutsideFunction: boolean;
  startLine: number;
  tokens: boolean;
  plugins: (string | [string, ParserPluginOptions])[];
}

const defaultOptions: ParserOptions = {
  sourceType: "module",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  startLine: 1,
  tokens: true,
  plugins: [
    ["flow", { all: true }],
    "flowComments",
    "jsx",
    "asyncGenerators",
    "bigInt",
    "classProperties",
    "classPrivateProperties",
    "classPrivateMethods",
    ["decorators", { decoratorsBeforeExport: false }],
    "doExpressions",
    "dynamicImport",
    "exportDefaultFrom",
    "exportNamespaceFrom",
    "functionBind",
    "functionSent",
    "importMeta",
    "logicalAssignment",
    "nullishCoalescingOperator",
    "numericSeparator",
    "objectRestSpread",
    "optionalCatchBinding",
    "optionalChaining",
    ["pipelineOperator", { proposal: "minimal" }],
    "throwExpressions",
  ],
};

/**
 * Wrapper to set default options
 */
export default function (options: ParserOptions = defaultOptions) {
  return {
    parse(code: string) {
      return babylon.parse(code, options as any);
    },
  };
}
