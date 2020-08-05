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
 * coderunner question definition classes.
 *
 * @package    qtype
 * @subpackage coderunner
 * @copyright  Richard Lobb, 2011, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();


require_once($CFG->dirroot . '/question/behaviour/adaptive/behaviour.php');
require_once($CFG->dirroot . '/question/engine/questionattemptstep.php');
require_once($CFG->dirroot . '/question/behaviour/adaptive_adapted_for_coderunner/behaviour.php');
require_once($CFG->dirroot . '/question/behaviour/deferredfeedback_graphchecker/behaviour.php');
require_once($CFG->dirroot . '/question/type/graphchecker/questiontype.php');

use qtype_graphchecker\constants;

/**
 * Represents a 'CodeRunner' question.
 */
class qtype_graphchecker_question extends question_graded_automatically {

    public $testcases = null; // Array of testcases.

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

        if ($preferredbehaviour === "deferredfeedback") {
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
        return '';
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
        // Return the sample answer, if supplied.
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
            $checks = $this->get_checks();
            $runner = new qtype_graphchecker_jobrunner();
            $testoutcome = $runner->run_checks($this, $answer, $checks, $isprecheck);
            $testoutcomeserial = serialize($testoutcome);
        }

        $datatocache = array('_testoutcome' => $testoutcomeserial);
        if ($testoutcome->run_failed()) {
            return array(0, question_state::$invalid, $datatocache);
        } else if ($testoutcome->all_correct()) {
             return array(1, question_state::$gradedright, $datatocache);
        } else {
            return array(0, question_state::$gradedwrong, $datatocache);
        }
    }


    // Returns all checks that we need to run.
    protected function get_checks() {
        $checks = json_decode($this->checks, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new coding_exception('Invalid JSON string for tests');
        }

        foreach ($checks as $index => $check) {
            $checks[$index] = new qtype_graphchecker_check($check);
        }

        return $checks;
    }


    public static function get_ui_params_for_type($type) {
        global $CFG;
        $json = file_get_contents($CFG->dirroot . '/question/type/graphchecker/checks/types.json');
        $types = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON types file");
        }
        $params = $types[$type]["ui_params"];
        return $params;
    }

    /**
     * Returns a JSON string to be handed to the UI plugin, corresponding to
     * the answer type of this question.
     */
    public function get_ui_params() {
        $params = qtype_graphchecker_question::get_ui_params_for_type($this->answertype);

        if ($this->vertex_highlight) {
            $params['highlight_vertices'] = true;
        }
        if ($this->edge_highlight) {
            $params['highlight_edges'] = true;
        }

        return json_encode($params);
    }



    /* ================================================================
     * Interface methods for use by jobrunner.
       ================================================================*/

    // Return an instance of the sandbox to be used to run code for this question.
    public function get_sandbox() {
        global $CFG;
        $sandboxinstance = qtype_graphchecker_sandbox::get_best_sandbox('python3');
        if ($sandboxinstance === null) {
            throw new qtype_graphchecker_exception("Language {$this->language} is not available on this system");
        }

        return $sandboxinstance;
    }
}
