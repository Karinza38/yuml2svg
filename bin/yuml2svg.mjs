#!/usr/bin/env node

"use strict";

if (process.stdin.isTTY) {
  console.log("Usage: cat diagram.yuml | yuml2svg > diagram.svg");
  console.log("\tTakes yUML diagram via stdin and outputs SVG to stdout.");
  console.log("\tOption: --dark to generate SVG with dark mode.");
} else {
  const isDark = process.argv[2] === "--dark";
  import("../index")
    .then(module => module.default(process.stdin, { isDark }))
    .then(svg => process.stdout.write(svg), console.error);
}
