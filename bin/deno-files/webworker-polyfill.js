/**
 * Adds global variables to the global scope to make sure JS code targeting
 * webworker should be able to run as long as it doesn't actually use any of
 * these features. Do not use this on production.
 *
 * This module solely aims to monkey-patch global scope for Emscripten scripts
 * compiled with `-s ENVIRONMENT=worker` if you want to test it on a different
 * JS environment. It should work on Node.js and Deno.
 * You would need to provide a Module object with a `wasmBinary` property
 * containing an `ArrayBuffer` describing the WASM file.
 *
 * ```js
 * globalThis['Module'] = { wasmBinary: Uint16Array.from([]).buffer };
 * import './webworker-polyfill.js';
 * import './render.js';
 * ```
 */
if ("undefined" === typeof window) globalThis["window"] = globalThis;
if ("undefined" === typeof self) globalThis["self"] = globalThis;
if ("undefined" === typeof importScripts)
  globalThis["importScripts"] = Function.prototype;
if ("undefined" === typeof addEventListener)
  globalThis["addEventListener"] = Function.prototype;
if ("undefined" === typeof location) globalThis["location"] = { href: "" };
if ("undefined" === typeof postMessage) globalThis["postMessage"] = console.log;
if ("undefined" === typeof crypto)
  globalThis["crypto"] = {
    getRandomValues(b) {
      b.fill(4); // @see https://www.xkcd.com/221/
    },
  };
