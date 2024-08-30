/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from "events";
import async from "neo-async";
import fs from "graceful-fs";
import writeFileAtomic from "write-file-atomic";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import getParser from "./getParser";
import jscodeshift from "./core";
import { Options, Parser } from "./types/core";
import presetEnv from "@babel/preset-env";
import babelRegister from "@babel/register";
import presetTypescript from "@babel/preset-typescript"; //
import presetFlow from "@babel/preset-flow"; //
import classProperties from "@babel/plugin-transform-class-properties"; //
import nullishCoalescingOperator from "@babel/plugin-transform-nullish-coalescing-operator"; //
import optionalChaining from "@babel/plugin-transform-optional-chaining";
import modulesCommonjs from "@babel/plugin-transform-modules-commonjs";
import privateMethods from "@babel/plugin-transform-private-methods";

class CustomEmitter extends EventEmitter {
  send(data: any) {
    // Custom logic for send
    this.emit("message", data);
  }
}

let emitter: CustomEmitter | undefined;
let finish: () => void;
let notify: (data: any) => void;
let transform: Function;
let parserFromTransform: Function | string | undefined;

let worker: any;

if (module.parent) {
  emitter = new CustomEmitter();
  emitter.send = (data: any) => {
    run(data);
  };
  finish = () => {
    emitter?.emit("disconnect");
  };
  notify = (data: any) => {
    emitter?.emit("message", data);
  };
  worker = (args: any[]) => {
    setup(args[0], args[1]);
    return emitter;
  };
} else {
  finish = () => setImmediate(() => process.disconnect?.());
  notify = (data: any) => {
    process.send && process.send(data);
  };
  process.on("message", (data) => {
    run(data);
  });
  setup(process.argv[2], process.argv[3]);
}

export default worker;

function prepareJscodeshift(options: Options) {
  const parser =
    parserFromTransform || getParser(options.parser, options.parserConfig);
  return jscodeshift.withParser(parser as string | Parser);
}

async function setup(tr: any, babel: any) {
  if (babel === "babel") {
    const presets: any[] = [];
    if (presetEnv) {
      presets.push([presetEnv, { targets: { node: true } }]);
    }
    presets.push(/\.tsx?$/.test(tr) ? presetTypescript() : presetFlow());

    babelRegister({
      configFile: false,
      babelrc: false,
      presets,
      plugins: [
        classProperties(),
        nullishCoalescingOperator(),
        optionalChaining(),
        modulesCommonjs(),
        privateMethods(),
      ],
      extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
      ignore: [
        /@babel\/parser/,
        /\/flow-parser\//,
        /\/recast\//,
        /\/ast-types\//,
      ],
    });
  }

  const module = await import(tr);
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

function updateStatus(status: any, file: any, msg?: string): void {
  msg = msg ? file + " " + msg : file;
  notify({ action: "status", status, msg });
}

function report(file: any, msg: any): void {
  notify({ action: "report", file, msg });
}

function empty() {}

function stats(name: any, quantity: any): void {
  quantity = typeof quantity !== "number" ? 1 : quantity;
  notify({ action: "update", name, quantity });
}

function trimStackTrace(trace: string | undefined): string {
  if (!trace) {
    return "";
  }
  const lines = trace.split("\n");
  const result: string[] = [];
  lines.every((line: string) => {
    if (!line.includes(__filename)) {
      result.push(line);
      return true;
    }
  });
  return result.join("\n");
}

function run(data: any): void {
  const files = data.files;
  const options = data.options || {};
  if (!files.length) {
    finish();
    return;
  }
  async.each(
    files,
    (file: string, callback: Function) => {
      fs.readFile(
        file,
        async (err: NodeJS.ErrnoException | null, source: Buffer) => {
          if (err) {
            updateStatus("error", file, "File error: " + err);
            callback();
            return;
          }
          const sourceStr = source.toString();
          try {
            const jscodeshiftInstance = prepareJscodeshift(options);
            const out = await transform(
              {
                path: file,
                source: sourceStr,
              },
              {
                j: jscodeshiftInstance,
                jscodeshift: jscodeshiftInstance,
                stats: options.dry ? stats : empty,
                report: (msg: any) => report(file, msg),
              },
              options
            );
            if (!out || out === sourceStr) {
              updateStatus(out ? "nochange" : "skip", file);
              callback();
              return;
            }
            if (options.print) {
              console.log(out); // eslint-disable-line no-console
            }
            if (!options.dry) {
              writeFileAtomic(file, out, (err) => {
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
        }
      );
    },
    (err: any) => {
      if (err) {
        updateStatus("error", "", "This should never be shown!");
      }
      free();
    }
  );
}
