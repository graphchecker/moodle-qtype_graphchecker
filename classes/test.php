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
     *   - package: the package the test methods can be found in;
     *   - name: the method name of the test;
     *   - params: an array of parameters for the test.
     */
    public function __construct($test_array) {
        $this->package = $test_array['package'];
        $this->method = $test_array['method'];
        $this->params = $test_array['params'];
    }

    /**
     * Returns the method call that executes the test.
     */
    public function get_test_code() {
        return $this->package . '.' . $this->method .
            '(' . $this->get_parameter_string() . ')';
    }

    private function get_parameter_string() {
        $parameters = 'student_answer';

        foreach ($this->params as $name => $value) {
            $parameters .= ', ';
            $parameters .= $name . '=' . $value;
        }

        return $parameters;
    }

    public static function get_available_tests() {
        global $CFG;

        $modules = array();

        $checksDir = $CFG->dirroot . '/question/type/coderunner/checks/undirected';
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

