import { promises as fs } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));


fs.readdir(__dirname)
  .then(files =>
    Promise.all(
      files
        .filter(fileName => fileName.endsWith(".js"))
        .map(fileName => import(`./${fileName}`).then(module => module.default))
    )
  )
  .then(console.log, console.error);
