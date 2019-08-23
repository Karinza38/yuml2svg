#!/usr/bin/env node

const { spawn } = require("child_process");
const { join } = require("path");

const FLAG = "--experimental-modules";
const ACTUAL_MODULE_PATH = join(__dirname, "yuml2svg");

const options = [FLAG, ACTUAL_MODULE_PATH].concat(process.argv.slice(2));

const subprocess = spawn(process.argv0, options, {
  windowsHide: true,
  stdio: "inherit",
});

subprocess.on("error", console.error);
subprocess.on("exit", code => {
  process.exit(code || 0);
});
