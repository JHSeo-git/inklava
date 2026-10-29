import { expect, test } from "bun:test";
import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { highlightTree, tags, tagHighlighter } from "@lezer/highlight";
import { mermaidLanguage } from "./mermaidLanguage";

function tokens(source: string) {
  const state = EditorState.create({ doc: source, extensions: [mermaidLanguage] });
  const result: [string, string][] = [];
  highlightTree(
    syntaxTree(state),
    tagHighlighter([
      { tag: tags.keyword, class: "keyword" },
      { tag: tags.comment, class: "comment" },
      { tag: tags.string, class: "string" },
      { tag: tags.operator, class: "operator" },
    ]),
    (from, to, style) => result.push([source.slice(from, to), style]),
  );
  return result;
}

test("strings protect comment and arrow text, including escaped quotes and multiple lines", () => {
  expect(tokens('flowchart LR\n A["a \\"quote\\" %% -->\nnext"]-->B')).toEqual([
    ["flowchart", "keyword"],
    ['"a \\"quote\\" %% -->', "string"],
    ['next"', "string"],
    ["-->", "operator"],
  ]);
});

test("comments swallow quoted keywords and arrows until the next line", () => {
  expect(tokens('%% "flowchart" -->\nsequenceDiagram\n Alice->>Bob: Hello')).toEqual([
    ['%% "flowchart" -->', "comment"],
    ["sequenceDiagram", "keyword"],
    ["->>", "operator"],
  ]);
});

test("recognizes adjacent edges and hyphenated keywords without matching keyword prefixes", () => {
  expect(
    tokens("stateDiagram-v2\n endNode-->B\n A-.->B\n C<-->D\n CUSTOMER ||--o{ ORDER\n X---Y"),
  ).toEqual([
    ["stateDiagram-v2", "keyword"],
    ["-->", "operator"],
    ["-.->", "operator"],
    ["<-->", "operator"],
    ["||--o{", "operator"],
    ["---", "operator"],
  ]);
});
