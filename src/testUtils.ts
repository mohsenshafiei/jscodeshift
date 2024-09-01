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
import { TestOptions } from "./types/testUtils";
import { Options, Parser, Transform } from "./types/core";
import jscodeshiftCore from "./core";

function isTransformModule(
  module: { default: Transform; parser: TestOptions["parser"] } | Transform
): module is { default: Transform; parser: TestOptions["parser"] } {
  return (module as { default: Transform }).default !== undefined;
}

export function applyTransform(
  module: any,
  options: Options | null,
  input: any,
  testOptions = {}
) {
  // Handle ES6 modules using default export for the transform
  const transform = module.default ? module.default : module;

  // Jest resets the module registry after each test, so we need to always get
  // a fresh copy of jscodeshift on every test run.
  let jscodeshift = jscodeshiftCore;
  // @ts-ignore
  if (testOptions.parser || module.parser) {
    // @ts-ignore
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

export function runSnapshotTest(
  module:
    | {
        default: Transform;
        parser: TestOptions["parser"];
      }
    | Transform,
  options: Options,
  input: {
    path?: string;
    source: string;
  }
) {
  const output = applyTransform(module, options, input);
  expect(output).toMatchSnapshot();
  return output;
}

export function runInlineTest(
  module:
    | {
        default: Transform;
        parser: TestOptions["parser"];
      }
    | Transform,
  input: {
    path?: string;
    source: string;
  },

  expectedOutput: string,
  options: Options | null,
  testOptions?: TestOptions
) {
  const output = applyTransform(module, options, input, testOptions);
  expect(output).toEqual(expectedOutput.trim());
  return output;
}

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
export async function runTest(
  dirName: string,
  transformName: string,
  options: Options | null,
  testFilePrefix?: string,
  testOptions?: TestOptions
) {
  if (!testFilePrefix) {
    testFilePrefix = transformName;
  }

  // Assumes transform is one level up from __tests__ directory
  const module = await import(path.join(dirName, "..", transformName));
  const extension = extensionForParser(
    (testOptions && testOptions.parser) || module.parser
  );
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
    {
      path: inputPath,
      source,
    },
    expectedOutput,
    options,
    testOptions
  );
}

/**
 * Handles some boilerplate around defining a simple jest/Jasmine test for a
 * jscodeshift transform.
 */
export function defineTest(
  dirName: string,
  transformName: string,
  options: Options | null,
  testFilePrefix?: string,
  testOptions?: TestOptions
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
  module:
    | {
        default: Transform;
        parser: TestOptions["parser"];
      }
    | Transform,
  options: Options,
  input: string,
  expectedOutput: string,
  testName?: string
) {
  it(testName || "transforms correctly", () => {
    runInlineTest(
      module,
      {
        source: input,
      },
      expectedOutput,
      options
    );
  });
}

export function defineSnapshotTest(
  module:
    | {
        default: Transform;
        parser: TestOptions["parser"];
      }
    | Transform,
  options: Options,
  input: string,
  testName?: string
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
  dirName: string,
  module:
    | {
        default: Transform;
        parser: TestOptions["parser"];
      }
    | Transform,
  options: Options,
  testFilePrefix: string,
  testName?: string,
  testOptions: TestOptions = {}
) {
  const extension = extensionForParser(
    testOptions.parser || (isTransformModule(module) && module.parser)
  );
  const fixtureDir = path.join(dirName, "..", "__testfixtures__");
  const inputPath = path.join(
    fixtureDir,
    testFilePrefix + `.input.${extension}`
  );
  const source = fs.readFileSync(inputPath, "utf8");
  defineSnapshotTest(module, options, source, testName);
}
