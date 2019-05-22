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
  .then(array =>
    array.reduce(
      (acc, { status, value, reason }) => {
        status === "fulfilled"
          ? acc.pass.push(value)
          : acc.failures.push(reason);
        return acc;
      },
      { pass: [], failures: [] }
    )
  )
  .then(({ pass, failures }) => ({
    pass: pass.flat(),
    failures,
  }))
  .then(console.log, console.error);
