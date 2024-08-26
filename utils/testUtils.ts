/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import fs from "fs";
import path from "path";
import temp from "temp";

export function renameFileTo(
  oldPath: string,
  newFilename: string,
  extension: string = ""
): string {
  const projectPath = path.dirname(oldPath);
  const newPath = path.join(projectPath, newFilename + extension);
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.renameSync(oldPath, newPath);
  return newPath;
}
export function createTempFileWith(content: string): string;
export function createTempFileWith(content: string, extension: string): string;
export function createTempFileWith(
  content: string,
  filename: string | undefined,
  extension: string
): string;
export function createTempFileWith(
  content: string,
  filename?: string | undefined,
  extension?: string
) {
  const info = temp.openSync({ suffix: extension });
  let filePath = info.path;
  fs.writeSync(info.fd, content);
  fs.closeSync(info.fd);
  if (filename) {
    filePath = renameFileTo(filePath, filename, extension);
  }
  return filePath;
}

// Test transform files need a js extension to work with @babel/register
// .ts or .tsx work as well
export function createTransformWith(content: string, ext = ".js") {
  return createTempFileWith(
    "module.exports = function(fileInfo, api, options) { " + content + " }",
    undefined,
    ext
  );
}

export function getFileContent(filePath: string) {
  return fs.readFileSync(filePath).toString();
}
