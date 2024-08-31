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
export default function transformer(file: any, api: any) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.Identifier)
    .replaceWith((p: any) =>
      j.identifier(p.node.name.split("").reverse().join(""))
    )
    .toSource();
}
