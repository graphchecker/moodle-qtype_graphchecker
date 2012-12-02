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
//
///////////////////
/// coderunner ///
///////////////////
/// PROGCODE QUESTION TYPE CLASS //////////////////
// The class for programming code questions.
// A coderunner question consists of a specification for piece of program
// code, which might be a function or a complete program or (possibly in the
// future) a fragment of code.
// The student's response must be source code that defines
// the specified function. The student's code is executed by
// a set of test cases, all of which must pass for the question
// to be marked correct. The code execution takes place in an external
// sandbox.
// There are no part marks -- the question is marked 100% or
// zero. It is expected that each coderunner question will have its
// own submit button and students will keep submitting until
// they pass all tests, so that their mark will be based on
// the number of submissions and the penalty per wrong
// submissions.

/**
 * @package 	qtype
 * @subpackage 	coderunner
 * @copyright 	&copy; 2012 Richard Lobb
 * @author 	Richard Lobb richard.lobb@canterbury.ac.nz
 */

define('COMPUTE_STATS', false);

/**
 * qtype_coderunner extends the base question_type to coderunner-specific functionality.
 * A coderunner question requires an additional DB table
 * that contains the definitions for the testcases associated with a programming code
 * question. There are an arbitrary number of these, so they can't be handled
 * by adding columns to the standard question table.
 * Each subclass cas its own testcase database table.
 *
 * Note: the database tables were to be given names like question_coderunner_testcases
 * but names are limited to 28 chars! So quest_coderunner_.* was used instead.
 */
class qtype_coderunner extends question_type {

    /**
     * Whether this question type can perform a frequency analysis of student
     * responses.
     *
     * If this method returns true, you must implement the get_possible_responses
     * method, and the question_definition class must implement the
     * classify_response method.
     *
     * @return bool whether this report can analyse all the student reponses
     * for things like the quiz statistics report.
     */
    public function can_analyse_responses() {
        return FALSE;  // TODO Consider if this functionality should be enabled
    }

    /**
     * If your question type has a table that extends the question table, and
     * you want the base class to automatically save, backup and restore the extra fields,
     * override this method to return an array wherer the first element is the table name,
     * and the subsequent entries are the column names (apart from id and questionid).
     *
     * @return mixed array as above, or null to tell the base class to do nothing.
     */
    public function extra_question_fields() {
        return array('quest_coderunner_options', 'coderunner_type');
    }

    /**
     * If you use extra_question_fields, overload this function to return question id field name
     * in case you table use another name for this column.
     * [Don't really need this as we're returning the default value, but I pref
     * to be explicit.]
     */
    public function questionid_column_name() {
        return 'questionid';
    }

    /**
     * Abstract function implemented by each question type. It runs all the code
     * required to set up and save a question of any type for testing purposes.
     * Alternate DB table prefix may be used to facilitate data deletion.
     */
    public function generate_test($name, $courseid=null) {
        // Closer inspection shows that this method isn't actually implemented
        // by even the standard question types and wouldn't be called for any
        // non-standard ones even if implemented. I'm leaving the stub in, in
        // case it's ever needed, but have set it to throw and exception, and
        // I've removed the actual test code.
        throw new coding_exception('Unexpected call to generate_test. Read code for details.');
    }


// Function to copy testcases from form fields into question->testcases
    private function copy_testcases_from_form(&$question) {
        $testcases = array();
        $numTests = count($question->testcode);
        assert(count($question->output) == $numTests);
        for($i = 0; $i < $numTests; $i++) {
            $input = $this->filterCrs($question->testcode[$i]);
            $stdin = $this->filterCrs($question->stdin[$i]);
            $output = $this->filterCrs($question->output[$i]);
            if ($input == '' && $stdin == '' && $output == '') {
                continue;
            }
            $testcase = new stdClass;
            $testcase->questionid = isset($question->id) ? $question->id : 0;
            $testcase->testcode = $input;
            $testcase->stdin = $stdin;
            $testcase->output = $output;
            $testcase->useasexample = isset($question->useasexample[$i]);
            $testcase->display = $question->display[$i];
            $testcase->hiderestiffail = isset($question->hiderestiffail[$i]);
            $testcases[] = $testcase;
        }

        $question->testcases = $testcases;
    }

    // This override saves all the extra question data, including
    // the set of testcases to the database.
    // Note that the parameter isn't a question object, but the question form
    // (or a mock-up of it). See questiontypebase.php.
    // The parent implementation saves the data in the coderunner_options table.

    public function save_question_options($question) {
        global $DB;

        assert(isset($question->coderunner_type));

        parent::save_question_options($question);

        // TODO: Add code to handle CUSTOM types. Following is broken.
        /*
        $customType = 'CUSTOM_' . $question->id;
        if ($question->options->coderunner_type === $customType) {
            // Custom type: create or replace an existing type for this
            // question. Note that only the per-test-template is used on
            // custom types; for simplicity they aren't allowed to make use
            // of the combinator template.

            $DB->delete_records('quest_coderunner_types',
                    array('coderunner_type' => $customType));
            $DB->insert_record('quest_coderunner_types',
                    array('coderunner_type' => $customType,
                          'per_test_template' => $question->template,
                          'language' => $question->language,
                          'sandbox'  => $question->sandbox));
        }
        */

        $testcaseTable = "quest_coderunner_testcases";

        if (!isset($question->testcases)) {
            $this->copy_testcases_from_form($question);
        }

        if (!$oldtestcases = $DB->get_records($testcaseTable,
                array('questionid' => $question->id), 'id ASC')) {
            $oldtestcases = array();
        }


        foreach ($question->testcases as $tc) {
            if (($oldtestcase = array_shift($oldtestcases))) { // Existing testcase, so reuse it
                $tc->id = $oldtestcase->id;
                $DB->update_record($testcaseTable, $tc);
            } else {
                // A new testcase
                $tc->questionid = $question->id;
                $testcase->id = $DB->insert_record($testcaseTable, $tc);
            }
        }


        // delete old testcase records
        foreach ($oldtestcases as $otc) {
            $DB->delete_records($testcaseTable, array('id' => $otc->id));
        }


        return true;
    }

    // Load the question options (all the question extension fields and
    // testcases) from the database into the 'question' (which is actually a
    // coderunner question edit form).

    public function get_question_options($question) {
        global $CFG, $DB, $OUTPUT;

        parent::get_question_options($question);

        if (!$row = $DB->get_record('quest_coderunner_types',
                array('coderunner_type' => $question->options->coderunner_type))) {
            throw new coding_exception("Failed to load type info for question id {$question->id}");
        }
        $question->language = $row->language;
        $question->combinator_template = $row->combinator_template;
        $question->test_splitter_re = $row->test_splitter_re;
        $question->template = $row->per_test_template;
        $question->sandbox = $row->sandbox;
        $question->validator = $row->validator;

        if (!$question->testcases = $DB->get_records('quest_coderunner_testcases',
                array('questionid' => $question->id), 'id ASC')) {

            throw new coding_exception("Failed to load testcases for question id {$question->id}");
        }

        if (COMPUTE_STATS) {
            $question->stats = $this->get_question_stats($question->id);
        } else {
            $question->stats = null;
        }

        return true;
    }


    // The 'questiondata' here is actually (something like) a coderunner question
    // edit form, and we need to extend the baseclass method to copy the
    // testcases and stats across to the under-creation question definition.
    protected function initialise_question_instance(question_definition $question, $questiondata) {
        parent::initialise_question_instance($question, $questiondata);
        $question->testcases = $questiondata->testcases;
        $question->stats = $questiondata->stats;
        foreach ($questiondata->options as $option => $value) {
            $question->$option = $value;
        }

        $question->language = $questiondata->language;
        $question->combinator_template = $questiondata->combinator_template;
        $question->test_splitter_re = $questiondata->test_splitter_re;
        $question->template = $questiondata->template;
        $question->sandbox = $questiondata->sandbox;
        $question->validator = $questiondata->validator;
    }


    // Delete the testcases when this question is deleted.
    // Also tries deleting a corresponding custom type, which may or may not
    // exist.
    public function delete_question($questionid, $contextid) {
        global $DB;

        $success = $DB->delete_records("quest_coderunner_testcases",
                array('questionid' => $questionid));
        $success = $success && $DB->delete_records('quest_coderunner_types',
                array('coderunner_type' => 'CUSTOM_' . $questionid));
        return $success && parent::delete_question($questionid, $contextid);
    }



    // Query the database to get the statistics of attempts and ratings for
    // a given question.
    private function get_question_stats($question_id) {
        // TODO: this query kills the DB server! If stats gathering is to
        // be turned on again it must be restructured, e.g. have the subquery
        // filter by attemptstepid rather than name, then select subset with
        // right name.
        global $DB;
        $attempts = $DB->get_records_sql("
            SELECT questionattemptid, fraction, rating, sequencenumber
            FROM mdl_question_attempts as qa,
                        mdl_question_attempt_steps as qas
            LEFT JOIN
                ( SELECT value as rating, attemptstepid
                  FROM  mdl_question_attempt_step_data
                  WHERE name = 'rating'
                ) as qasd
            ON qasd.attemptstepid = qas.id
            WHERE questionattemptid = qa.id

            AND questionid = ?
            AND qas.sequencenumber =
                ( SELECT max(mdl_question_attempt_steps.sequencenumber)
                  FROM mdl_question_attempt_steps
                  WHERE mdl_question_attempt_steps.questionattemptid = qa.id
                )",
            array($question_id));

        $num_attempts = 0;
        $num_successes = 0;
        $counts = array(0, 0, 0, 0);
        $num_steps = 0;
        foreach ($attempts as $attempt) {
            $rating = isset($attempt->rating) ? $attempt->rating : 0;
            $counts[$rating]++;
            if ($attempt->fraction > 0.0) {
                $num_successes++;
            }
            if ($attempt->sequencenumber > 0) {
                $num_attempts++;
                $num_steps += $attempt->sequencenumber;
            }
        }

        $success_percent = $num_attempts == 0 ? 0 : intval(100.0 * $num_successes / $num_attempts);
        $average_retries = $num_attempts == 0 ? 0 : $num_steps / $num_attempts;
        $stats = (object) array(
            'question_id' => $question_id,
            'attempts'    => $num_attempts,
            'success_percent' => $success_percent,
            'average_retries' => $average_retries,
            'likes'    => $counts[1],
            'neutrals' => $counts[2],
            'dislikes' => $counts[3]);
        return $stats;
    }


    // TODO Override the default submit button so can hook in javascript to prevent
    // multiple clicking while a submission is being marked.
//    function print_question_submit_buttons(&$question, &$state, $cmoptions, $options) {
//        if (($cmoptions->optionflags & QUESTION_ADAPTIVE) and !$options->readonly) {
//            echo '<input type="submit" name="', $question->name_prefix, 'submit" value="',
//            get_string('mark', 'quiz'), '" class="submit btn" onclick="submitClicked(event)" />';
//        }
//    }


/// IMPORT/EXPORT FUNCTIONS /////////////////

    /*
     * Imports question from the Moodle XML format
     *
     * Overrides default since coderunner questions contain a list of testcases,
     * not a list of answers.
     *
     */
    function import_from_xml($data, $question, qformat_xml $format, $extra=null) {

        if ($extra != null) {
            throw new coding_exception("coderunner:import_from_xml: unexpected 'extra' parameter");
        }

        $question_type = $data['@']['type'];
        if ($question_type != $this->name()) {
            return false;
        }

        $extraquestionfields = $this->extra_question_fields();
        if (!is_array($extraquestionfields)) {
            return false;
        }

        //omit table name
        array_shift($extraquestionfields);
        $qo = $format->import_headers($data);
        $qo->qtype = $question_type;

        foreach ($extraquestionfields as $field) {
            $qo->$field = $format->getpath($data, array('#', $field, 0, '#'), '');
        }

        if (!isset($qo->coderunner_type) || $qo->coderunner_type == '') {
            $qo->coderunner_type = 'python3_basic';
        }

        $testcases = $data['#']['testcases'][0]['#']['testcase'];

        $qo->testcases = array();

        foreach ($testcases as $testcase) {
            $tc = new stdClass;
            $tc->testcode = $testcase['#']['testcode'][0]['#']['text'][0]['#'];
            $tc->stdin = $testcase['#']['stdin'][0]['#']['text'][0]['#'];
            $tc->output = $testcase['#']['output'][0]['#']['text'][0]['#'];
            $tc->display = 'SHOW';
            if (isset($testcase['@']['hidden']) && $testcase['@']['hidden'] == "1") {
                $tc->display = 'HIDE';  // Handle old-style export too
            }
            if (isset($testcase['#']['display'])) {
                $tc->display = $testcase['#']['display'][0]['#']['text'][0]['#'];
            }
            if (isset($testcase['@']['hiderestiffail'] )) {
                $tc->hiderestiffail = $testcase['@']['hiderestiffail'] == "1" ? 1 : 0;
            }
            else {
                $tc->hiderestiffail = 0;
            }
            $tc->useasexample = $testcase['@']['useasexample'] == "1" ? 1 : 0;
            //debugging(print_r($tc->stdin, TRUE) . "length " . strlen($tc->stdin));
            $qo->testcases[] = $tc;
        }

        return $qo;
    }

    /*
     * Export question to the Moodle XML format
     *
     * We override the default method because we don't have 'answers' but
     * testcases.
     *
     */

    function export_to_xml($question, qformat_xml $format, $extra=null) {
        if ($extra !== null) {
            throw new coding_exception("coderunner:export_to_xml: Unexpected parameter");
        }

        $expout = parent::export_to_xml($question, $format, $extra);;

        $expout .= "    <testcases>\n";
        foreach ($question->testcases as $testcase) {
            $useasexample = $testcase->useasexample ? 1 : 0;
            $hiderestiffail = $testcase->hiderestiffail ? 1 : 0;
            $expout .= "      <testcase useasexample=\"$useasexample\" hiderestiffail=\"$hiderestiffail\">\n";
            foreach (array('testcode', 'stdin', 'output', 'display') as $field) {
                //$exportedValue = $format->xml_escape($testcase->$field);
                $exportedValue = $format->writetext($testcase->$field, 4);
                $expout .= "      <{$field}>{$exportedValue}</{$field}>\n";
            }
            $expout .= "    </testcase>\n";
        }
        $expout .= "    </testcases>\n";
        return $expout;
    }


    /** Utility func: remove all '\r' chars from $s and also trim trailing newlines */
    private function filterCrs($s) {
        $s = str_replace("\r", "", $s);
        while (substr($s, strlen($s) - 1, 1) == '\n') {
            $s = substr($s, 0, strlen($s) - 1);
        }
        return $s;
    }
}

