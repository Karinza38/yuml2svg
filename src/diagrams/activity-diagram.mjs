import {
  escape_label,
  extractBgAndNote,
  serializeDotElements,
  splitYumlExpr,
} from "../utils/yuml2dot-utils.mjs";
import UIDHandler from "../utils/uidHandler.mjs";
import Color from "color";

const RANKSEP = 0.5;
const HEADPORTS = { LR: "w", RL: "e", TB: "n" };

/*
Syntax as specified in yuml.me

Start	           (start)
End	               (end)
Activity           (Find Products)
Flow	           (start)->(Find Products)
Multiple Assoc.    (start)->(Find Products)->(end)
Decisions          (start)-><d1>
Decisions w/Label  (start)-><d1>logged in->(Show Dashboard), <d1>not logged in->(Show Login Page)
Parallel	       (Action1)->|a|,(Action 2)->|a|
Note               (Action1)-(note: A note message here)
Comment            // Comments
*/

function parseYumlExpr(specLine) {
  const exprs = [];
  const parts = splitYumlExpr(specLine, "(<|");

  for (const part of parts) {
    if (/^\(.*\)$/.test(part)) {
      // activity
      const ret = extractBgAndNote(
        part.substr(1, part.length - 2).trim(),
        true
      );
      exprs.push([
        ret.isNote ? "note" : "record",
        ret.part,
        ret.bg,
        ret.fontcolor,
      ]);
    } else if (/^<.*>$/.test(part)) {
      // decision
      exprs.push(["diamond", part.substr(1, part.length - 2).trim()]);
    } else if (/^\|.*\|$/.test(part)) {
      // bar
      exprs.push(["mrecord", part.substr(1, part.length - 2).trim()]);
    } else if (/->$/.test(part)) {
      // arrow
      exprs.push([
        "edge",
        "none",
        "vee",
        part.substr(0, part.length - 2).trim(),
        "solid",
      ]);
    } else if (part === "-") {
      // connector for notes
      exprs.push(["edge", "none", "none", "", "solid"]);
    } else throw new Error("Invalid expression");
  }

  return exprs;
}

function composeDotExpr(specLines, options) {
  let node;
  const uidHandler = new UIDHandler();
  const elements = [];

  for (const line of specLines) {
    const parsedYumlExpr = parseYumlExpr(line);
    const parsedYumlExprLastIndex = parsedYumlExpr.length - 1;

    for (const elem of parsedYumlExpr) {
      const [shape, label] = elem;

      if (shape === "note" || shape === "record") {
        const uid = uidHandler.createUid(label);
        if (!uid) continue;

        if (shape === "record" && (label === "start" || label === "end")) {
          node = {
            shape: label === "start" ? "circle" : "doublecircle",
            height: 0.3,
            width: 0.3,
            margin: "0,0",
            label: "",
          };
        } else {
          node = {
            shape,
            height: 0.5,
            fontsize: 10,
            margin: "0.20,0.05",
            label: escape_label(label),
            style: "rounded",
          };

          if (elem[2]) {
            const color = Color(elem[2]);

            node.style += ",filled";
            node.fillcolor = color.hex();
            node.fontcolor = color.isDark() ? "white" : "black";
          }

          if (elem[3]) node.fontcolor = elem[3];
        }

        elements.push([uid, node]);
      } else if (shape === "diamond") {
        const uid = uidHandler.createUid(label);
        if (!uid) continue;

        node = {
          shape: "diamond",
          height: 0.5,
          width: 0.5,
          margin: "0,0",
          label: "",
        };

        elements.push([uid, node]);
      } else if (shape === "mrecord") {
        const uid = uidHandler.createUid(label);
        if (!uid) continue;

        node = {
          shape: "record",
          height: options.dir === "TB" ? 0.05 : 0.5,
          width: options.dir === "TB" ? 0.5 : 0.05,
          margin: "0,0",
          style: "filled",
          label: "",
          fontsize: 1,
          penwidth: 4,
        };

        elements.push([uid, node]);
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
          labeldistance: 1,
          fontsize: 10,
        };

        const element = [
          uidHandler.getUid(parsedYumlExpr[k - 1][1]),
          uidHandler.getUid(parsedYumlExpr[k + 1][1]),
          edge,
        ];

        if (parsedYumlExpr[k][3].length > 0) {
          edge.label = parsedYumlExpr[k][3];
        }

        if (parsedYumlExpr[k + 1][0] === "mrecord") {
          element[1] += `:${addBarFacet(elements, element[1])}:${
            HEADPORTS[options.dir]
          }`;
        }

        elements.push(element);
      }
    }
  }

  return `\tranksep= ${RANKSEP}\n\trankdir= ${
    options.dir
  }\n${serializeDotElements(elements)}`;
}

function addBarFacet(elements, name) {
  for (const elem of elements) {
    if (elem.length === 2 && elem[0] === name) {
      const node = elem[1];
      const facetNum = (node.label.match(/|/g) || []).length + 1;

      if (node.label.length) {
        node.label += `|<f${facetNum}>`;
      } else {
        node.label = "<f1>";
      }

      return "f" + facetNum;
    }
  }

  return null;
}

export default composeDotExpr;
