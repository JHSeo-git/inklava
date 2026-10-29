# User guide

[Getting started](../README.md) · [Development](development.md)

## Rendering and draft storage

The first visit opens a short example. The preview updates after 200ms without further input and waits while an input method is composing text. Syntax errors show a message and location while preserving the last successful diagram. Clearing the source also clears the preview.

Drafts are stored in the current browser's `localStorage`. An empty draft is restored as empty. If browser storage is blocked, the app shows a message and lets you continue editing. Server storage and account synchronization are not supported.

The editor and preview have no persistent help rows. Feedback appears below the editor only for input errors or draft storage failures.

## Editing source

The CodeMirror 6 editor provides line numbers and horizontal and vertical scrolling inside the panel. Long lines scroll horizontally instead of wrapping. Following Pele Playground, panel focus outlines, active-line and line-number backgrounds, matching-bracket and matching-word highlights, and the gutter border are hidden. Text selection and search results remain highlighted.

Basic colors distinguish Mermaid keywords, comments, double-quoted strings, and connections. Pele rendering determines whether the source is valid. The editor is not a full Mermaid language server; autocomplete, folding, automatic bracket insertion, and navigation to error locations are not included.

Clicking the `Mermaid source` label focuses the editor without changing its document or selection. An open search panel keeps its query and focus when syntax errors or storage feedback change.

At widths of 768px or more, drag the divider between the source and preview to resize the panels. When the divider is focused, use the left and right arrow keys to resize, Home and End to reach the limits, or double-click to restore the initial ratio. The source stays at least 240px wide and the preview at least 360px. Narrower screens use a vertical layout with the divider hidden. Resizing preserves editing history, preview scale, and the diagram point at the center. Reloading resets the panel ratio.

| Input                           | Action                                          |
| ------------------------------- | ----------------------------------------------- |
| Tab / Shift + Tab               | Indent / outdent by two spaces                  |
| Escape, then Tab                | Move focus out of the editor within two seconds |
| Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z | Undo / redo                                     |
| Ctrl/⌘ + F                      | Search source                                   |
| Enter / Shift + Enter in search | Next / previous result                          |
| Escape in search                | Close search and return to the editor           |

## Preview controls

| Input                                        | Action                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Scroll / two-finger trackpad scroll          | Pan horizontally and vertically                                           |
| Shift + vertical scroll                      | Pan horizontally                                                          |
| Ctrl/⌘ + scroll / trackpad pinch             | Zoom around the pointer                                                   |
| Drag with the left or middle mouse button    | Pan freely                                                                |
| `−`, `+`, `100%`, `Fit to view`              | Zoom around the view center, show natural size, or fit the entire diagram |
| `+`, `−`, `0`, arrow keys with preview focus | Zoom, fit, or pan                                                         |

Editing source preserves the current camera. Resizing the window preserves the scale and the diagram point at the center of the view. Use `Fit to view` to recover a diagram that has been panned offscreen. The editor and toolbar keep their normal browser scrolling and keyboard behavior.

## PNG downloads

Use the download icon in the preview toolbar to save the entire diagram as `inklava-YYYYMMDD-HHmmss.png`. The date and time use the device's local time zone at the moment you click the button, for example `inklava-20261029-143052.png`.

Exports have a white background and default to twice the diagram's natural resolution, independent of the current pan and zoom. Large diagrams are scaled proportionally to a maximum of 4,096px on the longest edge. When a syntax error leaves the last successful diagram visible, that diagram is exported. Downloading is disabled for an empty preview. Conversion happens in the browser without uploading to a server.

## Supported scope

Inklava uses Pele's default styles and built-in Mermaid compatibility. Its layout differs from Mermaid.js, and external plugins are not supported. Links and external images in previews are disabled. See [Pele compatibility](https://pele.run/compatibility).

Sharing, collaboration, and touchscreen multitouch controls are not supported.
