import { API, FileInfo, JSCodeshift } from "../types/core";
import { defineInlineTest } from "../testUtils";

export function transformer(file: FileInfo, api: API): string {
  const j: JSCodeshift = api.jscodeshift;

  return j(file.source).toSource();
}

transformer.parser = "ts";

describe("should parse TypeScript decoratorAutoAccessors correctly", () => {
  jest.autoMockOff();

  defineInlineTest(
    transformer,
    {},
    `export class Test {
      public accessor myValue = 10;
    }`,
    `export class Test {
      public accessor myValue = 10;
    }`,
    "ts-decorator-auto-accessor"
  );
});
