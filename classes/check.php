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

/**
 * Representation of a single check that can be performed on a graph.
 *
 * A check consists of a package name, a method name, and a set of parameters.
 * At runtime, the check is executed by calling
 *
 * ```
 * <package>.<method>(<params>)
 * ```
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qtype_graphchecker_check {

    /**
     * Constructs a check from a PHP associative array.
     *
     * @param check_array An array with the following keys:
     *   - module: the module the check methods can be found in;
     *   - method: the method name of the check;
     *   - arguments: an array of arguments for the check.
     */
    public function __construct($check_array) {
        $this->module = $check_array['module'];
        $this->method = $check_array['method'];
        if (array_key_exists('arguments', $check_array)) {
            $this->arguments = $check_array['arguments'];
        } else {
            $this->arguments = array();
        }
    }

    public static function has_check($answertype, $module, $method) {
        if ($module === 'custom' && $method === 'custom') {
            return true;
        }
        $modules = qtype_graphchecker_check::get_available_checks($answertype);
        if (!array_key_exists($module, $modules)) {
            return false;
        }
        $methods = $modules[$module]->checks;
        return array_key_exists($method, $methods);
    }

    public static function get_available_checks($answertype) {
        global $CFG;

        $modules = array();

        $checksDir = $CFG->dirroot . '/question/type/graphchecker/checks/' . $answertype;
        $checkFiles = scandir($checksDir);
        foreach ($checkFiles as $file) {
            $path = $checksDir . '/' . $file;
            if (!is_dir($path) && pathinfo($path, PATHINFO_EXTENSION) === "json" &&
                    pathinfo($path, PATHINFO_FILENAME) !== "type") {
                $json = file_get_contents($path);
                $modules[pathinfo($path, PATHINFO_FILENAME)] = json_decode($json);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception("Invalid JSON metadata file: " . $file);
                }
            }
        }

        return $modules;
    }
}

