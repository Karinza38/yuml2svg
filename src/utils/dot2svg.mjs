import Viz from "@aduh95/viz.js";
/**
 * @type {Viz}
 */
let viz;
/**
 * @type {import("@aduh95/viz.js").RenderOptions}
 */
let oldVizOptions;

const createVizInstanceWithDefaultOptions = () =>
  import("@aduh95/viz.js/worker").then(
    module => new Viz({ worker: module.default() })
  );

/**
 *
 * @param {string} dot The graph to render, as DOT
 * @param {import("@aduh95/viz.js").VizConstructorOptions} [vizOptions]
 * @param {import("@aduh95/viz.js").RenderOptions} [renderOptions]
 */
export default async (dot, vizOptions, renderOptions) => {
  if (vizOptions && vizOptions !== oldVizOptions) {
    viz = new Viz((oldVizOptions = vizOptions));
  } else if (viz === undefined) {
    viz = await createVizInstanceWithDefaultOptions();
  }
  // else uses cached viz instance

  return viz.renderString(dot, renderOptions).catch(err => {
    oldVizOptions = undefined;

    throw err;
  });
};
