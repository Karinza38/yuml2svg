#!/usr/bin/env deno

import yuml2svg from "../index.mjs";

if (import.meta.main) {
  if (Deno.isTTY().stdin) {
    console.log("Usage: cat diagram.yuml | yuml2svg > diagram.svg");
    console.log("\tTakes yUML diagram via stdin and outputs SVG to stdout.");
    console.log("\tOption: --dark to generate SVG with dark mode.");
  } else {
    const isDark = Deno.args[1] === "--dark";
    Deno.readAll(Deno.stdin)
      .then(buffer =>
        yuml2svg(
          buffer,
          { isDark },
          { workerURL: "https://dev.jspm.io/viz.js@2.1.2/full.render.js" },
          {}
        )
      )
      .then(console.log)
      .catch(console.error);
  }
}

export default yuml2svg;
