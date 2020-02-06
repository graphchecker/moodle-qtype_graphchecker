<?php

defined('MOODLE_INTERNAL') || die();

/**
 * Representation of a single test that can be performed on a graph.
 *
 * A test consists of a package name, a method name, and a set of parameters.
 * At runtime, the test is executed by calling
 *
 * ```
 * <package>.<method>(<params>)
 * ```
 */
class qtype_coderunner_test {

    /**
     * Constructs a test from a PHP associative array.
     *
     * @param test_array An array with the following keys:
     *   - module: the module the test methods can be found in;
     *   - method: the method name of the test;
     *   - arguments: an array of arguments for the test.
     */
    public function __construct($test_array) {
        $this->module = $test_array['module'];
        $this->method = $test_array['method'];
        if (array_key_exists('arguments', $test_array)) {
            $this->arguments = $test_array['arguments'];
        } else {
            $this->arguments = array();
        }
    }

    /**
     * Returns the method call that executes the test.
     */
    public function get_test_code() {
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

    public static function get_available_tests($answertype) {
        global $CFG;

        $modules = array();

        $checksDir = $CFG->dirroot . '/question/type/coderunner/checks/' . $answertype;
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

