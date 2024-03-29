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
 * GraphChecker's question definition class.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once($CFG->dirroot . '/question/behaviour/adaptive/behaviour.php');
require_once($CFG->dirroot . '/question/engine/questionattemptstep.php');
require_once($CFG->dirroot . '/question/behaviour/adaptive_adapted_for_coderunner/behaviour.php');
require_once($CFG->dirroot . '/question/behaviour/deferredfeedback_graphchecker/behaviour.php');
require_once($CFG->dirroot . '/question/type/graphchecker/questiontype.php');

use qtype_graphchecker\constants;

/**
 * Represents a GraphChecker question.
 */
class qtype_graphchecker_question extends question_graded_automatically {

    public $testcases = null; // Array of testcases.

    // GraphChecker does not support hiding the Check button, but CodeRunner
    // does, and its adaptive behavior expects to be able to do
    //
    // if ($question->hidecheck) { ... }
    //
    // to check for this. Hence, we just set this field to false here.
    public $hidecheck = false;

    /**
     * Start a new attempt at this question, storing any information that will
     * be needed later in the step. It is retrieved and applied by
     * apply_attempt_state.
     *
     * @param question_attempt_step The first step of the {@link question_attempt}
     *      being started. Can be used to store state. Is set to null during
     *      question validation, and must then be ignored.
     * @param int $varant which variant of this question to start. Will be between
     *      1 and {@link get_num_variants()} inclusive.
     */
    public function start_attempt(question_attempt_step $step=null, $variant=null) {
        global $USER;

        $user = $USER;
        $this->student = $user;
        if ($step !== null) {
            parent::start_attempt($step, $variant);
        }
    }


    /**
     * Override default behaviour so that we can use a specialised behaviour
     * that caches test results returned by the call to grade_response().
     *
     * @param question_attempt $qa the attempt we are creating an behaviour for.
     * @param string $preferredbehaviour the requested type of behaviour.
     * @return question_behaviour the new behaviour object.
     */
    public function make_behaviour(question_attempt $qa, $preferredbehaviour) {

        // if asking for deferred behavior, use that
        // otherwise use our adapted adaptive behavior (so that we can display the results table)

        if ($preferredbehaviour === "manualgraded") {
            return question_engine::make_behaviour('manualgraded', $qa, $preferredbehaviour);
        } else if ($preferredbehaviour === "deferredfeedback") {
            return new qbehaviour_deferredfeedback_graphchecker($qa, $preferredbehaviour);
        } else {
            return new qbehaviour_adaptive_adapted_for_coderunner($qa, $preferredbehaviour);
        }
    }


    public function get_expected_data() {
        $expecteddata = array('answer' => PARAM_RAW,
                     'language' => PARAM_NOTAGS);
        return $expecteddata;
    }


    public function summarise_response(array $response) {
        if (isset($response['answer'])) {
            return $response['answer'];
        } else {
            return null;
        }
    }


    public function is_gradable_response(array $response) {
        return true;
    }


    public function is_complete_response(array $response) {
        return true;
    }

    /**
     * In situations where is_gradable_response() returns false, this method
     * should generate a description of what the problem is.
     * @return string the message.
     */
    public function get_validation_error(array $response) {
        $error = 'This answer could not be graded because an error occurred while checking.<br>Details:';
        $testoutcomeserial = $response['_testoutcome'];
        $testoutcome = unserialize($testoutcomeserial);
        if ($testoutcome instanceof qtype_graphchecker_testing_outcome) {
            if (property_exists($testoutcome, 'errormessage') && $testoutcome->errormessage) {
                $error .= '<pre>' . $testoutcome->errormessage . '</pre>';
            } else {
                $error .= "<ul>";
                foreach ($testoutcome->testresults as $result) {
                    if (array_key_exists('error', $result)) {
                        $error .= "<li>";
                        $error .= "Check <b>" . $testoutcome->get_test_name($this->answertype, $result['module'], $result['method']) .
                            "</b> produced error:<pre>" . $result['error'] . "</pre>";
                    }
                }
                $error .= "</ul>";
            }
        } else {
            $error .= "Unknown error.";
        }
        return $error;
    }


    /** This function is used by the question engine to prevent regrading of
     *  unchanged submissions.
     *
     * @param array $prevresponse
     * @param array $newresponse
     * @return boolean
     */
    public function is_same_response(array $prevresponse, array $newresponse) {
        $sameanswer = question_utils::arrays_same_at_key_missing_is_blank(
                        $prevresponse, $newresponse, 'answer');
        return $sameanswer;
    }


    public function get_correct_response() {
        return $this->get_correct_answer();
    }


    public function get_correct_answer() {
        // Return the feedback answer, if supplied.
        if (!isset($this->answer)) {
            return null;
        } else {
            $answer = array('answer' => $this->answer);
            return $answer;
        }
    }


    /**
     * Grade the given student's response.
     * This implementation assumes a modified behaviour that will accept a
     * third array element in its response, containing data to be cached and
     * served up again in the response on subsequent calls.
     * @param array $response the qt_data for the current pending step. The
     * two relevant keys are '_testoutcome', which is a cached copy of the
     * grading outcome if this response has already been graded and 'answer'
     * (the student's answer) otherwise.
     * @param bool $isprecheck true iff this grading is occurring because the
     * student clicked the precheck button
     * @return 3-element array of the mark (0 - 1), the question_state (
     * gradedright, gradedwrong, gradedpartial, invalid) and the full
     * qtype_graphchecker_testing_outcome object to be cached. The invalid
     * state is used when a sandbox error occurs.
     * @throws coding_exception
     */
    public function grade_response(array $response, $isprecheck=false) {
        if ($isprecheck && empty($this->precheck)) {
            throw new coding_exception("Unexpected precheck");
        }
        $gradingreqd = true;
        if (!empty($response['_testoutcome'])) {
            $testoutcomeserial = $response['_testoutcome'];
            $testoutcome = unserialize($testoutcomeserial);
            if ($testoutcome instanceof qtype_graphchecker_testing_outcome) {
                $gradingreqd = false;  // Already graded and with same precheck state.
            }
        }
        if ($gradingreqd) {
            // We haven't already graded this submission or we graded it with
            // a different precheck setting.
            $answer = '';
            if (array_key_exists('answer', $response)) {
                $answer = $response['answer'];
            }
            $runner = new qtype_graphchecker_jobrunner();
            $testoutcome = $runner->run_checks($this, $answer, $this->checks, $isprecheck);
            $testoutcomeserial = serialize($testoutcome);
        }

        $datatocache = array('_testoutcome' => $testoutcomeserial);
        if ($testoutcome->is_ungradable()) {
            return array(0, question_state::$invalid, $datatocache);
        } else if ($testoutcome->mark_as_fraction() == 1) {
            return array(1, question_state::$gradedright, $datatocache);
        } else if ($testoutcome->mark_as_fraction() == 0) {
            return array(0, question_state::$gradedwrong, $datatocache);
        } else {
            return array($testoutcome->mark_as_fraction(), question_state::$gradedpartial, $datatocache);
        }
    }


    public static function get_ui_params_for_type($type) {
        $types = qtype_graphchecker_util::get_type_data();
        $params = $types[$type]["ui_params"];
        return $params;
    }


    public static function get_ui_params_for_preload($type) {
        $params = qtype_graphchecker_question::get_ui_params_for_type($type);
        $params['ignore_locked'] = true;
        $params['save_locked'] = true;
        $params['allow_edits'] = [
            'move', 'edit_vertex', 'edit_edge',
            'vertex_labels', 'edge_labels',
            'vertex_colors', 'edge_colors',
            'fsm_flags', 'petri_marking'
        ];
        $params['vertex_colors'] = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'];
        $params['edge_colors'] = ['black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white'];
        return $params;
    }


    /**
     * Returns a JSON string to be handed to the UI plugin, corresponding to
     * the answer type of this question.
     */
    public function get_ui_params() {
        $params = qtype_graphchecker_question::get_ui_params_for_type($this->answertype);

        $params['highlight_vertices'] = $this->vertex_highlight === "1";
        $params['highlight_edges'] = $this->edge_highlight === "1";

        if ($this->vertex_attr_colors) {
            $params['vertex_colors'] = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'];
        }
        if ($this->edge_attr_colors) {
            $params['edge_colors'] = ['black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white'];
        }

        if ($this->allowed_vertex_edits === 'none') {
            $params['allow_edits'] = [];
        } else if ($this->allowed_vertex_edits === 'edges') {
            $params['allow_edits'] = [
                'move', 'edit_edge',
                'fsm_flags', 'petri_marking'
            ];
        } else {  // 'all' or NULL (for old questions)
            $params['allow_edits'] = [
                'move', 'edit_vertex', 'edit_edge',
                'fsm_flags', 'petri_marking'
            ];
        }

        if ($this->vertex_attr_labels) {
            $params['allow_edits'][] = 'vertex_labels';
        }
        if ($this->edge_attr_labels) {
            $params['allow_edits'][] = 'edge_labels';
        }
        if ($this->vertex_attr_colors) {
            $params['allow_edits'][] = 'vertex_colors';
        }
        if ($this->edge_attr_colors) {
            $params['allow_edits'][] = 'edge_colors';
        }

        if (!$this->lock_preload) {
            $params['ignore_locked'] = true;
        }

        return json_encode($params);
    }
}
