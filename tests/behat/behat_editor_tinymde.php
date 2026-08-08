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
 * Custom step definitions for editor_tinymde.
 *
 * @package    editor_tinymde
 * @category   test
 * @copyright  2026 Andrew
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.

require_once(__DIR__ . '/../../../../behat/behat_base.php');

/**
 * TinyMDE custom behat step definitions.
 *
 * @copyright  2026 Andrew
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_editor_tinymde extends behat_base {
    /**
     * Press the up or down arrow key on TinyMDE's resize handle.
     *
     * Core's generic "I press key ... in ... " step (behat_general::i_press_key_in_element())
     * sends its key via WebDriver's native keyDown/keyUp actions, which only support modifier
     * keys (Ctrl/Shift/Alt/Meta) - anything else throws "Key Down / Up events only make sense
     * for modifier keys". Arrow keys need a real KeyboardEvent instead, dispatched directly.
     *
     * @Given /^I press the "(?P<direction_string>up|down)" arrow key on the TinyMDE resize handle$/
     * @param string $direction "up" or "down"
     */
    public function i_press_arrow_key_on_resize_handle(string $direction): void {
        $key = ($direction === 'down') ? 'ArrowDown' : 'ArrowUp';
        $js = <<<EOF
            document.querySelector('.tinymde-resize-handle').dispatchEvent(
                new KeyboardEvent('keydown', {key: '{$key}', bubbles: true})
            );
        EOF;
        $this->execute_script($js);
    }
}
