const yuml2svg = require("..");
const { promises: fs } = require("fs");

const inputFile = require.resolve("./test.yuml");
const outputFile = require.resolve("./test.yuml.svg");

Promise.all([fs.readFile(inputFile).then(yuml2svg), fs.readFile(outputFile)])
  .then(([actual, expectedOutput]) => {
    const actualOutput = Buffer.from(actual);
    if (Buffer.compare(actualOutput, expectedOutput) === 0) {
      return Promise.resolve("Success");
    } else {
      console.warn("Output has been modified");

      return fs.writeFile(outputFile, actualOutput);
    }
  })
  .then(console.log, console.error);
