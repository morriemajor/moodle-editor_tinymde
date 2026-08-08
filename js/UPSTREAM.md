# TinyMDE upstream files

Vendored from `tiny-markdown-editor` 0.2.32 (MIT), via unpkg:
- https://unpkg.com/tiny-markdown-editor@0.2.32/dist/tiny-mde.min.js
- https://unpkg.com/tiny-markdown-editor@0.2.32/dist/tiny-mde.min.css
- https://unpkg.com/tiny-markdown-editor@0.2.32/LICENSE

## Patch applied to tiny-mde.min.js

The upstream UMD header detects RequireJS (`typeof define == 'function' && define.amd`) and,
if present, self-registers as an anonymous AMD module instead of attaching `window.TinyMDE`.
Moodle's pages always have RequireJS loaded, so loading the unpatched file would risk colliding
with RequireJS's "currently loading module" tracking (the classic "Mismatched anonymous define()
modules" failure mode for vendored UMD libraries) depending on load timing, even though this
file is injected via a plain `<script>` tag rather than through `require()`/`import()`.

The AMD-detection branch was removed so the file always falls through to the `window.TinyMDE = {}`
global-assignment branch, matching how it's loaded here (see amd/src/loader.js). Only the UMD
boilerplate at the very start of the file was changed - no library logic was touched.

Before (from the original UMD header):
```
"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).TinyMDE={})
```

After:
```
"object"==typeof exports&&"undefined"!=typeof module?t(exports):t((e="undefined"!=typeof globalThis?globalThis:e||self).TinyMDE={})
```

`tiny-mde.min.css` and `LICENSE` are unmodified.

To update: download the new version's `dist/tiny-mde.min.js`/`dist/tiny-mde.min.css`/`LICENSE`
from unpkg, re-apply the same one-line removal to the new JS file's UMD header, and update the
version number in `../thirdpartylibs.xml`.
