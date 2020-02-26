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
/*
 * @package    qtype
 * @subpackage coderunner
 * @copyright  2016 Richard Lobb, University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();
require_once($CFG->dirroot . '/question/type/graphchecker/questiontype.php');

// The qtype_graphchecker_jobrunner class contains all code concerned with running a question
// in the sandbox and grading the result.
class qtype_graphchecker_jobrunner {
    private $sandbox = null;         // The sandbox we're using.
    private $code = null;            // The code we're running.
    private $files = null;           // The files to be loaded into the working dir.
    private $question = null;        // The question that we're running code for.
    private $tests = null;           // The tests (a subset of those in the question).
    private $allruns = null;         // Array of the source code for all runs.
    private $precheck = null;        // True if this is a precheck run.

    // Check the correctness of a student's code and possible extra attachments
    // as an answer to the given
    // question and and a given set of test cases (which may be empty or a
    // subset of the question's set of testcases. $isprecheck is true if
    // this is a run triggered by the student clicking the Precheck button.
    // $answerlanguage will be the empty string except for multilanguage questions,
    // when it is the language selected in the language drop-down menu.
    // Returns a TestingOutcome object.
    public function run_tests($question, $answer, $tests, $isprecheck) {
        global $CFG;

        $this->question = $question;
        $this->answer = $answer;
        $this->tests = $tests;

        $this->isprecheck = $isprecheck;
        $this->sandbox = $question->get_sandbox();

        $this->allruns = array();
        $this->templateparams = array(
            'STUDENT_ANSWER' => $answer,
            'IS_PRECHECK' => $isprecheck ? "1" : "0"
         );

        $outcome = $this->run_combinator($isprecheck);

        $this->sandbox->close();

        return $outcome;
    }

    private function run_combinator($isprecheck) {
        global $CFG;

        $numtests = count($this->tests);
        $this->templateparams['tests'] = $this->tests;
        $this->templateparams['checker_modules'] = $this->get_checker_modules();
        $outcome = new qtype_graphchecker_testing_outcome(1, $numtests, $isprecheck);
        $question = $this->question;

        $template = file_get_contents($CFG->dirroot . '/question/type/graphchecker/checks/' . $this->question->answertype . '/template.py.twig');

        try {
            $testprog = $question->twig_expand($template, $this->templateparams);
        } catch (Exception $e) {
            $outcome->set_status(
                    qtype_graphchecker_testing_outcome::STATUS_SYNTAX_ERROR,
                    get_string('templateerror', 'qtype_graphchecker') . ': ' . $e->getMessage());
            return $outcome;
        }

        $this->allruns[] = $testprog;
        $run = $this->sandbox->execute($testprog,
            "python3",  // language
            null,
            $this->get_checker_files(),  // files
            array());  // sandbox params

        // If it's a template grader, we pass the result to the
        // do_combinator_grading method. Otherwise we deal with syntax errors or
        // a successful result without accompanying stderr.
        // In all other cases (runtime error etc) we give up
        // on the combinator.

        if ($run->error !== qtype_graphchecker_sandbox::OK) {
            $outcome->set_status(
                    qtype_graphchecker_testing_outcome::STATUS_SANDBOX_ERROR,
                    qtype_graphchecker_sandbox::error_string($run));
        } else {
            $outcome = $this->do_combinator_grading($run, $isprecheck);
        }
        return $outcome;
    }


    private function get_checker_modules() {
        $modules = [];

        foreach ($this->tests as $test) {
            $module = $test->module;
            $modules[] = $module;
        }

        return array_unique($modules);
    }


    private function get_checker_files() {
        global $CFG;

        $filemap = [];

        foreach ($this->get_checker_modules() as $module) {
            $name = $module . '.py';
            $full_name = $CFG->dirroot . '/question/type/graphchecker/checks/' . $this->question->answertype . '/' . $name;
            $filemap[$name] = file_get_contents($full_name);  // TODO [ws] check for path traversal attacks!
        }

        return $filemap;
    }


    /**
     * Given the result of a sandbox run with the combinator template,
     * build and return a testingOutcome object with a status of
     * STATUS_COMBINATOR_TEMPLATE_GRADER and attributes of prelude and/or
     * and/or testresults and/or epiloguehtml.
     *
     * @param JSON $run The JSON-encoded output from the run.
     * @return \qtype_graphchecker_testing_outcome the outcome object ready
     * for display by the renderer. This will have an actualmark and zero or more of
     * prologuehtml, testresults and epiloguehtml. The last three are: some
     * html for display before the result table, the test results table (an
     * array of pseudo-test_result objects) and some html for display after
     * the result table.
     */
    private function do_combinator_grading($run, $isprecheck) {
        if ($run->result !== qtype_graphchecker_sandbox::RESULT_SUCCESS) {
            $error = get_string('brokentemplategrader', 'qtype_graphchecker',
                    array('output' => $run->cmpinfo . "\n" . $run->stderr));
            $outcome = new qtype_graphchecker_testing_outcome(qtype_graphchecker_testing_outcome::STATUS_BAD_COMBINATOR, [], $error);
            return $outcome;
        }

        $result = json_decode($run->output);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $error = get_string('badjsonorfraction', 'qtype_graphchecker',
                array('output' => $run->output));
            $outcome = new qtype_graphchecker_testing_outcome(qtype_graphchecker_testing_outcome::STATUS_BAD_COMBINATOR, [], $error);
            return $outcome;
        }

        return new qtype_graphchecker_testing_outcome(qtype_graphchecker_testing_outcome::STATUS_VALID, $result);
    }


    /* Return a $sep-separated string of the non-empty elements
       of the array $strings. Similar to implode except empty strings
       are ignored. */
    private function merge($sep, $strings) {
        $s = '';
        foreach ($strings as $el) {
            if (trim($el)) {
                if ($s !== '') {
                    $s .= $sep;
                }
                $s .= $el;
            }
        }
        return $s;
    }


    private function make_error_message($run) {
        $err = "***" . qtype_graphchecker_sandbox::result_string($run->result) . "***";
        if ($run->result === qtype_graphchecker_sandbox::RESULT_RUNTIME_ERROR) {
            $sig = $run->signal;
            if ($sig) {
                $err .= " (signal $sig)";
            }
        }
        return $this->merge("\n", array($run->cmpinfo, $run->output, $err, $run->stderr));
    }


    // Count the number of errors in the given array of test results.
    // TODO -- figure out how to eliminate either this one or the identical
    // version in renderer.php.
    private function count_errors($testresults) {
        $errors = 0;
        foreach ($testresults as $tr) {
            if (!$tr->iscorrect) {
                $errors++;
            }
        }
        return $errors;
    }
}
