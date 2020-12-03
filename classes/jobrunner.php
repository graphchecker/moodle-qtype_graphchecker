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

/**
 * A sandbox that uses the Jobe server (http://github.com/trampgeek/jobe) to
 * run student submissions.
 *
 * This version doesn't do any authentication; it's assumed the server is
 * firewalled to accept connections only from Moodle.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
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
                0,
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


    /**
     * Returns a list of modules used by the checks.
     */
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


    /**
     * Returns an associative array of files that need to be sent to the
     * sandbox to run the given checks.
     */
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
                0, [], $error);
            return $outcome;
        }

        $result = json_decode($run->output, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $error = "Invalid JSON output from checks: " . $run->output;
            $outcome = new qtype_graphchecker_testing_outcome(
                qtype_graphchecker_testing_outcome::STATUS_BAD_COMBINATOR,
                0, [], $error);
            return $outcome;
        }

        if ($result["type"] === "preprocess_fail") {
            $outcome = new qtype_graphchecker_testing_outcome(
                qtype_graphchecker_testing_outcome::STATUS_PREPROCESSOR_ERROR,
                0, [], $result["feedback"]);
            return $outcome;
        }

        return new qtype_graphchecker_testing_outcome(
            qtype_graphchecker_testing_outcome::STATUS_VALID,
            $result["grade"], $result["results"]);
    }
}
