interface ParserPluginOptions {
  decoratorsBeforeExport?: boolean;
}

export interface ParserOptions {
  sourceType: "module";
  allowHashBang: boolean;
  ecmaVersion: number;
  allowImportExportEverywhere: boolean;
  allowReturnOutsideFunction: boolean;
  startLine: number;
  tokens: boolean;
  plugins: (string | [string, ParserPluginOptions])[];
}

export interface FlowParserOptions {
  enums: boolean;
  esproposal_class_instance_fields: boolean;
  esproposal_class_static_fields: boolean;
  esproposal_decorators: boolean;
  esproposal_export_star_as: boolean;
  esproposal_optional_chaining: boolean;
  esproposal_nullish_coalescing: boolean;
  tokens: boolean;
  types: boolean;
}
