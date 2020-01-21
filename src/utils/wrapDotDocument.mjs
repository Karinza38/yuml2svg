const DEFAULT_FONT = "Helvetica";

const graph = { bgcolor: "transparent" };
const node = { shape: "none", margin: 0 };
const DEFAULT_HEADER = {
  graph,
  node,
  edge: {},
};

const DARK_HEADER = {
  graph,
  node: { ...node, color: "white", fontcolor: "white" },
  edge: { color: "white", fontcolor: "white" },
};

function* buildDotHeader(isDark, overrides) {
  const defaultHeaders = Object.entries(isDark ? DARK_HEADER : DEFAULT_HEADER);
  for (const [type, defaultSettings] of defaultHeaders) {
    yield `${type}[${Object.entries(
      Object.assign(
        { fontname: DEFAULT_FONT },
        defaultSettings,
        overrides[type]
      )
    )
      .map(entry => entry.join("="))
      .join(",")}]`;
  }
}

export default (document, isDark, overrides = {}) =>
  "digraph G {\n\t" +
  [...buildDotHeader(isDark, overrides)].join("\n\t") +
  "\n" +
  document +
  "\n}\n";
