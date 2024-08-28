/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as babylon from "@babel/parser";

// These are the options that were the default of the Babel5 parse function
// see https://github.com/babel/babel/blob/5.x/packages/babel/src/api/node.js#L81

interface ParserPluginOptions {
  decoratorsBeforeExport?: boolean;
}

interface ParserOptions {
  sourceType: "module";
  allowHashBang: boolean;
  ecmaVersion: number;
  allowImportExportEverywhere: boolean;
  allowReturnOutsideFunction: boolean;
  startLine: number;
  tokens: boolean;
  plugins: (string | [string, ParserPluginOptions])[];
}

const options: babel.ParserOptions = {
  sourceType: "module",
  // allowHashBang: true,
  // ecmaVersion: Infinity,
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  startLine: 1,
  tokens: true,
  plugins: [
    "estree",
    "jsx",
    "asyncGenerators",
    "classProperties",
    "doExpressions",
    // "exportExtensions",
    "functionBind",
    "functionSent",
    "objectRestSpread",
    "dynamicImport",
    "nullishCoalescingOperator",
    "optionalChaining",
    ["decorators", { decoratorsBeforeExport: false }],
  ],
};

/**
 * Wrapper to set default options. Doesn't accept custom options because in that
 * case babylon should be used instead.
 */
export default function () {
  return {
    parse(code: string) {
      return babylon.parse(code, options);
    },
  };
}
