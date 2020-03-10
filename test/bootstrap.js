#!/usr/bin/env node

import { promises as fs } from "fs";
import { dirname, sep } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const currentModuleName = __filename.substring(
  __dirname.length + !__dirname.endsWith(sep)
);

if ("function" !== typeof Promise.allSettled) {
  Promise.allSettled = function allSettled(iterable) {
    return Promise.all(
      Array.from(iterable, item =>
        item.then(
          value => ({ status: "fulfilled", value }),
          reason => ({ status: "rejected", reason })
        )
      )
    );
  };
}

fs.readdir(__dirname)
  .then(files =>
    Promise.allSettled(
      files
        .filter(
          fileName => fileName.endsWith(".js") && fileName !== currentModuleName
        )
        .map(fileName => import(`./${fileName}`).then(module => module.default))
    )
  )
  .then(array => {
    const pass = [];
    const failures = [];
    for (const { status, value, reason } of array) {
      if (status === "fulfilled") {
        pass.push(value);
      } else {
        failures.push(reason);
      }
    }
    return {
      pass: pass.flat(),
      failures,
    };
  })
  .then(console.log, console.error);
