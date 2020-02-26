<?php

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

    /**
     * Returns the method call that executes the check.
     */
    public function get_check_code() {
        return $this->module . '.' . $this->method .
            '(' . $this->get_arguments_string() . ')';
    }

    private function get_arguments_string() {
        $arguments = 'student_answer, sample_answer, preload_answer';

        foreach ($this->arguments as $name => $value) {
            $arguments .= ', ';
            $arguments .= $name . '=' . $this->make_python_string($value);
        }

        return $arguments;
    }

    /**
     * Given a value, produces an (properly-escaped) Python string containing
     * that value.
     */
    private function make_python_string($value) {
        $escaped = str_replace("'", "\'", $value);
        return "'" . $escaped . "'";
    }

    public static function get_available_checks($answertype) {
        global $CFG;

        $modules = array();

        $checksDir = $CFG->dirroot . '/question/type/graphchecker/checks/' . $answertype;
        $checkFiles = scandir($checksDir);
        foreach ($checkFiles as $file) {
            $path = $checksDir . '/' . $file;
            if (!is_dir($path) && pathinfo($path, PATHINFO_EXTENSION) === "json") {
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

