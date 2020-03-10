#!/usr/bin/env deno

import yuml2svg from "yuml2svg";

{
  const { addEventListener } = Worker.prototype as any;
  (Worker as any).prototype.addEventListener = function(
    eventType: string,
    handler: Function
  ) {
    if ("message" === eventType) {
      this.onmessage = handler;
    } else {
      addEventListener.apply(this, arguments);
    }
  };
}

if (import.meta.main) {
  if (Deno.isatty(Deno.stdin.rid)) {
    console.log("Usage: yuml2svg < diagram.yuml > diagram.svg");
    console.log("\tTakes yUML diagram via stdin and outputs SVG to stdout.");
    console.log("\tOption: --dark to generate SVG with dark mode.");
  } else {
    const isDark = Deno.args[1] === "--dark";
    Deno.readAll(Deno.stdin)
      .then(TextDecoder.prototype.decode.bind(new TextDecoder()))
      .then((yuml: string) =>
        yuml2svg(yuml, { isDark }, { workerURL: "./deno-files/worker.ts" }, {})
      )
      .then(console.log)
      .catch(console.error);
  }
}

export default yuml2svg;
