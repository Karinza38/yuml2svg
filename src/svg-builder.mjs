const NS = "http://www.w3.org/2000/svg";
const FONT_SIZE = 18;
const CHAR_WIDTH = 8.5;
const MARKER_SIZE = 6;

const WHITE = "#fff";
const BLACK = "#000";

export default import("./get-dom-window.mjs")
  .then(module => module.default)
  .then(
    ({ document }) =>
      function(isDark) {
        const svgElement = document.createElement("svg");

        this.getDocument = function() {
          return svgElement;
        };

        this.setDocumentSize = function(width, height) {
          const svg = this.getDocument();
          svg.setAttribute("width", width);
          svg.setAttribute("height", height);
        };

        this.createRect = function(width, height) {
          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("width", width);
          rect.setAttribute("height", height);
          rect.setAttribute("stroke", isDark ? WHITE : BLACK);
          rect.setAttribute("stroke-width", "1");
          rect.setAttribute("fill", "none");

          return rect;
        };

        this.createText = function(message, x, y, color) {
          const g = document.createElementNS(NS, "g");
          const lines = message.split("\n");

          y -= ((lines.length - 1) / 2) * FONT_SIZE;

          for (const lineText of lines) {
            const text = document.createElementNS(NS, "text");
            text.textContent = lineText;
            text.setAttribute("fill", color || isDark ? WHITE : BLACK);
            text.setAttribute("font-family", "Helvetica,sans-Serif");

            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");

            y += FONT_SIZE;

            g.appendChild(text);
          }

          return g;
        };

        this.getTextSize = function(text) {
          const lines = text.split("\n");
          const width =
            CHAR_WIDTH * Math.max(...lines.map(line => line.length));

          return { x: 0, y: 0, width, height: FONT_SIZE * lines.length };
        };

        this.createPath = function(format, lineType) {
          const pathSpec = format.replace(
            /\{(\d+)\}/g,
            (_, index) => arguments[parseInt(index) + 2]
          );

          const path = document.createElementNS(NS, "path");
          path.setAttribute("d", pathSpec);
          path.setAttribute("stroke", isDark ? WHITE : BLACK);
          path.setAttribute("stroke-width", "1");
          path.setAttribute("fill", "none");

          if (lineType === "dashed") {
            path.setAttribute("stroke-dasharray", "7,4");
          }

          return path;
        };

        this.serialize = function() {
          return this.getDocument().outerHTML;
        };

        this._createDefsElement = function() {
          const defs = document.createElementNS(NS, "defs");
          const filledArrow = document.createElementNS(NS, "marker");
          const openArrow = document.createElementNS(NS, "marker");

          const filledArrowPath = this.createPath("M0,0 6,3 0,6z", "solid");
          filledArrow.appendChild(filledArrowPath);

          const openArrowPath = this.createPath("M0,0 6,3 0,6", "solid");
          openArrow.appendChild(openArrowPath);

          filledArrow.setAttribute("id", "arrow-filled");
          filledArrow.setAttribute("refX", MARKER_SIZE);
          filledArrow.setAttribute("refY", MARKER_SIZE / 2);
          filledArrow.setAttribute("markerWidth", MARKER_SIZE);
          filledArrow.setAttribute("markerHeight", MARKER_SIZE);
          filledArrow.setAttribute("orient", "auto");

          filledArrowPath.setAttribute("stroke", "none");
          openArrowPath.setAttribute("stroke-width", "1");
          filledArrowPath.setAttribute("fill", isDark ? WHITE : BLACK);
          openArrowPath.setAttribute("fill", isDark ? WHITE : BLACK);

          openArrow.setAttribute("id", "arrow-open");
          openArrow.setAttribute("refX", MARKER_SIZE);
          openArrow.setAttribute("refY", MARKER_SIZE / 2);
          openArrow.setAttribute("markerWidth", MARKER_SIZE);
          openArrow.setAttribute("markerHeight", MARKER_SIZE);
          openArrow.setAttribute("orient", "auto");

          defs.appendChild(filledArrow);
          defs.appendChild(openArrow);
          return defs;
        };

        svgElement.setAttribute("xmlns", NS);
        svgElement.appendChild(this._createDefsElement());
      }
  );
