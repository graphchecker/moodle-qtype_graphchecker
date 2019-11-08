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
 * @subpackage coderunner
 * @copyright  Richard Lobb, 2015, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_coderunner/userinterfacewrapper'], function($, ui) {

    // Set up the author edit form UI plugins and event handlers.
    // The strings parameter is an associative array containing a subset of
    // the strings extracted from lang/xx/qtype_coderunner.php.
    // The template parameters and Ace language are passed to each
    // text area from PHP by setting its data-params and
    // data-lang attributes.
    function initEditForm(strings) {
        var globalextra = $('#id_globalextra'),
            typeCombo = $('#id_coderunnertype'),
            preloadHdr = $('#id_answerpreloadhdr'),
            courseId = $('input[name="courseid"]').prop('value'),
            precheck = $('select#id_precheck');

        // Set up the UI controller for the textarea whose name is
        // given as the first parameter (one of template, answer or answerpreload)
        // to the given UI controller (which may be "None" or, equivalently, empty).
        // We don't attempt to process changes in template parameters,
        // as these need to be merged with those of the prototype. But we do handle
        // changes in the language.
        function setUi(taId) {
            var ta = $(document.getElementById(taId)),  // The jquery text area element(s).
                paramsJson = ta.attr('data-params'),    // Template params set by PHP.
                params = {},
                uiWrapper;

            ta.attr('data-globalextra', globalextra.val());
            try {
                params = JSON.parse(paramsJson);
            } catch(err) {}

            uiWrapper = ta.data('current-ui-wrapper'); // Currently-active UI wrapper on this ta.

            if (uiWrapper && uiWrapper.uiname === "graph" && currentLang == lang) {
                return; // We already have what we want - give up.
            }

            if (!uiWrapper) {
                uiWrapper = new ui.InterfaceWrapper("graph", taId);
            } else {
                // Wrapper has already been set up - just reload the requested UI.
                uiWrapper.loadUi("graph", params);
            }

        }

        // Set the correct Ui controller on both the sample answer and the answer preload.
        function setUis() {
            setUi('id_answer');
            setUi('id_answerpreload');
        }

        // A JSON request for a question type returned a 'failure' response - probably a
        // missing question type. Report the error with an alert, and replace
        // the template contents with an error message in case the user
        // saves the question and later wonders why it breaks.
        function reportError(questionType, error) {
            var errorMessage;
            window.alert(getString('prototype_load_failure') + error);
            errorMessage = getString('prototype_error') + "\n";
            errorMessage += error + '\n';
            errorMessage += "CourseId: " + courseId + ", qtype: " + questionType;
            template.prop('value', errorMessage);
        }

        function detailsHtml(title, html) {
            // Local function to return the HTML to display in the
            // question type details section of the form.
            var resultHtml = '<p class="question-type-details-header">';
            resultHtml += getString('coderunner_question_type');
            resultHtml += title + '</p>\n' + html;
            return resultHtml;

        }

        // Get the required string from the strings parameter.
        function getString(key) {
            return strings[key];
        }

        /*************************************************************
         *
         * Body of initEditFormWhenReady starts here.
         *
         *************************************************************/

        setUis();  // Set up UI controllers on answer and answerpreload.

        typeCombo.on('change', function() {
            // TODO load new tests or something?
        });

        // In order to initialise the Ui plugin when the answer preload section is
        // expanded, we monitor attribute mutations in the Answer Preload
        // header.
        var observer = new MutationObserver( function () {
            setUis();
        });
        observer.observe(preloadHdr.get(0), {'attributes': true});

        // Setup click handler for the buttons that allow users to replace the
        // expected output  with the output got from testing the answer program.
        $('button.replaceexpectedwithgot').click(function() {
            var gotPre = $(this).prev('pre[id^="id_got_"]');
            var testCaseId = gotPre.attr('id').replace('id_got_', '');
            $('#id_expected_' + testCaseId).val(gotPre.text());
            $('#id_fail_expected_' + testCaseId).html(gotPre.text());
            $('.failrow_' + testCaseId).addClass('fixed');  // Fixed row.
            $(this).prop('disabled', true);
        });
    }

    return {initEditForm: initEditForm};
});
