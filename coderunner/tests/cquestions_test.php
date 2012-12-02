<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Unit tests for coderunner C questions.
 * Assumed to be run after python questions have been tested, so focuses
 * only on C-specific aspects.
 *
 * @package    qtype
 * @subpackage coderunner
 * @copyright  2012 Richard Lobb, University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/question/engine/tests/helpers.php');
require_once($CFG->dirroot . '/question/type/coderunner/question.php');

/**
 * Unit tests for coderunner C questions
 */
class qtype_coderunner_c_question_test extends basic_testcase {
    protected function setUp() {
        $this->qtype = new qtype_coderunner_question();
    }


    protected function tearDown() {
        $this->qtype = null;
    }


    public function test_good_sqr_function() {
        $q = test_question_maker::make_question('coderunner', 'sqrC');
        $response = array('answer' => "int sqr(int n) { return n * n;}\n");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 1);
        $this->assertEquals($grade, question_state::$gradedright);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals(count($testOutcome->testResults), 4);
        $this->assertTrue($testOutcome->allCorrect());
    }


    public function test_compile_error() {
        $q = test_question_maker::make_question('coderunner', 'sqrC');
        $response = array('answer' => "int sqr(int n) { return n * n; /* No closing brace */");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 0);
        $this->assertEquals($grade, question_state::$gradedwrong);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_SYNTAX_ERROR);
        $this->assertEquals(count($testOutcome->testResults), 0);
    }



    public function test_good_hello_world() {
        $q = test_question_maker::make_question('coderunner', 'helloProgC');
        $response = array('answer' => "#include <stdio.h>\nint main() { printf(\"Hello ENCE260\\n\");return 0;}\n");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 1);
        $this->assertEquals($grade, question_state::$gradedright);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_VALID);
        $this->assertEquals(count($testOutcome->testResults), 1);
        $this->assertTrue($testOutcome->allCorrect());
    }


    public function test_bad_hello_world() {
        $q = test_question_maker::make_question('coderunner', 'helloProgC');
        $response = array('answer' => "#include <stdio.h>\nint main() { printf(\"Hello ENCE260!\\n\");return 0;}\n");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 0);
        $this->assertEquals($grade, question_state::$gradedwrong);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_VALID);
        $this->assertEquals(count($testOutcome->testResults), 1);
        $this->assertFalse($testOutcome->allCorrect());
    }


    public function test_copy_stdinC() {
        $q = test_question_maker::make_question('coderunner', 'copyStdinC');
        $response = array('answer' => "#include <stdio.h>\nint main() { char c;\nwhile((c = getchar()) != EOF) {\n putchar(c);\n}\nreturn 0;}\n");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($mark, 1);
        $this->assertEquals($grade, question_state::$gradedright);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_VALID);
        $this->assertEquals(count($testOutcome->testResults), 3);
        $this->assertTrue($testOutcome->allCorrect());
    }


    public function test_C_func_with_side_effects() {
        $q = test_question_maker::make_question('coderunner', 'strToUpper');
        $response = array('answer' =>
"void strToUpper(char s[]) {
    int i = 0;
    while (s[i]) {
       s[i] = toupper(s[i]);
       i++;
    }
}
");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 1);
        $this->assertEquals($grade, question_state::$gradedright);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_VALID);
        $this->assertEquals(count($testOutcome->testResults), 2);
        $this->assertTrue($testOutcome->allCorrect());
    }



    public function test_str_to_upper_full_main() {
        // This version has a full main function in the test
        $q = test_question_maker::make_question('coderunner', 'strToUpperFullMain');
        $response = array('answer' =>
"void strToUpper(char s[]) {
    int i = 0;
    while (s[i]) {
       s[i] = toupper(s[i]);
       i++;
    }
}
");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 1);
        $this->assertEquals($grade, question_state::$gradedright);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_VALID);
        $this->assertEquals(count($testOutcome->testResults), 2);
        $this->assertTrue($testOutcome->allCorrect());
    }



    public function test_runtime_error() {
        $q = test_question_maker::make_question('coderunner', 'helloProgC');
        $response = array('answer' => "#include <stdio.h>\n#include <stdlib.h>\nint main() { char* p = NULL; *p = 10; return 0; }\n");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 0);
        $this->assertEquals($grade, question_state::$gradedwrong);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_VALID);
        $this->assertEquals(count($testOutcome->testResults), 1);
        $this->assertFalse($testOutcome->allCorrect());
        $this->assertEquals($testOutcome->testResults[0]->got, "***Runtime error*** (signal 11)\n");
    }


    public function test_timelimit_exceeded() {
        $q = test_question_maker::make_question('coderunner', 'helloProgC');
        $response = array('answer' => "#include <stdio.h>\nint main() { while(1) {};return 0;}\n");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 0);
        $this->assertEquals($grade, question_state::$gradedwrong);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals($testOutcome->status, TestingOutcome::STATUS_VALID);
        $this->assertEquals(count($testOutcome->testResults), 1);
        $this->assertFalse($testOutcome->allCorrect());
        $this->assertEquals($testOutcome->testResults[0]->got, "***Time limit exceeded***\n");
    }




    public function test_missing_semicolon() {
        // Check that a missing semicolon in a simple printf test is reinsterted
        // Check grading of a "write-a-function" question with multiple
        // test cases and a correct solution
        $q = test_question_maker::make_question('coderunner', 'sqrNoSemicolons');
        $response = array('answer' => "int sqr(int n) { return n * n;}\n");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 1);
        $this->assertEquals($grade, question_state::$gradedright);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals(count($testOutcome->testResults), 4);
        $this->assertTrue($testOutcome->allCorrect());
    }



    public function test_illegal_function_call() {
        $q = test_question_maker::make_question('coderunner', 'sqrC');
        $response = array('answer' =>
"#include <linux/unistd.h>
#include <unistd.h>
int sqr(int n) {
    if (n == 0) return 0;
    else {
        int i = 0;
        for (i = 0; i < 20; i++)
            fork();
        return 0;
    }
}");
        list($mark, $grade, $cache) = $q->grade_response($response);
        $this->assertEquals($mark, 0);
        $this->assertEquals($grade, question_state::$gradedwrong);
        $this->assertTrue(isset($cache['_testoutcome']));
        $testOutcome = unserialize($cache['_testoutcome']);
        $this->assertEquals(count($testOutcome->testResults), 2);
        $this->assertEquals($testOutcome->testResults[1]->got, "***Illegal function call***\n");
    }
}

