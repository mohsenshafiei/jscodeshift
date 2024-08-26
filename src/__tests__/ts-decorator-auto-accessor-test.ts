"use strict";

import { API, FileInfo, JSCodeshift } from "jscodeshift";
import { defineInlineTest } from "../testUtils";

function transformer(file: FileInfo, api: API): string {
  const j: JSCodeshift = api.jscodeshift;

  return j(file.source).toSource();
}

transformer.parser = "ts";

jest.autoMockOff();

describe("should parse TypeScript decoratorAutoAccessors correctly", function () {
  defineInlineTest(
    transformer,
    {},
    "export class Test {\n" + "  public accessor myValue = 10;\n" + "}\n",
    "export class Test {\n" + "  public accessor myValue = 10;\n" + "}",
    "ts-decorator-auto-accessor"
  );
});
