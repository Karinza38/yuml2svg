import { promises as fs } from "fs";
import { dirname, join } from "path";

const __dirname = dirname(import.meta.url.substring("file:".length));

const inputFile = join(__dirname, "test.yuml");
const outputFile = join(__dirname, "test.yuml.svg");

Promise.all([
  Promise.all([
    import("../index.mjs").then(module => module.default),
    fs.readFile(inputFile),
  ])
    .then(([yuml2svg, yuml]) => yuml2svg(yuml))
    .then(Buffer.from),
  fs.readFile(outputFile),
])
  .then(([actualOutput, expectedOutput]) => {
    if (Buffer.compare(actualOutput, expectedOutput) === 0) {
      return Promise.resolve("Success");
    } else {
      console.warn("Output has been modified");

      return fs.writeFile(outputFile, actualOutput);
    }
  })
  .then(console.log, console.error);
