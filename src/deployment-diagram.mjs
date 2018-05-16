import {
  extractBgAndNote,
  formatLabel,
  serializeDot,
  splitYumlExpr,
} from "./yuml2dot-utils.mjs";
import UIDHandler from "./uidHandler.mjs";
import Color from "color";

const RANKSEP = 0.5;

/*
Unofficial syntax, based on the activity diagram syntax specified in yuml.me

Node           [node1]
Association    [node1]-[node2]
Labeled assoc  [node1]label-[node2]
Note           [node1]-[note: a note here]
Comment        // Comments
*/

function parseYumlExpr(specLine) {
  const exprs = [];
  const parts = splitYumlExpr(specLine, "[");

  for (const part of parts) {
    if (/^\[.*\]$/.test(part)) {
      // node
      const ret = extractBgAndNote(part.substr(1, part.length - 2), true);

      exprs.push([
        ret.isNote ? "note" : "box3d",
        ret.part,
        ret.bg,
        ret.fontcolor,
      ]);
    } else if (part.endsWith("-")) {
      // line w/ or wo/ label
      exprs.push([
        "edge",
        "none",
        "none",
        part.substr(0, part.length - 1).trim(),
        "solid",
      ]);
    } else {
      throw new Error(`Invalid expression - ${part}.`);
    }
  }

  return exprs;
}

function composeDotExpr(specLines, options) {
  const uidHandler = new UIDHandler();
  let dot = "";

  for (const line of specLines) {
    const parsedYumlExpr = parseYumlExpr(line);
    const parsedYumlExprLastIndex = parsedYumlExpr.length - 1;

    for (const elem of parsedYumlExpr) {
      const [shape] = elem;

      if (shape === "note" || shape === "box3d") {
        const label = elem[1];
        const uid = uidHandler.createUid(label);
        if (!uid) continue;

        const node = {
          shape,
          height: 0.5,
          fontsize: 10,
          margin: "0.20,0.05",
          label: formatLabel(label, 20, true),
        };

        if (elem[2]) {
          const color = Color(elem[2]);

          node.style = "filled";
          node.fillcolor = color.hex();
          node.fontcolor = color.isDark() ? "white" : "black";
        }

        if (elem[3]) {
          node.fontcolor = elem[3];
        }

        dot += `\t${uid} ${serializeDot(node)}\n`;
      }
    }

    for (let k = 1; k < parsedYumlExprLastIndex; k++) {
      if (
        parsedYumlExpr[k][0] === "edge" &&
        parsedYumlExpr[k - 1][0] !== "edge" &&
        parsedYumlExpr[k + 1][0] !== "edge"
      ) {
        const style =
          parsedYumlExpr[k - 1][0] === "note" ||
          parsedYumlExpr[k + 1][0] === "note"
            ? "dashed"
            : parsedYumlExpr[k][4];

        const edge = {
          shape: "edge",
          dir: "both",
          style,
          arrowtail: parsedYumlExpr[k][1],
          arrowhead: parsedYumlExpr[k][2],
          labeldistance: 2,
          fontsize: 10,
        };

        if (parsedYumlExpr[k][3].length > 0) {
          edge.label = parsedYumlExpr[k][3];
        }

        dot += `\t${uidHandler.getUid(
          parsedYumlExpr[k - 1][1]
        )} -> ${uidHandler.getUid(parsedYumlExpr[k + 1][1])} ${serializeDot(
          edge
        )}\n`;
      }
    }
  }

  return `\tranksep=${RANKSEP}\n\trankdir=${options.dir}\n${dot}`;
}

export default composeDotExpr;
