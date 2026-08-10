# editor_tinymde

Andrew Bainbridge-Smith

Version 0.1, 8 August 2026.


## Introduction

A Moodle text editor plugin that wraps [TinyMDE](https://github.com/jefago/tiny-markdown-editor) a small, dependency-light Markdown editor for `FORMAT_MARKDOWN` content.

It exists so that [filter_editor_selector](../moodle-filter_editor_selector) has a real Moodle editor plugin to attach for the Markdown format option, the same way it attaches TinyMCE (via core's `editor_tiny`) for the HTML format option, rather than vendoring a Markdown editor directly inside that filter.

It also works as a normal, standalone Moodle editor: selectable under *Preferences > Editor
preferences*, it renders wherever a field's format is Markdown, the same as TinyMCE or Atto would for HTML.

## Features

- Toolbar (bold, italic, headings, lists, blockquote, links, images) and live inline 
  Markdown formatting preview, via TinyMDE.
- Chrome matching TinyMCE's own look: bordered/rounded container, drag-to-resize handle
  (with a keyboard equivalent) starting at a compact default height.
- No file/image picker integration - TinyMDE doesn't have one of its own.

## Requirements

Moodle 4.5 or later. Developed and primarily tested against Moodle 5.2; CI covers 4.5, 5.0, 5.1
and 5.2 (see `.github/workflows/ci.yml`).

## Installation

Standard Moodle plugin install: copy (or symlink) this directory to
`<moodle>/lib/editor/tinymde`, then visit *Site administration > Notifications* to complete the install.

## Development

This repo is developed and tested separately from any Moodle install - see `CLAUDE.md` for the workflow, the test environment, and the plugin's architecture in more detail.

## Change History

 * Version 0.1
   Initial release.
   * Lowered minimum required version to Moodle 4.5 and added a GitHub Actions CI workflow
     (moodlehq/moodle-plugin-ci) testing against Moodle 4.5, 5.0, 5.1 and 5.2.
   * Vendored TinyMDE, patched to stop its UMD bundle self-registering as an anonymous AMD
     module (a real risk of colliding with Moodle's RequireJS loader) - see `js/UPSTREAM.md`.
   * Implemented as a standard Moodle `texteditor` (`classes/editor.php`), selectable under
     *Preferences > Editor preferences* like any other editor, plus an `amd/src/editor.js` API
     (`setupForTarget`/`removeInstanceForTarget`) for attaching/detaching it dynamically outside
     that normal flow.
   * Added chrome matching TinyMCE's own look: a bordered/rounded container around the toolbar
     and editor area, and a drag-to-resize handle (with a keyboard equivalent) starting at a
     compact default height - the handle's icon is fetched live from TinyMCE's own vendored icon
     pack rather than a copied asset, so it stays in sync if that icon is ever updated.
   * Wired into [filter_editor_selector](../moodle-filter_editor_selector)'s toggle button for the Markdown
     format option, the same way that plugin already attaches TinyMCE for HTML.
   * Added Behat tests covering native rendering (via the real `use_editor()` path, not just
     dynamic attachment), the resize handle, and the underlying textarea being correctly restored
     on teardown.
   (Claude written)

## License

GPL v3 or later, same as Moodle itself. The vendored TinyMDE library (`js/`) is MIT licensed - see `js/LICENSE` and `js/UPSTREAM.md`.
