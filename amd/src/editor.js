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
 * TinyMDE Editor Manager.
 *
 * Public API mirrors editor_tiny/editor's shape (setupForTarget, setupForElementId,
 * getInstanceForElementId) so callers - including editor_tinymde/editor::use_editor() and any
 * other plugin dynamically attaching this editor - have a familiar surface. Unlike editor_tiny,
 * there is no per-context plugin configuration to assemble: TinyMDE takes almost no options.
 *
 * @module editor_tinymde/editor
 * @copyright  2026 Andrew
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getTinyMDE, getResizeHandleSvg} from './loader';

/**
 * Storage for the TinyMDE instances on the page, keyed by their target textarea.
 * @type {Map}
 */
const instanceMap = new Map();

/** @constant {number} Initial/minimum editor height in pixels, matching TinyMCE's own min_height default. */
const MIN_HEIGHT = 175;

/**
 * Build a status bar with a drag-to-resize handle beneath the editor area, matching TinyMCE's
 * own .tox-statusbar/.tox-statusbar__resize-handle (vertical-only resize, same icon - see
 * loader.js's getResizeHandleSvg()).
 *
 * @param {HTMLElement} editorElement The TinyMDE editor DOM element to resize.
 * @returns {HTMLElement} The status bar element, ready to be appended into the wrapper.
 */
const createStatusbar = (editorElement) => {
    editorElement.classList.add('tinymde-resizable-area');
    editorElement.style.height = `${MIN_HEIGHT}px`;

    const statusbar = document.createElement('div');
    statusbar.className = 'tinymde-statusbar';

    const handle = document.createElement('div');
    handle.className = 'tinymde-resize-handle';
    handle.setAttribute('role', 'separator');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-orientation', 'horizontal');
    statusbar.append(handle);

    getResizeHandleSvg().then(svg => {
        handle.innerHTML = svg;
        return null;
    }).catch(() => {
        // No icon is not worth surfacing to the user; the handle still works without one.
    });

    let startY = 0;
    let startHeight = 0;

    const onPointerMove = (event) => {
        const newHeight = Math.max(MIN_HEIGHT, startHeight + (event.clientY - startY));
        editorElement.style.height = `${newHeight}px`;
    };

    const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    };

    handle.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        startY = event.clientY;
        startHeight = editorElement.getBoundingClientRect().height;
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    });

    // Basic keyboard equivalent (arrow up/down), since the handle is focusable.
    handle.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
            return;
        }
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 10 : -10;
        const newHeight = Math.max(MIN_HEIGHT, editorElement.getBoundingClientRect().height + delta);
        editorElement.style.height = `${newHeight}px`;
    });

    return statusbar;
};

/**
 * Get the TinyMDE instance for the specified HTMLElement.
 *
 * @param {HTMLElement} element
 * @returns {Object|undefined}
 */
export const getInstanceForElement = element => instanceMap.get(element);

/**
 * Get the TinyMDE instance for the specified Node ID.
 *
 * @param {string} elementId
 * @returns {Object|undefined}
 */
export const getInstanceForElementId = elementId => getInstanceForElement(document.getElementById(elementId));

/**
 * Set up TinyMDE for the HTML textarea element.
 *
 * @param {HTMLTextAreaElement} target
 * @param {Object} [options={}]
 * @param {string} [options.content] Initial content override. If omitted, TinyMDE reads the
 *                                   textarea's own current value (see TinyMDE's `textarea` mode).
 * @param {boolean} [options.toolbar=true] Whether to create a command bar (toolbar) above the editor.
 * @param {boolean} [options.resizable=true] Whether to add a drag-to-resize handle below the editor.
 * @return {Promise<Object>} The {editor, commandBar} instance.
 */
export const setupForTarget = async(target, options = {}) => {
    const existing = getInstanceForElement(target);
    if (existing) {
        return existing;
    }

    const TinyMDE = await getTinyMDE();

    // Wrap the toolbar and editor area in a shared container so styles.css can draw a single
    // border/rounded-corner box around both, matching TinyMCE's .tox-tinymce chrome. The
    // textarea itself is moved inside too (harmless for form submission - it stays within the
    // same <form>), so that TinyMDE's own editor element, which it inserts as the textarea's
    // next sibling, ends up inside the wrapper as well.
    const wrapper = document.createElement('div');
    wrapper.className = 'tinymde-wrapper';
    target.insertAdjacentElement('beforebegin', wrapper);

    // The toolbar must be appended before the textarea: TinyMDE inserts its own editor element
    // as the textarea's very next sibling below, so DOM order here determines visual order
    // (toolbar above the editor, not below it).
    let toolbarElement = null;
    let commandBar = null;
    if (options.toolbar !== false) {
        toolbarElement = document.createElement('div');
        toolbarElement.className = 'tinymde-toolbar';
        wrapper.append(toolbarElement);
    }
    wrapper.append(target);

    const editorOptions = {textarea: target};
    if (options.content !== undefined) {
        editorOptions.content = options.content;
    }
    const editor = new TinyMDE.Editor(editorOptions);

    // TinyMDE inserts its own editor DOM element as the textarea's next sibling (documented
    // behaviour for `textarea` mode) - captured here since there's no public API to look it up
    // later, and we need it to clean up on removeInstanceForTarget().
    const editorElement = target.nextElementSibling;

    if (toolbarElement) {
        commandBar = new TinyMDE.CommandBar({element: toolbarElement, editor});
    }

    let statusbarElement = null;
    if (options.resizable !== false) {
        statusbarElement = createStatusbar(editorElement);
        wrapper.append(statusbarElement);
    }

    const instance = {editor, commandBar, editorElement, toolbarElement, statusbarElement, wrapper, target};
    instanceMap.set(target, instance);
    return instance;
};

/**
 * Set up TinyMDE for the selector at the specified HTML Node id.
 *
 * @param {Object} config
 * @param {string} config.elementId The HTML Node ID
 * @param {Object} [config.options] Options, see setupForTarget().
 * @return {Promise<Object>} The {editor, commandBar} instance.
 */
export const setupForElementId = ({elementId, options}) => {
    return setupForTarget(document.getElementById(elementId), options);
};

/**
 * Remove a previously set up TinyMDE instance, reverting to the plain textarea.
 *
 * @param {HTMLTextAreaElement} target
 */
export const removeInstanceForTarget = target => {
    const instance = instanceMap.get(target);
    if (!instance) {
        return;
    }

    if (instance.wrapper && instance.wrapper.parentElement) {
        // Move the textarea back out to where the wrapper was, then remove the wrapper along
        // with everything still inside it (the toolbar and TinyMDE's own editor element).
        instance.wrapper.insertAdjacentElement('beforebegin', target);
        instance.wrapper.parentElement.removeChild(instance.wrapper);
    }

    // TinyMDE hides the linked textarea while attached; there is no public API to reverse this,
    // so it's done directly here.
    target.style.removeProperty('display');

    instanceMap.delete(target);
};
