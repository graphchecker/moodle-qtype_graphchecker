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
 * Defines a testing_outcome class which contains the complete set of
 * results from running all the checks on a particular submission.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();
use qtype_graphchecker\constants;

class qtype_graphchecker_testing_outcome {
    const STATUS_VALID = 1;         // A full set of test results is returned.
    const STATUS_BAD_COMBINATOR = 3; // A combinator template yielded an invalid result.
    const STATUS_SANDBOX_ERROR = 4;  // The run failed altogether.
    const STATUS_UNSERIALIZE_FAILED = 6; // A serialised outcome can't be deserialised.
    const STATUS_PREPROCESSOR_ERROR = 7; // An error occurred while preprocessing the student's answer.

    const TOLERANCE = 0.00001;       // Allowable difference between actual and max marks for a correct outcome.

    public $status;                  // One of the STATUS_ constants above.
                                     // If this is not 1, subsequent fields may not be meaningful.
    public $errorcount;              // The number of failing test cases.
    public $errormessage;            // The error message to display if there are errors.
    public $testresults = [];        // An array of TestResult objects.
    public $grade;                   // Grade computed by the checker code.

    /**
     * Constructs a testing outcome.
     *
     * @param $status Constant indicating the status (see above).
     * @param $result (Only if $status === STATUS_VALID:) The test results,
     * as an array containing objects with the following keys:
     *  - package: the package the test was in;
     *  - method: the test method;
     *  - correct: boolean indicating whether the test passed;
     *  - feedback: (only if !correct) feedback string to present to the
     *    student.
     * @param $errormessage (Only if $status !== STATUS_VALID:)
     * Human-readable error message describing the problem.
     */
    public function __construct($status, $grade, $result=[], $errormessage='') {
        $this->status = $status;
        $this->grade = $grade;
        $this->testresults = $result;
        $this->errormessage = $errormessage;
        $this->errorcount = 0;
    }

    public function set_status($status, $errormessage='') {
        $this->status = $status;
        $this->errormessage = $errormessage;
    }

    public function run_failed() {
        return $this->status === self::STATUS_SANDBOX_ERROR;
    }

    public function invalid() {
        return $this->status === self::STATUS_UNSERIALIZE_FAILED;
    }

    public function combinator_error() {
        return $this->status === self::STATUS_BAD_COMBINATOR;
    }

    public function check_error() {
        if ($this->status === self::STATUS_VALID) {
            foreach ($this->testresults as $result) {
                if (array_key_exists('error', $result)) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    }

    public function preprocessor_error() {
        return $this->status === self::STATUS_PREPROCESSOR_ERROR;
    }

    public function is_ungradable() {
        return $this->run_failed() || $this->combinator_error() || $this->check_error();
    }

    public function mark_as_fraction() {
        if ($this->status === self::STATUS_VALID && !$this->check_error()) {
            return $this->grade;
        } else {
            return 0;
        }
    }

    /**
     * Return a concise error message for the validate-on-save function.
     */
    public function validation_error_message($question) {
        if ($this->invalid()) {
            return html_writer::tag('pre', $this->errormessage);
        } else if ($this->run_failed()) {
            return get_string('run_failed', 'qtype_graphchecker');
        } else if ($this->combinator_error()) {
            return get_string('badquestion', 'qtype_graphchecker') . html_writer::tag('pre', $this->errormessage);
        } else if ($this->preprocessor_error()) {
            return 'Sample answer failed a sanity check:' . html_writer::tag('p', $this->errormessage);
        }

        $message = 'Sample answer fails checks (' . $this->grade * 100 . '% of points awarded):<ul>';
        foreach ($this->testresults as $result) {
            if (!$result['correct']) {
                $checkName = $this->get_test_name($question->answertype, $result["module"], $result["method"]);
                $message .= '<li><b>' . $checkName . '</b>: ' . $result['feedback'];
            }
        }
        $message .= '</ul>';
        return $message;
    }

    /**
     * Build the table of test results.
     */
    public function build_results_table(qtype_graphchecker_question $question) {
        $table = array();
        $table[] = array('iscorrect', 'Test', 'Result');

        foreach ($this->testresults as $result) {
            $tablerow = array();
            if (array_key_exists('error', $result)) {
                $tablerow[] = 0;
            } else {
                $tablerow[] = $result["correct"] ? 1 : 0;
            }
            $tablerow[] = $this->get_test_name($question->answertype, $result["module"], $result["method"]);
            if (array_key_exists('feedback', $result)) {
                $tablerow[] = $result["feedback"];
            } elseif (array_key_exists('error', $result)) {
                $tablerow[] = "Error while checking:\n" . $result["error"];
            } elseif ($result["correct"]) {
                $tablerow[] = "Correct!";
            } else {
                $tablerow[] = "Incorrect!";
            }
            $table[] = $tablerow;
        }

        return $table;
    }

    public function get_test_name($answertype, $module, $method) {

        global $CFG;

        // avoid illegal answertype or module name values (avoids possible
        // path traversal attacks)
        if (!qtype_graphchecker_util::check_valid_name($answertype)) {
            throw new Exception('Illegal answertype');
        }
        if (!qtype_graphchecker_util::check_valid_name($module)) {
            throw new Exception('Illegal module name');
        }

        // load module JSON
        $name = $module . '.json';
        $full_name = $CFG->dirroot . '/question/type/graphchecker/checks/' . $answertype . '/' . $name;
        $module_json = file_get_contents($full_name);
        $module_info = json_decode($module_json, true);

        if (array_key_exists($method, $module_info['checks'])) {
            return $module_info['checks'][$method]['name'];
        }

        return $module . '.' . $method . '()';
    }

    /**
     *
     * @global type $COURSE the current course (if there is one)
     * @return boolean true iff the current user has permissions to view hidden rows
     */
    public static function can_view_hidden() {
        global $COURSE;

        if ($COURSE && $coursecontext = context_course::instance($COURSE->id)) {
            $canviewhidden = has_capability('moodle/grade:viewhidden', $coursecontext);
        } else {
            $canviewhidden = false;
        }

        return $canviewhidden;
    }


    // Getter methods for use by renderer.
    // ==================================.

    public function get_test_results(qtype_graphchecker_question $q) {
        return $this->build_results_table($q);
    }

    public function get_prologue() {
        return '';
    }

    public function get_epilogue() {
        return '';
    }

    // TODO TODO [ws] stub!
    public function was_aborted() {
        return false;
    }
}
