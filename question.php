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
     * For CodeRunner questions we pre-process the template parameters for any
     * randomisation required, storing the processed template parameters in
     * the question_attempt_step.
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
            $step->set_qt_var('_STUDENT', serialize($user));
        }

        $seed = mt_rand();
        if ($step !== null) {
            $step->set_qt_var('_mtrandseed', $seed);
        }
        $this->setup_template_params($seed);
        $this->twig_all();
    }

    // Retrieve the saved random number seed and reconstruct the template
    // parameters to the state they were left after start_attempt was called.
    // Also twig expand the rest of the question fields.
    public function apply_attempt_state(question_attempt_step $step) {
        parent::apply_attempt_state($step);
        $this->student = unserialize($step->get_qt_var('_STUDENT'));
        $seed = $step->get_qt_var('_mtrandseed');
        if ($seed === null) {
            // Rendering a question that was begun before randomisation
            // was introduced into the code.
            $seed = mt_rand();
        }
        $this->setup_template_params($seed);
        $this->twig_all();
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
        // Regardless of the preferred behaviour, always use an adaptive
        // behaviour.
        return  new qbehaviour_adaptive_adapted_for_coderunner($qa, $preferredbehaviour);
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


    public function validate_response(array $response) {
        // Check the response and return a validation error message if it's
        // faulty or an empty string otherwise.

        $hasanswer = array_key_exists('answer', $response);
        if (!$hasanswer || strlen($response['answer']) == 0) {
            return get_string('answerrequired', 'qtype_graphchecker');
        } else if (strlen($response['answer']) < constants::FUNC_MIN_LENGTH) {
            return get_string('answertooshort', 'qtype_graphchecker', constants::FUNC_MIN_LENGTH);
        }
        return '';  // All good.
    }


    public function is_gradable_response(array $response) {
        return $this->validate_response($response) == '';
    }


    public function is_complete_response(array $response) {
        return $this->is_gradable_response($response);
    }


    /**
     * In situations where is_gradable_response() returns false, this method
     * should generate a description of what the problem is.
     * @return string the message.
     */
    public function get_validation_error(array $response) {
        $error = $this->validate_response($response);
        if ($error) {
            return $error;
        } else {
            return get_string('unknownerror', 'qtype_graphchecker');
        }
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
                        $prevresponse, $newresponse, 'answer') &&
                question_utils::arrays_same_at_key_missing_is_blank(
                        $prevresponse, $newresponse, 'language');
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


    public function check_file_access($qa, $options, $component, $filearea, $args, $forcedownload) {
        if ($component == 'question' && $filearea == 'response_attachments') {
            // Response attachments visible if the question has them.
            return $this->attachments != 0;
        } else {
            return parent::check_file_access($qa, $options, $component,
                    $filearea, $args, $forcedownload);
        }
    }


    /** Return a setting that determines whether or not the specific
     *  feedback display is controlled by the quiz settings or this particular
     *  question.
     * @return bool FEEDBACK_USE_QUIZ, FEEDBACK_SHOW or FEEDBACK_HIDE from constants class.
     */
    public function display_feedback() {
        return isset($this->displayfeedback) ? intval($this->displayfeedback) : constants::FEEDBACK_USE_QUIZ;
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
            $answer = $response['answer'];
            $tests = $this->get_tests();
            $runner = new qtype_graphchecker_jobrunner();
            $testoutcome = $runner->run_tests($this, $answer, $tests, $isprecheck);
            $testoutcomeserial = serialize($testoutcome);
        }

        $datatocache = array('_testoutcome' => $testoutcomeserial);
        if ($testoutcome->run_failed()) {
            return array(0, question_state::$invalid, $datatocache);
        } else if ($testoutcome->all_correct()) {
             return array(1, question_state::$gradedright, $datatocache);
        /*} else if ($this->allornothing &&
                !($this->grader === 'TemplateGrader' && $this->iscombinatortemplate)) {
            return array(0, question_state::$gradedwrong, $datatocache);
        } else {
            // Allow partial marks if not allornothing or if it's a combinator template grader.
            return array($testoutcome->mark_as_fraction(),
                    question_state::$gradedpartial, $datatocache);
        }*/
        } else {
            return array(0, question_state::$gradedwrong, $datatocache);
        }
        // TODO [ws] I still need to look into this code to allow partial grades. The library code should be able to return a grade
    }


    // Twig expand all text fields of the question except the templateparam field
    // (which should have been expanded when the question was started) and
    // the template itself.
    // Done only if randomisation is specified within the template params.
    private function twig_all() {
        // Before twig expanding all fields, copy the template parameters
        // into $this->parameters.
        if (!empty($this->templateparams)) {
            $this->parameters = json_decode($this->templateparams);
        } else {
            $this->parameters = array();
        }

        // Twig expand everything in a context that includes the template
        // parameters and the STUDENT and QUESTION objects.
        $this->questiontext = $this->twig_expand($this->questiontext);
        $this->generalfeedback = $this->twig_expand($this->generalfeedback);
        $this->answer = $this->twig_expand($this->answer);
        $this->answerpreload = $this->twig_expand($this->answerpreload);
        $this->globalextra = $this->twig_expand($this->globalextra);
        /* TODO twig test cases??
        foreach ($this->testcases as $key => $test) {
            foreach (['testcode', 'stdin', 'expected', 'extra'] as $field) {
                $text = $this->testcases[$key]->$field;
                $this->testcases[$key]->$field = $this->twig_expand($text);
            }
        }*/
    }

    /**
     * Return Twig-expanded version of the given text. The
     * Twig environment includes the question itself (this) and the template
     * parameters. Additional twig environment parameters are passed in via
     * $twigparams. Template parameters are hoisted if required.
     * @param string $text Text to be twig expanded.
     * @param associative array $twigparams Extra twig environment parameters
     */
    public function twig_expand($text, $twigparams=array()) {
        if (empty(trim($text))) {
            return $text;
        } else {
            $twigparams['QUESTION'] = $this;
            // hoist template parameters
            foreach ($this->parameters as $key => $value) {
                $twigparams[$key] = $value;
            }
            return qtype_graphchecker_twig::render($text, $twigparams);
        }
    }

    /**
     * Define the template parameters for this question by Twig-expanding
     * both our own template params and our prototype template params and
     * merging the two.
     * @param type $seed The random number seed to set for Twig randomisation
     */
    private function setup_template_params($seed) {
        mt_srand($seed);
        if (!isset($this->templateparams)) {
            $this->templateparams = '';
        }
        $ournewtemplateparams = qtype_graphchecker_twig::render($this->templateparams);
        if (isset($this->prototypetemplateparams)) {
            $prototypenewtemplateparams = qtype_graphchecker_twig::render($this->prototypetemplateparams);
            $this->templateparams = qtype_graphchecker_util::merge_json($prototypenewtemplateparams, $ournewtemplateparams);
        } else {
            // Missing prototype?
            $this->templateparams = $ournewtemplateparams;
        }
    }


    // Returns all tests that we need to run.
    protected function get_tests() {
        $tests = json_decode($this->tests, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new coding_exception('Invalid JSON string for tests');
        }

        foreach ($tests as $index => $test) {
            $tests[$index] = new qtype_graphchecker_test($test);
        }

        return $tests;
    }


    // Return the appropriate subset of questions in the case that the question
    // precheck setting is "selected", given whether or not this is a precheckrun.
    protected function selected_testcases($isprecheckrun) {
        $testcases = array();
        foreach ($this->testcases as $testcase) {
            if (($isprecheckrun && $testcase->testtype != constants::TESTTYPE_NORMAL) ||
                (!$isprecheckrun && $testcase->testtype != constants::TESTTYPE_PRECHECK)) {
                $testcases[] = $testcase;
            }
        }
        return $testcases;
    }


    // Return an empty testcase - an artifical testcase with all fields
    // empty or zero except for a mark of 1.
    private function empty_testcase() {
        return (object) array(
            'testtype' => 0,
            'testcode' => '',
            'stdin'    => '',
            'expected' => '',
            'extra'    => '',
            'display'  => 'HIDE',
            'useasexample' => 0,
            'hiderestiffail' => 0,
            'mark'     => 1
        );
    }


    /**
     * Returns a JSON string to be handed to the UI plugin, corresponding to
     * the answer type of this question.
     */
    public static function get_ui_params($type) {
        global $CFG;
        $json = file_get_contents($CFG->dirroot . '/question/type/graphchecker/checks/types.json');
        $types = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON types file");
        }

        return json_encode($types[$type]["ui_params"]);
    }



    /* ================================================================
     * Interface methods for use by jobrunner.
       ================================================================*/

    // Return the template.
    public function get_template() {
        return $this->template;
    }


    // Return the programming language used to run the code.
    public function get_language() {
        return $this->language;
    }


    // Get the showsource boolean.
    public function get_show_source() {
        return $this->showsource;
    }


    // Return an instance of the sandbox to be used to run code for this question.
    public function get_sandbox() {
        global $CFG;
        $sandboxinstance = qtype_graphchecker_sandbox::get_best_sandbox('python3');
        if ($sandboxinstance === null) {
            throw new qtype_graphchecker_exception("Language {$this->language} is not available on this system");
        }

        return $sandboxinstance;
    }


    // Get the sandbox parameters for a run.
    public function get_sandbox_params() {
        if (isset($this->sandboxparams)) {
            $sandboxparams = json_decode($this->sandboxparams, true);
        } else {
            $sandboxparams = array();
        }

        if (isset($this->cputimelimitsecs)) {
            $sandboxparams['cputime'] = intval($this->cputimelimitsecs);
        }
        if (isset($this->memlimitmb)) {
            $sandboxparams['memorylimit'] = intval($this->memlimitmb);
        }
        if (isset($this->templateparams) && $this->templateparams != '') {
            $this->parameters = json_decode($this->templateparams);
        }
        return $sandboxparams;
    }
}
