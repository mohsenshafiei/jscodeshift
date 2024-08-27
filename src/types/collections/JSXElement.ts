import * as astTypes from "ast-types";
import * as nodePath from "ast-types/lib/node-path";
import * as Collection from "../Collection";

type ASTPath<N> = nodePath.NodePath<N, N>;
export type JSXElement = astTypes.namedTypes.JSXElement;

export interface GlobalMethods {
  findJSXElements(name?: string): Collection.Collection<JSXElement>;
  findJSXElementsByModuleName(
    moduleName: string
  ): Collection.Collection<JSXElement>;
}

type Defined<T> = T extends undefined ? never : T;
type JSXElementChild = Defined<JSXElement["children"]>[0];

export interface TraversalMethods {
  childNodes(): Collection.Collection<JSXElementChild>;
  childElements(): Collection.Collection<JSXElement>;
}

interface Filter {
  (path: ASTPath<any>): boolean;
}

export interface FilterMethods {
  hasAttributes(attributeFilter: { [attributeName: string]: any }): Filter;
  hasChildren(name: string): Filter;
}

export interface MappingMethods {
  getRootName(path: ASTPath<any>): string;
}
