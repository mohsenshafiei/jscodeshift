import astTypes = require("ast-types");
import nodePath = require("ast-types/lib/node-path");
import Collection = require("../Collection");

type ASTPath<N> = nodePath.NodePath<N, N>;

export interface GlobalMethods {
  findVariableDeclarators(
    name?: string
  ): Collection.Collection<astTypes.namedTypes.VariableDeclarator>;
}

export interface TransformMethods<N> {
  renameTo(newName: string): Collection.Collection<N>;
}

interface Filter {
  (path: ASTPath<any>): boolean;
}

export interface FilterMethods {
  requiresModule(names: string | string[]): Filter;
}
