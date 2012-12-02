<?php
/** The BasicValidator class. Compares outputs from running all tests
 *  with expected outputs, returning 'true' on each test case only
 *  if the outputs are exactly equal to the expected results, after
 *  trailing white space has been removed from the expected and actual outputs.
 *  "Trailing white space" means all white space at the end of the strings
 *  plus all white space from the end of each line in the strings. It does
 *  not include blank lines within the strings or white space within the lines.
 */

/**
 * @package    qtype
 * @subpackage coderunner
 * @copyright  Richard Lobb, 2012, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('validatorbase.php');
class BasicValidator extends Validator {

    /** Called to validate the output generated by a student's code for
     *  a given testcase. Returns a single TestResult object.
     *  Should not be called if the execution failed (syntax error, exception
     *  etc).
     */
    function validate($output, $testCase) {
        $cleanedOutput = $this->clean($output);
        $cleanedExpected = $this->clean($testCase->output);
        return new TestResult(
                $cleanedOutput == $cleanedExpected,  // isCorrect
                $this->snip($cleanedExpected),
                $this->snip($cleanedOutput)
        );
    }
}