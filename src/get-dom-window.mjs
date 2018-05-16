let exports;

if (typeof IS_BROWSER === "undefined" || !IS_BROWSER) {
  exports = import("jsdom").then(module => new module.default.JSDOM().window);
} else {
  exports = Promise.resolve(window);
}

/**
 * @returns {Promise<Window>} Should work on Node as on the browser
 */
export default exports;
