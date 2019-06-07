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

Class           [Customer]
Directional     [Customer]->[Order]
Bidirectional   [Customer]<->[Order]
Aggregation     [Customer]+-[Order] or [Customer]<>-[Order]
Composition     [Customer]++-[Order]
Inheritance     [Customer]^[Cool Customer], [Customer]^[Uncool Customer]
Dependencies    [Customer]uses-.->[PaymentStrategy]
Cardinality     [Customer]<1-1..2>[Address]
Labels          [Person]customer-billingAddress[Address]
Notes           [Person]-[Address],[Address]-[note: Value Object]
Full Class      [Customer|Forename;Surname;Email|Save()]
Color splash    [Customer{bg:orange}]<>1->*[Order{bg:green}]
Comment         // Comments
*/

function* parseYumlExpr(specLine) {
  const parts = splitYumlExpr(specLine, "[");

  for (const part of parts) {
    if (/^\[.*\]$/.test(part)) {
      // class box
      const ret = extractBgAndNote(part.substr(1, part.length - 2), true);
      yield [ret.isNote ? "note" : "record", ret.part, ret.bg, ret.fontcolor];
    } else if (part === "^") {
      // inheritance
      yield ["edge", "empty", "", "none", "", "solid"];
    } else if (part.includes("-")) {
      // association
      const isDashed = part.includes("-.-");
      const style = isDashed ? "dashed" : "solid";
      const [left, right] = part.split(isDashed ? "-.-" : "-", 2);

      if (left === undefined || right === undefined) {
        throw new Error(`Invalid expression - "${part}".`);
      }

      const processLeft = function(left) {
        if (left.startsWith("<>")) return ["odiamond", left.substring(2)];
        else if (left.startsWith("++")) return ["diamond", left.substring(2)];
        else if (left.startsWith("+")) return ["odiamond", left.substring(1)];
        else if (left.startsWith("<") || left.endsWith(">"))
          return ["vee", left.substring(1)];
        else if (left.startsWith("^")) return ["empty", left.substring(1)];
        else return ["none", left];
      };

      const [leftStyle, leftText] = processLeft(left);

      const processRight = function(right) {
        const len = right.length;

        if (right.endsWith("<>"))
          return ["odiamond", right.substring(0, len - 2)];
        else if (right.endsWith("++"))
          return ["diamond", right.substring(0, len - 2)];
        else if (right.endsWith("+"))
          return ["odiamond", right.substring(0, len - 1)];
        else if (right.endsWith(">"))
          return ["vee", right.substring(0, len - 1)];
        else if (right.endsWith("^"))
          return ["empty", right.substring(0, len - 1)];
        else return processLeft(right);
      };

      const [rightStyle, rightText] = processRight(right);

      yield ["edge", leftStyle, leftText, rightStyle, rightText, style];
    } else {
      throw new Error(`Invalid expression - ${part}.`);
    }
  }
}

function composeDotExpr(specLines, options) {
  const uidHandler = new UIDHandler();

  let dot = "";

  for (const line of specLines) {
    const parsedYumlExpr = [];
    let mightBeEdgy = true;

    for (const elem of parseYumlExpr(line)) {
      const [shape, label] = elem;

      if (mightBeEdgy) {
        // In case the yUML expression is an edge between two notes/classes
        // or a junction of three classes
        const parsedLength = parsedYumlExpr.push(elem);
        mightBeEdgy =
          parsedLength < 5 && (parsedLength !== 2 || shape === "edge");
      }

      if (shape === "note" || shape === "record") {
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

    if (mightBeEdgy && parsedYumlExpr.length === 3) {
      const hasNote =
        parsedYumlExpr[0][0] === "note" || parsedYumlExpr[2][0] === "note";

      const edge = {
        shape: "edge",
        dir: "both",
        style: hasNote ? "dashed" : parsedYumlExpr[1][5],
        arrowtail: parsedYumlExpr[1][1],
        taillabel: parsedYumlExpr[1][2],
        arrowhead: parsedYumlExpr[1][3],
        headlabel: parsedYumlExpr[1][4],
        labeldistance: 2,
        fontsize: 10,
      };

      const dotEdge = `${uidHandler.getUid(
        parsedYumlExpr[0][1]
      )} -> ${uidHandler.getUid(parsedYumlExpr[2][1])} ${serializeDot(edge)}`;

      dot += hasNote ? `\t{rank=same;${dotEdge};}\n` : `\t${dotEdge}\n`;
    } else if (
      mightBeEdgy &&
      parsedYumlExpr.length === 4 &&
      parsedYumlExpr[0][0] === "record" &&
      parsedYumlExpr[2][0] === "record" &&
      parsedYumlExpr[3][0] === "record"
    ) {
      // intermediate association class
      const style = parsedYumlExpr[1][5];

      const junction = {
        shape: "point",
        style: "invis",
        label: "",
        height: 0.01,
        width: 0.01,
      };

      const edge1 = {
        shape: "edge",
        dir: "both",
        style,
        arrowtail: parsedYumlExpr[1][1],
        taillabel: parsedYumlExpr[1][2],
        arrowhead: "none",
        labeldistance: 2,
        fontsize: 10,
      };
      const edge2 = {
        shape: "edge",
        dir: "both",
        style,
        arrowtail: "none",
        arrowhead: parsedYumlExpr[1][3],
        headlabel: parsedYumlExpr[1][4],
        labeldistance: 2,
        fontsize: 10,
      };
      const edge3 = {
        shape: "edge",
        dir: "both",
        style: "dashed",
        arrowtail: "none",
        arrowhead: "vee",
        labeldistance: 2,
      };

      const uid =
        uidHandler.getUid(parsedYumlExpr[0][1]) +
        "J" +
        uidHandler.getUid(parsedYumlExpr[2][1]);

      dot += `\t${uid} ${serializeDot(junction)}\n\t${uidHandler.getUid(
        parsedYumlExpr[0][1]
      )} -> ${uid} ${serializeDot(edge1)}\n\t${uid} -> ${uidHandler.getUid(
        parsedYumlExpr[2][1]
      )} ${serializeDot(edge2)}\n\t{rank=same;${uidHandler.getUid(
        parsedYumlExpr[3][1]
      )} -> ${uid} ${serializeDot(edge3)};}\n`;
    }
  }

  return `\tranksep= ${RANKSEP}\n\trankdir= ${options.dir}\n${dot}`;
}

export default composeDotExpr;
