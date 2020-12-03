<?php
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

defined('MOODLE_INTERNAL') || die();

/*
 * GraphChecker's question edit form.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once($CFG->dirroot . '/question/type/graphchecker/questiontype.php');
require_once($CFG->dirroot . '/question/type/graphchecker/question.php');

use qtype_graphchecker\constants;

/**
 * GraphChecker editing form definition.
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
        return array();
    }

    // Define the GraphChecker question edit form.
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


    // Defines the bit of the GraphChecker question edit form after the "General"
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

        // vertex attributes
        $vertexAttrBoxes = [];
        $vertexAttrBoxes[] =& $mform->createElement('advcheckbox', 'vertex_attr_labels',
                'Labels', null, null);
        $vertexAttrBoxes[] =& $mform->createElement('advcheckbox', 'vertex_attr_colors',
                'Colors', null, null);
        $mform->addGroup($vertexAttrBoxes, 'vertex_attributes',
                'Node attributes', [''], false);
        $mform->addHelpButton('vertex_attributes', 'vertex_attributes', 'qtype_graphchecker');
        $mform->setDefault('vertex_attr_labels', true);
        $mform->setDefault('vertex_attr_colors', true);

        // edge attributes
        $edgeAttrBoxes = [];
        $edgeAttrBoxes[] =& $mform->createElement('advcheckbox', 'edge_attr_labels',
                'Labels', null, null);
        $edgeAttrBoxes[] =& $mform->createElement('advcheckbox', 'edge_attr_colors',
                'Colors', null, null);
        $mform->addGroup($edgeAttrBoxes, 'edge_attributes',
                'Edge attributes', [''], false);
        $mform->addHelpButton('edge_attributes', 'edge_attributes', 'qtype_graphchecker');
        $mform->setDefault('edge_attr_labels', true);
        $mform->setDefault('edge_attr_colors', true);

        // add other sections
        $this->add_student_interaction_field($mform);
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

        $params = qtype_graphchecker_question::get_ui_params_for_type($this->answertype);
        // always allow highlighting in the sample answer field
        $params['highlight_vertices'] = true;
        $params['highlight_edges'] = true;
        $params['highlight_edges'] = true;
        $params['vertex_colors'] = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'];
        $params['edge_colors'] = ['black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white'];

        $attributes = array(
            'rows' => 9,
            'class' => 'answer edit_code',
            'data-params' => json_encode($params)
        );
        $mform->addElement('textarea', 'answer',
                get_string('answer', 'qtype_graphchecker'),
                $attributes);
        $mform->addHelpButton('answer', 'answer', 'qtype_graphchecker');

        $copyButtons = [];
        $copyButtons[] =& $mform->createElement('button', 'copyfrompreload', 'Copy from preload');
        $copyButtons[] =& $mform->createElement('button', 'copytopreload', 'Copy to preload');
        $copyButtons[] =& $mform->createElement('advcheckbox', 'validateonsave', null,
            get_string('validateonsave', 'qtype_graphchecker'));

        $mform->addGroup($copyButtons, 'copy_buttons', '', [''], false);

        $mform->setDefault('validateonsave', true);
        $mform->addHelpButton('copy_buttons', 'validateonsave', 'qtype_graphchecker');
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

    protected function add_student_interaction_field($mform) {
        $mform->addElement('header', 'studentinteractionhdr',
                    'Student interaction', '');
        $mform->setExpanded('studentinteractionhdr', 1);

        // preload field
        $attributes = array(
            'rows' => 5,
            'class' => 'preloadanswer edit_code',
            'data-params' => json_encode(qtype_graphchecker_question::get_ui_params_for_preload($this->answertype))
        );
        $mform->addElement('textarea', 'answerpreload',
                get_string('answerpreload', 'qtype_graphchecker'),
                $attributes);
        $mform->addHelpButton('answerpreload', 'answerpreload', 'qtype_graphchecker');

        $lockPreloadBox = [];
        $lockPreloadBox[] =& $mform->createElement('advcheckbox', 'lock_preload',
                'Lock preload', null, null);
        $mform->addGroup($lockPreloadBox, 'lock_preload_box', '', [''], false);
        $mform->addHelpButton('lock_preload_box', 'lock_preload_box', 'qtype_graphchecker');

        // allowed add/remove
        $add_remove_choices = [];
        $add_remove_choices['none'] = 'none';
        $add_remove_choices['edges'] = 'only edges';
        $add_remove_choices['all'] = 'all (nodes and edges)';
        $mform->addElement('select', 'allowed_vertex_edits',
                'Allow adding/removing', $add_remove_choices);
        $mform->setDefault('allowed_vertex_edits', 'all');
        $mform->addHelpButton('allowed_vertex_edits', 'allowed_vertex_edits', 'qtype_graphchecker');

        // highlighting
        $highlightBoxes = [];
        $highlightBoxes[] =& $mform->createElement('advcheckbox', 'vertex_highlight',
                'Nodes', null, null);
        $highlightBoxes[] =& $mform->createElement('advcheckbox', 'edge_highlight',
                'Edges', null, null);
        $mform->addGroup($highlightBoxes, 'highlight',
                'Highlighting', [''], false);
        $mform->addHelpButton('highlight', 'highlight', 'qtype_graphchecker');
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

    /**
     * Construct a question object containing all the fields from $data.
     * Used when validating the sample answer.
     */
    private function make_question_from_form_data($data) {
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
            list($mark, $state, $cachedata) = $question->grade_response($response);
        } catch (Exception $e) {
            return $e->getMessage();
        }

        // Return either an empty string if run was good or an error message.
        if ($mark == 1.0) {
            return '';
        } else {
            $outcome = unserialize($cachedata['_testoutcome']);
            $error = $outcome->validation_error_message($question);
            return $error;
        }
    }
}

