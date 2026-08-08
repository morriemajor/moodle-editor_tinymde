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

/**
 * get_texteditor() (lib/editorlib.php) requires lib/editor/{name}/lib.php to exist and to
 * define (directly or, as here, via alias) a global-namespace "{name}_texteditor" class. The
 * real implementation lives in classes/editor.php using normal PSR-4 autoloading, matching
 * editor_tiny's lib.php pattern.
 *
 * @package    editor_tinymde
 * @copyright  2026 Andrew
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class_alias(\editor_tinymde\editor::class, 'tinymde_texteditor');
