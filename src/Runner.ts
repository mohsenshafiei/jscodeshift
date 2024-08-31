/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import child_process from "child_process";
import pc from "picocolors";
import fs from "graceful-fs";
import path from "path";
import http from "http";
import https from "https";
import temp from "temp";
import * as ignores from "./ignoreFiles";
import os from "os";
// Types
import * as CoreTypes from "./types/core";
import * as RunnerTypes from "./types/Runner";

// import { createRequire } from "node:module";
// const require = createRequire(import.meta.url);

const availableCpus = Math.max(os.cpus().length - 1, 1);
const CHUNK_SIZE = 50;

function lineBreak(str: string) {
  return /\n$/.test(str) ? str : str + "\n";
}

const bufferedWrite = (function () {
  const buffer: string[] = [];
  let buffering = false;

  process.stdout.on("drain", () => {
    if (!buffering) return;
    while (
      buffer.length > 0 &&
      process.stdout.write(buffer.shift() as string) !== false
    );
    if (buffer.length === 0) {
      buffering = false;
    }
  });
  return function write(msg: string) {
    if (buffering) {
      buffer.push(msg);
    }
    if (process.stdout.write(msg) === false) {
      buffering = true;
    }
  };
})();

const log: any = {
  ok(msg: string, verbose: number) {
    verbose >= 2 && bufferedWrite(pc.bgGreen(pc.white(" OKK ")) + msg);
  },
  nochange(msg: string, verbose: number) {
    verbose >= 1 && bufferedWrite(pc.bgYellow(pc.white(" NOC ")) + msg);
  },
  skip(msg: string, verbose: number) {
    verbose >= 1 && bufferedWrite(pc.bgYellow(pc.white(" SKIP ")) + msg);
  },
  error(msg: string, verbose: number) {
    verbose >= 0 && bufferedWrite(pc.bgRed(pc.white(" ERR ")) + msg);
  },
};

function report({ file, msg }: RunnerTypes.ReportParams) {
  bufferedWrite(lineBreak(`${pc.bgBlue(pc.white(" REP "))}${file} ${msg}`));
}

function concatAll<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  for (const array of arrays) {
    for (const element of array) {
      result.push(element);
    }
  }
  return result;
}

function showFileStats(fileStats: RunnerTypes.FileCounters) {
  process.stdout.write(
    "Results: \n" +
      pc.red(fileStats.error + " errors\n") +
      pc.yellow(fileStats.nochange + " unmodified\n") +
      pc.yellow(fileStats.skip + " skipped\n") +
      pc.green(fileStats.ok + " ok\n")
  );
}

function showStats(stats: RunnerTypes.Stats) {
  const names = Object.keys(stats).sort();
  if (names.length) {
    process.stdout.write(pc.blue("Stats: \n"));
  }
  names.forEach((name) =>
    process.stdout.write(name + ": " + stats[name] + "\n")
  );
}

function dirFiles(
  dir: string,
  callback: (files: string[]) => void,
  acc?: RunnerTypes.Accumulator
): void {
  // acc stores files found so far and counts remaining paths to be processed
  acc = acc || { files: [], remaining: 1 };

  function done() {
    // decrement count and return if there are no more paths left to process
    if (!--acc!.remaining) {
      if (acc) callback(acc.files);
    }
  }

  fs.readdir(dir, (err, files) => {
    // if dir does not exist or is not a directory, bail
    // (this should not happen as long as calls do the necessary checks)
    if (err) throw err;

    acc.remaining += files.length;
    files.forEach((file) => {
      let name = path.join(dir, file);
      fs.stat(name, (err, stats) => {
        if (err) {
          // probably a symlink issue
          process.stdout.write(
            'Skipping path "' + name + '" which does not exist.\n'
          );
          done();
        } else if (ignores.shouldIgnore(name)) {
          // ignore the path
          done();
        } else if (stats.isDirectory()) {
          dirFiles(name + "/", callback, acc);
        } else {
          acc.files.push(name);
          done();
        }
      });
    });
    done();
  });
}

function getAllFiles(
  paths: string[],
  filter: (file: string) => boolean
): Promise<string[]> {
  return Promise.all(
    paths.map(
      (file) =>
        new Promise<string[]>((resolve) => {
          fs.lstat(file, (err, stat) => {
            if (err) {
              process.stderr.write(
                "Skipping path " + file + " which does not exist. \n"
              );
              resolve([]);
              return;
            }

            if (stat.isDirectory()) {
              dirFiles(file, (list) => resolve(list.filter(filter)));
            } else if (!filter(file) || ignores.shouldIgnore(file)) {
              // ignoring the file
              resolve([]);
            } else {
              resolve([file]);
            }
          });
        })
    )
  ).then(concatAll);
}

export default function run(
  transformFile: string,
  paths: string[],
  options: CoreTypes.Options
) {
  let usedRemoteScript = false;
  const cpus = options.cpus
    ? Math.min(availableCpus, options.cpus)
    : availableCpus;
  const extensions =
    options.extensions &&
    options.extensions.split(",").map((ext: string) => "." + ext);
  const fileCounters: RunnerTypes.FileCounters = {
    error: 0,
    ok: 0,
    nochange: 0,
    skip: 0,
  };
  const statsCounter: RunnerTypes.StatsCounter = {};
  const startTime = process.hrtime();

  ignores.add(options.ignoreSet);
  ignores.add(options.ignorePattern);
  ignores.addFromFile(options.ignoreConfig);

  if (options.gitignore) {
    let currDirectory = process.cwd();
    let gitIgnorePath = path.join(currDirectory, ".gitignore");
    ignores.addFromFile(gitIgnorePath);
  }

  if (/^http/.test(transformFile)) {
    usedRemoteScript = true;
    return new Promise((resolve, reject) => {
      // call the correct `http` or `https` implementation
      (transformFile.indexOf("https") !== 0 ? http : https)
        .get(transformFile, (res) => {
          let contents = "";
          res
            .on("data", (d) => {
              contents += d.toString();
            })
            .on("end", () => {
              const ext = path.extname(transformFile);
              temp.open({ prefix: "jscodeshift", suffix: ext }, (err, info) => {
                if (err) return reject(err);
                fs.write(info.fd, contents, function (err) {
                  if (err) return reject(err);
                  fs.close(info.fd, function (err) {
                    if (err) return reject(err);
                    transform(info.path).then(resolve, reject);
                  });
                });
              });
            });
        })
        .on("error", (e) => {
          reject(e);
        });
    });
  } else if (!fs.existsSync(transformFile)) {
    process.stderr.write(
      pc.bgRed(pc.white("ERROR")) +
        " Transform file " +
        transformFile +
        " does not exist \n"
    );
    return;
  } else {
    return transform(transformFile);
  }

  function transform(transformFile: string) {
    return getAllFiles(
      paths,
      (name: string) =>
        !extensions || extensions.indexOf(path.extname(name)) != -1
    )
      .then((files) => {
        const numFiles = files.length;

        if (numFiles === 0) {
          process.stdout.write("No files selected, nothing to do. \n");
          return [];
        }

        const processes = options.runInBand ? 1 : Math.min(numFiles, cpus);
        const chunkSize =
          processes > 1
            ? Math.min(Math.ceil(numFiles / processes), CHUNK_SIZE)
            : numFiles;

        let index = 0;
        // return the next chunk of work for a free worker
        function next() {
          if (!options.silent && !options.runInBand && index < numFiles) {
            process.stdout.write(
              "Sending " +
                Math.min(chunkSize, numFiles - index) +
                " files to free worker...\n"
            );
          }
          return files.slice(index, (index += chunkSize));
        }

        if (!options.silent) {
          process.stdout.write("Processing " + files.length + " files... \n");
          if (!options.runInBand) {
            process.stdout.write("Spawning " + processes + " workers...\n");
          }
          if (options.dry) {
            process.stdout.write(
              pc.green("Running in dry mode, no files will be written! \n")
            );
          }
        }

        const args = [transformFile, options.babel ? "babel" : "no-babel"];

        const workers = [];
        for (let i = 0; i < processes; i++) {
          workers.push(
            options.runInBand
              ? require("./Worker")(args)
              : child_process.fork(require.resolve("./Worker"), args)
          );
        }

        return workers.map((child) => {
          child.send({ files: next(), options });
          child.on("message", (message: RunnerTypes.Message) => {
            switch (message.action) {
              case "status":
                if (message.status && message.msg) {
                  fileCounters[message.status] += 1;
                  log[message.status](lineBreak(message.msg), options.verbose!);
                }
                break;
              case "update":
                if (message.name && message.quantity !== undefined) {
                  statsCounter[message.name] =
                    (statsCounter[message.name] || 0) + message.quantity;
                }
                break;
              case "free":
                child.send({ files: next(), options });
                break;
              case "report":
                if (message.status && message.file && message.msg) {
                  report({
                    status: message.status,
                    file: message.file,
                    msg: message.msg,
                  });
                }
                break;
            }
          });
          return new Promise((resolve) => child.on("disconnect", resolve));
        });
      })
      .then((pendingWorkers) =>
        Promise.all(pendingWorkers).then(() => {
          const endTime = process.hrtime(startTime);
          const timeElapsed = (endTime[0] + endTime[1] / 1e9).toFixed(3);
          if (!options.silent) {
            process.stdout.write("All done. \n");
            showFileStats(fileCounters);
            showStats(statsCounter);
            process.stdout.write("Time elapsed: " + timeElapsed + "seconds \n");

            if (options.failOnError && fileCounters.error > 0) {
              process.exit(1);
            }
          }
          if (usedRemoteScript) {
            temp.cleanupSync();
          }
          return Object.assign(
            {
              stats: statsCounter,
              timeElapsed: timeElapsed,
            },
            fileCounters
          );
        })
      );
  }
}
