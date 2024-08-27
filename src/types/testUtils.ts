import { Options, Parser, Transform } from "./core";

export interface TestOptions {
  parser?: Parser | "babylon" | "flow" | "ts" | "tsx" | "babel" | undefined;
}

export interface applyTransform {
  (
    module:
      | {
          default: Transform;
          parser: TestOptions["parser"];
        }
      | Transform,
    options: Options | null | undefined,
    input: {
      path?: string;
      source: string;
    },
    testOptions?: TestOptions
  ): string;
}

export interface DefineTest {
  (
    dirName: string,
    transformName: string,
    options?: Options | null,
    testFilePrefix?: string,
    testOptions?: TestOptions
  ): void;
}

export interface RunTest {
  (
    dirName: string,
    transformName: string,
    options: Options,
    testFilePrefix?: string,
    testOptions?: TestOptions
  ): string;
}

export interface DefineInlineTest {
  (
    module:
      | {
          default: Transform;
          parser: TestOptions["parser"];
        }
      | Transform,
    options: Options,
    inputSource: string,
    expectedOutputSource: string,
    testName?: string
  ): void;
}

export interface RunInlineTest {
  (
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
    },
    expectedOutput: string,
    testOptions?: TestOptions
  ): string;
}

export interface DefineSnapshotTest {
  (
    module:
      | {
          default: Transform;
          parser: TestOptions["parser"];
        }
      | Transform,
    options: Options,
    input: string,
    testName?: string
  ): void;
}

export interface RunSnapshotTest {
  (
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
  ): string;
}
