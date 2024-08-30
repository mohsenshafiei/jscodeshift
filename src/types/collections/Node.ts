import * as astTypes from "ast-types";
import * as nodePath from "ast-types/lib/node-path";
import * as types from "ast-types/lib/types";
import * as Collection from "../Collection";

type ASTPath<N> = nodePath.NodePath<N, N>;

type RecursiveMatchNode<T> =
  | (T extends {}
      ? {
          [K in keyof T]?: RecursiveMatchNode<T[K]>;
        }
      : T)
  | ((value: T) => boolean);

type ASTNode = types.ASTNode;

export interface TraversalMethods {
  find<T extends ASTNode>(
    type: types.Type<T> | string,
    filter?: RecursiveMatchNode<T> | { name: string }
  ): Collection.Collection<T>;

  closestScope(): Collection.Collection<astTypes.namedTypes.ASTNode>;

  closest<T>(
    type: types.Type<T>,
    filter?: RecursiveMatchNode<T>
  ): Collection.Collection<T>;

  getVariableDeclarators(
    nameGetter: (...args: any[]) => any
  ): Collection.Collection<astTypes.namedTypes.VariableDeclarator>;
}

export interface MutationMethods<N> {
  replaceWith<T>(
    nodes: T | T[] | ((path: ASTPath<N>, i: number) => T)
  ): Collection.Collection<T>;

  insertBefore(insert: any): Collection.Collection<N>;

  insertAfter(insert: any): Collection.Collection<N>;

  remove(): Collection.Collection<N>;
}
