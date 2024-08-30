import * as core from "./core";

export interface WithParser {
  (parser: core.Parser): template.Template;
}

export type Template = {
  statements(...args: any[]): any;
  /** Tagged template function. Parses the string as source and returns an Statement AST node. */
  statement(...args: any[]): any;
  /** Tagged template function. Parses the string as source and returns an Expression AST node. */
  expression(...args: any[]): any;
  /** Tagged template function. Parses the string as source and returns an Expression AST node for async expressions. */
  asyncExpression(...args: any[]): any;
};

declare namespace template {
  interface Template {
    statements(...args: any[]): any;
    /** Tagged template function. Parses the string as source and returns an Statement AST node. */
    statement(...args: any[]): any;
    /** Tagged template function. Parses the string as source and returns an Expression AST node. */
    expression(...args: any[]): any;
    /** Tagged template function. Parses the string as source and returns an Expression AST node for async expressions. */
    asyncExpression(...args: any[]): any;
  }
}

export interface NodeWithLocation {
  start?: number;
  end?: number;
  loc?: string;
  [key: string]: any;
}
