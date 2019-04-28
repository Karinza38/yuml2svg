import { promises as fs } from "fs";
import { dirname } from "path";

const __dirname = dirname(new URL(import.meta.url).pathname);

fs.readdir(__dirname)
  .then(files =>
    Promise.all(
      files
        .filter(fileName => fileName.endsWith(".js"))
        .map(fileName => import(`./${fileName}`).then(module => module.default))
    )
  )
  .then(console.log, console.error);
