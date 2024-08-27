/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as recast from "recast";
import * as CollectionModule from "../../Collection";
import * as ImportDeclaration from "../ImportDeclaration";
import getParser from "../../getParser";

describe("ImportDeclaration API", function () {
  let nodes: any;
  let Collection: any;
  let ImportDeclarationCollection: any;
  let types: any;
  let b: any;

  beforeEach(async function () {
    jest.resetModules();

    Collection = CollectionModule;
    ImportDeclarationCollection = ImportDeclaration;
    types = recast.types.namedTypes;
    b = recast.types.builders;

    ImportDeclarationCollection.register();

    nodes = [
      recast.parse(
        [
          'import FooBar from "XYZ";',
          'import Foo, { Bar, Baz } from "@meta/foo";',
          'import { Bar as Burger } from "@meta/bar";',
        ].join("\n"),
        { parser: await getParser() }
      ).program,
    ];
  });

  describe("Traversal", function () {
    describe("hasImportDeclaration", function () {
      it("returns true if an ImportDeclaration exists", function () {
        const hasImport =
          Collection.fromNodes(nodes).hasImportDeclaration("XYZ");

        expect(hasImport).toBe(true);
      });

      it("returns false if an ImportDeclaration does not exist", function () {
        const hasImport =
          Collection.fromNodes(nodes).hasImportDeclaration("ABC");

        expect(hasImport).toBe(false);
      });
    });

    describe("findImportDeclarations", function () {
      it("lets us find ImportDeclarations by source path conveniently", function () {
        const imports =
          Collection.fromNodes(nodes).findImportDeclarations("XYZ");

        expect(imports.length).toBe(1);
      });

      it("returns an empty ImportDeclarationCollection if no ImportDeclarations are found", function () {
        const imports =
          Collection.fromNodes(nodes).findImportDeclarations("Foo");

        expect(imports.length).toBe(0);
      });
    });

    describe("renameImportDeclaration", function () {
      it("renames an ImportDeclaration with the given sourcePath", function () {
        Collection.fromNodes(nodes).renameImportDeclaration("XYZ", "ABC");

        {
          const imports =
            Collection.fromNodes(nodes).findImportDeclarations("ABC");

          expect(imports.length).toBe(1);
        }
        {
          const imports =
            Collection.fromNodes(nodes).findImportDeclarations("XYZ");
          expect(imports.length).toBe(0);
        }
      });

      it("throws if sourcePath is not provided", function () {
        expect(function () {
          Collection.fromNodes(nodes).renameImportDeclaration();
        }).toThrow();
      });

      it("throws if newSourcePath is not provided", function () {
        expect(function () {
          Collection.fromNodes(nodes).renameImportDeclaration("XYZ");
        }).toThrow();
      });
    });

    describe("insertImportDeclaration", function () {
      it("inserts an ImportDeclaration into the AST", function () {
        Collection.fromNodes(nodes).insertImportDeclaration("@foo/bar", [
          b.importDefaultSpecifier(b.identifier("Foo")),
          b.importSpecifier(b.identifier("ABC")),
          b.importSpecifier(b.identifier("123")),
        ]);

        const imports =
          Collection.fromNodes(nodes).findImportDeclarations("@foo/bar");

        expect(imports.length).toBe(1);

        const importSpecifiers = imports.paths()[0].value.specifiers;
        expect(importSpecifiers.length).toBe(3);
      });

      it("does not insert duplicate ImportDeclarations", function () {
        Collection.fromNodes(nodes).insertImportDeclaration("@foo/baz", [
          b.importDefaultSpecifier(b.identifier("Foo")),
          b.importSpecifier(b.identifier("ABC")),
        ]);

        Collection.fromNodes(nodes).insertImportDeclaration("@foo/baz", [
          b.importDefaultSpecifier(b.identifier("Foo")),
          b.importSpecifier(b.identifier("ABC")),
        ]);

        const imports =
          Collection.fromNodes(nodes).findImportDeclarations("@foo/baz");

        expect(imports.length).toBe(1);
      });

      it("throws if importDeclaration is not provided", function () {
        expect(function () {
          Collection.fromNodes(nodes).insertImportDeclaration();
        }).toThrow();
      });
    });
  });
});
