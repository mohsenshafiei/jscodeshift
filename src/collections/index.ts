/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Node from "./Node";
import * as JSXElement from "./JSXElement";
import * as VariableDeclarator from "./VariableDeclarator";
import * as ImportDeclaration from "./ImportDeclaration";
interface CollectionModule {
  register: () => void;
}

// Define the collections object with proper typing
const collections: { [key: string]: CollectionModule } = {
  Node,
  JSXElement,
  VariableDeclarator,
  ImportDeclaration,
};

export default collections;
