import { promises as fs } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import yuml2svg from "yuml2svg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputDir = join(__dirname, "old_issues");

export default fs.readdir(inputDir).then(files =>
  Promise.all(
    files.filter(filename => filename.endsWith(".yuml")).map(async filename => {
      const path = join(inputDir, filename);
      const [actualOutput, expectedOutput] = await Promise.all([
        fs
          .readFile(path)
          .then(input => yuml2svg(input))
          .then(Buffer.from),
        fs.readFile(path + ".svg"),
      ]);

      if (Buffer.compare(actualOutput, expectedOutput) === 0) {
        return `Success for ${filename}`;
      } else {
        return Promise.reject(new Error(`Wrong output for ${filename}`));
      }
    })
  )
);
