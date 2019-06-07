import {
  extractBgAndNote,
  formatLabel,
  serializeDot,
  splitYumlExpr,
} from "../utils/yuml2dot-utils.mjs";
import UIDHandler from "../utils/uidHandler.mjs";
import Color from "color";

const RANKSEP = 0.7;

/*
Syntax as specified in yuml.me

Use Case	        (Login)
Actor	            [Customer]
<<Extend>>	        (Login)<(Forgot Password)
<<Include>>	        (Register)>(Confirm Email)
Actor Inheritance	[Admin]^[User]
Notes	            [Admin]^[User],[Admin]-(note: Most privileged user)
*/

function parseYumlExpr(specLine) {
  const exprs = [];
  const parts = splitYumlExpr(specLine, "[(");

  for (const part of parts) {
    if (/^\(.*\)$/.test(part)) {
      // use-case
      const ret = extractBgAndNote(part.substr(1, part.length - 2), true);
      exprs.push([
        ret.isNote ? "note" : "record",
        ret.part,
        ret.bg,
        ret.fontcolor,
      ]);
    } else if (/^\[.*\]$/.test(part)) {
      // actor

      exprs.push(["actor", part.substr(1, part.length - 2)]);
    } else
      switch (part) {
        case "<":
          exprs.push(["edge", "vee", "<<extend>>", "none", "dashed"]);
          break;
        case ">":
          exprs.push(["edge", "none", "<<include>>", "vee", "dashed"]);
          break;
        case "-":
          exprs.push(["edge", "none", "", "none", "solid"]);
          break;
        case "^":
          exprs.push(["edge", "none", "", "empty", "solid"]);
          break;
        default:
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
      const [type, label] = elem;

      if (type === "note" || type === "record" || type === "actor") {
        const uid = uidHandler.createUid(label);
        if (!uid) continue;

        const node = {
          fontsize: 10,
          label: formatLabel(label, 20, false),
        };

        if (type === "actor") {
          node.margin = "0.05,0.05";
          node.shape = "none";
          node.label = "{img:actor} " + node.label;
          node.height = 1;
        } else {
          node.margin = "0.20,0.05";
          node.shape = type === "record" ? "ellipse" : "note";
          node.height = 0.5;

          if (elem[2]) {
            const color = Color(elem[2]);

            node.style = "filled";
            node.fillcolor = color.hex();
            node.fontcolor = color.isDark() ? "white" : "black";
          }

          if (elem[3]) {
            node.fontcolor = elem[3];
          }
        }

        dot += `\t${uid} ${serializeDot(node)}\n`;
      }
    }

    if (parsedYumlExpr.length === 3 && parsedYumlExpr[1][0] === "edge") {
      const style =
        parsedYumlExpr[0][0] === "note" || parsedYumlExpr[2][0] === "note"
          ? "dashed"
          : parsedYumlExpr[1][4];

      const edge = {
        shape: "edge",
        dir: "both",
        style,
        arrowtail: parsedYumlExpr[1][1],
        arrowhead: parsedYumlExpr[1][3],
        labeldistance: 2,
        fontsize: 10,
      };
      if (parsedYumlExpr[1][2].length > 0) {
        edge.label = parsedYumlExpr[1][2];
      }

      dot += `\t${uidHandler.getUid(
        parsedYumlExpr[0][1]
      )} -> ${uidHandler.getUid(parsedYumlExpr[2][1])} ${serializeDot(edge)}\n`;
    }
  }

  return `\tranksep=${RANKSEP}\n\trankdir=${options.dir}\n${dot}`;
}

export default composeDotExpr;
