/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import flowParser from "flow-parser";

interface FlowParserOptions {
  enums: boolean;
  esproposal_class_instance_fields: boolean;
  esproposal_class_static_fields: boolean;
  esproposal_decorators: boolean;
  esproposal_export_star_as: boolean;
  esproposal_optional_chaining: boolean;
  esproposal_nullish_coalescing: boolean;
  tokens: boolean;
  types: boolean;
}

const defaultOptions: FlowParserOptions = {
  enums: true,
  esproposal_class_instance_fields: true,
  esproposal_class_static_fields: true,
  esproposal_decorators: true,
  esproposal_export_star_as: true,
  esproposal_optional_chaining: true,
  esproposal_nullish_coalescing: true,
  tokens: true,
  types: true,
};

/**
 * Wrapper to set default options
 */
export default function (options: FlowParserOptions = defaultOptions) {
  return {
    parse(code: string) {
      return flowParser.parse(code, options);
    },
  };
}
