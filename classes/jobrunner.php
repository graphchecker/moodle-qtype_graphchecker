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

/**
 * The job runner is responsible for constructing the checker code, handing it
 * to the sandbox, and interpreting the result.
 */
class qtype_graphchecker_jobrunner {

    private $sandbox = null;

    /**
     * Runs a series of checks.
     *
     * @param $question The question we're running checks for.
     * @param $answer The student-submitted answer.
     * @param $checks JSON string describing the checks to run.
     */
    public function run_checks($question, $answer, $checks) {
        global $CFG;

        /*$this->question = $question;
        $this->answer = $answer;
        $this->checks = $checks;*/

        $this->sandbox = new qtype_graphchecker_jobesandbox();

        $code = $this->get_code($question, $answer, $checks);

        $run = $this->sandbox->execute($code,
            "python3",  // language
            null,  // stdin
            $this->get_checker_files($question, $checks),  // files
            []);  // sandbox params

        if ($run->error !== qtype_graphchecker_sandbox::OK) {
            $outcome = new qtype_graphchecker_testing_outcome(
                qtype_graphchecker_testing_outcome::STATUS_SANDBOX_ERROR,
                [],
                qtype_graphchecker_sandbox::error_string($run));
        } else {
            $outcome = $this->do_grading($run);
        }

        $this->sandbox->close();

        return $outcome;
    }


    private function get_code($question, $answer, $checks) {
        $code = "";

        $code .= "import checkrunner\n";
        $code .= "import json\n";

        foreach ($this->get_checker_modules($checks) as $module) {
            $code .= "import " . $module . "\n";
        }

        $code .= "answer_type = \"\"\"" . $this->py_escape($question->answertype) . "\"\"\"\n";
        $code .= "answer = \"\"\"" . $this->py_escape($answer) . "\"\"\"\n";
        $code .= "checks = \"\"\"" . $this->py_escape($checks) . "\"\"\"\n";

        $code .= "result = checkrunner.run(answer_type, answer, checks)\n";
        $code .= "print(json.dumps(result))";

        return $code;
    }


    /**
     * An escaper for use with Python triple-doublequote delimiters. Escapes only
     * double quote characters plus backslashes.
     * @param $s The string to convert
     */
    private function py_escape($s) {
        return str_replace('"', '\"', str_replace('\\', '\\\\', $s));
    }


    private function get_checker_modules($checks) {
        $modules = [];

        $checksArray = json_decode($checks, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new coding_exception('Invalid JSON string for tests');
        }

        foreach ($checksArray as $check) {
            // only look at type "check", not "grade"
            if (!array_key_exists("type", $check) ||
                    $check["type"] === "check") {
                $module = $check['module'];
                $modules[] = $module;
            }
        }

        $modules[] = 'preprocess';

        return array_unique($modules);
    }


    private function get_checker_files($question, $checks) {
        global $CFG;

        $filemap = [];

        foreach ($this->get_checker_modules($checks) as $module) {
            // Python file
            $name = $module . '.py';
            $full_name = $CFG->dirroot . '/question/type/graphchecker/checks/' . $question->answertype . '/' . $name;
            $filemap[$name] = file_get_contents($full_name);  // TODO [ws] check for path traversal attacks!

            // JSON file
            if ($module != 'preprocess') {
                $name = $module . '.json';
                $full_name = $CFG->dirroot . '/question/type/graphchecker/checks/' . $question->answertype . '/' . $name;
                $filemap[$name] = file_get_contents($full_name);
            }
        }

        // also add the checkrunner and types.json
        $full_name = $CFG->dirroot . '/question/type/graphchecker/checks/checkrunner.py';
        $filemap['checkrunner.py'] = file_get_contents($full_name);
        $full_name = $CFG->dirroot . '/question/type/graphchecker/checks/types.json';
        $filemap['types.json'] = file_get_contents($full_name);

        return $filemap;
    }


    private function do_grading($run) {
        if ($run->result !== qtype_graphchecker_sandbox::RESULT_SUCCESS) {
            $error = "Checks failed, output on stderr: " . $run->stderr;
            $outcome = new qtype_graphchecker_testing_outcome(
                qtype_graphchecker_testing_outcome::STATUS_BAD_COMBINATOR,
                [], $error);
            return $outcome;
        }

        $result = json_decode($run->output, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $error = "Invalid JSON output from checks: " . $run->output;
            $outcome = new qtype_graphchecker_testing_outcome(
                qtype_graphchecker_testing_outcome::STATUS_BAD_COMBINATOR,
                [], $error);
            return $outcome;
        }

        if ($result["type"] === "preprocess_fail") {
            $outcome = new qtype_graphchecker_testing_outcome(
                qtype_graphchecker_testing_outcome::STATUS_PREPROCESSOR_ERROR,
                [], $result["feedback"]);
            return $outcome;
        }

        return new qtype_graphchecker_testing_outcome(
            qtype_graphchecker_testing_outcome::STATUS_VALID,
            $result["results"]);
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
