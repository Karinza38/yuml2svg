# yUML to SVG

[![npm](https://img.shields.io/npm/v/yuml2svg.svg)](https://www.npmjs.com/package/yuml2svg)

This project is a fork of
[jaime-olivares/yuml-diagram](https://www.npmjs.com/package/yuml-diagram). You
might want to check it out if you are more interested in a synchronous version
of the API or you want to use an older version of Node.js.

Allows the creation of offline UML diagrams based on the
[yUML Syntax](http://yuml.me/).

## Support

- Node.js v12+ _(yuml2svg v5 uses ECMAScript modules, support is still
  experimental at the time of writing)_.
- Browser support through import maps or bundling (WebPack, Rollup, etc.).
- Unofficial support for Node.js v10 LTS (with the `--experimental-modules` CLI
  flag).
- Unofficial support for Deno.

## Installation

You can install it with yarn:

```shell
yarn global add yuml2svg # For CLI usage
yarn add yuml2svg # As local dependency
```

Or with npm:

```shell
npm --global install yuml2svg # For CLI usage
npm install yuml2svg # As local dependency
```

## Features

- Currently, the following diagram types are supported:
  - Class
  - Activity
  - Use-case
  - State
  - Deployment
  - Package
  - Sequence
- Additional directives for altering diagram type and orientation
- Embedded rendering engine: **No need to call an external web service**

## yUML syntax

Please refer to the [wiki page](//github.com/jaime-olivares/yuml-diagram/wiki).

## Usage

### CLI

You can use the package to transform yUML diagrams to SVG via the Command-Line
Interface.

```shell
# You can install the package globally (or use npx)
yarn global add yuml2svg

# Prints SVG document on the standard output
cat diagram.yuml | yuml2svg

# Save SVG file to the disk
cat diagram.yuml | yuml2svg > diagram.svg

# Save SVG file to the disk using dark mode
cat diagram.yuml | yuml2svg --dark > diagram.svg
```

### Node.JS API

The API exports a function that accepts as arguments:

1.  A `Readable` stream, a `Buffer` or a `string` containing the yUML diagram.
2.  An optional plain `object` containing the options for the rendering.
3.  An optional plain `object` containing the
    [options for Viz.js](//github.com/mdaines/viz.js/wiki/2.0.0-API#new-vizoptions).
    Check it out if you are using this package in the browser.
4.  An optional plain `object` containing the
    [render options for Viz.js](//github.com/mdaines/viz.js/wiki/2.0.0-API#render-options).

The API returns a `Promise` which resolves in a string containing SVG document
as a `string`.

> The options for the rendering are:
>
> - `dir`: `string` The direction of the diagram "TB" (default) - topDown,
>   "LR" - leftToRight, "RL" - rightToLeft
> - `type`: `string` The type of SVG - "class" (default), "usecase", "activity",
>   "state", "deployment", "package", "sequence".
> - `isDark`: `boolean` Option to get dark or light diagram
> - `dotHeaderOverrides`: `object` Option to customize output (not supported for
>   sequence diagram)
>
> Please check out [Viz.js wiki](//github.com/mdaines/viz.js/wiki/2.0.0-API) to
> get more the documentation of the last two parameters.

Here are some examples of a simple usage you can make of the API:

```js
import fs from "fs";
import yuml2svg from "yuml2svg";

/**
 * Renders a string or a Buffer into SVG with dark mode
 * @param {string | Buffer | Readable} yuml The yUML diagram
 * @returns {Promise<string>} callback The SVG document that represents the yUML diagram
 */
const renderDarkSVG = yuml => yuml2svg(yuml, { isDark: true });

/**
 * Renders a given file into a SVG string asynchronously
 * @param {string} filePath Path to the yUML diagram
 * @returns {Promise<string>} callback The SVG document that represents the yUML diagram
 */
const renderFile = filePath => yuml2svg(fs.createReadStream(filePath));

/**
 * Renders a given file into a SVG string asynchronously
 * @param {string} filePath Path to the yUML diagram
 * @param {{dir:string, type: string, isDark: boolean}} [options]
 * @param {object} [vizOptions] @see https://github.com/mdaines/viz.js/wiki/2.0.0-API
 * @returns {Promise<string>} callback The SVG document that represents the yUML diagram
 */
const renderFileWithOptions = (filePath, options, vizOptions) =>
  yuml2svg(fs.createReadStream(filePath), options, vizOptions);

/**
 * Generates a SVG file from a yUML file
 * @param {string} inputFile Path to the .yuml document to read
 * @param {string} outputFile Path to the .svg file to write
 * @returns {Promise<>} Promise that resolves once the SVG file is written
 */
const generateSVG = async (inputFile, outputFile) => {
  const svg = await yuml2svg(fs.createReadStream(filePath));

  return await fs.promises.writeFile(outputFile, svg);
};
```

**N.B.:** yuml2svg is written using ES modules, it means it cannot be _required_
(`require('yuml2svg')` will throw); although you still can use it from a CJS
script using dynamic import:

```js
var fs = require("fs");

/**
 * Renders a given file into a SVG string asynchronously
 * @param {string} filePath Path to the yUML diagram
 * @param {(Error, string)=>any} callback Async callback
 */
function renderFile(filePath, callback) {
  import("yuml2svg")
    .then(function(module) {
      var yuml2svg = module.default;
      return yuml2svg(fs.createReadStream(filePath));
    })

    .then(function(svg) {
      callback(null, svg);
    })
    .catch(callback);
}
```

### Run on the browser

You can find a working example of a browser implementation using webpack here:
[yuml2svg-playground](//github.com/aduh95/yuml2svg-playground).

If you want to use streams, pass a `ReadableStreamDefaultReader` or
`ReadableStreamBYOBReader` object to the API:

```js
import yuml2svg from "https://dev.jspm.io/yuml2svg@5";

const yumlOptions = {};
const vizOptions = {
  workerURL:
    "data:application/javascript,importScripts('https://unpkg.com/viz.js@2.1.2/full.render.js')",
};

fetch("https://raw.githubusercontent.com/aduh95/yuml2svg/master/test/test.yuml")
  .then(response =>
    response.ok
      ? yuml2svg(response.body.getReader(), yumlOptions, vizOptions)
      : Promise.reject(response.text())
  )
  .then(svg =>
    document.body.append(
      new DOMParser().parseFromString(svg, "text/xml").documentElement
    )
  )
  .catch(console.error);
```

> Note: Only UTF-8 is supported when using streams.

## Credits

- Thanks to the [mdaines](//github.com/mdaines)'s port of
  [Graphviz](//www.graphviz.org/) for JavaScript
  [viz.js](//github.com/mdaines/viz.js).
- Thanks to the [jaime-olivares](//github.com/jaime-olivares)'s
  [VSCode extension](//github.com/jaime-olivares/vscode-yuml).
