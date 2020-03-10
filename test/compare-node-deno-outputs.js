import { promises as fs, createReadStream } from "fs";
import { join, dirname } from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";

const PACKAGE_ROOT_PATH = join(dirname(fileURLToPath(import.meta.url)), "..");

const DENO_EXECUTABLE = process.env.DENO || "deno";
const getReadStream = () =>
  createReadStream(join(PACKAGE_ROOT_PATH, "test", "test.yuml"));

async function runNode(options) {
  const NODE_BIN_FILE = await fs
    .readFile(join(PACKAGE_ROOT_PATH, "package.json"))
    .then(JSON.parse)
    .then(({ bin }) => join(PACKAGE_ROOT_PATH, bin.yuml2svg));

  return new Promise((resolve, reject) => {
    const buffer = [];
    const node_process = execFile(NODE_BIN_FILE, options);

    node_process.on("error", reject);
    node_process.on("exit", () => resolve(buffer));

    node_process.stdout.on("data", chunk => buffer.push(chunk));
    node_process.stderr.pipe(process.stderr);

    getReadStream().pipe(node_process.stdin);
  });
}

async function runDeno(options = []) {
  return new Promise((resolve, reject) => {
    const buffer = [];
    const deno_process = execFile(DENO_EXECUTABLE, [
      "--importmap",
      join(PACKAGE_ROOT_PATH, "bin", "deno-files", "importmap.json"),
      `--allow-read=/dev,${PACKAGE_ROOT_PATH}`,
      "--allow-net=dev.jspm.io,unpkg.com",
      "-r",
      join(PACKAGE_ROOT_PATH, "bin", "yuml2svg.deno.ts"),
      ...options,
    ]);

    deno_process.on("error", reject);
    deno_process.on("exit", () => resolve(buffer));

    deno_process.stdout.on("data", chunk => buffer.push(chunk));
    deno_process.stderr.pipe(process.stderr);

    getReadStream().pipe(deno_process.stdin);
  });
}

const test = (options, successMessage, errorMessage) =>
  Promise.all([runNode, runDeno].map(fun => fun(options))).then(output =>
    Buffer.compare(...output.map(chunks => Buffer.from(chunks)))
      ? Promise.reject(new Error(errorMessage))
      : Promise.resolve(successMessage)
  );

export default Promise.all([
  test(
    [],
    "Deno and Node are aligned when using no options",
    "Node and Deno should produce same output when no option is specified"
  ),

  test(
    ["--dark"],
    "Deno and Node are aligned with --dark option",
    "Node and Deno should produce same output with --dark option"
  ),
]);
