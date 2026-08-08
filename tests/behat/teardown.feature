@editor @editor_tinymde @filter_editor_selector @javascript
Feature: Detaching TinyMDE restores the underlying textarea
  In order to trust that toggling away from TinyMDE leaves a normal, usable plain-text field
  As a user
  I need removeInstanceForTarget() to fully restore the original textarea, not leave it hidden
  or otherwise broken

  This necessarily uses the sibling filter_editor_selector plugin's toggle button, since it is
  the only realistic way to trigger editor_tinymde/editor's removeInstanceForTarget() in a real
  browser - TinyMDE is never torn down through any mechanism of its own (there is no "revert"
  concept in the normal MoodleQuickForm_editor -> use_editor() rendering path this plugin also
  supports, only in the dynamic-attach path filter_editor_selector drives). It is here, rather
  than in that plugin's own test suite, because what is being verified is specifically this
  plugin's teardown correctness (the underlying textarea's visibility), not the toggle button's
  own behaviour (already covered by filter_editor_selector/tests/behat/toggle_button.feature).

  Background:
    Given the following config values are set as admin:
      | texteditors | textarea,tiny,tinymde |  |
      | editor_format_markdown | tinymde | filter_editor_selector |
    And the "editor_selector" filter is "on"
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1        | 0        |
    And I log in as "admin"
    And I am on the "C1" "Course" page
    And I navigate to "Settings" in current page administration
    And I set the field "summary_editor[format]" to "4"

  Scenario: Detaching TinyMDE restores the underlying textarea's visibility
    Given I click on "Switch to rich text editor" "button"
    And ".tinymde-wrapper" "css_element" should exist
    And "summary_editor[text]" "field" should not be visible
    When I click on "Switch to plain text" "button"
    Then ".tinymde-wrapper" "css_element" should not exist
    And "summary_editor[text]" "field" should be visible
