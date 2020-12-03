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
 * Utility routines for qtype_graphchecker.
 */

defined('MOODLE_INTERNAL') || die();



global $CFG;

use qtype_graphchecker\constants;

class qtype_graphchecker_util {

    /*
     * Load/initialise the graph UI plugin.
     * $textareaid is the id of the textarea that the UI plugin is to manage.
     */
    public static function load_uiplugin_js($question, $textareaid) {
        global $CFG, $PAGE;
        $params = array('graph', $textareaid);
        $PAGE->requires->js_call_amd('qtype_graphchecker/userinterfacewrapper', 'newUiWrapper', $params);
    }


    // Limit the length of the given string to MAX_STRING_LENGTH by
    // removing the centre of the string, inserting the substring
    // [... snip ... ] in its place.
    public static function snip(&$s) {
        $snipinsert = ' ...snip... ';
        $len = mb_strlen($s);
        if ($len > constants::MAX_STRING_LENGTH) {
            $lentoremove = $len - constants::MAX_STRING_LENGTH + mb_strlen($snipinsert);
            $partlength = ($len - $lentoremove) / 2;
            $firstbit = mb_substr($s, 0, $partlength);
            $lastbit = mb_substr($s, $len - $partlength, $partlength);
            $s = $firstbit . $snipinsert . $lastbit;
        }
        return $s;
    }


    // Return a cleaned and snipped version of the string s (or null if s is null).
    public static function tidy($s) {
        if ($s === null) {
            return null;
        } else {
            $cleaneds = self::clean($s);
            return self::snip($cleaneds);
        }
    }


    // Sanitise given text with 's()' and wrap in a <pre> element.
    // TODO: expand tabs (which appear in Java traceback output).
    public static function format_cell($cell) {
        if (substr($cell, 0, 1) === "\n") {
            $cell = "\n" . $cell;  // Fix <pre> quirk that ignores leading \n.
        }
        return s($cell);
    }


    // Clean the given html by wrapping it in <div> tags and parsing it with libxml
    // and outputing the (supposedly) cleaned up HTML.
    public static function clean_html($html) {
        libxml_use_internal_errors(true);
        $html = "<div>". $html . "</div>"; // Wrap it in a div (seems to help libxml).
        $doc = new DOMDocument;
        if ($doc->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD)) {
            return $doc->saveHTML();
        } else {
            $message = "Errors in HTML\n<br />";
            foreach (libxml_get_errors() as $error) {
                $message .= "Line {$error->line} column {$error->line}: {$error->code}\n<br />";
            }
            libxml_clear_errors();
            $message .= "\n<br />" + $html;
            return $message;
        }
    }

    /**
     * Convert a given list of lines to an HTML <p> element.
     * @param type $lines
     */
    public static function make_html_para($lines) {
        if (count($lines) > 0) {
            $para = html_writer::start_tag('p');
            $para .= $lines[0];
            for ($i = 1; $i < count($lines); $i++) {
                $para .= html_writer::empty_tag('br') . $lines[$i];;
            }
            $para .= html_writer::end_tag('p');
        } else {
            $para = '';
        }
        return $para;
    }

    /** Function to merge the JSON template parameters from the
     *  the prototype with the child's template params. The prototype can
     *  be overridden by the child.
     */
    public static function merge_json($prototypejson, $childjson) {
        $result = new stdClass();
        foreach (self::template_params($prototypejson) as $attr => $field) {
            $result->$attr = $field;
        }

        foreach (self::template_params($childjson) as $attr => $field) {
            $result->$attr = $field;
        }

        return json_encode($result);
    }

    // Decode given json-encoded template parameters, returning an associative
    // array. Return an empty array if jsonparams is empty or invalid.
    // This function is also responsible for normalising the JSON it is
    // given, replacing the triple-quoted strings with standard JSON versions.
    public static function template_params($jsonparams) {
        $params = json_decode($jsonparams, true);
        return $params === null ? array() : $params;
    }
}
