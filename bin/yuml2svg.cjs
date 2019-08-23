#!/usr/bin/env node

const { spawn } = require("child_process");
const { join } = require("path");

const FLAG = "--experimental-modules";
const ACTUAL_MODULE_PATH = join(__dirname, "yuml2svg");

const subprocess = spawn(process.argv0, [FLAG, ACTUAL_MODULE_PATH], {
  windowsHide: true,
  stdio: "pipe",
});

process.stdin.pipe(subprocess.stdin);
subprocess.stderr.pipe(process.stderr);
subprocess.stdout.pipe(process.stdout);

subprocess.on("error", console.error);
subprocess.on("exit", code => {
  process.exit(code || 0);
});
