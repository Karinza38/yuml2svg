const handleStream = "handle-stream";
const dot2svg = "dot2svg";
const processEmbeddedImages = "svg-utils";
const wrapDotDocument = "wrapDotDocument";

const diagramTypes = {
  class: "class-diagram",
  usecase: "usecase-diagram",
  activity: "activity-diagram",
  state: "state-diagram",
  deployment: "deployment-diagram",
  package: "package-diagram",
  sequence: "sequence-diagram",
};

const directions = {
  topDown: "TB",
  leftToRight: "LR",
  rightToLeft: "RL",
};

/**
 * Generates SVG diagram.
 * @param {string | Buffer | Readable} input The yUML document to parse
 * @param {object} [options] - The options to be set for generating the SVG
 * @param {string} [options.dir] - The direction of the diagram "TB" (default) - topDown, "LR" - leftToRight, "RL" - rightToLeft
 * @param {string} [options.type] - The type of SVG - "class" (default), "usecase", "activity", "state", "deployment", "package".
 * @param {string} [options.isDark] - Option to get dark or light diagram
 * @param {object} [options.dotHeaderOverrides] - Dot HEADER overrides (Not supported for Sequence diagrams)
 * @param {object} [vizOptions] - @see https://github.com/mdaines/viz.js/wiki/API#new-vizoptions (should be undefined for back-end rendering)
 * @param {string} [vizOptions.workerUrl] - URL of one of the rendering script files
 * @param {Worker} [vizOptions.worker] - Worker instance constructed with the URL or path of one of the rendering script files
 * @param {object} [renderOptions] - @see https://github.com/mdaines/viz.js/wiki/API#render-options
 * @param {string} [renderOptions.engine] - layout engine
 * @param {string} [renderOptions.format] - desired output format (only "svg" is supported)
 * @param {boolean} [renderOptions.yInvert] - invert the y coordinate in output (not supported with "svg" format output)
 * @param {object[]} [renderOptions.images] - image dimensions to use when rendering nodes with image attributes
 * @param {object[]} [renderOptions.files] - files to make available to Graphviz using Emscripten's in-memory filesystem
 * @returns {Promise<string>} The rendered diagram as a SVG document (or other format if specified in renderOptions)
 */
export default (input, options, vizOptions, renderOptions) => {
  if (!options) options = {};
  if (!options.dir) options.dir = "TB";
  if (!options.type) options.type = "class";
  if (!options.isDark) options.isDark = false;

  const diagramInstructions = [];

  if (input.read && "function" === typeof input.read) {
    return import(`./src/${handleStream}.mjs`)
      .then(module => module.default)
      .then(handleStream =>
        handleStream(input, processLine(options, diagramInstructions))
      )
      .then(() =>
        processYumlData(diagramInstructions, options, vizOptions, renderOptions)
      );
  } else {
    input
      .toString()
      .split(/\r|\n/)
      .forEach(processLine(options, diagramInstructions));

    return processYumlData(
      diagramInstructions,
      options,
      vizOptions,
      renderOptions
    );
  }
};

const processYumlData = (
  diagramInstructions,
  options,
  vizOptions,
  renderOptions
) => {
  if (diagramInstructions.length === 0) {
    return Promise.resolve("");
  }

  if (!options.hasOwnProperty("type")) {
    return Promise.reject(
      new Error("Error: Missing mandatory 'type' directive")
    );
  }

  if (options.type in diagramTypes) {
    const { isDark, dotHeaderOverrides } = options;

    try {
      const renderingFunction = diagramTypes[options.type];
      const renderingPromise = import(`./src/${renderingFunction}.mjs`).then(
        module => module.default(diagramInstructions, options)
      );

      // Sequence diagrams are rendered as SVG, not dot file -- and have no embedded images (I guess)
      return options.type === "sequence"
        ? renderingPromise
        : Promise.all([
            Promise.all([
              import(`./src/${dot2svg}.mjs`).then(module => module.default),
              import(`./src/${wrapDotDocument}.mjs`).then(
                module => module.default
              ),
              renderingPromise,
            ]).then(([dot2svg, wrapDotDocument, dotDocument]) =>
              dot2svg(
                wrapDotDocument(dotDocument, isDark, dotHeaderOverrides),
                vizOptions,
                renderOptions
              )
            ),
            import(`./src/${processEmbeddedImages}.mjs`).then(
              module => module.default
            ),
          ]).then(([svg, processEmbeddedImages]) =>
            processEmbeddedImages(svg, isDark)
          );
    } catch (err) {
      return Promise.reject(err);
    }
  } else {
    return Promise.reject(new Error("Invalid diagram type"));
  }
};

const processLine = (options, diagramInstructions) => line => {
  line = line.trim();
  if (line.startsWith("//")) {
    processDirectives(line, options);
  } else if (line.length) {
    diagramInstructions.push(line);
  }
};

const processDirectives = function(line, options) {
  const keyValue = /^\/\/\s+\{\s*([\w]+)\s*:\s*([\w]+)\s*\}$/.exec(line); // extracts directives as:  // {key:value}
  if (keyValue !== null && keyValue.length === 3) {
    const [_, key, value] = keyValue;

    switch (key) {
      case "type":
        if (value in diagramTypes) {
          options.type = value;
        } else {
          console.warn(
            new Error(
              "Invalid value for 'type'. Allowed values are: " +
                Object.keys(diagramTypes).join(", ")
            )
          );
        }
        break;

      case "direction":
        if (value in directions) {
          options.dir = directions[value];
        } else {
          console.warn(
            new Error(
              "Invalid value for 'direction'. Allowed values are: " +
                Object.keys(directions).join(", ")
            )
          );
        }
        break;

      case "generate":
        if (/^(true|false)$/.test(value)) {
          options.generate = value === "true";
          console.warn("Generate option is not supported");
        } else {
          console.warn(
            new Error(
              "Error: invalid value for 'generate'. Allowed values are: true, false <i>(default)</i>."
            )
          );
        }
    }
  }
};
