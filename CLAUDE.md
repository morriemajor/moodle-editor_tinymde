# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This repo is the source for `editor_tinymde`, a Moodle "editor" subsystem plugin wrapping
[TinyMDE](https://github.com/jefago/tiny-markdown-editor) (`tiny-markdown-editor` on npm, MIT
licensed), a small dependency-light Markdown editor, for `FORMAT_MARKDOWN` content.

It exists so that [filter_editor_selector](../editor_selector) (a sibling project - see its own
CLAUDE.md) has a real Moodle editor plugin to dynamically attach for the Markdown format option,
the same way it already attaches TinyMCE (via core's `editor_tiny`) for the HTML format option -
rather than vendoring a Markdown editor directly inside that filter. That plugin's
`amd/src/toggle.js` now does exactly this (dynamically `import()`s `editor_tinymde/editor` and
calls `setupForTarget`/`removeInstanceForTarget`), and formally depends on this plugin via
`$plugin->dependencies` in its `version.php`.

This is a standalone plugin source checkout — it is **not** a Moodle install itself and cannot be
run on its own. It is developed here and tested against a separate Moodle instance at
`../moodle-dev` (sibling directory, not part of this repo) - the same instance `editor_selector`
uses.

## Test environment (`../moodle-dev`)

Same environment as `editor_selector` - see that project's CLAUDE.md for the full description of
`../moodle-dev/moodle` and `../moodle-dev/moodle-docker`. In short: Moodle 5.2 core checkout
(web root `public/`), running via moodlehq/moodle-docker on `http://localhost:8000`.

### Getting this plugin into the test site: sync, not symlink

Run `./sync-to-moodle.sh` from this repo to copy it into
`../moodle-dev/moodle/public/lib/editor/tinymde` and rebuild its AMD JS. Re-run it after **any**
change (PHP or JS) that you want to test.

This is a real copy, not a symlink, for the same reason as `editor_selector`: Moodle's Grunt AMD
build computes each module's Moodle component name from the source file's real
(`fs.realpathSync()`-resolved) filesystem path, and fails if that path isn't inside the
`moodle-dev/moodle` checkout - see `editor_selector/CLAUDE.md` for the full discovery writeup.
The script pins `PATH` to `/opt/homebrew/opt/node@22/bin` (Grunt needs Node 22.x specifically,
per `moodle-dev/moodle/.nvmrc`) - `brew install node@22` if missing. `--no-build` skips the Grunt
step for PHP-only changes. Built `amd/build/*` output is copied back into this repo and should be
committed alongside `amd/src/*`, per normal Moodle plugin convention.

## Common commands

Same `moodle-docker-compose` invocation pattern as `editor_selector` - run from
`../moodle-dev/moodle-docker`, after exporting its `.env` (the wrapper script doesn't auto-source
it):

```bash
cd ../moodle-dev/moodle-docker
set -a && source .env && set +a

# Install/upgrade this plugin in the test site after bumping version.php
bin/moodle-docker-compose exec webserver php admin/cli/upgrade.php --non-interactive

# Purge caches (needed after lang string / JS changes)
bin/moodle-docker-compose exec webserver php admin/cli/purge_caches.php
```

Unlike a filter, a new editor plugin needs no separate "enable" step - `editors_get_available()`
auto-discovers any installed `editor_*` plugin. It does **not**, however, automatically become
selectable as a user's actual "Text editor" preference; that list is `$CFG->texteditors`
(defaults to `'tiny,textarea'`) or - if desired - set explicitly:

```bash
bin/moodle-docker-compose exec webserver php -r '
define("CLI_SCRIPT", true);
require("/var/www/html/public/config.php");
set_config("texteditors", "tinymde,tiny,textarea");
'
```

That said, `filter_editor_selector`'s use case bypasses `$CFG->texteditors`/preference selection
entirely and calls this plugin's AMD API (`editor_tinymde/editor`'s `setupForTarget`) directly, the
same way it does for `editor_tiny` - so changing `$CFG->texteditors` is only useful for testing
this plugin's normal server-rendered path (`use_editor()`) in isolation, e.g. on a form field
whose format happens to be Markdown.

## Plugin architecture

Standard Moodle "editor" plugin layout (frankenstyle component: `editor_tinymde`):

- `version.php` — required.
- `lang/en/editor_tinymde.php` — `pluginname` + `privacy:metadata` (this plugin stores no
  personal data - see `classes/privacy/provider.php`, a `null_provider`).
- `lib.php` — `get_texteditor()` (`lib/editorlib.php` in core) requires this file to exist and to
  define a global-namespace `tinymde_texteditor` class. The real implementation lives in
  `classes/editor.php` using normal PSR-4 autoloading; `lib.php` just does
  `class_alias(\editor_tinymde\editor::class, 'tinymde_texteditor')`, mirroring `editor_tiny`'s
  own `lib.php`.
- `classes/editor.php` — `\editor_tinymde\editor extends \texteditor`. Declares
  `FORMAT_MARKDOWN` as both its only supported and preferred format, `supports_repositories()`
  as `false` (TinyMDE has no file/image picker integration), and `use_editor()` just queues an
  inline `require(['editor_tinymde/editor'], ...)` JS call - unlike `editor_tiny`'s equivalent,
  there's no per-context plugin/filepicker configuration to assemble server-side, since TinyMDE
  itself needs almost no options.
- `amd/src/loader.js` — loads the vendored library. Injects a plain `<script>`/`<link>` tag
  rather than importing it as an AMD module (see "Vendoring TinyMDE" below for why), mirroring
  `editor_tiny/loader.js`'s approach for its own (much larger) vendored TinyMCE library.
- `amd/src/editor.js` — the public API: `setupForTarget`, `setupForElementId`,
  `getInstanceForElement(Id)`, `removeInstanceForTarget`. Shaped to match `editor_tiny/editor`'s
  surface so callers (this plugin's own `use_editor()`, and eventually `filter_editor_selector`)
  have a consistent pattern across both editors. TinyMDE's `{textarea: target}` constructor mode
  is a genuine drop-in replacement - it auto-reads the textarea's initial content and keeps the
  textarea's value in sync on every change, so no manual save/sync wiring was needed.
  `setupForTarget` wraps the toolbar + textarea + TinyMDE's own editor element in a
  `.tinymde-wrapper` container (moving the textarea into it, harmless for form submission since
  it stays within the same `<form>`) so `styles.css` can draw a single bordered/rounded box
  around both, matching TinyMCE's `.tox-tinymce` chrome - see "Styling" below. TinyMDE has no
  documented teardown API, so `removeInstanceForTarget` moves the textarea back out of the
  wrapper and removes the wrapper (taking the toolbar and TinyMDE's own editor element with it),
  then clears the textarea's inline `display` style itself; verified both in a Node sandbox (see
  below) and in a real browser (`tests/behat/teardown.feature`). Also builds a status bar with a drag-to-resize
  handle (`createStatusbar()`), matching TinyMCE's `.tox-statusbar__resize-handle` - see "Resize
  handle" below.
- `js/` — vendored TinyMDE `tiny-mde.min.js`/`tiny-mde.min.css`/`LICENSE`, declared in
  `thirdpartylibs.xml`. Outside `amd/src`, so Grunt's AMD build ignores it entirely (same
  placement pattern as `editor_tiny/js/tinymce`).
- `styles.css` — plugin-root CSS, auto-aggregated into the theme's CSS bundle by Moodle (no
  registration needed beyond the file existing - verified present in
  `theme/styles.php/boost/*/all` after a cache purge, **using the site's current `$CFG->themerev`
  in the URL** - requesting an old/stale rev number deliberately keeps serving old cached content
  forever, that's the whole point of rev-based cache-busting, and it isn't obvious until you hit
  it). Border/radius on `.tinymde-wrapper`, plus `.tinymde-resizable-area` /
  `.tinymde-statusbar` / `.tinymde-resize-handle` for the resize handle (see below).

### Resize handle

`setupForTarget` gives the editor area an initial/minimum height of 175px (`MIN_HEIGHT` in
`editor.js`, matching TinyMCE's own `min_height` default from `editor_tiny/editor.js`'s
`getStandardConfig()`) and a drag handle in a status bar below it, so the box starts small but
the user can make it taller - mirroring TinyMCE's `.tox-statusbar__resize-handle`. Vertical-only
resize (matching TinyMCE's default `ns-resize` cursor behaviour, not the `nwse-resize` variant),
plus a basic arrow-up/down keyboard equivalent since the handle is focusable
(`tabindex="0"`, `role="separator"`). Verified in a real browser
(`tests/behat/rendering.feature`) via that keyboard path - WebDriver's native
keyDown/keyUp only supports modifier keys, not arrow keys, so the test dispatches a
synthetic `KeyboardEvent` directly instead (`tests/behat/behat_editor_tinymde.php`); mouse
dragging itself is not covered.

The handle's icon is **not** a copied asset - `loader.js`'s `getResizeHandleSvg()` fetches
`editor_tiny`'s own vendored TinyMCE icon pack live at runtime
(`lib/editor/tiny/loader.php/{jsrev}/icons/default/icons.min.js`, the same file/URL pattern
`editor_tiny/loader.js` itself uses to load `tinymce.min.js`) as plain text and regexes out the
`'resize-handle'` entry's SVG markup - deliberately reading the live file rather than vendoring a
copy, so that if TinyMCE's own icon set is ever updated, this picks up the change automatically
on next page load with no manual work. A hardcoded copy of the same icon
(`FALLBACK_RESIZE_HANDLE_SVG`) is used only if that fetch fails (e.g. `editor_tiny` somehow
unavailable) - not expected to need updating in lockstep with the live source.

### Vendoring TinyMDE: the UMD/RequireJS patch

`tiny-mde.min.js` is a UMD bundle whose header checks for RequireJS (`define.amd`) and, if
found, self-registers as an anonymous AMD module instead of attaching `window.TinyMDE`. Since
Moodle pages always have RequireJS loaded, and the file is injected via a plain `<script>` tag
(not `import()`/`require()`), this created a real risk of colliding with RequireJS's
"currently-loading module" tracking - the classic "Mismatched anonymous define() modules"
failure mode. The one-line fix (removing the `define.amd` branch from the UMD header so it
always falls through to the global-assignment branch) is documented in detail, with the exact
before/after strings, in `js/UPSTREAM.md` - read that before updating the vendored library to a
newer version, since the patch needs re-applying by hand.

This was verified directly: running the patched file in a plain Node `vm` sandbox (no
`define`/`module`/`exports` present, simulating a `<script>` tag) correctly sets
`TinyMDE.{Editor,CommandBar}` as functions; running it again with a mock `define.amd = true`
present (simulating RequireJS) confirms `define()` is never called and the global is still set
correctly either way.

## Tests

`tests/behat/`:

- `rendering.feature` - tests this plugin in true isolation, with no dependency on
  `filter_editor_selector`: a bare fixture form (`tests/behat/fixtures/editor_form.php` +
  `editor_example.php`, modelled on `lib/editor/tests/fixtures/editor_form.php`, which
  `editor_textarea`'s own Behat tests use the same way) with a single `FORMAT_MARKDOWN` editor
  field, rendered via the *real* `MoodleQuickForm_editor` → `use_editor()` path (the user's "Text
  editor" preference set to TinyMDE via Preferences, not a dynamic attach) - confirms this plugin
  actually functions as a normal Moodle editor, not just as something `filter_editor_selector`
  happens to be able to drive. Also covers the resize handle (see "Resize handle" above).
- `teardown.feature` - the one scenario that does need `filter_editor_selector` (tagged
  accordingly), since there is no way to trigger `removeInstanceForTarget()` other than through
  that plugin's toggle button - see the feature file's own description for why this still counts
  as testing *this* plugin rather than duplicating that one's `toggle_button.feature`.
- `behat_editor_tinymde.php` - one custom step, `I press the "up"/"down" arrow key on the TinyMDE
  resize handle`, needed because core's generic `I press key "..." in "..." "..."` step sends
  keys via WebDriver's native keyDown/keyUp actions, which only support modifier keys
  (Ctrl/Shift/Alt/Meta) - anything else throws `Key Down / Up events only make sense for modifier
  keys`. Dispatches a synthetic `KeyboardEvent` directly instead.

All passing as of this writing (5 scenarios, 67 steps standalone; 18 scenarios, 237 steps combined
with `filter_editor_selector`'s own suite). See that plugin's CLAUDE.md for the shared
Behat-running commands and environment gotchas (install-order-sensitive defaults on a fresh site,
needing `util.php --enable` after adding new feature/step files, etc.) - all of it applies here
too, since both plugins share the one `../moodle-dev` test site.

## Known gaps / next steps

- No Markdown-specific filepicker/image-upload integration - `supports_repositories()` is `false`
  by design, matching what TinyMDE itself offers out of the box.
- The resize handle's *mouse* dragging is untested (only the keyboard equivalent is, via the
  custom step above) - WebDriver mouse-move-by-offset actions would need their own custom step
  along similar lines if this is ever worth covering.
