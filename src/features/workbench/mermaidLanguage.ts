import { StreamLanguage, type StreamParser } from "@codemirror/language";

const keywords = new Set(
  `flowchart graph sequenceDiagram classDiagram stateDiagram stateDiagram-v2 erDiagram
  gantt pie journey mindmap timeline gitGraph quadrantChart requirementDiagram
  C4Context C4Container C4Component C4Dynamic C4Deployment sankey-beta xychart-beta
  block-beta packet-beta architecture-beta kanban radar-beta treemap-beta
  subgraph end direction classDef class style linkStyle click
  participant actor activate deactivate loop alt else opt par and critical option break rect
  Note note over left right of title accTitle accDescr section dateFormat axisFormat
  state as hideEmptyDescription autonumber title legend box`.split(/\s+/),
);

// Only lexical hints: Pele remains responsible for Mermaid syntax validation.
const parser: StreamParser<{ quoted: boolean }> = {
  startState: () => ({ quoted: false }),
  token(stream, state) {
    if (!state.quoted) {
      if (stream.eatSpace()) return null;
      if (stream.match("%%")) {
        stream.skipToEnd();
        return "comment";
      }
      if (stream.peek() === '"') {
        stream.next();
        state.quoted = true;
      } else {
        if (stream.match(/[<ox|}{]{0,2}(?:-+(?:\.-*)?|=+)[>ox|}{]{1,2}|---+|===+|-\.-/)) {
          return "operator";
        }
        const word = stream.match(/[\p{L}_][\p{L}\p{N}_]*(?:-[\p{L}\p{N}_]+)*/u);
        if (word && typeof word !== "boolean") return keywords.has(word[0]) ? "keyword" : null;
        stream.next();
        return null;
      }
    }
    while (!stream.eol()) {
      const character = stream.next();
      if (character === "\\") stream.next();
      else if (character === '"') {
        state.quoted = false;
        break;
      }
    }
    return "string";
  },
};

export const mermaidLanguage = StreamLanguage.define(parser);
