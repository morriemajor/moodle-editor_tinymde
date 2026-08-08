// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * TinyMDE loader for Moodle.
 *
 * Loads the vendored TinyMDE library (see ../../js/UPSTREAM.md) via a plain injected <script>
 * tag rather than an AMD import, matching editor_tiny/loader's approach for the same reason:
 * it's a third-party UMD bundle, not an AMD module of our own, and we want it to attach itself
 * to window.TinyMDE rather than participate in RequireJS's module graph.
 *
 * @module      editor_tinymde/loader
 * @copyright   2026 Andrew
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Config from 'core/config';

/* global M */

const baseUrl = `${Config.wwwroot}/lib/editor/tinymde/js`;

// editor_tiny's own vendored TinyMCE icon pack, served through its loader.php the same way
// editor_tiny/loader.js itself loads tinymce.min.js. Fetched as plain text (not executed - the
// file calls tinymce.IconManager.add(...), which needs a full TinyMCE instance to exist) purely
// to read the "resize-handle" icon's SVG markup out of it, so our own resize handle (see
// editor.js) stays visually identical to TinyMCE's without us having to vendor a copy of our
// own: if TinyMCE's icon set is ever updated, this picks up the change automatically.
const resizeHandleIconUrl = `${Config.wwwroot}/lib/editor/tiny/loader.php/${M.cfg.jsrev}/icons/default/icons.min.js`;

// Fallback copy of the same icon (lib/editor/tiny/js/tinymce/icons/default/icons.js's
// 'resize-handle' entry), used only if the live fetch above fails - e.g. editor_tiny is ever
// uninstalled or its loader.php is unreachable. Since the live fetch is what actually stays in
// sync with TinyMCE, this fallback is not expected to need manual updates in step with it.
const FALLBACK_RESIZE_HANDLE_SVG =
    // eslint-disable-next-line max-len
    '<svg width="10" height="10"><g fill-rule="nonzero"><path d="M8.1 1.1A.5.5 0 1 1 9 2l-7 7A.5.5 0 1 1 1 8l7-7ZM8.1 5.1A.5.5 0 1 1 9 6l-3 3A.5.5 0 1 1 5 8l3-3Z"/></g></svg>';

let tinyMdePromise;
let resizeHandleSvgPromise;

const loadCss = () => {
    if (document.querySelector('link[data-tinymde="tinymde"]')) {
        return;
    }
    const link = document.createElement('link');
    link.dataset.tinymde = 'tinymde';
    link.rel = 'stylesheet';
    link.href = `${baseUrl}/tiny-mde.min.css?v=${M.cfg.jsrev}`;
    document.querySelector('head').append(link);
};

/**
 * Get the TinyMDE API object, loading it if necessary.
 *
 * @returns {Promise<TinyMDE>} The TinyMDE API object (window.TinyMDE once loaded).
 */
export const getTinyMDE = () => {
    if (tinyMdePromise) {
        return tinyMdePromise;
    }

    loadCss();

    tinyMdePromise = new Promise((resolve, reject) => {
        const head = document.querySelector('head');
        let script = head.querySelector('script[data-tinymde="tinymde"]');
        if (script) {
            resolve(window.TinyMDE);
            return;
        }

        script = document.createElement('script');
        script.dataset.tinymde = 'tinymde';
        script.src = `${baseUrl}/tiny-mde.min.js?v=${M.cfg.jsrev}`;
        script.async = true;

        script.addEventListener('load', () => {
            resolve(window.TinyMDE);
        }, false);

        script.addEventListener('error', (err) => {
            reject(err);
        }, false);

        head.append(script);
    });

    return tinyMdePromise;
};

/**
 * Get the SVG markup for TinyMCE's own "resize-handle" icon, read live from editor_tiny's
 * vendored icon pack. Falls back to a hardcoded copy if that fetch fails for any reason.
 *
 * @returns {Promise<string>}
 */
export const getResizeHandleSvg = () => {
    if (resizeHandleSvgPromise) {
        return resizeHandleSvgPromise;
    }

    resizeHandleSvgPromise = fetch(resizeHandleIconUrl)
        .then(response => response.text())
        .then(text => {
            const match = text.match(/['"]resize-handle['"]\s*:\s*'([^']+)'/);
            return match ? match[1] : FALLBACK_RESIZE_HANDLE_SVG;
        })
        .catch(() => FALLBACK_RESIZE_HANDLE_SVG);

    return resizeHandleSvgPromise;
};
