/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global expect, describe, it */

"use strict";

import fs from "fs";
import path from "path";

function applyTransform(
  module: any,
  options: any,
  input: any,
  testOptions: any = {}
) {
  // Handle ES6 modules using default export for the transform
  const transform = module.default ? module.default : module;

  // Jest resets the module registry after each test, so we need to always get
  // a fresh copy of jscodeshift on every test run.
  let jscodeshift = require("./core");
  if (testOptions.parser || module.parser) {
    jscodeshift = jscodeshift.withParser(testOptions.parser || module.parser);
  }

  const output = transform(
    input,
    {
      jscodeshift,
      j: jscodeshift,
      stats: () => {},
    },
    options || {}
  );

  return (output || "").trim();
}
exports.applyTransform = applyTransform;

function runSnapshotTest(module: any, options: any, input: any) {
  const output = applyTransform(module, options, input);
  expect(output).toMatchSnapshot();
  return output;
}
exports.runSnapshotTest = runSnapshotTest;

function runInlineTest(
  module: any,
  options: any,
  input: any,
  expectedOutput: any,
  testOptions?: any
) {
  const output = applyTransform(module, options, input, testOptions);
  expect(output).toEqual(expectedOutput.trim());
  return output;
}
exports.runInlineTest = runInlineTest;

function extensionForParser(parser: any) {
  switch (parser) {
    case "ts":
    case "tsx":
      return parser;
    default:
      return "js";
  }
}

/**
 * Utility function to run a jscodeshift script within a unit test. This makes
 * several assumptions about the environment:
 *
 * - `dirName` contains the name of the directory the test is located in. This
 *   should normally be passed via __dirname.
 * - The test should be located in a subdirectory next to the transform itself.
 *   Commonly tests are located in a directory called __tests__.
 * - `transformName` contains the filename of the transform being tested,
 *   excluding the .js extension.
 * - `testFilePrefix` optionally contains the name of the file with the test
 *   data. If not specified, it defaults to the same value as `transformName`.
 *   This will be suffixed with ".input.js" for the input file and ".output.js"
 *   for the expected output. For example, if set to "foo", we will read the
 *   "foo.input.js" file, pass this to the transform, and expect its output to
 *   be equal to the contents of "foo.output.js".
 * - Test data should be located in a directory called __testfixtures__
 *   alongside the transform and __tests__ directory.
 */
export function runTest(
  dirName: any,
  transformName: any,
  options: any,
  testFilePrefix: any,
  testOptions: any = {}
) {
  if (!testFilePrefix) {
    testFilePrefix = transformName;
  }

  // Assumes transform is one level up from __tests__ directory
  const module = require(path.join(dirName, "..", transformName));
  const extension = extensionForParser(testOptions.parser || module.parser);
  const fixtureDir = path.join(dirName, "..", "__testfixtures__");
  const inputPath = path.join(
    fixtureDir,
    testFilePrefix + `.input.${extension}`
  );
  const source = fs.readFileSync(inputPath, "utf8");
  const expectedOutput = fs.readFileSync(
    path.join(fixtureDir, testFilePrefix + `.output.${extension}`),
    "utf8"
  );
  runInlineTest(
    module,
    options,
    {
      path: inputPath,
      source,
    },
    expectedOutput,
    testOptions
  );
}

/**
 * Handles some boilerplate around defining a simple jest/Jasmine test for a
 * jscodeshift transform.
 */
export function defineTest(
  dirName: any,
  transformName: any,
  options?: any,
  testFilePrefix?: any,
  testOptions?: any
) {
  const testName = testFilePrefix
    ? `transforms correctly using "${testFilePrefix}" data`
    : "transforms correctly";
  describe(transformName, () => {
    it(testName, () => {
      runTest(dirName, transformName, options, testFilePrefix, testOptions);
    });
  });
}

export function defineInlineTest(
  module: any,
  options: any,
  input: any,
  expectedOutput: any,
  testName?: any
) {
  it(testName || "transforms correctly", () => {
    runInlineTest(
      module,
      options,
      {
        source: input,
      },
      expectedOutput
    );
  });
}

export function defineSnapshotTest(
  module: any,
  options: any,
  input: any,
  testName: any
) {
  it(testName || "transforms correctly", () => {
    runSnapshotTest(module, options, {
      source: input,
    });
  });
}

/**
 * Handles file-loading boilerplates, using same defaults as defineTest
 */
export function defineSnapshotTestFromFixture(
  dirName: any,
  module: any,
  options: any,
  testFilePrefix: any,
  testName?: any,
  testOptions: any = {}
) {
  const extension = extensionForParser(testOptions.parser || module.parser);
  const fixtureDir = path.join(dirName, "..", "__testfixtures__");
  const inputPath = path.join(
    fixtureDir,
    testFilePrefix + `.input.${extension}`
  );
  const source = fs.readFileSync(inputPath, "utf8");
  defineSnapshotTest(module, options, source, testName);
}
