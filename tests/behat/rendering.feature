@editor @editor_tinymde @javascript
Feature: TinyMDE renders as a native Moodle editor and its resize handle works
  In order to trust TinyMDE as a real Moodle editor plugin, not just something dynamically
  attached by filter_editor_selector
  As a user
  I need it to render correctly when it is my selected editor for Markdown content, and its
  resize handle to actually resize the editor

  Background:
    Given the following "courses" exist:
      | fullname | shortname | format |
      | Course 1 | C1        | topics |
    And the following "activities" exist:
      | activity | name | intro                                                                                           | course | idnumber |
      | label    | L1   | <a href="../lib/editor/tinymde/tests/behat/fixtures/editor_example.php">TinyMDE test form</a> | C1     | label1   |
    And the following config values are set as admin:
      | texteditors | tinymde,tiny,textarea |  |
    And I log in as "admin"
    And I follow "Preferences" in the user menu
    And I follow "Editor preferences"
    And I set the field "Text editor" to "TinyMDE markdown editor"
    And I press "Save changes"
    And I am on "Course 1" course homepage
    And I click on "TinyMDE test form" "link" in the "region-main" "region"

  Scenario: TinyMDE renders as the field's editor, with its toolbar, border and content
    Then ".tinymde-wrapper" "css_element" should exist
    And ".tinymde-toolbar" "css_element" should exist
    And I should see "Sample content"

  Scenario: The editor starts at its minimum height
    Then the "style" attribute of ".tinymde-resizable-area" "css_element" should contain "175px"

  Scenario: The resize handle grows the editor when the down arrow is pressed
    When I press the "down" arrow key on the TinyMDE resize handle
    And I press the "down" arrow key on the TinyMDE resize handle
    Then the "style" attribute of ".tinymde-resizable-area" "css_element" should contain "195px"

  Scenario: The resize handle shrinks the editor when the up arrow is pressed, but not below the minimum height
    Given I press the "down" arrow key on the TinyMDE resize handle
    And I press the "down" arrow key on the TinyMDE resize handle
    And the "style" attribute of ".tinymde-resizable-area" "css_element" should contain "195px"
    When I press the "up" arrow key on the TinyMDE resize handle
    And I press the "up" arrow key on the TinyMDE resize handle
    And I press the "up" arrow key on the TinyMDE resize handle
    Then the "style" attribute of ".tinymde-resizable-area" "css_element" should contain "175px"
