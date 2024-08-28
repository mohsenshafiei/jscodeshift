/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

/**
 * Options shared by the TypeScript and TSX parsers.
 */
const tsOptions: babel.ParserOptions = {
  sourceType: "module",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  startLine: 1,
  tokens: true,
  plugins: [
    "asyncGenerators",
    "decoratorAutoAccessors",
    "bigInt",
    "classPrivateMethods",
    "classPrivateProperties",
    "classProperties",
    "decorators-legacy",
    "doExpressions",
    "dynamicImport",
    "exportDefaultFrom",
    "exportNamespaceFrom",
    "functionBind",
    "functionSent",
    "importAttributes",
    "importMeta",
    "nullishCoalescingOperator",
    "numericSeparator",
    "objectRestSpread",
    "optionalCatchBinding",
    "optionalChaining",
    ["pipelineOperator", { proposal: "minimal" }],
    "throwExpressions",
    "typescript",
  ],
};

export default tsOptions;
