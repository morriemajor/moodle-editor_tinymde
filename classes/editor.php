<?php
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

namespace editor_tinymde;

/**
 * TinyMDE markdown editor.
 *
 * A lightweight editor for FORMAT_MARKDOWN content only, wrapping the third-party TinyMDE
 * library (see ../js/UPSTREAM.md). Unlike editor_tiny/editor_atto, this has no server-side
 * plugin subsystem, filepicker integration, or per-context configuration to assemble - TinyMDE
 * itself needs none of that, so use_editor() only has to queue the JS call.
 *
 * @package    editor_tinymde
 * @copyright  2026 Andrew
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class editor extends \texteditor {

    #[\Override]
    public function supported_by_browser() {
        return true;
    }

    #[\Override]
    public function get_supported_formats() {
        return [
            FORMAT_MARKDOWN => FORMAT_MARKDOWN,
        ];
    }

    #[\Override]
    public function get_preferred_format() {
        return FORMAT_MARKDOWN;
    }

    #[\Override]
    public function supports_repositories() {
        // TinyMDE has no image/file picker integration of its own.
        return false;
    }

    #[\Override]
    public function use_editor($elementid, ?array $options = null, $fpoptions = null) {
        global $PAGE;

        $config = (object) [
            'content' => $this->get_text(),
        ];
        $config = json_encode($config);

        $inlinejs = <<<EOF
            M.util.js_pending('editor_tinymde/editor');
            require(['editor_tinymde/editor'], (TinyMde) => {
                TinyMde.setupForElementId({
                    elementId: "{$elementid}",
                    options: {$config},
                });
                M.util.js_complete('editor_tinymde/editor');
            });
        EOF;

        $PAGE->requires->js_amd_inline($inlinejs);
    }
}
