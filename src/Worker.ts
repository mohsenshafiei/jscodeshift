/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const EventEmitter = require("events").EventEmitter;

import async from "neo-async";
import fs from "graceful-fs";
import writeFileAtomic from "write-file-atomic";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import getParser from "./getParser";
import * as jscodeshift from "./core";

let presetEnv: typeof import("@babel/preset-env");
async function loadPresetEnv(): Promise<void> {
  try {
    presetEnv = await import("@babel/preset-env");
  } catch (error) {
    console.error("Failed to load @babel/preset-env:", error);
  }
}
loadPresetEnv();

let emitter: any;
let finish: any;
let notify: any;
let transform: any;
let parserFromTransform: any;

if (module.parent) {
  emitter = new EventEmitter();
  emitter.send = (data: any) => {
    run(data);
  };
  finish = () => {
    emitter.emit("disconnect");
  };
  notify = (data: any) => {
    emitter.emit("message", data);
  };
  module.exports = (args: any) => {
    setup(args[0], args[1]);
    return emitter;
  };
} else {
  finish = () => setImmediate(() => process.disconnect());
  notify = (data: any) => {
    process.send && process.send(data);
  };
  process.on("message", (data) => {
    run(data);
  });
  setup(process.argv[2], process.argv[3]);
}

function prepareJscodeshift(options: any) {
  const parser =
    parserFromTransform || getParser(options.parser, options.parserConfig);
  return jscodeshift.withParser(parser);
}

function setup(tr: any, babel: any) {
  if (babel === "babel") {
    const presets = [];
    if (presetEnv) {
      // @ts-ignore
      presets.push([presetEnv.default, { targets: { node: true } }]);
    }
    presets.push(
      /\.tsx?$/.test(tr)
        ? require("@babel/preset-typescript").default
        : require("@babel/preset-flow").default
    );

    require("@babel/register")({
      configFile: false,
      babelrc: false,
      presets,
      plugins: [
        require("@babel/plugin-transform-class-properties").default,
        require("@babel/plugin-transform-nullish-coalescing-operator").default,
        require("@babel/plugin-transform-optional-chaining").default,
        require("@babel/plugin-transform-modules-commonjs").default,
        require("@babel/plugin-transform-private-methods").default,
      ],
      extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
      // By default, babel register only compiles things inside the current working directory.
      // https://github.com/babel/babel/blob/2a4f16236656178e84b05b8915aab9261c55782c/packages/babel-register/src/node.js#L140-L157
      ignore: [
        // Ignore parser related files
        /@babel\/parser/,
        /\/flow-parser\//,
        /\/recast\//,
        /\/ast-types\//,
      ],
    });
  }

  const module = require(tr);
  transform = typeof module.default === "function" ? module.default : module;
  if (module.parser) {
    parserFromTransform =
      typeof module.parser === "string"
        ? getParser(module.parser)
        : module.parser;
  }
}

function free() {
  notify({ action: "free" });
}

function updateStatus(status: any, file: any, msg?: any): any {
  msg = msg ? file + " " + msg : file;
  notify({ action: "status", status: status, msg: msg });
}

function report(file: any, msg: any) {
  notify({ action: "report", file, msg });
}

function empty() {}

function stats(name: any, quantity: any) {
  quantity = typeof quantity !== "number" ? 1 : quantity;
  notify({ action: "update", name: name, quantity: quantity });
}

function trimStackTrace(trace: any) {
  if (!trace) {
    return "";
  }
  // Remove this file from the stack trace of an error thrown in the transformer
  const lines = trace.split("\n");
  const result: any = [];
  lines.every(function (line: any) {
    if (line.indexOf(__filename) === -1) {
      result.push(line);
      return true;
    }
  });
  return result.join("\n");
}

function run(data: any) {
  const files = data.files;
  const options = data.options || {};
  if (!files.length) {
    finish();
    return;
  }
  async.each(
    files,
    function (file: any, callback) {
      fs.readFile(file, async function (err: any, source: any) {
        if (err) {
          updateStatus("error", file, "File error: " + err);
          callback();
          return;
        }
        source = source.toString();
        try {
          const jscodeshift = prepareJscodeshift(options);
          const out = await transform(
            {
              path: file,
              source: source,
            },
            {
              j: jscodeshift,
              jscodeshift: jscodeshift,
              stats: options.dry ? stats : empty,
              report: (msg: any) => report(file, msg),
            },
            options
          );
          if (!out || out === source) {
            updateStatus(out ? "nochange" : "skip", file);
            callback();
            return;
          }
          if (options.print) {
            console.log(out); // eslint-disable-line no-console
          }
          if (!options.dry) {
            writeFileAtomic(file, out, function (err) {
              if (err) {
                updateStatus("error", file, "File writer error: " + err);
              } else {
                updateStatus("ok", file);
              }
              callback();
            });
          } else {
            updateStatus("ok", file);
            callback();
          }
        } catch (err: any) {
          updateStatus(
            "error",
            file,
            "Transformation error (" +
              err.message.replace(/\n/g, " ") +
              ")\n" +
              trimStackTrace(err.stack)
          );
          callback();
        }
      });
    },
    function (err) {
      if (err) {
        updateStatus("error", "", "This should never be shown!");
      }
      free();
    }
  );
}
