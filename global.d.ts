namespace jest {
  interface Matchers<R> {
    toMatchNode(needle: any): R;
  }
}

declare module "flow-parser" {
  const flowParser: any;
  export default flowParser;
}

declare module "@babel/preset-typescript" {
  const presetTypescript: any;
  export default presetTypescript;
}

declare module "@babel/preset-flow" {
  const presetFlow: any;
  export default presetFlow;
}

declare module "@babel/plugin-transform-class-properties" {
  const classProperties: any;
  export default classProperties;
}

declare module "@babel/plugin-transform-nullish-coalescing-operator" {
  const nullishCoalescingOperator: any;
  export default nullishCoalescingOperator;
}

declare module "@babel/plugin-transform-optional-chaining" {
  const optionalChaining: any;
  export default optionalChaining;
}

declare module "@babel/plugin-transform-modules-commonjs" {
  const modulesCommonjs: any;
  export default modulesCommonjs;
}

declare module "@babel/plugin-transform-private-methods" {
  const privateMethods: any;
  export default privateMethods;
}
