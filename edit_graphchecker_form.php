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

defined('MOODLE_INTERNAL') || die();

/*
 * Defines the editing form for the coderunner question type.
 *
 * @package 	questionbank
 * @subpackage 	questiontypes
 * @copyright 	&copy; 2013 Richard Lobb
 * @author 		Richard Lobb richard.lobb@canterbury.ac.nz
 * @license 	http://www.gnu.org/copyleft/gpl.html GNU Public License
 */

require_once($CFG->dirroot . '/question/type/graphchecker/questiontype.php');
require_once($CFG->dirroot . '/question/type/graphchecker/question.php');

use qtype_graphchecker\constants;

/**
 * CodeRunner editing form definition.
 */
class qtype_graphchecker_edit_form extends question_edit_form {

    const NUM_TESTCASES_START = 5;  // Num empty test cases with new questions.
    const NUM_TESTCASES_ADD = 3;    // Extra empty test cases to add.
    const DEFAULT_NUM_ROWS = 18;    // Answer box rows.
    const DEFAULT_NUM_COLS = 100;   // Answer box columns.
    const TEMPLATE_PARAM_ROWS = 5;  // The number of rows of the template parameter field.
    const RESULT_COLUMNS_SIZE = 80; // The size of the resultcolumns field.

    public function qtype() {
        return 'graphchecker';
    }


    private static function author_edit_keys() {
        // A list of all the language strings required by authorform.js.
        /*return array('coderunner_question_type', 'confirm_proceed', 'template_changed',
            'info_unavailable', 'proceed_at_own_risk', 'error_loading_prototype',
            'ajax_error', 'prototype_load_failure', 'prototype_error',
            'question_type_changed');*/
        return array();
    }

    // Define the CodeRunner question edit form.
    protected function definition() {
        global $PAGE;

        $mform = $this->_form;
        $this->answertype = 'undirected';
        if (!empty($this->question->options->answertype)) {
            $this->answertype = $this->question->options->answertype;
        }

        $this->make_error_div($mform);

        $PAGE->requires->js_call_amd('qtype_graphchecker/textareas', 'setupAllTAs');

        // Define the parameters required by the JS initEditForm amd module.
        $strings = array();
        foreach (self::author_edit_keys() as $key) {
            $strings[$key] = get_string($key, 'qtype_graphchecker');
        }

        $PAGE->requires->js_call_amd('qtype_graphchecker/authorform', 'initEditForm',
                array($strings));

        parent::definition($mform);  // The superclass adds the "General" stuff.
    }


    // Defines the bit of the CodeRunner question edit form after the "General"
    // section and before the footer stuff.
    public function definition_inner($mform) {

        // add Answer type field
        $types = $this->get_types_array();
        $typeselectorelements = array();
        $typeselectorelements[] = $mform->createElement('select', 'answertype',
                null, $types);
        $mform->setDefault('answertype', 'undirected');
        $mform->addElement('group', 'coderunner_type_group',
                get_string('answertype', 'qtype_graphchecker'), $typeselectorelements, null, false);
        $mform->addHelpButton('coderunner_type_group', 'answertype', 'qtype_graphchecker');

        // add other sections
        $this->add_preload_answer_field($mform);
        $this->add_checks_field($mform);
        $this->add_sample_answer_field($mform);
    }


    /**
     * Add a field for a sample answer to this problem (optional)
     * @param object $mform the form being built
     */
    protected function add_sample_answer_field($mform) {
        global $CFG;
        $mform->addElement('header', 'answerhdr',
                    get_string('answer', 'qtype_graphchecker'), '');
        $mform->setExpanded('answerhdr', 1);
        $attributes = array(
            'rows' => 9,
            'class' => 'answer edit_code',
            'data-params' => qtype_graphchecker_question::get_ui_params($this->answertype));
        $mform->addElement('textarea', 'answer',
                get_string('answer', 'qtype_graphchecker'),
                $attributes);
        //$mform->addElement('advcheckbox', 'validateonsave', null,
        //        get_string('validateonsave', 'qtype_graphchecker'));
        //$mform->setDefault('validateonsave', false);
        $mform->addHelpButton('answer', 'answer', 'qtype_graphchecker');
    }


    /**
     * Add a field for the checks.
     * @param object $mform the form being built
     */
    protected function add_checks_field($mform) {
        global $CFG;
        $mform->addElement('header', 'checkshdr',
                    get_string('checks', 'qtype_graphchecker'), '');
        $mform->setExpanded('checkshdr', 1);
        $availableTests = qtype_graphchecker_check::get_available_checks($this->answertype);
        $mform->addElement('textarea', 'checks',
            get_string('checks', 'qtype_graphchecker'),
            array(
                'class' => 'edit_code',
                'data-available-checks' => json_encode($availableTests)
            )
        );
        $mform->setDefault('checks', '[]');
        $mform->addHelpButton('checks', 'checks', 'qtype_graphchecker');
    }

    /**
     * Add a field for a text to be preloaded into the answer box.
     * @param object $mform the form being built
     */
    protected function add_preload_answer_field($mform) {
        $mform->addElement('header', 'answerpreloadhdr',
                    get_string('answerpreload', 'qtype_graphchecker'), '');
        $expanded = !empty($this->question->options->answerpreload);
        $mform->setExpanded('answerpreloadhdr', $expanded);
        $attributes = array(
            'rows' => 5,
            'class' => 'preloadanswer edit_code',
            'data-params' => qtype_graphchecker_question::get_ui_params($this->answertype));
        $mform->addElement('textarea', 'answerpreload',
                get_string('answerpreload', 'qtype_graphchecker'),
                $attributes);
        $mform->addHelpButton('answerpreload', 'answerpreload', 'qtype_graphchecker');
    }


    public function data_preprocessing($question) {
        // Preprocess the question data to be loaded into the form. Called by set_data after
        // standard stuff all loaded.
        global $COURSE;

        if (isset($question->options->testcases)) { // Reloading a saved question?

            // Next flatten all the question->options down into the question itself.
            $question->testcode = array();
            $question->expected = array();
            $question->useasexample = array();
            $question->display = array();
            $question->extra = array();
            $question->hiderestifail = array();

            foreach ($question->options->testcases as $tc) {
                $question->testcode[] = $this->newline_hack($tc->testcode);
                $question->testtype[] = $tc->testtype;
                $question->stdin[] = $this->newline_hack($tc->stdin);
                $question->expected[] = $this->newline_hack($tc->expected);
                $question->extra[] = $this->newline_hack($tc->extra);
                $question->useasexample[] = $tc->useasexample;
                $question->display[] = $tc->display;
                $question->hiderestiffail[] = $tc->hiderestiffail;
                $question->mark[] = sprintf("%.3f", $tc->mark);
            }

            $question->courseid = $COURSE->id;

            // Load the type-name if this is a prototype, else make it blank.
            $question->typename = '';

            // Convert raw newline chars in testsplitterre into 2-char form
            // so they can be edited in a one-line entry field.
            if (isset($question->testsplitterre)) {
                $question->testsplitterre = str_replace("\n", '\n', $question->testsplitterre);
            }
        }

        return $question;
    }


    // A horrible hack for a horrible browser "feature".
    // Inserts a newline at the start of a text string that's going to be
    // displayed at the start of a <textarea> element, because all browsers
    // strip a leading newline. If there's one there, we need to keep it, so
    // the extra one ensures we do. If there isn't one there, this one gets
    // ignored anyway.
    private function newline_hack($s) {
        return "\n" . $s;
    }


    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if (count($errors) == 0 && !empty($data['validateonsave'])) {
            $testresult = $this->validate_sample_answer($data);
            if ($testresult) {
                $errors['answer'] = $testresult;
            }
        }

        return $errors;
    }

    // FUNCTIONS TO BUILD PARTS OF THE MAIN FORM
    // =========================================.

    // Create an empty div with id id_qtype_graphchecker_error_div for use by
    // JavaScript error handling code.
    private function make_error_div($mform) {
        $mform->addElement('html', "<div id='id_qtype_graphchecker_error_div' class='qtype_graphchecker_error_message'></div>");
    }

    /**
     * Returns an array of key-value pairs, containing a list of available
     * answer types.
     *
     * The keys are the internal names, while the values are the human-readable
     * names of the answer types.
     */
    private function get_types_array() {
        global $CFG;
        $json = file_get_contents($CFG->dirroot . '/question/type/graphchecker/checks/types.json');
        $types = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON types file");
        }

        $result = [];
        foreach ($types as $key => $type) {
            $result[$key] = $type["name"];
        }

        return $result;
    }


    // UTILITY FUNCTIONS.
    // =================.

    private function make_question_from_form_data($data) {
        // Construct a question object containing all the fields from $data.
        // Used in data pre-processing and when validating a question.
        global $DB;
        $question = new qtype_graphchecker_question();
        foreach ($data as $key => $value) {
            if ($key === 'questiontext' || $key === 'generalfeedback') {
                // Question text and general feedback are associative arrays.
                $question->$key = $value['text'];
            } else {
                $question->$key = $value;
            }
        }
        $question->isnew = true;

        // Clean the question object, get inherited fields and run the sample answer.
        $qtype = new qtype_graphchecker();
        $qtype->clean_question_form($question, true);
        $questiontype = $question->answertype;
        list($category) = explode(',', $question->category);
        $contextid = $DB->get_field('question_categories', 'contextid', array('id' => $category));
        $question->contextid = $contextid;
        $context = context::instance_by_id($contextid, IGNORE_MISSING);
        return $question;
    }

    // Check the sample answer (if there is one)
    // Return an empty string if there is no sample answer and no attachments,
    // or if the sample answer passes all the tests.
    // Otherwise return a suitable error message for display in the form.
    private function validate_sample_answer($data) {

        try {
            $question = $this->make_question_from_form_data($data);
            $question->start_attempt();
            $response = array('answer' => $question->answer);
            if (!empty($answerlang)) {
                $response['language'] = $answerlang;
            }
            $error = $question->validate_response($response);
            if ($error) {
                return $error;
            }
            list($mark, $state, $cachedata) = $question->grade_response($response);
        } catch (Exception $e) {
            return $e->getMessage();
        }

        // Return either an empty string if run was good or an error message.
        if ($mark == 1.0) {
            return '';
        } else {
            $outcome = unserialize($cachedata['_testoutcome']);
            $error = $outcome->validation_error_message();
            return $error;
        }
    }
}

