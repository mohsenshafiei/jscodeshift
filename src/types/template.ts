import * as core from "./core";

export type Template = WithParser;

export interface WithParser {
  (parser: core.Parser): template.Template;
}

declare namespace template {
  interface Template {
    /** Tagged template function. Parses the string as source and returns an array of Statement AST nodes. */
    statements(...args: any[]): any;
    /** Tagged template function. Parses the string as source and returns an Statement AST node. */
    statement(...args: any[]): any;
    /** Tagged template function. Parses the string as source and returns an Expression AST node. */
    expression(...args: any[]): any;
  }
}

export interface NodeWithLocation {
  start?: number;
  end?: number;
  loc?: any;
  [key: string]: any;
}
