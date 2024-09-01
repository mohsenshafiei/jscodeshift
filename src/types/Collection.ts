import * as nodePath from "ast-types/lib/node-path";
import * as types from "ast-types/lib/types";
import * as recast from "recast";
import * as JSXElement from "./collections/JSXElement";
import * as NodeCollection from "./collections/Node";
import * as VariableDeclarator from "./collections/VariableDeclarator";

export type ASTPath<N> = nodePath.NodePath<N, N>;

export interface Collection<N>
  extends NodeCollection.TraversalMethods,
    NodeCollection.MutationMethods<N>,
    VariableDeclarator.GlobalMethods,
    VariableDeclarator.TransformMethods<N>,
    JSXElement.GlobalMethods,
    JSXElement.TraversalMethods {
  new (
    paths: Array<ASTPath<N>>,
    parent: Collection<any>,
    types?: Array<types.Type<any>>
  ): this;

  filter<S extends N>(
    callback: (
      path: ASTPath<N>,
      i: number,
      paths: Array<ASTPath<N>>
    ) => path is ASTPath<S>
  ): Collection<S>;
  filter(
    callback: (path: ASTPath<N>, i: number, paths: Array<ASTPath<N>>) => boolean
  ): Collection<N>;

  forEach(
    callback: (path: ASTPath<N>, i: number, paths: Array<ASTPath<N>>) => void
  ): this;

  some(
    callback: (path: ASTPath<N>, i: number, paths: Array<ASTPath<N>>) => boolean
  ): boolean;

  every(
    callback: (path: ASTPath<N>, i: number, paths: Array<ASTPath<N>>) => boolean
  ): boolean;

  map<T = types.ASTNode>(
    callback: (
      path: ASTPath<N>,
      i: number,
      paths: Array<ASTPath<N>>
    ) => ASTPath<T> | Array<ASTPath<T>> | null | undefined,
    type?: types.Type<any>
  ): Collection<T>;

  size(): number;
  length: number;
  nodes(): N[];
  paths(): Array<ASTPath<N>>;
  getAST(): Array<ASTPath<any>>;
  toSource(options?: recast.Options): string;
  at(index: number): Collection<N>;
  get(...fields: Array<string | number>): any;
  getTypes(): string[];
  isOfType(type: types.Type<any>): boolean;
}

export type registerMethods = (
  methods: Record<string, Function>,
  type?: types.Type<any>
) => void;
export type hasConflictingRegistration = (...args: any[]) => any;
export type setDefaultCollectionType = (...args: any[]) => any;
