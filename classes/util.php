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
        $type_data = qtype_graphchecker_util::get_type_data();
        $ui_plugin = $type_data[$question->answertype]['ui_plugin'];
        if ($ui_plugin !== "text") {
            $params = array($ui_plugin, $textareaid);
            $PAGE->requires->js_call_amd('qtype_graphchecker/userinterfacewrapper', 'newUiWrapper', $params);
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


    /**
     * Checks if the given name is a valid type, module, or check name.
     * A name is valid if it consists of alphanumeric characters and
     * underscores.
     */
    public static function check_valid_name($name) {
        return preg_match('[^A-Za-z0-9_]', $name) === 0;
    }


    /**
     * Returns all answer types and their type data.
     *
     * This reads all types in checks/types.json, and for each type, it reads
     * checks/<typename>/type.json. These are then returned as an array mapping
     * the type name to the type data.
     */
    public static function get_type_data() {
        global $CFG;
        $json = file_get_contents($CFG->dirroot . '/question/type/graphchecker/checks/types.json');
        $types = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON types list (checks/types.json)');
        }

        $result = [];
        foreach ($types as $type) {
            if (!qtype_graphchecker_util::check_valid_name($type)) {
                throw new Exception('JSON types list (checks/types.json) contains type "' . $type . '" which is invalid');
            }

            $json = file_get_contents($CFG->dirroot . '/question/type/graphchecker/checks/' . $type . '/type.json');
            $typeData = json_decode($json, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON types file for type "' . $type . '"');
            }

            $result[$type] = $typeData;
        }

        return $result;
    }
}
