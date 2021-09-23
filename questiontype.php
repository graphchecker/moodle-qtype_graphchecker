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

defined('MOODLE_INTERNAL') || die();

/*
 * GraphChecker's question definition class.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/engine/bank.php');
require_once($CFG->dirroot . '/lib/questionlib.php');

/**
 * GraphChecker's question type class. This includes the specific fields
 * needed for GraphChecker questions (answer type, preload, feedback answer,
 * etc.)
 */
class qtype_graphchecker extends question_type {

    public function can_analyse_responses() {
        return false;
    }


    public function extra_question_fields() {
        return array('question_graphchecker_opts',
            'answertype',
            'answerpreload',
            'answer',
            'validateonsave',
            'checks',
            'allowed_vertex_edits',
            'allowed_edge_edits',
            'vertex_highlight',
            'edge_highlight',
            'vertex_labels',
            'edge_labels',
            'lock_preload',
            'vertex_attr_labels',
            'edge_attr_labels',
            'vertex_attr_colors',
            'edge_attr_colors'
        );
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

        return true;
    }


    // Load the question options (all the question extension fields and
    // testcases) from the database into the question.
    // The various fields are initialised from the prototype, then overridden
    // by any non-null values in the specific question.
    //
    // As a special case, required by edit_graphchecker_form, an option
    // 'mergedtemplateparams' is set by merging the prototype question's
    // template parameters with the given question's template parameters,
    // with the caveat that template parameters with embedded twig code that
    // aren't valid JSON are ignored.
    public function get_question_options($question) {
        global $CFG, $DB, $OUTPUT;
        parent::get_question_options($question);
        $options =& $question->options;
        $qtype = $options->answertype;
        $context = $this->question_context($question);

        return true;
    }

    /**
     * Get the context for a question.
     *
     * @param stdClass $question a row from either the question or question_graphchecker_opts tables.
     * @return context the corresponding context id.
     */
    public static function question_context($question) {
        return context::instance_by_id(self::question_contextid($question));
    }

    /**
     * Get the context id for a question.
     *
     * @param stdClass $question a row from either the question or question_graphchecker_opts tables.
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
            0 => get_string('attachmentsoptional', 'qtype_graphchecker'),
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

    /*
     * Imports question from the Moodle XML format.
     *
     * Overridden because we need to avoid the superclass code that tries to
     * read answers (we have only one feedback answer and it is an extra question
     * field).
     */
    public function import_from_xml($data, $question, qformat_xml $format, $extra=null) {
        $question_type = $data['@']['type'];
        if ($question_type != $this->name()) {
            return false;
        }

        $extraquestionfields = $this->extra_question_fields();
        if (!is_array($extraquestionfields)) {
            return false;
        }

        // Omit table name.
        array_shift($extraquestionfields);
        $qo = $format->import_headers($data);
        $qo->qtype = $question_type;

        foreach ($extraquestionfields as $field) {
            $qo->$field = $format->getpath($data, array('#', $field, 0, '#'), '');
        }

        return $qo;
    }
}

