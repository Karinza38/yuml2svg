let exports;

if ("object" === typeof globalThis && globalThis.document) {
  exports = Promise.resolve(window);
} else if (typeof IS_BROWSER === "undefined" || !IS_BROWSER) {
  exports = import("jsdom").then(module => new module.default.JSDOM().window);
}

/**
 * @returns {Promise<Window>} Should work on Node as on the browser
 */
export default exports;
