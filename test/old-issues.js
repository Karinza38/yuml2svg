import { promises as fs } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import yuml2svg from "../index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputDir = join(__dirname, "old_issues");

export default fs.readdir(inputDir).then(files =>
  Promise.all(
    files
      .filter(filename => filename.endsWith(".yuml"))
      .map(filename => join(inputDir, filename))
      .map(path =>
        Promise.all([
          fs
            .readFile(path)
            .then(input => yuml2svg(input))
            .then(Buffer.from),
          fs.readFile(path + ".svg"),
        ]).then(([actualOutput, expectedOutput]) => {
          if (Buffer.compare(actualOutput, expectedOutput) === 0) {
            return Promise.resolve("Success");
          } else {
            return Promise.reject("An old bug file as been modified");
          }
        })
      )
  )
);
