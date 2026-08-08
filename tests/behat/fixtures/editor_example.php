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
 * Displays editor_tinymde_test_form, with its editor field pre-set to FORMAT_MARKDOWN content -
 * enough for MoodleQuickForm_editor::toHtml() to select TinyMDE as the field's editor via the
 * normal editors_get_preferred_editor(FORMAT_MARKDOWN) path, provided the current user's "Text
 * editor" preference is TinyMDE (see tests/behat/rendering.feature's Background).
 *
 * This fixture is only used by the Behat test.
 *
 * @package    editor_tinymde
 * @copyright  2026 Andrew
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__ . '/../../../../../../config.php');
require_once('./editor_form.php');

// Behat test fixture only.
defined('BEHAT_SITE_RUNNING') || die('Only available on Behat test server');

require_login();

$PAGE->set_url('/lib/editor/tinymde/tests/behat/fixtures/editor_example.php');
$PAGE->set_context(context_system::instance());

$mform = new editor_tinymde_test_form();
$mform->set_data(['myeditor' => ['text' => 'Sample content', 'format' => FORMAT_MARKDOWN]]);

echo $OUTPUT->header();
$mform->display();
echo $OUTPUT->footer();
