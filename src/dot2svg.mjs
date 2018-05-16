import Viz from "viz.js";

if (typeof IS_BROWSER === "undefined" || !IS_BROWSER) {
  var viz = import("viz.js/full.render.js")
    .then(module => module.default)
    .then(({ Module, render }) => new Viz({ Module, render }));
}

/**
 *
 * @param {string} dot The graph to render, as DOT
 * @param {object} [vizOptions] @see https://github.com/mdaines/viz.js/wiki/API#new-vizoptions
 * @param {object} [renderOptions] @see https://github.com/mdaines/viz.js/wiki/API#render-options
 */
export default async (dot, vizOptions, renderOptions) => {
  const renderer = vizOptions ? new Viz(vizOptions) : await viz;
  return renderer.renderString(dot, renderOptions).catch(err => {
    /** @see https://github.com/mdaines/viz.js/wiki/Caveats */
    if (!vizOptions) {
      viz = import("viz.js/full.render.js")
        .then(module => module.default)
        .then(({ Module, render }) => new Viz({ Module, render }));
    }
    throw err;
  });
};
