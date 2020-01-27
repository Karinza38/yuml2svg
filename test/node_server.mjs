#!/usr/bin/env node

/**
 * Creates a very simple test server with Node.js to test WHATWG stream support.
 *
 * Requires a browser with import-maps support.
 * @see https://github.com/WICG/import-maps
 * @see chrome://flags/#enable-experimental-productivity-features
 */

import path from "path";
import { promises as fs, constants, createReadStream } from "fs";
import { createServer } from "http";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.join(__dirname, "..");

const requestListener = (req, res) => {
  const jsMIME = "application/javascript";
  if (req.url === "/") {
    res.setHeader("Content-Type", "text/html");
    fs.readFile(path.join(PROJECT_DIR, "/bin/importmap.json"))
      .then(JSON.parse)
      .then(importMap => {
        const workerURL = importMap.imports["@aduh95/viz.js/worker"];
        const workerLoader = `data:${jsMIME},self.Module={locateFile:file=>"${workerURL.substring(
          0,
          workerURL.lastIndexOf("/") + 1
        )}"+file};importScripts("${encodeURI(workerURL)}")`;

        importMap.imports[
          "@aduh95/viz.js/worker"
        ] = `data:${jsMIME},export%20default'${encodeURI(workerLoader)}'`;
        importMap.imports.yuml2svg = "/index.mjs";

        res.end(
          `<script type="importmap">${JSON.stringify(importMap)}</script>
            <script type="module">
                import yuml2svg from "yuml2svg";
                import workerURL from "@aduh95/viz.js/worker";

                const vizOptions = { workerURL };

                console.time();
                
                const p = document.createElement('p');
                p.textContent = "Loading...";
                document.body.append(p);
        
                fetch('/test/test.yuml')
                    .then(response =>
                        response.ok
                        ? yuml2svg(response.body.getReader(), {}, vizOptions)
                        : Promise.reject(response.text())
                    )
                    .then(svg => {
                        const { documentElement } = new DOMParser()
                          .parseFromString(svg, "text/xml")
                        p.replaceWith(documentElement);
                        console.timeEnd();
                      }
                    )
                    .catch(e => {
                      p.textContent = e.message;
                      console.error(e);
                      console.info(
                        'Hint: Maybe your browser does not support import-maps.',
                        'https://github.com/WICG/import-maps'
                      );
                    });
            </script>
            <script nomodule>document.write('Unsupported browser!')</script>
            <noscript>Unsupported browser!</noscript>`
        );
      })
      .catch(err => res.end(err.message));
  } else {
    const resolvedPath = path.join(PROJECT_DIR, req.url);

    // Required for ES modules
    res.setHeader("Content-Type", jsMIME);

    fs.access(resolvedPath, constants.R_OK)
      .then(() => {
        createReadStream(resolvedPath).pipe(res);
      })
      .catch(e => {
        console.error(e);
        res.statusCode = 404;
        res.end(`Cannot find '${req.url}' on this server.`);
      });
  }
};

const server = createServer(requestListener).listen(0, "localhost", function() {
  console.log(`Server started on http://localhost:${server.address().port}`);
});
