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
        let $sampleAnswerField = $('#id_answer'),
            $preloadField = $('#id_answerpreload'),
            $checksField = $('#id_checks'),
            $typeCombo = $('#id_answertype'),
            type = $typeCombo.val(),
            $copyFromPreloadButton = $('#id_copyfrompreload'),
            $copyToPreloadButton = $('#id_copytopreload');

        // Set up the UI controller for the textarea whose name is
        // given as the first parameter to the given UI controller.
        function setUi($textArea, uiName) {

            // if the right UI controller is not yet present, create it
            // otherwise, just reload
            let uiWrapper = $textArea.data('current-ui-wrapper');
            if (!uiWrapper || uiWrapper.uiname !== uiName) {
                uiWrapper = new ui.InterfaceWrapper(uiName, $textArea.attr('id'));

            } else {
                let params = {};
                if ($textArea.attr('data-params')) {
                    params = JSON.parse($textArea.attr('data-params'));
                }
                uiWrapper.loadUi(uiName, params);
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

        function updateUis() {
            type = $typeCombo.val();

            $.getJSON(M.cfg.wwwroot + '/question/type/graphchecker/api/typeinfo.php',
                {
                    answertype: type
                },
                function(data) {
                    let params = data['ui_params'];
                    params['type'] = type;
                    params['highlight_vertices'] = true;
                    params['highlight_edges'] = true;
                    params['highlight_edges'] = true;
                    params['ignore_locked'] = true;
                    params['vertex_colors'] = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'];
                    params['edge_colors'] = ['black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white'];
                    let jsonParams = JSON.stringify(params);
                    $sampleAnswerField.attr('data-params', jsonParams);

                    params['save_locked'] = true;
                    jsonParams = JSON.stringify(params);
                    $preloadField.attr('data-params', jsonParams);

                    $checksField.attr('data-available-checks', JSON.stringify(data['available_checks']));

                    setUis();
                }
            ).fail(function() {
                window.alert('Could not read answer type data. ' +
                    'Please reload this page to retry, or notify the ' +
                    'teacher if this keeps happening.');
            });
        }

        updateUis();  // Set up UI controllers on answer and answerpreload.

        $typeCombo.on('change', function() {
            if (window.confirm('Changing the answer type will clear the ' +
                    'Answer box preload, Checks, and Sample answer ' +
                    'sections below.')) {
                stopUis();
                $sampleAnswerField.val('');
                $preloadField.val('');
                $checksField.val('');
                updateUis();
            } else {
                $typeCombo.val(type);
            }
        });

        $copyFromPreloadButton.on('click', function() {
            $preloadField.data('current-ui-wrapper').stop();
            $sampleAnswerField.data('current-ui-wrapper').stop();

            $sampleAnswerField.val($preloadField.val());

            $preloadField.data('current-ui-wrapper').restart();
            $sampleAnswerField.data('current-ui-wrapper').restart();
        });

        $copyToPreloadButton.on('click', function() {
            $preloadField.data('current-ui-wrapper').stop();
            $sampleAnswerField.data('current-ui-wrapper').stop();

            $preloadField.val($sampleAnswerField.val());

            $preloadField.data('current-ui-wrapper').restart();
            $sampleAnswerField.data('current-ui-wrapper').restart();
        });
    }

    return {initEditForm: initEditForm};
});

