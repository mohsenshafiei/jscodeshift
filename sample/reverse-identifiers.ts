/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { API } from "../src/types/core";

/**
 * Example jscodeshift transformer. Simply reverses the names of all
 * identifiers.
 */
export default function transformer(
  file: {
    path?: string;
    source: string;
  },
  api: API
) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.Identifier)
    .replaceWith((p) => j.identifier(p.node.name.split("").reverse().join("")))
    .toSource();
}
