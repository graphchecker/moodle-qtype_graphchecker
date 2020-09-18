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

/** Defines a testing_outcome class which contains the complete set of
 *  results from running all the tests on a particular submission.
 *
 * @package    qtype
 * @subpackage coderunner
 * @copyright  Richard Lobb, 2013, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
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
    public $testresults;             // An array of TestResult objects.

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
    public function __construct($status, $result=[], $errormessage='') {
        $this->status = $status;
        $this->testresults = $result;
        $this->errormessage = $errormessage;
        $this->errorcount = 0;
    }

    public function iscombinatorgrader() {
        return false;
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
            foreach ($this->testresults as $result) {
                if (!$result["correct"]) {
                    return 0;
                }
            }
            return 1;
        } else {
            return 0;
        }
    }

    public function all_correct() {
        return $this->mark_as_fraction() === 1;
    }

    // Return a message summarising the nature of the error if this outcome
    // is not all correct.
    public function validation_error_message() {
        if ($this->invalid()) {
            return html_writer::tag('pre', $this->errormessage);
        } else if ($this->run_failed()) {
            return get_string('run_failed', 'qtype_graphchecker');
        } else if ($this->combinator_error()) {
            return get_string('badquestion', 'qtype_graphchecker') . html_writer::tag('pre', $this->errormessage);
        } else if (!$this->iscombinatorgrader()) {  // Combinator grader results table can't be used.
            $numerrors = 0;
            $failures = new html_table();
            $failures->attributes['class'] = 'graphchecker-test-results';
            $failures->head = array(get_string('testcolhdr', 'qtype_graphchecker'),
                get_string('expectedcolhdr', 'qtype_graphchecker'),
                get_string('gotcolhdr', 'qtype_graphchecker'));
            $failures->data = array();
            $failures->rowclasses = array();

            foreach ($this->testresults as $i => $testresult) {
                if (!$testresult->iscorrect) {
                    $numerrors += 1;
                    $rownum = isset($testresult->rownum) ? intval($testresult->rownum) : $i;
                    if (isset($testresult->expected) && isset($testresult->got)) {
                        $failures->data[] = array(
                            html_writer::link('#id_testcode_' . $rownum,
                                    get_string('testcase', 'qtype_graphchecker', $rownum + 1) .
                                        html_writer::empty_tag('br') . s($testresult->testcode)),
                            html_writer::link('#id_expected_' . $rownum, html_writer::tag('pre', s($testresult->expected),
                                    array('id' => 'id_fail_expected_' . $rownum))),
                            html_writer::tag('pre', s($testresult->got), array('id' => 'id_got_' . $rownum)) .
                                html_writer::tag('button', '&lt;&lt;', array(
                                    'type' => 'button',  // To suppress form submission.
                                    'class' => 'replaceexpectedwithgot')),
                        );
                        $failures->rowclasses[] = 'graphchecker-failed-test failrow_' . $rownum;
                    }
                }
            }
            $message = get_string('failedntests', 'qtype_graphchecker', array(
                'numerrors' => $numerrors));
            if ($failures->data) {
                $message .= html_writer::table($failures) . get_string('replaceexpectedwithgot', 'qtype_graphchecker');
            } else {
                $message .= get_string('failedtesting', 'qtype_graphchecker');
            }
        } else {
            $message = get_string('failedtesting', 'qtype_graphchecker');
        }
        return $message . html_writer::empty_tag('br') . get_string('howtogetmore', 'qtype_graphchecker');
    }

    /**
     *
     * @global type $COURSE
     * @param qtype_graphchecker $question
     * @return a table of test results.
     * The test result table is an array of table rows (each an array).
     * The first row is a header row, containing strings like 'Test', 'Expected',
     * 'Got' etc. Other rows are the values of those items for the different
     * tests that were run.
     * There are two special case columns. If the header is 'iscorrect', the
     * value in the row should be 0 or 1. The header of this column is left blank
     * and the row contents are replaced by a tick or a cross. There can be
     * multiple iscorrect columns. If the header is
     * 'ishidden', the column is not displayed but instead the row itself is
     * hidden from view unless the user has the grade:viewhidden capability.
     *
     * The set of columns to be displayed is specified by the question's
     * resultcolumns variable (which should be accessed via its result_columns
     * method). The resultcolumns attribute is a JSON-encoded list of column specifiers.
     * A column specifier is itself a list, usually with 2 or 3 elements.
     * The first element is the column header the second is (usually) the test
     * result object field name whose value is to be displayed in the column
     * and the third (optional) element is the sprintf format used to display
     * the field. It is also possible to combine more than one field of the
     * test result object into a single field by adding extra field names into
     * the column specifier before the format, which is then mandatory.
     * For example, to display the mark awarded for a test case as, say
     * '0.71 out of 1.00' the column specifier would be
     * ["Mark", "awarded", "mark", "%.2f out of %.2f"] A special case format
     * specifier is '%h' denoting that the result object field value should be
     * treated as ready-to-output html. Empty columns are suppressed.
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

        // load module JSON
        $name = $module . '.json';
        $full_name = $CFG->dirroot . '/question/type/graphchecker/checks/' . $answertype . '/' . $name;
        $module_json = file_get_contents($full_name);  // TODO [ws] check for path traversal attacks!
        $module_info = json_decode($module_json, true);

        if (array_key_exists($method, $module_info['checks'])) {
            return $module_info['checks'][$method]['name'];
        }

        return $module . '.' . $method . '()';
    }


    // Count the number of errors in hidden testcases, given the array of
    // testresults.
    public function count_hidden_errors() {
        $count = 0;
        $hidingrest = false;
        foreach ($this->testresults as $tr) {
            if ($hidingrest) {
                $isdisplayed = false;
            } else {
                $isdisplayed = $this->should_display_result($tr);
            }
            if (!$isdisplayed && !$tr->iscorrect) {
                $count++;
            }
            if ($tr->hiderestiffail && !$tr->iscorrect) {
                $hidingrest = true;
            }
        }
        return $count;
    }


    // True iff the given test result should be displayed.
    protected static function should_display_result($testresult) {
        return !isset($testresult->display) ||  // E.g. broken combinator template?
             $testresult->display == 'SHOW' ||
            ($testresult->display == 'HIDE_IF_FAIL' && $testresult->iscorrect) ||
            ($testresult->display == 'HIDE_IF_SUCCEED' && !$testresult->iscorrect);
    }


    // Support function to count how many objects in the given list of objects
    // have the given 'field' attribute non-blank. Non-existent fields are also
    // included in order to generate a column showing the error, but null values.
    protected static function count_non_blanks($field, $objects) {
        $n = 0;
        foreach ($objects as $obj) {
            if (!property_exists($obj, $field) ||
                (!is_null($obj->$field) && !is_string($obj->$field)) ||
                (is_string($obj->$field) && trim($obj->$field !== ''))) {
                $n++;
            }
        }
        return $n;
    }


    /**
     * Make an HTML table describing a single failing test case
     * @param string $expected the expected output from the test
     * @param string $got the actual output from the test
     */
    protected static function make_error_html($expected, $got) {
        $table = new html_table();
        $table->attributes['class'] = 'graphchecker-test-results';
        $table->head = array(get_string('expectedcolhdr', 'qtype_graphchecker'),
                             get_string('gotcolhdr', 'qtype_graphchecker'));
        $table->data = array(array(html_writer::tag('pre', s($expected)), html_writer::tag('pre', s($got))));
        return html_writer::table($table);
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

    // Called only in case of precheck == 1, and no errors.
    public function get_raw_output() {
        assert(count($this->testresults) === 1);
        $testresult = $this->testresults[0];
        assert(empty($testresult->stderr));
        return $testresult->got;
    }

    public function get_prologue() {
        return '';
    }

    public function get_epilogue() {
        return '';
    }

    public function get_sourcecode_list() {
        return $this->sourcecodelist;
    }

    public function get_error_count() {
        return $this->errorcount;
    }

    // TODO TODO [ws] stub!
    public function was_aborted() {
        return false;
    }
}
