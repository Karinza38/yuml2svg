import { promises as fs } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputFile = join(__dirname, "test.yuml");
const outputFile = join(__dirname, "test.yuml.svg");

export default Promise.all([
  Promise.all([
    import("../index.mjs").then(module => module.default),
    fs.readFile(inputFile),
  ])
    .then(([yuml2svg, yuml]) => yuml2svg(yuml))
    .then(Buffer.from),
  fs.readFile(outputFile),
]).then(([actualOutput, expectedOutput]) => {
  if (Buffer.compare(actualOutput, expectedOutput) === 0) {
    return Promise.resolve("Success for light diagram with Buffers");
  } else {
    console.warn("Output of light diagram has been modified");

    return fs
      .writeFile(outputFile, actualOutput)
      .then(() =>
        Promise.reject(new Error("Wrong output for light diagram with Buffers"))
      );
  }
});
