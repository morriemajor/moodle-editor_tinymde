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
 * A bare form with a single editor field, for testing editor_tinymde as a real Moodle editor
 * in isolation (i.e. rendered via the normal MoodleQuickForm_editor -> use_editor() path,
 * not dynamically attached by filter_editor_selector). Modelled on
 * lib/editor/tests/fixtures/editor_form.php, which editor_textarea's own Behat tests use the
 * same way.
 *
 * This fixture is only used by the Behat test.
 *
 * @package    editor_tinymde
 * @copyright  2026 Andrew
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->libdir . '/formslib.php');

/**
 * Form with a single editor field.
 */
class editor_tinymde_test_form extends moodleform {

    #[\Override]
    protected function definition() {
        $mform = $this->_form;

        $mform->addElement('editor', 'myeditor', 'My editor', null, [
            'context' => context_system::instance(),
            'maxfiles' => 0,
        ]);
        $mform->setType('myeditor', PARAM_RAW);
    }
}
