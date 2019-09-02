#!/usr/bin/env deno

import yuml2svg from "../index.mjs";

if (import.meta.main) {
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

export default yuml2svg;
