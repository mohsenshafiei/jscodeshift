import * as core from "./core";

export interface WithParser {
  (parser: core.Parser): Template;
}

export type Template = {
  statements(args: TemplateStringsArray, ...values: any[]): string;
  statement(args: TemplateStringsArray, ...values: any[]): string;
  expression<T>(args: TemplateStringsArray, ...values: T[]): string;
  asyncExpression<T>(args: TemplateStringsArray, ...values: T[]): string;
};

export interface NodeWithLocation {
  start?: number;
  end?: number;
  loc?: string;
  [key: string]: string | number | undefined;
}
