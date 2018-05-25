"use strict";

const {
  escape_label,
  extractBgAndNote,
  recordName,
  serializeDotElements,
  splitYumlExpr,
} = require("./yuml2dot-utils.js");
const Color = require("color");

const RANKSEP = 0.5;

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
  const uids = {};
  let len = 0;
  const elements = [];
  const headports = { LR: "w", RL: "e", TB: "n" };
  const getUID = (uids, label) => {
    const recordNameLabel = recordName(label);

    return (
      !uids.hasOwnProperty(recordNameLabel) &&
      (uids[recordNameLabel] = "A" + len++)
    );
  };

  for (let i = 0; i < specLines.length; i++) {
    const elem = parseYumlExpr(specLines[i]);

    for (let k = 0; k < elem.length; k++) {
      if (elem[k][0] === "note" || elem[k][0] === "record") {
        const label = elem[k][1];
        const uid = getUID(uids, label);
        if (!uid) continue;

        if (elem[k][0] === "record" && (label === "start" || label === "end")) {
          node = {
            shape: label === "start" ? "circle" : "doublecircle",
            height: 0.3,
            width: 0.3,
            margin: "0,0",
            label: "",
          };
        } else {
          node = {
            shape: elem[k][0],
            height: 0.5,
            fontsize: 10,
            margin: "0.20,0.05",
            label: escape_label(label),
            style: "rounded",
          };

          if (elem[k][2]) {
            const color = Color(elem[k][2]);

            node.style += ",filled";
            node.fillcolor = color.hex();
            node.fontcolor = color.isDark() ? "white" : "black";
          }

          if (elem[k][3]) node.fontcolor = elem[k][3];
        }

        elements.push([uid, node]);
      } else if (elem[k][0] === "diamond") {
        const label = elem[k][1];
        const uid = getUID(uids, label);
        if (!uid) continue;

        node = {
          shape: "diamond",
          height: 0.5,
          width: 0.5,
          margin: "0,0",
          label: "",
        };

        elements.push([uid, node]);
      } else if (elem[k][0] === "mrecord") {
        const label = elem[k][1];
        const uid = getUID(uids, label);
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

    for (let k = 1; k < elem.length - 1; k++) {
      if (
        elem[k][0] === "edge" &&
        elem[k - 1][0] !== "edge" &&
        elem[k + 1][0] !== "edge"
      ) {
        const style =
          elem[k - 1][0] === "note" || elem[k + 1][0] === "note"
            ? "dashed"
            : elem[k][4];

        const edge = {
          shape: "edge",
          dir: "both",
          style,
          arrowtail: elem[k][1],
          arrowhead: elem[k][2],
          labeldistance: 1,
          fontsize: 10,
        };

        if (elem[k][3].length > 0) edge.label = elem[k][3];

        const uid1 = uids[recordName(elem[k - 1][1])];
        let uid2 = uids[recordName(elem[k + 1][1])];

        if (elem[k + 1][0] === "mrecord") {
          const facet = addBarFacet(elements, uid2);
          uid2 += ":" + facet + ":" + headports[options.dir];
        }

        elements.push([uid1, uid2, edge]);
      }
    }
  }

  return `\tranksep= ${RANKSEP}\n\trankdir= ${
    options.dir
  }\n${serializeDotElements(elements)}}\n`;
}

function addBarFacet(elements, name) {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].length === 2 && elements[i][0] === name) {
      const node = elements[i][1];
      let facetNum = 1;

      if (node.label.length > 0) {
        facetNum = node.label.split("|").length + 1;
        node.label += "|<f" + facetNum + ">";
      } else node.label = "<f1>";

      return "f" + facetNum;
    }
  }

  return null;
}

module.exports = composeDotExpr;
