import * as Collection from "./Collection";
import collections from "./collections";
import getParser from "./getParser";
import { matchNode } from "./matchNode";
import * as recast from "recast";
import * as template from "./template";
import { Options } from "./types/core";
import * as CoreTypes from "./types/core";

const Node = recast.types.namedTypes.Node;
const NodePath = recast.types.NodePath;

// Register all built-in collections
for (const name in collections) {
  // @ts-ignore
  collections[name].register();
}

/**
 * Main entry point to the tool. This function creates a Collection instance
 * from a source string or AST nodes/paths.
 *
 * @param {Node|NodePath|Array|string} source
 * @param {Object} options Options to pass to Recast when passing source code
 * @return {Collection}
 */
function core(
  source: CoreTypes.ASTNode | CoreTypes.ASTNode[] | string,
  options: Options = {}
) {
  if (typeof source === "string") {
    return fromSource(source, options);
  } else {
    return fromAST(source);
  }
}

// @ts-ignore
function fromAST(ast) {
  if (Array.isArray(ast)) {
    if (ast[0] instanceof NodePath || ast.length === 0) {
      return Collection.fromPaths(ast);
    } else if (Node.check(ast[0])) {
      // @ts-ignore
      return Collection.fromNodes(ast);
    }
  } else {
    if (ast instanceof NodePath) {
      return Collection.fromPaths([ast]);
    } else if (Node.check(ast)) {
      // @ts-ignore
      return Collection.fromNodes([ast]);
    }
  }
  throw new TypeError(
    "Received an unexpected value " + Object.prototype.toString.call(ast)
  );
}

function fromSource(source: string, options: Options): any {
  if (!options.parser) {
    options.parser = getParser();
  }
  const ast = recast.parse(source, options);
  return fromAST(ast);
}

function match(path: any, filter: any): boolean {
  if (!(path instanceof NodePath)) {
    if (typeof path.get === "function") {
      path = path.get();
    } else {
      path = { value: path };
    }
  }
  return matchNode(path.value, filter);
}

const plugins: CoreTypes.Plugin[] = [];

function use(plugin: any): void {
  if (plugins.indexOf(plugin) === -1) {
    plugins.push(plugin);
    plugin(core);
  }
}

function withParser(parser: string | CoreTypes.Parser): CoreTypes.JSCodeshift {
  if (typeof parser === "string") {
    parser = getParser(parser);
  }

  const newCore = function (source: string, options: Options) {
    if (options && !options.parser) {
      options.parser = parser;
    } else {
      options = { parser };
    }
    return core(source, options);
  };

  return enrichCore(newCore as CoreTypes.JSCodeshift, parser);
}

function enrichCore(
  coreInstance: CoreTypes.JSCodeshift,
  parser?: CoreTypes.Parser
): CoreTypes.JSCodeshift {
  Object.assign(coreInstance, recast.types.namedTypes);
  Object.assign(coreInstance, recast.types.builders);

  const resolvedParser = parser || getParser();
  coreInstance.registerMethods = Collection.registerMethods;
  coreInstance.types = recast.types;
  coreInstance.match = match;
  coreInstance.template = template.withParser(resolvedParser);
  coreInstance.filters = {};
  coreInstance.mappings = {};

  for (const name in collections) {
    // @ts-ignore
    if (collections[name].filters) {
      // @ts-ignore
      coreInstance.filters[name] = collections[name].filters;
    } // @ts-ignore
    if (collections[name].mappings) {
      // @ts-ignore
      coreInstance.mappings[name] = collections[name].mappings;
    }
  }
  coreInstance.use = use;
  coreInstance.withParser = withParser;

  return coreInstance;
}

// Export the enriched core, which is now a function that returns Collection instances.
const enrichedCore: CoreTypes.JSCodeshift = enrichCore(
  core as CoreTypes.JSCodeshift
);

export default enrichedCore;
