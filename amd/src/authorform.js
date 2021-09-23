// This file is part of GraphChecker - https://github.com/graphchecker
//
// GraphChecker is based on CodeRunner by Richard Lobb et al.
// See https://coderunner.org.nz/
//
// GraphChecker is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// GraphChecker is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with GraphChecker.  If not, see <http://www.gnu.org/licenses/>.

/**
 * JavaScript for handling UI actions in the question editing form.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/userinterfacewrapper'], function($, ui) {

    // Set up the author edit form UI plugins and event handlers.
    function initEditForm() {
        let $feedbackAnswerField = $('#id_answer'),
            $preloadField = $('#id_answerpreload'),
            $checksField = $('#id_checks'),
            $typeCombo = $('#id_answertype'),
            type = $typeCombo.val(),
            $copyFromPreloadButton = $('#id_copyfrompreload'),
            $copyToPreloadButton = $('#id_copytopreload');

        // Set up the UI controller for the textarea whose name is
        // given as the first parameter to the given UI controller.
        function setUi($textArea, uiName) {
            console.log(uiName); // eslint-disable-line

            let uiWrapper = $textArea.data('current-ui-wrapper');

            if (uiName === "text") {
                if (uiWrapper) {
                    // disable the wrapper to make sure it won't be reactivated
                    // on pressing Ctrl+Alt+M
                    uiWrapper.disabled = true;
                    uiWrapper.stop();
                }
                return;
            }

            // if the right UI controller is not yet present, create it
            // otherwise, just reload
            if (!uiWrapper || uiWrapper.uiname !== uiName) {
                uiWrapper = new ui.InterfaceWrapper(uiName, $textArea.attr('id'));
                $textArea.data('current-ui-wrapper', uiWrapper);

            } else {
                uiWrapper.disabled = false;
                let params = {};
                if ($textArea.attr('data-params')) {
                    params = JSON.parse($textArea.attr('data-params'));
                }
                uiWrapper.loadUi(uiName, params);
            }
        }

        // Set the correct Ui controller on both the feedback answer and the answer preload.
        function setUis(pluginName) {
            setUi($feedbackAnswerField, pluginName);
            setUi($preloadField, pluginName);
            setUi($checksField, 'checks');
        }

        function stopUis() {
            if ($feedbackAnswerField.data('current-ui-wrapper')) {
                $feedbackAnswerField.data('current-ui-wrapper').stop();
            }
            if ($preloadField.data('current-ui-wrapper')) {
                $preloadField.data('current-ui-wrapper').stop();
            }
            if ($checksField.data('current-ui-wrapper')) {
                $checksField.data('current-ui-wrapper').stop();
            }
        }

        function updateUis() {
            type = $typeCombo.val();

            $.getJSON(M.cfg.wwwroot + '/question/type/graphchecker/api/typeinfo.php',
                {
                    answertype: type
                },
                function(data) {
                    let params = data['ui_params'];
                    params['highlight_vertices'] = true;
                    params['highlight_edges'] = true;
                    params['highlight_edges'] = true;
                    params['ignore_locked'] = true;
                    params['vertex_colors'] = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'];
                    params['edge_colors'] = ['black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white'];
                    let jsonParams = JSON.stringify(params);
                    $feedbackAnswerField.attr('data-params', jsonParams);

                    params['save_locked'] = true;
                    jsonParams = JSON.stringify(params);
                    $preloadField.attr('data-params', jsonParams);

                    $checksField.attr('data-available-checks', JSON.stringify(data['available_checks']));
                    $checksField.attr('data-python-explanation', data['python_explanation']);

                    setUis(data['ui_plugin']);
                }
            ).fail(function() {
                window.alert('Could not read answer type data. ' +
                    'Please reload this page to retry, or notify the ' +
                    'teacher if this keeps happening.');
            });
        }

        updateUis();  // Set up UI controllers on answer and answerpreload.

        $typeCombo.on('change', function() {
            stopUis();
            let needsToClear =
                    $feedbackAnswerField.val() !== '' ||
                    $preloadField.val() !== '' ||
                    $checksField.val() !== '[]';
            if (needsToClear) {
                if (window.confirm('Changing the answer type will clear the ' +
                        'Answer box preload, Checks, and Feedback answer ' +
                        'sections below.')) {
                    $feedbackAnswerField.val('');
                    $preloadField.val('');
                    $checksField.val('[]');
                } else {
                    $typeCombo.val(type);
                }
            }
            updateUis();
        });

        $copyFromPreloadButton.on('click', function() {
            $preloadField.data('current-ui-wrapper').stop();
            $feedbackAnswerField.data('current-ui-wrapper').stop();

            $feedbackAnswerField.val($preloadField.val());

            $preloadField.data('current-ui-wrapper').restart();
            $feedbackAnswerField.data('current-ui-wrapper').restart();
        });

        $copyToPreloadButton.on('click', function() {
            $preloadField.data('current-ui-wrapper').stop();
            $feedbackAnswerField.data('current-ui-wrapper').stop();

            $preloadField.val($feedbackAnswerField.val());

            $preloadField.data('current-ui-wrapper').restart();
            $feedbackAnswerField.data('current-ui-wrapper').restart();
        });
    }

    return {initEditForm: initEditForm};
});

