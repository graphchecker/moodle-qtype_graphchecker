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

defined('MOODLE_INTERNAL') || die();

/*
 * Defines the editing form for the coderunner question type.
 *
 * @package 	questionbank
 * @subpackage 	questiontypes
 * @copyright 	&copy; 2013 Richard Lobb
 * @author 		Richard Lobb richard.lobb@canterbury.ac.nz
 * @license 	http://www.gnu.org/copyleft/gpl.html GNU Public License
 */

require_once($CFG->dirroot . '/question/type/coderunner/questiontype.php');
require_once($CFG->dirroot . '/question/type/coderunner/question.php');

use qtype_coderunner\constants;

/**
 * CodeRunner editing form definition.
 */
class qtype_coderunner_edit_form extends question_edit_form {

    const NUM_TESTCASES_START = 5;  // Num empty test cases with new questions.
    const NUM_TESTCASES_ADD = 3;    // Extra empty test cases to add.
    const DEFAULT_NUM_ROWS = 18;    // Answer box rows.
    const DEFAULT_NUM_COLS = 100;   // Answer box columns.
    const TEMPLATE_PARAM_ROWS = 5;  // The number of rows of the template parameter field.
    const RESULT_COLUMNS_SIZE = 80; // The size of the resultcolumns field.

    public function qtype() {
        return 'coderunner';
    }


    private static function author_edit_keys() {
        // A list of all the language strings required by authorform.js.
        return array('coderunner_question_type', 'confirm_proceed', 'template_changed',
            'info_unavailable', 'proceed_at_own_risk', 'error_loading_prototype',
            'ajax_error', 'prototype_load_failure', 'prototype_error',
            'question_type_changed');
    }

    // Define the CodeRunner question edit form.
    protected function definition() {
        global $PAGE;

        $mform = $this->_form;
        $this->mergedtemplateparams = '';
        $this->twiggedparams = '';
        if (!empty($this->question->options->mergedtemplateparams)) {
            $this->mergedtemplateparams = $this->question->options->mergedtemplateparams;
            try {
                $this->twiggedparams = qtype_coderunner_twig::render($this->mergedtemplateparams);
            } catch (Exception $ex) {
                // If the params are broken, don't use them.
                // Code checker won't accept an empty catch.
                $this->twiggedparams = '';
            }
        }
        if (!empty($this->question->options->language)) {
            $this->lang = $this->acelang = $this->question->options->language;
        } else {
            $this->lang = $this->acelang = '';
        }
        if (!empty($this->question->options->acelang)) {
            $this->acelang = $this->question->options->acelang;
        }
        $this->make_error_div($mform);
        qtype_coderunner_util::load_ace();

        $PAGE->requires->js_call_amd('qtype_coderunner/textareas', 'setupAllTAs');

        // Define the parameters required by the JS initEditForm amd module.
        $strings = array();
        foreach (self::author_edit_keys() as $key) {
            $strings[$key] = get_string($key, 'qtype_coderunner');
        }

        $PAGE->requires->js_call_amd('qtype_coderunner/authorform', 'initEditForm',
                array($strings));

        parent::definition($mform);  // The superclass adds the "General" stuff.
    }


    // Defines the bit of the CodeRunner question edit form after the "General"
    // section and before the footer stuff.
    public function definition_inner($mform) {
        $this->make_questiontype_panel($mform);

        $this->add_preload_answer_field($mform);
        $this->add_sample_answer_field($mform);
        $this->add_tests_field($mform);

        // Insert the attachment section to allow file uploads.
        $qtype = question_bank::get_qtype('coderunner');
        $mform->addElement('header', 'attachmentoptions', get_string('attachmentoptions', 'qtype_coderunner'));
        $mform->setExpanded('attachmentoptions', 0);

        $mform->addElement('select', 'attachments',
                get_string('allowattachments', 'qtype_coderunner'), $qtype->attachment_options());
        $mform->setDefault('attachments', 0);
        $mform->addHelpButton('attachments', 'allowattachments', 'qtype_coderunner');

        $mform->addElement('select', 'attachmentsrequired',
                get_string('attachmentsrequired', 'qtype_coderunner'), $qtype->attachments_required_options());
        $mform->setDefault('attachmentsrequired', 0);
        $mform->addHelpButton('attachmentsrequired', 'attachmentsrequired', 'qtype_coderunner');
        $mform->disabledIf('attachmentsrequired', 'attachments', 'eq', 0);

        $filenamecontrols = array();
        $filenamecontrols[] = $mform->createElement('text', 'filenamesregex',
                get_string('filenamesregex', 'qtype_coderunner'));
        $mform->disabledIf('filenamesregex', 'attachments', 'eq', 0);
        $mform->setType('filenamesregex', PARAM_RAW);
        $mform->setDefault('filenamesregex', '');
        $filenamecontrols[] = $mform->createElement('text', 'filenamesexplain',
                get_string('filenamesexplain', 'qtype_coderunner'));
        $mform->disabledIf('filenamesexplain', 'attachments', 'eq', 0);
        $mform->setType('filenamesexplain', PARAM_RAW);
        $mform->setDefault('filenamesexplain', '');
        $mform->addElement('group', 'filenamesgroup',
                get_string('allowedfilenames', 'qtype_coderunner'), $filenamecontrols, null, false);
        $mform->addHelpButton('filenamesgroup', 'allowedfilenames', 'qtype_coderunner');

        $mform->addElement('select', 'maxfilesize',
                get_string('maxfilesize', 'qtype_coderunner'), $qtype->attachment_filesize_max());
        $mform->addHelpButton('maxfilesize', 'maxfilesize', 'qtype_coderunner');
                $mform->setDefault('maxfilesize', '10240');
        $mform->disabledIf('maxfilesize', 'attachments', 'eq', 0);

        // Add the option to attach runtime support files, all of which are
        // copied into the working directory when the expanded template is
        // executed.The file context is that of the current course.
        $options = $this->fileoptions;
        $options['subdirs'] = false;
        $mform->addElement('header', 'fileheader',
                get_string('fileheader', 'qtype_coderunner'));
        $mform->addElement('filemanager', 'datafiles',
                get_string('datafiles', 'qtype_coderunner'), null,
                $options);
        $mform->addHelpButton('datafiles', 'datafiles', 'qtype_coderunner');
    }

    /**
     * Add a field for a sample answer to this problem (optional)
     * @param object $mform the form being built
     */
    protected function add_sample_answer_field($mform) {
        global $CFG;
        $mform->addElement('header', 'answerhdr',
                    get_string('answer', 'qtype_coderunner'), '');
        $mform->setExpanded('answerhdr', 1);
        $attributes = array(
            'rows' => 9,
            'class' => 'answer edit_code',
            'data-params' => $this->twiggedparams,
            'data-lang' => $this->acelang);
        $mform->addElement('textarea', 'answer',
                get_string('answer', 'qtype_coderunner'),
                $attributes);
        // Add a file attachment upload panel (disabled if attachments not allowed).
        $options = $this->fileoptions;
        $options['subdirs'] = false;
        $mform->addElement('filemanager', 'sampleanswerattachments',
                get_string('sampleanswerattachments', 'qtype_coderunner'), null,
                $options);
        $mform->addHelpButton('sampleanswerattachments', 'sampleanswerattachments', 'qtype_coderunner');
        // Unless behat is running, hide the attachments file picker.
        // behat barfs if it's hidden.
        if ($CFG->prefix !== "b_") {
            /* @var $mform MoodleQuickForm */
            $method = method_exists($mform, 'hideIf') ? 'hideIf' : 'disabledIf';
            $mform->$method('sampleanswerattachments', 'attachments', 'eq', 0);
        }
        $mform->addElement('advcheckbox', 'validateonsave', null,
                get_string('validateonsave', 'qtype_coderunner'));
        $mform->setDefault('validateonsave', false);
        $mform->addHelpButton('answer', 'answer', 'qtype_coderunner');
    }


    /**
     * Add a field for the test cases.
     * @param object $mform the form being built
     */
    protected function add_tests_field($mform) {
        global $CFG;
        $mform->addElement('header', 'testshdr',
                    get_string('tests', 'qtype_coderunner'), '');
        $mform->setExpanded('testshdr', 1);
        $mform->addElement('textarea', 'tests',
            get_string('tests', 'qtype_coderunner'),
            array(
                  'class' => 'edit_code'
            )
        );
        $mform->addHelpButton('tests', 'tests', 'qtype_coderunner');
    }

    /**
     * Add a field for a text to be preloaded into the answer box.
     * @param object $mform the form being built
     */
    protected function add_preload_answer_field($mform) {
        $mform->addElement('header', 'answerpreloadhdr',
                    get_string('answerpreload', 'qtype_coderunner'), '');
        $expanded = !empty($this->question->options->answerpreload);
        $mform->setExpanded('answerpreloadhdr', $expanded);
        $attributes = array(
            'rows' => 5,
            'class' => 'preloadanswer edit_code',
            'data-params' => $this->twiggedparams,
            'data-lang' => $this->acelang);
        $mform->addElement('textarea', 'answerpreload',
                get_string('answerpreload', 'qtype_coderunner'),
                $attributes);
        $mform->addHelpButton('answerpreload', 'answerpreload', 'qtype_coderunner');
    }


    // A list of the allowed values of the DB 'display' field for each testcase.
    protected function displayoptions() {
        return array('SHOW', 'HIDE', 'HIDE_IF_FAIL', 'HIDE_IF_SUCCEED');
    }


    public function data_preprocessing($question) {
        // Preprocess the question data to be loaded into the form. Called by set_data after
        // standard stuff all loaded.
        global $COURSE;

        $question->missingprototypemessage = ''; // The optimistic assumption
        if (isset($question->options->testcases)) { // Reloading a saved question?

            // Next flatten all the question->options down into the question itself.
            $question->testcode = array();
            $question->expected = array();
            $question->useasexample = array();
            $question->display = array();
            $question->extra = array();
            $question->hiderestifail = array();

            foreach ($question->options->testcases as $tc) {
                $question->testcode[] = $this->newline_hack($tc->testcode);
                $question->testtype[] = $tc->testtype;
                $question->stdin[] = $this->newline_hack($tc->stdin);
                $question->expected[] = $this->newline_hack($tc->expected);
                $question->extra[] = $this->newline_hack($tc->extra);
                $question->useasexample[] = $tc->useasexample;
                $question->display[] = $tc->display;
                $question->hiderestiffail[] = $tc->hiderestiffail;
                $question->mark[] = sprintf("%.3f", $tc->mark);
            }

            $question->courseid = $COURSE->id;

            // Load the type-name if this is a prototype, else make it blank.
            $question->typename = '';

            // Convert raw newline chars in testsplitterre into 2-char form
            // so they can be edited in a one-line entry field.
            if (isset($question->testsplitterre)) {
                $question->testsplitterre = str_replace("\n", '\n', $question->testsplitterre);
            }
        }

        foreach (array('datafiles' => 'datafile',
                'sampleanswerattachments' => 'samplefile') as $fileset => $filearea) {
            $draftid = file_get_submitted_draft_itemid($fileset);
            $options = $this->fileoptions;
            $options['subdirs'] = false;

            file_prepare_draft_area($draftid, $this->context->id,
                    'qtype_coderunner', $filearea,
                    empty($question->id) ? null : (int) $question->id,
                    $options);
            $question->$fileset = $draftid; // File manager needs this (and we need it when saving).
        }
        return $question;
    }


    // A horrible hack for a horrible browser "feature".
    // Inserts a newline at the start of a text string that's going to be
    // displayed at the start of a <textarea> element, because all browsers
    // strip a leading newline. If there's one there, we need to keep it, so
    // the extra one ensures we do. If there isn't one there, this one gets
    // ignored anyway.
    private function newline_hack($s) {
        return "\n" . $s;
    }


    public function validation($data, $files) {
        $errors = parent::validation($data, $files);
        if ($data['coderunnertype'] == 'Undefined') {
            $errors['coderunner_type_group'] = get_string('questiontype_required', 'qtype_coderunner');
        }

        if ($data['precheck'] == constants::PRECHECK_EXAMPLES && $this->num_examples($data) === 0) {
            $errors['coderunner_precheck_group'] = get_string('precheckingemptyset', 'qtype_coderunner');
        }

        $templatestatus = $this->validate_template_params($data);
        if ($templatestatus['error']) {
            $errors['templateparams'] = $templatestatus['error'];
        }

        if ($data['attachments']) {
            // Check a valid regular expression was given.
            // Use '=' as the PCRE delimiter.
            if (@preg_match('=^' . $data['filenamesregex'] . '$=', null) === false) {
                $errors['filenamesgroup'] = get_string('badfilenamesregex', 'qtype_coderunner');
            }
        }

        if (count($errors) == 0 && $templatestatus['istwigged']) {
            $errors = $this->validate_twigables($data, $templatestatus['renderedparams']);
        }

        if (count($errors) == 0 && !empty($data['validateonsave'])) {
            $testresult = $this->validate_sample_answer($data);
            if ($testresult) {
                $errors['answer'] = $testresult;
            }
        }

        // Don't allow the teacher to require more attachments than they allow; as this would
        // create a condition that it's impossible for the student to meet.
        if ($data['attachments'] != -1 && $data['attachments'] < $data['attachmentsrequired'] ) {
            $errors['attachmentsrequired']  = get_string('mustrequirefewer', 'qtype_coderunner');
        }

        return $errors;
    }

    // FUNCTIONS TO BUILD PARTS OF THE MAIN FORM
    // =========================================.

    // Create an empty div with id id_qtype_coderunner_error_div for use by
    // JavaScript error handling code.
    private function make_error_div($mform) {
        $mform->addElement('html', "<div id='id_qtype_coderunner_error_div' class='qtype_coderunner_error_message'></div>");
    }

    // Add to the supplied $mform the panel "Coderunner question type".
    private function make_questiontype_panel($mform) {
        $mform->addElement('header', 'questiontypeheader', get_string('type_header', 'qtype_coderunner'));
        // Insert the (possible) missing prototype message as a hidden field. JavaScript
        // will be used to show it if non-empty.
        $mform->addElement('hidden', 'missingprototypemessage', '',
                array('id' => 'id_missing_prototype', 'class' => 'missingprototypeerror'));
        $mform->setType('missingprototypemessage', PARAM_RAW);

        // The Question Type controls (a group with just a single member).
        $types = array('Undirected graph', 'Directed graph');  // TODO
        $typeselectorelements = array();
        $expandedtypes = array_merge(array('Undefined' => 'Undefined'), $types);
        $typeselectorelements[] = $mform->createElement('select', 'coderunnertype',
                null, $expandedtypes);
        $mform->addElement('group', 'coderunner_type_group',
                get_string('coderunnertype', 'qtype_coderunner'), $typeselectorelements, null, false);
        $mform->addHelpButton('coderunner_type_group', 'coderunnertype', 'qtype_coderunner');

        // Precheck control (a group with only one element).
        $precheckelements = array();
        $precheckvalues = array(
            constants::PRECHECK_DISABLED => get_string('precheck_disabled', 'qtype_coderunner'),
            constants::PRECHECK_EMPTY    => get_string('precheck_empty', 'qtype_coderunner'),
            constants::PRECHECK_EXAMPLES => get_string('precheck_examples', 'qtype_coderunner'),
            constants::PRECHECK_SELECTED => get_string('precheck_selected', 'qtype_coderunner'),
            constants::PRECHECK_ALL      => get_string('precheck_all', 'qtype_coderunner')
        );
        $precheckelements[] = $mform->createElement('select', 'precheck', null, $precheckvalues);
        $mform->addElement('group', 'coderunner_precheck_group',
                get_string('precheck', 'qtype_coderunner'), $precheckelements, null, false);
        $mform->addHelpButton('coderunner_precheck_group', 'precheck', 'qtype_coderunner');

        // Feedback control (a group with only one element).
        $feedbackelements = array();
        $feedbackvalues = array(
            constants::FEEDBACK_USE_QUIZ => get_string('feedback_quiz', 'qtype_coderunner'),
            constants::FEEDBACK_SHOW    => get_string('feedback_show', 'qtype_coderunner'),
            constants::FEEDBACK_HIDE => get_string('feedback_hide', 'qtype_coderunner'),
        );

        $feedbackelements[] = $mform->createElement('select', 'displayfeedback', null, $feedbackvalues);
        $mform->addElement('group', 'coderunner_feedback_group',
                get_string('feedback', 'qtype_coderunner'), $feedbackelements, null, false);
        $mform->addHelpButton('coderunner_feedback_group', 'feedback', 'qtype_coderunner');
        $mform->setDefault('displayfeedback', constants::FEEDBACK_SHOW);
        $mform->setType('displayfeedback', PARAM_INT);

        // Marking controls.
        $markingelements = array();
        $markingelements[] = $mform->createElement('advcheckbox', 'allornothing', null,
                get_string('allornothing', 'qtype_coderunner'));
        $mform->addElement('group', 'markinggroup', get_string('markinggroup', 'qtype_coderunner'),
                $markingelements, null, false);
        $mform->setDefault('allornothing', true);
        $mform->addHelpButton('markinggroup', 'markinggroup', 'qtype_coderunner');

        // Template params.
        $mform->addElement('textarea', 'templateparams',
            get_string('templateparams', 'qtype_coderunner'),
            array('rows' => self::TEMPLATE_PARAM_ROWS,
                  'class' => 'edit_code',
                  'data-lang' => '' // Don't syntax colour template params.
            )
        );
        $mform->setType('templateparams', PARAM_RAW);
        $mform->addHelpButton('templateparams', 'templateparams', 'qtype_coderunner');
    }


    // Get a list of all available UI plugins, namely all files of the form
    // ui_pluginname.js in the amd/src directory.
    // Returns an associative array with a uiname => uiname entry for each
    // available ui plugin.
    private function get_ui_plugins() {
        global $CFG;
        $uiplugins = array('None' => 'None');
        $files = scandir($CFG->dirroot . '/question/type/coderunner/amd/src');
        foreach ($files as $file) {
            if (substr($file, 0, 3) === 'ui_' && substr($file, -3) === '.js') {
                $uiname = substr($file, 3, -3);
                $uiplugins[$uiname] = ucfirst($uiname);
            }
        }
        return $uiplugins;
    }


    // UTILITY FUNCTIONS.
    // =================.

    // True iff the given name is valid for a new type, i.e., it's not in use
    // in the current context (Currently only a single global context is
    // implemented).
    private function is_valid_new_type($typename) {
        list($langs, $types) = $this->get_languages_and_types();
        return !array_key_exists($typename, $types);
    }


    /**
     * Return a count of the number of test cases set as examples.
     * @param array $data data from the form
     */
    private function num_examples($data) {
        return isset($data['useasexample']) ? count($data['useasexample']) : 0;
    }

    // Validate the test cases.
    private function validate_test_cases($data) {
        $errors = array(); // Return value.
        $testcodes = $data['testcode'];
        $stdins = $data['stdin'];
        $expecteds = $data['expected'];
        $marks = $data['mark'];
        $count = 0;
        $numnonemptytests = 0;
        $num = max(count($testcodes), count($stdins), count($expecteds));
        for ($i = 0; $i < $num; $i++) {
            $testcode = trim($testcodes[$i]);
            if ($testcode != '') {
                $numnonemptytests++;
            }
            $stdin = trim($stdins[$i]);
            $expected = trim($expecteds[$i]);
            if ($testcode !== '' || $stdin != '' || $expected !== '') {
                $count++;
                $mark = trim($marks[$i]);
                if ($mark != '') {
                    if (!is_numeric($mark)) {
                        $errors["testcode[$i]"] = get_string('nonnumericmark', 'qtype_coderunner');
                    } else if (floatval($mark) <= 0) {
                        $errors["testcode[$i]"] = get_string('negativeorzeromark', 'qtype_coderunner');
                    }
                }
            }
        }

        if ($count == 0) {
            $errors["testcode[0]"] = get_string('atleastonetest', 'qtype_coderunner');
        } else if ($numnonemptytests != 0 && $numnonemptytests != $count) {
            $errors["testcode[0]"] = get_string('allornone', 'qtype_coderunner');
        }
        return $errors;
    }


    // Check the templateparameters value, if given. Return value is
    // an associative array with an error message 'error', a boolean
    // 'istwigged' and a string 'renderedparams'.  istwigged is true if
    // twigging the template parameters changed them. 'renderedparams' is
    // the result of twig expanding the params.
    // Error is the empty string if the template parameters are OK.
    // As a side effect, $this->renderedparams is the result of twig expanding
    // the params and $this->decodedparams is the json decoded template parameters
    // as an associative array.
    private function validate_template_params($data) {
        global $USER;
        $errormessage = '';
        $istwiggedparams = false;
        $this->renderedparams = '';
        $this->decodedparams = array();
        if ($data['templateparams'] != '') {
            // Try Twigging the template params to make sure they parse.
            $ok = true;
            $json = $data['templateparams'];
            try {
                $this->renderedparams = qtype_coderunner_twig::render($json);
                if (str_replace($this->renderedparams, "\r", '') !==
                        str_replace($json, "\r", '')) {
                    // Twig loses '\r' chars, so must strip them before checking.
                    $istwiggedparams = true; //Twigging the template parameters changed them.
                }
            } catch (Exception $ex) {
                $errormessage = $ex->getMessage();
                $ok = false;
            }
            if ($ok) {
                $this->decodedparams = json_decode($this->renderedparams, true);
                if ($this->decodedparams === null) {
                    if ($this->decodedparams) {
                        $badjsonhtml = str_replace("\n", '<br>', $this->renderedparams);
                        $errormessage = get_string('badtemplateparamsaftertwig',
                                'qtype_coderunner', $badjsonhtml);
                    } else {
                        $errormessage = get_string('badtemplateparams', 'qtype_coderunner');
                    }
                }
            }

        }
        return array('error' => $errormessage,
                    'istwigged' => $istwiggedparams,
                    'renderedparams' => $this->renderedparams);
    }


    // If the template parameters contain twig code, in which case the
    // other question fields will need twig expansion, check for twig errors
    // in all other fields. Return value is an associative array mapping from
    // form fields to error messages.
    private function validate_twigables($data, $renderedparams) {
        $errors = array();
        if (!empty($renderedparams)) {
            $parameters = json_decode($renderedparams, true);
        } else {
            $parameters = array();
        }

        // Try twig expanding everything (see question::twig_all), with strict_variables true.
        foreach (['questiontext', 'answer', 'answerpreload', 'globalextra'] as $field) {
            $text = $data[$field];
            if (is_array($text)) {
                $text = $text['text'];
            }
            try {
                qtype_coderunner_twig::render($text, $parameters, true);
            } catch (Twig_Error $ex) {
                $errors[$field] = get_string('twigerror', 'qtype_coderunner',
                        $ex->getMessage());
            }
        }

        // Now all test cases.
        if (!empty($data['testcode'])) {
            $num = max(count($data['testcode']), count($data['stdin']),
                    count($data['expected']), count($data['extra']));

            for ($i = 0; $i < $num; $i++) {
                foreach (['testcode', 'stdin', 'expected', 'extra'] as $fieldname) {
                    $text = $data[$fieldname][$i];
                    try {
                        qtype_coderunner_twig::render($text, $parameters, true);
                    } catch (Twig_Error $ex) {
                        $errors["testcode[$i]"] = get_string('twigerrorintest',
                                'qtype_coderunner', $ex->getMessage());
                    }
                }
            }
        }
        return $errors;
    }


    private function make_question_from_form_data($data) {
        // Construct a question object containing all the fields from $data.
        // Used in data pre-processing and when validating a question.
        global $DB;
        $question = new qtype_coderunner_question();
        foreach ($data as $key => $value) {
            if ($key === 'questiontext' || $key === 'generalfeedback') {
                // Question text and general feedback are associative arrays.
                $question->$key = $value['text'];
            } else {
                $question->$key = $value;
            }
        }
        $question->isnew = true;
        $question->supportfilemanagerdraftid = $this->get_file_manager('datafiles');

        // Clean the question object, get inherited fields and run the sample answer.
        $qtype = new qtype_coderunner();
        $qtype->clean_question_form($question, true);
        $questiontype = $question->coderunnertype;
        list($category) = explode(',', $question->category);
        $contextid = $DB->get_field('question_categories', 'contextid', array('id' => $category));
        $question->contextid = $contextid;
        $context = context::instance_by_id($contextid, IGNORE_MISSING);
        return $question;
    }

    // Check the sample answer (if there is one)
    // Return an empty string if there is no sample answer and no attachments,
    // or if the sample answer passes all the tests.
    // Otherwise return a suitable error message for display in the form.
    private function validate_sample_answer($data) {

        $attachmentssaver = $this->get_sample_answer_file_saver();
        $files = $attachmentssaver ? $attachmentssaver->get_files() : array();
        if (trim($data['answer']) === '' && count($files) == 0) {
            return '';
        }
        // Check if it's a multilanguage question; if so need to determine
        // what language to use. If there is a specific answer_language template
        // parameter, that is used. Otherwise the default language (if specified)
        // or the first in the list is used.
        $acelangs = trim($data['acelang']);
        if ($acelangs !== '' && strpos($acelangs, ',') !== false) {
            if (empty($this->decodedparams['answer_language'])) {
                list($languages, $answerlang) = qtype_coderunner_util::extract_languages($acelangs);
                if ($answerlang === '') {
                    $answerlang = $languages[0];
                }
            } else {
                $answerlang = $this->decodedparams['answer_language'];
            }
        }

        try {
            $question = $this->make_question_from_form_data($data);
            $question->start_attempt();
            $response = array('answer' => $question->answer);
            if (!empty($answerlang)) {
                $response['language'] = $answerlang;
            }
            if ($attachmentssaver) {
                $response['attachments'] = $attachmentssaver;
            }
            $error = $question->validate_response($response);
            if ($error) {
                return $error;
            }
            list($mark, $state, $cachedata) = $question->grade_response($response);
        } catch (Exception $e) {
            return $e->getMessage();
        }

        // Return either an empty string if run was good or an error message.
        if ($mark == 1.0) {
            return '';
        } else {
            $outcome = unserialize($cachedata['_testoutcome']);
            $error = $outcome->validation_error_message();
            return $error;
        }
    }


    // Return a file saver for the sample answer filemanager, if present.
    private function get_sample_answer_file_saver() {
        $sampleanswerdraftid = $this->get_file_manager('sampleanswerattachments');
        $saver = null;
        if ($sampleanswerdraftid) {
            $saver = new question_file_saver($sampleanswerdraftid, 'qtype_coderunner', 'draft');
        }
        return $saver;
    }


    // Find the id of the filemanager element draftid with the given name.
    private function get_file_manager($filemanagername) {
        $mform = $this->_form;
        $draftid = null;
        foreach ($mform->_elements as $element) {
            if ($element->_type == 'filemanager'
                    && $element->_attributes['name'] === $filemanagername) {
                $draftid = (int)$element->getValue();
            }
        }
        return $draftid;
    }

}
