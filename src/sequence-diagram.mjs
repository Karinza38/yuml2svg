import {
  extractBgAndNote,
  formatLabel,
  splitYumlExpr,
} from "./yuml2dot-utils.mjs";
import UIDHandler from "./uidHandler.mjs";

/*
Unofficial syntax, based on a proposal specified in the Scruffy project, plus local additions

Object     [Patron]
Message    [Patron]order food>[Waiter]
Response   [Waiter]serve wine.>[Patron]
Note       [Actor]-[note: a note message]
Comment    // Comments

Asynchronous message            [Patron]order food>>[Waiter]
Open activation box at source   [Source](message>[Dest]
Open activation box at dest     [Source]message>([Dest]
Close activation at dest        [Source]message>)[Dest]
Close activation at source      [Source])message>[Dest]
Cancel activation box           [Source])X
*/

function parseYumlExpr(specLine) {
  const exprs = [];
  const parts = splitYumlExpr(specLine, "[");

  for (const part of parts) {
    if (/^\[.*\]$/.test(part)) {
      // object
      const ret = extractBgAndNote(part.substr(1, part.length - 2), true);
      exprs.push([
        ret.isNote ? "note" : "object",
        ret.part,
        ret.bg,
        ret.fontcolor,
      ]);
    } else if (part === "-") {
      exprs.push(["signal", "", "", "dashed", ""]); // note connector
    } else if (part.includes(">")) {
      // message
      const style = part.includes(">>")
        ? "async"
        : part.includes(".>")
        ? "dashed"
        : "solid";

      const prefix =
        part.startsWith("(") || part.startsWith(")") ? part.charAt(0) : "";

      const pos = part.match(/[\.|>]?>[\(|\)]?$/);
      if (pos === null) {
        throw new Error("Invalid expression");
      }
      const message = pos.index > 0 ? part.substr(0, pos.index) : "";

      const suffix =
        part.endsWith("(") || part.endsWith(")")
          ? part.charAt(part.length - 1)
          : "";

      exprs.push(["signal", prefix, message, style, suffix]);
    } else {
      throw new Error("Invalid expression");
    }
  }

  return exprs;
}

function composeSVG(specLines, options) {
  const actors = [];
  const signals = [];

  const uidHandler = new UIDHandler();

  for (const line of specLines) {
    const parsedYumlExpr = parseYumlExpr(line);

    for (const elem of parsedYumlExpr) {
      const [type, label] = elem;

      if (type === "object") {
        uidHandler.createUid(label, name => {
          const actor = {
            type,
            name,
            label: formatLabel(label, 20, true),
            index: actors.length,
          };

          actors.push(actor);

          return actor;
        });
      }
    }

    const isValidElem =
      parsedYumlExpr.length === 3 &&
      parsedYumlExpr[0][0] === "object" &&
      parsedYumlExpr[1][0] === "signal";

    if (isValidElem && parsedYumlExpr[2][0] === "object") {
      const [_, __, message, style] = parsedYumlExpr[1];
      const actorA = uidHandler.getUid(parsedYumlExpr[0][1]);
      const actorB = uidHandler.getUid(parsedYumlExpr[2][1]);

      switch (style) {
        case "dashed":
          signals.push({
            type: "signal",
            actorA,
            actorB,
            linetype: "dashed",
            arrowtype: "arrow-filled",
            message,
          });
          break;
        case "solid":
          signals.push({
            type: "signal",
            actorA,
            actorB,
            linetype: "solid",
            arrowtype: "arrow-filled",
            message,
          });
          break;
        case "async":
          signals.push({
            type: "signal",
            actorA,
            actorB,
            linetype: "solid",
            arrowtype: "arrow-open",
            message,
          });
          break;

        default:
      }
    } else if (isValidElem && parsedYumlExpr[2][0] === "note") {
      const actor = uidHandler.getUid(parsedYumlExpr[0][1]);
      const message = formatLabel(parsedYumlExpr[2][1], 20, true);
      const note = { type: "note", message, actor };

      if (parsedYumlExpr[2][2])
        // background color
        note.bgcolor = parsedYumlExpr[2][2];
      if (parsedYumlExpr[2][3])
        // font color
        note.fontcolor = parsedYumlExpr[2][3];

      signals.push(note);
    }
  }

  return import("./sequence-renderer.mjs")
    .then(module => module.default)
    .then(
      Renderer =>
        new Renderer(actors, signals, uidHandler._uids, options.isDark)
    )
    .then(renderer => renderer.svg_.serialize());
}

export default composeSVG;
