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
 * JavaScript for handling UI actions in the question authoring form.
 *
 * @package    qtype
 * @subpackage graphchecker
 * @copyright  Richard Lobb, 2015, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/userinterfacewrapper'], function($, ui) {

    // Set up the author edit form UI plugins and event handlers.
    function initEditForm() {
        let $sampleAnswerField = $('#id_answer'),
            $preloadField = $('#id_answerpreload'),
            $checksField = $('#id_checks'),
            $typeCombo = $('#id_answertype'),
            type = $typeCombo.val();

        // Set up the UI controller for the textarea whose name is
        // given as the first parameter to the given UI controller.
        function setUi($textArea, uiName) {

            // if the right UI controller is not yet present, create it
            // otherwise, just reload
            let uiWrapper = $textArea.data('current-ui-wrapper');
            if (!uiWrapper || uiWrapper.uiname !== uiName) {
                uiWrapper = new ui.InterfaceWrapper(uiName, $textArea.attr('id'));
            } else {
                uiWrapper.loadUi(uiName, $textArea.data('params'));
            }

        }

        // Set the correct Ui controller on both the sample answer and the answer preload.
        function setUis() {
            setUi($sampleAnswerField, 'graph');  // TODO change this into whatever UI the question wants
            setUi($preloadField, 'graph');
            setUi($checksField, 'checks');
        }

        function stopUis() {
            $sampleAnswerField.data('current-ui-wrapper').stop();
            $preloadField.data('current-ui-wrapper').stop();
            $checksField.data('current-ui-wrapper').stop();
        }

        setUis();  // Set up UI controllers on answer and answerpreload.

        $typeCombo.on('change', function() {
            if (window.confirm('Changing the answer type will clear the ' +
                    'Answer box preload, Checks, and Sample answer ' +
                    'sections below.')) {

                type = $typeCombo.val();

                stopUis();

                $sampleAnswerField.val('');
                $preloadField.val('');
                $checksField.val('');

                setUis();

            } else {
                $typeCombo.val(type);
            }
        });
    }

    return {initEditForm: initEditForm};
});

