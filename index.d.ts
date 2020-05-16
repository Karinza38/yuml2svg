declare const yuml2svg: (
  input:
    | string
    | Uint8Array
    | ReadableStreamDefaultReader
    | ReadableStreamBYOBReader,
  options?: {
    isDark?: boolean;
    dotHeaderOverrides?: {
      graph?: any;
      node?: any;
      edge?: any;
    };
    type?:
      | "class"
      | "usecase"
      | "activity"
      | "state"
      | "sequence"
      | "deployment"
      | "package";
    dir?: "TB" | "LR" | "RL";
  },
  vizOptions?:
    | { workerURL: string }
    | { worker: Worker }
    | {
        Module: () => any;
        render: (instance: any, src: string, options: object) => string;
      },
  renderOptions?: {
    engine?: "circo" | "dot" | "fdp" | "neato" | "osage" | "twopi";
    format?: "svg";
    images?: object[];
    files?: object[];
  },
) => Promise<string>;
/**
 * Generates SVG diagram.
 * @param {string | Buffer | stream.Readable} input The yUML document to parse
 * @param {object} [options] - The options to be set for generating the SVG
 * @param {string} [options.dir] - The direction of the diagram "TB" (default) - topDown, "LR" - leftToRight, "RL" - rightToLeft
 * @param {string} [options.type] - The type of SVG - "class" (default), "usecase", "activity", "state", "deployment", "package".
 * @param {string} [options.isDark] - Option to get dark or light diagram
 * @param {object} [options.dotHeaderOverrides] - Dot HEADER overrides (Not supported for Sequence diagrams)
 * @param {object} [vizOptions] - @see https://github.com/mdaines/viz.js/wiki/API#new-vizoptions (should be undefined for back-end rendering)
 * @param {string | URL} [vizOptions.workerUrl] - URL of one of the rendering script files
 * @param {Worker} [vizOptions.worker] - Worker instance constructed with the URL or path of one of the rendering script files
 * @param {object} [renderOptions] - @see https://github.com/mdaines/viz.js/wiki/API#render-options
 * @param {string} [renderOptions.engine] - layout engine
 * @param {string} [renderOptions.format] - desired output format (only "svg" is supported)
 * @param {boolean} [renderOptions.yInvert] - invert the y coordinate in output (not supported with "svg" format output)
 * @param {object[]} [renderOptions.images] - image dimensions to use when rendering nodes with image attributes
 * @param {object[]} [renderOptions.files] - files to make available to Graphviz using Emscripten's in-memory filesystem
 * @returns {Promise<string>} The rendered diagram as a SVG document (or other format if specified in renderOptions)
 */
export default yuml2svg;
