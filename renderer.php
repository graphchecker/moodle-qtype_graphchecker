<?php
// This file is part of CodeRunner - http://coderunner.org.nz/
//
// CodeRunner is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// CodeRunner is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with CodeRunner.  If not, see <http://www.gnu.org/licenses/>.

/**
 * CodeRunner renderer class.
 *
 * @package    qtype
 * @subpackage coderunner
 * @copyright  2012 Richard Lobb, The University of Canterbury.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

use qtype_graphchecker\constants;

/**
 * Subclass for generating the bits of output specific to graphchecker questions.
 *
 * @copyright  Richard Lobb, University of Canterbury.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


class qtype_graphchecker_renderer extends qtype_renderer {

    /**
     * Generate the display of the formulation part of the question. This is the
     * area that contains the question text, and the controls for students to
     * input their answers. Some question types also embed bits of feedback, for
     * example ticks and crosses, in this area.
     *
     * @param question_attempt $qa the question attempt to display.
     * @param question_display_options $options controls what should and should not be displayed.
     * @return string HTML fragment.
     */
    public function formulation_and_controls(question_attempt $qa, question_display_options $options) {
        global $CFG, $PAGE;
        global $USER;

        $question = $qa->get_question();
        $qid = $question->id;
	if (empty($USER->graphcheckerquestionids)) {
            $USER->graphcheckerquestionids = array($qid);  // Record in case of AJAX request
	} else {
	    array_push($USER->graphcheckerquestionids, $qid); // Array of active qids
	}
        $qtext = $question->format_questiontext($qa);

        $qtext .= html_writer::start_tag('div', array('class' => 'prompt'));

        $responsefieldname = $qa->get_qt_field_name('answer');
        $responsefieldid = 'id_' . $responsefieldname;
        $answerprompt = html_writer::tag('label',
                get_string('answerprompt', 'qtype_graphchecker'), array('class' => 'answerprompt', 'for' => $responsefieldid));
        $qtext .= $answerprompt;

        $qtext .= html_writer::end_tag('div');

        $preload = isset($question->answerpreload) ? $question->answerpreload : '';
        if ($preload) {  // Add a reset button if preloaded text is non-empty.
            $qtext .= self::reset_button($qa, $responsefieldid, $preload);
        }

        $rows = isset($question->answerboxlines) ? $question->answerboxlines : 18;
        $taattributes = array(
                'class' => 'graphchecker-answer edit_code',
                'name'  => $responsefieldname,
                'id'    => $responsefieldid,
                'data-params' => qtype_graphchecker_question::get_ui_params($question->answertype)
        );

        if ($options->readonly) {
            $taattributes['readonly'] = 'readonly';
        }

        $currentanswer = $qa->get_last_qt_var('answer');
        if ($currentanswer === null || $currentanswer === '') {
            $currentanswer = $preload;
        } else {
            // Horrible horrible hack for horrible horrible browser feature
            // of ignoring a leading newline in a textarea. So we inject an
            // extra one to ensure that if the answer beings with a newline it
            // is preserved.
            $currentanswer = "\n" . $currentanswer;
        }
        $qtext .= html_writer::tag('textarea', s($currentanswer), $taattributes);

        if ($qa->get_state() == question_state::$invalid) {
            $qtext .= html_writer::nonempty_tag('div',
                    $question->get_validation_error($qa->get_last_qt_data()),
                    array('class' => 'validationerror'));
        }

        // Initialise the Graph UI.
        qtype_graphchecker_util::load_uiplugin_js($question, $responsefieldid);

        return $qtext;
    }


    /**
     * Generate the specific feedback. This is feedback that varies according to
     * the response the student gave.
     * @param question_attempt $qa the question attempt to display.
     * @return string HTML fragment.
     */
    protected function specific_feedback(question_attempt $qa) {
        $toserialised = $qa->get_last_qt_var('_testoutcome');
        if (!$toserialised) { // Something broke?
            return '';
        }

        $q = $qa->get_question();
        $outcome = unserialize($toserialised);
        if ($outcome === false) {
            $outcome = new qtype_graphchecker_testing_outcome(qtype_graphchecker_testing_outcome::STATUS_UNSERIALIZE_FAILED, [], "Internal error: unserialization failed");
        }
        $resultsclass = $this->results_class($outcome);

        $fb = '';

        $fb .= html_writer::start_tag('div', array('class' => $resultsclass));
        if ($outcome->invalid()) {
            $fb .= html_writer::tag('h5', get_string('unserializefailed', 'qtype_graphchecker'),
                    array('class' => 'run_failed_error'));
        } else if ($outcome->run_failed()) {
            $fb .= html_writer::tag('h5', get_string('run_failed', 'qtype_graphchecker'));;
            $fb .= html_writer::tag('p', s($outcome->errormessage),
                    array('class' => 'run_failed_error'));
        } else if ($outcome->has_syntax_error()) {
            $fb .= html_writer::tag('h5', get_string('syntax_errors', 'qtype_graphchecker'));
            $fb .= html_writer::tag('pre', s($outcome->errormessage),
                    array('class' => 'pre_syntax_error'));
        } else if ($outcome->combinator_error()) {
            $fb .= html_writer::tag('h5', get_string('badquestion', 'qtype_graphchecker'));
            $fb .= html_writer::tag('pre', s($outcome->errormessage),
                    array('class' => 'pre_question_error'));

        } else {

            // The run was successful (i.e didn't crash, but may be wrong answer). Display results.
            $fb .= $this->build_results_table($outcome, $q);
        }

        // Summarise the status of the response in a paragraph at the end.
        // Suppress when previous errors have already said enough.
        if (!$outcome->has_syntax_error() &&
             !$outcome->is_ungradable() &&
             !$outcome->run_failed()) {

            $fb .= $this->build_feedback_summary($qa, $outcome);
        }
        $fb .= html_writer::end_tag('div');

        return $fb;
    }

    /**
     * Return html to display the status of an empty precheck run.
     * @param qtype_graphchecker_testing_outcome $outcome the results from the test
     * Must be a standard testing outcome, not a combinator grader outcome.
     * @return html string describing the outcome
     */
    protected function empty_precheck_status($outcome) {
        $output = $outcome->get_raw_output();
        if (!empty($output)) {
            $fb = html_writer::tag('p', get_string('bademptyprecheck', 'qtype_graphchecker'));
            $fb .= html_writer::tag('pre', qtype_graphchecker_util::format_cell($output),
                    array('class' => 'bad_empty_precheck'));
        } else {
            $fb = html_writer::tag('p', get_string('goodemptyprecheck', 'qtype_graphchecker'),
                    array('class' => 'good_empty_precheck'));
        }
        return $fb;

    }

    // Generate the main feedback, consisting of (in order) any prologuehtml,
    // a table of results and any epiloguehtml.
    protected function build_results_table($outcome, qtype_graphchecker_question $question) {
        $fb = $outcome->get_prologue();
        $testresults = $outcome->get_test_results($question);
        if (is_array($testresults) && count($testresults) > 0) {
            $table = new html_table();
            $table->attributes['class'] = 'graphchecker-test-results';
            $headers = $testresults[0];
            foreach ($headers as $header) {
                if (strtolower($header) != 'ishidden') {
                    $table->head[] = strtolower($header) === 'iscorrect' ? '' : $header;
                }
            }

            $rowclasses = array();
            $tablerows = array();

            for ($i = 1; $i < count($testresults); $i++) {
                $cells = $testresults[$i];
                $rowclass = $i % 2 == 0 ? 'r0' : 'r1';
                $tablerow = array();
                $j = 0;
                foreach ($cells as $cell) {
                    if (strtolower($headers[$j]) === 'iscorrect') {
                        $markfrac = (float) $cell;
                        $tablerow[] = $this->feedback_image($markfrac);
                    } else if (strtolower($headers[$j]) === 'ishidden') { // Control column.
                        if ($cell) { // Anything other than zero or false means hidden.
                            $rowclass .= ' hidden-test';
                        }
                    } else if ($cell instanceof qtype_graphchecker_html_wrapper) {
                        $tablerow[] = $cell->value();  // It's already HTML.
                    } else {
                        $tablerow[] = qtype_graphchecker_util::format_cell($cell);
                    }
                    $j++;
                }
                $tablerows[] = $tablerow;
                $rowclasses[] = $rowclass;
            }
            $table->data = $tablerows;
            $table->rowclasses = $rowclasses;
            $fb .= html_writer::table($table);

        }
        $fb .= empty($outcome->epiloguehtml) ? '' : $outcome->epiloguehtml;

        return $fb;
    }


    // Compute the HTML feedback summary for this test outcome.
    // Should not be called if there were any syntax or sandbox errors.
    protected function build_feedback_summary(question_attempt $qa, qtype_graphchecker_testing_outcome $outcome) {
        if ($outcome->iscombinatorgrader()) {
            // Simplified special case.
            return $this->build_combinator_grader_feedback_summary($qa, $outcome);
        }
        $question = $qa->get_question();
        $lines = array();  // List of lines of output.

        $onlyhiddenfailed = false;
        if ($outcome->was_aborted()) {
            $lines[] = get_string('aborted', 'qtype_graphchecker');
        }

        if ($outcome->all_correct()) {
            $lines[] = get_string('allok', 'qtype_graphchecker') .
                    "&nbsp;" . $this->feedback_image(1.0);
        } else {
            $lines[] = get_string('noerrorsallowed', 'qtype_graphchecker');
        }

        return qtype_graphchecker_util::make_html_para($lines);
    }


    // A special case of the above method for use with combinator template graders
    // only.
    protected function build_combinator_grader_feedback_summary($qa, qtype_graphchecker_combinator_grader_outcome $outcome) {
        $lines = array();  // List of lines of output.

        if ($outcome->all_correct()) {
            $lines[] = get_string('allok', 'qtype_graphchecker') .
                    "&nbsp;" . $this->feedback_image(1.0);
        }

        return qtype_graphchecker_util::make_html_para($lines);
    }


    /**
     * Return the HTML to display the sample answer, if given.
     * @param question_attempt $qa
     * @return string The html for displaying the sample answer.
     */
    public function correct_response(question_attempt $qa) {
        global $PAGE;
        $question = $qa->get_question();
        $answer = $question->answer;
        $fieldname = $qa->get_qt_field_name('sampleanswer');
        $fieldid = 'id_' . $fieldname;
        $heading = get_string('asolutionis', 'qtype_graphchecker');
        $html = html_writer::start_tag('div', array('class' => 'sample code'));
        $html .= html_writer::tag('h4', $heading);
        $rows = min(18, substr_count($answer, "\n"));
        $taattributes = array(
                'class' => 'graphchecker-sample-answer edit_code',
                'name'  => $fieldname,
                'id'    => $fieldid,
                'spellcheck' => 'false',
                'rows'      => $rows,
                'readonly' => true
        );

        $html .= html_writer::tag('textarea', s($answer), $taattributes);
        $html .= html_writer::end_tag('div');
        qtype_graphchecker_util::load_uiplugin_js($question, $fieldid);
        return $html;
    }


    /**
     * Displays any attached files when the question is in read-only mode.
     * @param question_attempt $qa the question attempt to display.
     * @param question_display_options $options controls what should and should
     *      not be displayed. Used to get the context.
     */
    public function files_read_only(question_attempt $qa, question_display_options $options) {
        $files = $qa->get_last_qt_files('attachments', $options->context->id);
        $output = array();

        foreach ($files as $file) {
            $output[] = html_writer::tag('p', html_writer::link($qa->get_response_file_url($file),
                    $this->output->pix_icon(file_file_icon($file), get_mimetype_description($file),
                    'moodle', array('class' => 'icon')) . ' ' . s($file->get_filename())));
        }
        return implode($output);
    }

    /**
     * Displays the input control for when the student is allowed to upload files.
     * @param question_attempt $qa the question attempt to display.
     * @param int $numallowed the maximum number of attachments allowed. -1 = unlimited.
     * @param question_display_options $options controls what should and should
     *      not be displayed. Used to get the context.
     */
    public function files_input(question_attempt $qa, $numallowed,
            question_display_options $options) {
        global $CFG, $PAGE;
        require_once($CFG->dirroot . '/lib/form/filemanager.php');

        $question = $qa->get_question();
        $pickeroptions = new stdClass();
        $pickeroptions->mainfile = null;
        $pickeroptions->maxfiles = $numallowed;
        $pickeroptions->maxbytes = intval($question->maxfilesize);
        $pickeroptions->context = $options->context;
        $pickeroptions->return_types = FILE_INTERNAL | FILE_CONTROLLED_LINK;
        $pickeroptions->accepted_types = '*';  // Accept anything - names checked on upload.
        $pickeroptions->itemid = $qa->prepare_response_files_draft_itemid(
                'attachments', $options->context->id);

        $fm = new form_filemanager($pickeroptions);
        $filesrenderer = $this->page->get_renderer('core', 'files');

        $text = '';
        if (!empty($question->filenamesexplain)) {
                $text = $question->filenamesexplain;
        } else if (!empty($question->filenamesregex)) {
            $text = html_writer::tag('p', get_string('allowedfilenamesregex', 'qtype_graphchecker')
                    . ': ' . $question->filenamesregex);
        }

        // In order to prevent a spurious warning message when checking or saving
        // the question after modifying the uploaded files, we need to explicitly
        // initialise the form change checker, to ensure the onsubmit action for
        // the form calls the set_form_submitted function in the module.
        // This is only needed during Preview as it's apparently done anyway
        // in normal quiz display mode, but we do it here regardless.
        $PAGE->requires->yui_module('moodle-core-formchangechecker',
                'M.core_formchangechecker.init',
                array(array('formid' => 'responseform'))
        );
        $PAGE->requires->string_for_js('changesmadereallygoaway', 'moodle');
        return $filesrenderer->render($fm). html_writer::empty_tag(
                'input', array('type' => 'hidden', 'name' => $qa->get_qt_field_name('attachments'),
                'value' => $pickeroptions->itemid)) . $text;
    }


    // Return a count of the number of non-empty stdins, tests and extras
    // in the given list of test result objects.
    private function count_bits($tests) {
        $numstds = 0;
        $numtests = 0;
        $numextras = 0;
        foreach ($tests as $test) {
            if (trim($test->stdin) !== '') {
                $numstds++;
            }
            if (trim($test->testcode) !== '') {
                $numtests++;
            }
            if (trim($test->extra) !== '') {
                $numextras++;
            }
        }
        return array($numtests, $numstds, $numextras);
    }

    // True iff the given testcase field is specified by the given question
    // resultcolumns field to be displayed.
    private function show_column($field, $resultcolumns) {
        foreach ($resultcolumns as $columnspecifier) {
            if ($columnspecifier[1] === $field) {
                return true;
            }
        }
        return false;
    }


    // Return the column header to be used for the given testcase field,
    // as specified by the question's resultcolumns field.
    private function column_header($field, $resultcolumns) {
        foreach ($resultcolumns as $columnspecifier) {
            if ($columnspecifier[1] === $field) {
                return $columnspecifier[0];
            }
        }
        return 'ERROR';
    }


    /**
     *
     * @param qtype_graphchecker_testing_outcome $outcome
     * @return string the CSS class for the given testing outcome
     */
    protected function results_class($outcome) {
        if ($outcome->all_correct()) {
            $resultsclass = "graphchecker-test-results good";
        } else if ($outcome->mark_as_fraction() == 0) {
            $resultsclass = "graphchecker-test-results bad";
        } else {
            $resultsclass = 'graphchecker-test-results partial';
        }
        return $resultsclass;
    }


    /**
     * Support method to generate the "Reset" button, which resets the student
     * answer to the preloaded value.
     *
     * Returns the HTML for the button, and sets up the JavaScript handler
     * for it.
     * @param question_attempt $qa The current question attempt object
     * @param string $responsefieldid The id of the student answer field
     * @param string $preload The text to be plugged into the answer if reset
     * @return string html string for the button
     */
    protected static function reset_button($qa, $responsefieldid, $preload) {
        global $PAGE;
        $buttonid = $qa->get_behaviour_field_name('resetbutton');
        $attributes = array(
            'type' => 'button',
            'id' => $buttonid,
            'name' => $buttonid,
            'value' => get_string('reset', 'qtype_graphchecker'),
            'class' => 'answer_reset_btn',
            'data-reload-text' => $preload);
        $html = html_writer::empty_tag('input', $attributes);

        $PAGE->requires->js_call_amd('qtype_graphchecker/resetbutton',
            'initResetButton',
            array($buttonid,
                  $responsefieldid,
                  get_string('confirmreset', 'qtype_graphchecker')
            )
        );

        return $html;
    }
}
