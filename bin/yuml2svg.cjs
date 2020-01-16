#!/usr/bin/env node

/**
 * Runs the binary with experimental flag for node versions that don't
 * support ECMAScript modules natively.
 */

const { spawn } = require("child_process");
const { join } = require("path");

const FLAG = "--experimental-modules";
const ACTUAL_MODULE_PATH = join(__dirname, "yuml2svg");

if (
  process.allowedNodeEnvironmentFlags &&
  !process.allowedNodeEnvironmentFlags.has(FLAG)
) {
  throw new Error("This version of Node.js doesn't support compat mode!");
}

const options = [FLAG, ACTUAL_MODULE_PATH].concat(process.argv.slice(2));

const subprocess = spawn(process.argv0, options, {
  windowsHide: true,
  stdio: "inherit",
});

subprocess.on("error", console.error);
subprocess.on("exit", code => {
  process.exit(code || 0);
});
