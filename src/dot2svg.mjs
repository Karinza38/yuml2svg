import Viz from "viz.js";
let viz;

if (typeof IS_BROWSER === "undefined" || !IS_BROWSER) {
  var createNewVizInstance = () =>
    import("viz.js/full.render.js")
      .then(module => module.default)
      .then(({ Module, render }) => new Viz({ Module, render }));

  viz = createNewVizInstance();
} else {
  var oldVizOptions;
}

/**
 *
 * @param {string} dot The graph to render, as DOT
 * @param {object} [vizOptions] @see https://github.com/mdaines/viz.js/wiki/API#new-vizoptions
 * @param {object} [renderOptions] @see https://github.com/mdaines/viz.js/wiki/API#render-options
 */
export default async (dot, vizOptions, renderOptions) => {
  if (vizOptions && vizOptions !== oldVizOptions) {
    viz = new Viz((oldVizOptions = vizOptions));
  }
  const renderer = await viz;
  return renderer.renderString(dot, renderOptions).catch(err => {
    /** @see https://github.com/mdaines/viz.js/wiki/Caveats */
    if (vizOptions) {
      oldVizOptions = undefined;
    } else {
      viz = createNewVizInstance();
    }
    throw err;
  });
};
