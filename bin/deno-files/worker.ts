import "./webworker-polyfill.js";
import {
  default as initWASM,
  onmessage as o,
} from "https://unpkg.com/@aduh95/viz.js@3.0.0-beta.6/dist/render.browser.js";

const fetchWasmBinary = fetch(
  "https://unpkg.com/@aduh95/viz.js@3.0.0-beta.6/dist/render.wasm"
).then(response =>
  response.ok ? response.arrayBuffer() : Promise.reject(response.status)
);

onmessage = function(m) {
  fetchWasmBinary
    .then(wasmBinary =>
      initWASM({
        wasmBinary,
      })
    )
    .then(() => o(m))
    .catch(console.error)
    .finally(() => {
      close();
    });
};
