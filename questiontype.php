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
//
// ***************
// coderunner
// ***************
//
// CODERUNNER QUESTION TYPE CLASS
// The class for programming code questions.
// A coderunner question consists of a specification for a piece of program
// code, which might be a function or a complete program or
// just a fragment of code.
// The student's response must be source code that defines
// the specified function. The student's code is executed by
// a set of test cases, all of which must pass for the question
// to be marked correct. The code execution takes place in an external
// sandbox.
// In a typical use case each coderunner question will have its
// own submit button and students will keep submitting until
// they pass all tests, so that their mark will be based on
// the number of submissions and the penalty per wrong
// submissions.  However, there is the capability to allow per-test-case
// part marks by turning off the "all-or-nothing" checkbox when authoring the
// question.

/**
 * @package     qtype
 * @subpackage  coderunner
 * @copyright   &copy; 2012, 2013, 2014 Richard Lobb
 * @author       Richard Lobb richard.lobb@canterbury.ac.nz
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/engine/bank.php');
require_once($CFG->dirroot . '/lib/questionlib.php');

/**
 * qtype_coderunner extends the base question_type to coderunner-specific functionality.
 */
class qtype_coderunner extends question_type {

    public function can_analyse_responses() {
        return false;
    }


    public function extra_question_fields() {
        return array('question_coderunner_options',
            'coderunnertype',  // answer type
            'precheck',
            'showsource',
            'answerpreload',
            'globalextra',
            'answer',
            'validateonsave',
            'templateparams',
            'attachments',
            'attachmentsrequired',
            'maxfilesize',
            'filenamesregex',
            'filenamesexplain',
            'displayfeedback',
            'tests'
        );
    }


    public function response_file_areas() {
        return array('attachments');
    }


    // Override save_question to record in $form if this is a new question or
    // not. Needed by save_question_options when saving prototypes.
    // Note that the $form parameter to save_question is passed through
    // to save_question_options as the $question parameter.
    public function save_question($question, $form) {
        $form->isnew = empty($question->id);
        return parent::save_question($question, $form);
    }


    // This override saves all the extra question data, including
    // the set of testcases and any datafiles to the database.
    public function save_question_options($question) {
        global $DB, $USER;

        // Tidy the form, handle inheritance from prototype.
        //$this->clean_question_form($question);

        parent::save_question_options($question);

        // TODO [ws] the following is unnecessary I think?
        // Lastly, save any datafiles (support files + sample answer files).
        if ($USER->id) {
            // The id check is a hack to deal with phpunit initialisation, when no user exists.
            foreach (array('datafiles' => 'datafile',
                'sampleanswerattachments' => 'samplefile') as $fileset => $filearea) {
                if (isset($question->$fileset)) {
                    file_save_draft_area_files($question->$fileset, $question->context->id,
                        'qtype_coderunner', $filearea, (int) $question->id, $this->fileoptions);
                }
            }
        }

        return true;
    }


    // TODO [ws] is this needed?
    /**
     * Move all the files belonging to this question from one context to another.
     * Override superclass implementation to handle the extra data files
     * we have in CodeRunner questions.
     * @param int $questionid the question being moved.
     * @param int $oldcontextid the context it is moving from.
     * @param int $newcontextid the context it is moving to.
     */
    public function move_files($questionid, $oldcontextid, $newcontextid) {
        parent::move_files($questionid, $oldcontextid, $newcontextid);
        $fs = get_file_storage();
        $fs->move_area_files_to_new_context($oldcontextid,
                $newcontextid, 'qtype_coderunner', 'datafile', $questionid);
    }


    // Load the question options (all the question extension fields and
    // testcases) from the database into the question.
    // The various fields are initialised from the prototype, then overridden
    // by any non-null values in the specific question.
    //
    // As a special case, required by edit_coderunner_form, an option
    // 'mergedtemplateparams' is set by merging the prototype question's
    // template parameters with the given question's template parameters,
    // with the caveat that template parameters with embedded twig code that
    // aren't valid JSON are ignored.
    public function get_question_options($question) {
        global $CFG, $DB, $OUTPUT;
        parent::get_question_options($question);
        $options =& $question->options;
        $qtype = $options->coderunnertype;
        $context = $this->question_context($question);
        $options->mergedtemplateparams = $options->templateparams;

        return true;
    }

    /**
     * Get the context for a question.
     *
     * @param stdClass $question a row from either the question or question_coderunner_options tables.
     * @return context the corresponding context id.
     */
    public static function question_context($question) {
        return context::instance_by_id(self::question_contextid($question));
    }

    /**
     * Get the context id for a question.
     *
     * @param stdClass $question a row from either the question or question_coderunner_options tables.
     * @return int the corresponding context id.
     */
    public static function question_contextid($question) {
        global $DB;

        if (isset($question->contextid)) {
            return $question->contextid;
        } else {
            $questionid = isset($question->questionid) ? $question->questionid : $question->id;
            $sql = "SELECT contextid FROM {question_categories}, {question}
                     WHERE {question}.id = ?
                       AND {question}.category = {question_categories}.id";
            return $DB->get_field_sql($sql, array($questionid), MUST_EXIST);
        }
    }


    /******************** EDIT FORM OPTIONS ************************/

    /**
     * @return array the choices that should be offered for the number of attachments.
     */
    public function attachment_options() {
        return array(
            0 => get_string('no'),
            1 => '1',
            2 => '2',
            3 => '3',
            -1 => get_string('unlimited'),
        );
    }

    /**
     * @return array the choices that should be offered for the number of required attachments.
     */
    public function attachments_required_options() {
        return array(
            0 => get_string('attachmentsoptional', 'qtype_coderunner'),
            1 => '1',
            2 => '2',
            3 => '3'
        );
    }

    /**
     * @return array the options for maximum file size
     */
    public function attachment_filesize_max() {
        return array(
            1024 => '1 kB',
            10240 => '10 kB',
            102400 => '100 kB',
            1048576 => '1 MB',
            10485760 => '10 MB',
            104857600 => '100 MB'
        );
    }


    /** Utility func: remove all '\r' chars from $s and also trim trailing newlines */
    private function filter_crs($s) {
        $s = str_replace("\r", "", $s);
        while (substr($s, strlen($s) - 1, 1) == '\n') {
            $s = substr($s, 0, strlen($s) - 1);
        }
        return $s;
    }
}

