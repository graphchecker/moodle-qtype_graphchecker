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
 * A sandbox that uses the Jobe server (http://github.com/trampgeek/jobe) to
 * run student submissions.
 *
 * This version doesn't do any authentication; it's assumed the server is
 * firewalled to accept connections only from Moodle.
 *
 * @package   qtype_graphchecker
 * @copyright 2014, 2015 Richard Lobb, University of Canterbury
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class qtype_graphchecker_jobesandbox extends qtype_graphchecker_sandbox {

    const DEBUGGING = 0;
    const HTTP_GET = 1;
    const HTTP_POST = 2;
    const HTTP_PUT = 3;

    /**
     * @var string when this variable is set, it is added as a HTTP
     * header X-CodeRunner-Job-Id: to every API call we make.
     *
     * This is intended for use when load-balancing over multiple instances
     * of JOBE, so that a sequence of related API calls can all be
     * routed to the same JOBE instance. Typically a particular value
     * of the job id will not be used for more than a few seconds,
     * so quite a short time-out can be used.
     *
     * Typical load-balancer config might be:
     *  - with haproxy try "balance hdr(X-CodeRunner-Job-Id)" (not tested)
     *  - with a Netscaler use rule-based persistence with expression
     *    HTTP.REQ.HEADER(“X-CodeRunner-Job-Id”)
     */
    private $currentjobid = null;

    private $languages = null;   // Languages supported by this sandbox.
    private $httpcode = null;    // HTTP response code.
    private $response = null;    // Response from HTTP request to server.

    // Constructor gets languages from Jobe and stores them.
    // If $this->languages is left null, the Jobe server is down or
    // refusing requests or misconfigured. The actual HTTP returncode and response
    // are left in $httpcode and $response resp.
    public function __construct() {
        qtype_graphchecker_sandbox::__construct();
        $this->jobeserver = get_config('qtype_graphchecker', 'jobe_host');
        $this->apikey = get_config('qtype_graphchecker', 'jobe_apikey');

        list($this->httpcode, $this->response) = $this->http_request(
                'languages', self::HTTP_GET);

        if ($this->httpcode == 200 && is_array($this->response)) {
            $this->languages = array();
            foreach ($this->response as $lang) {
                $this->languages[] = $lang[0];
            }
        } else {
            $this->languages = array();
        }
    }


    // List of supported languages.
    public function get_languages() {
        return (object) array(
            'error'     => $this->get_error_code($this->httpcode),
            'languages' => $this->languages);
    }

    /** Execute the given source code in the given language with the given
     *  input and returns an object with fields error, result, signal, cmpinfo,
     *  stderr, output.
     * @param string $sourcecode The source file to compile and run
     * @param string $language  One of the languages recognised by the sandbox
     * @param string $input A string to use as standard input during execution
     * @param associative array $files either null or a map from filename to
     *         file contents, defining a file context at execution time
     * @param associative array $params Sandbox parameters, depends on
     *         particular sandbox but most sandboxes should recognise
     *         at least cputime (secs), memorylimit (Megabytes) and
     *         files (an associative array mapping filenames to string
     *         filecontents.
     *         If the $params array is null, sandbox defaults are used.
     * @return an object with at least an attribute 'error'. This is one of the
     *         values 0 through 8 (OK to UNKNOWN_SERVER_ERROR) as defined in the
     *         base class. If
     *         error is 0 (OK), the returned object has additional attributes
     *         result, output, stderr, signal and cmpinfo as follows:
     *             result: one of the result_* constants defined in the base class
     *             output: the stdout from the run
     *             stderr: the stderr output from the run (generally a non-empty
     *                     string is taken as a runtime error)
     *             signal: one of the standard Linux signal values (but often not
     *                     used)
     *             cmpinfo: the output from the compilation run (usually empty
     *                     unless the result code is for a compilation error).
     *         If error is anything other than OK, the attribute stderr will
     *         contain the text of the actual HTTP response header, e.g
     *         Bad Parameter if the response was 400 Bad Parameter.
     */

    public function execute($sourcecode, $language, $input, $files=null, $params=null) {
        $language = strtolower($language);
        if (!in_array($language, $this->languages)) { // This shouldn't be possible.
            return (object) array('error' => self::UNKNOWN_SERVER_ERROR);
        }

        if ($input !== '' && substr($input, -1) != "\n") {
            $input .= "\n";  // Force newline on the end if necessary.
        }

        $filelist = array();
        if ($files !== null) {
            foreach ($files as $filename => $contents) {
                $id = md5($contents);
                $filelist[] = array($id, $filename);
            }
        }
        $progname = "__tester__.$language";

        $runspec = array(
                'language_id'       => $language,
                'sourcecode'        => $sourcecode,
                'sourcefilename'    => $progname,
                'input'             => $input,
                'file_list'         => $filelist
            );

        if (self::DEBUGGING) {
            $runspec['debug'] = 1;
        }

        if ($params !== null) {
            // Process any given sandbox parameters.
            $runspec['parameters'] = $params;
            if (isset($params['debug']) && $params['debug']) {
                $runspec['debug'] = 1;
            }
            if (isset($params['sourcefilename'])) {
                $runspec['sourcefilename'] = $params['sourcefilename'];
            }
            if (isset($params['jobeserver'])) {
                $this->jobeserver = $params['jobeserver'];
            }
            if (isset($params['jobeapikey'])) {
                $this->jobeapikey = $params['jobeapikey'];
            }
        }

        $postbody = array('run_spec' => $runspec);
        $this->currentjobid = sprintf('%08x', mt_rand());

        // Try submitting the job. If we get a 404, try again after
        // putting all the files on the server. Anything else is an error.
        $httpcode = $this->submit($postbody);
        if ($httpcode == 404) { // Missing file(s)?
            foreach ($files as $filename => $contents) {
                if (($httpcode = $this->put_file($contents)) != 204) {
                    break;
                }
            }
            if ($httpcode == 204) {
                // Try again if put_files all worked.
                $httpcode = $this->submit($postbody);
            }
        }

        if ($httpcode != 200   // We don't deal with Jobe servers that return 202!
                || !is_object($this->response)  // Or any sort of broken ...
                || !isset($this->response->outcome)) {     // ... communication with server.
            $errorcode = $httpcode == 200 ? self::UNKNOWN_SERVER_ERROR : $this->get_error_code($httpcode);
            $this->currentjobid = null;
            return (object) array('error' => $errorcode, 'stderr' => $this->response);
        } else if ($this->response->outcome == self::RESULT_SERVER_OVERLOAD) {
            return (object) array('error' => self::SERVER_OVERLOAD);
        } else if ($this->response->outcome == self::RESULT_TIME_LIMIT) {
            return (object) array('error' => self::TIME_LIMIT);
        } else {
            $stderr = $this->filter_file_path($this->response->stderr);
            // Any stderr output is treated as a runtime error.
            if (trim($stderr) !== '') {
                $this->response->outcome = self::RESULT_RUNTIME_ERROR;
            }
            $this->currentjobid = null;
            return (object) array(
              'error'   => self::OK,
              'result'  => $this->response->outcome,
              'signal'  => 0,              // Jobe doesn't return this.
              'cmpinfo' => $this->response->cmpinfo,
              'output'  => $this->filter_file_path($this->response->stdout),
              'stderr'  => $stderr
            );
        }
    }

    // Return the sandbox error code corresponding to the given httpcode.
    private function get_error_code($httpcode) {
        $codemap = array(
            '200' => self::OK,
            '202' => self::OK,
            '204' => self::OK,
            '400' => self::JOBE_400_ERROR,
            '401' => self::SUBMISSION_LIMIT_EXCEEDED,
            '403' => self::AUTH_ERROR
        );
        if (isset($codemap[$httpcode])) {
            return $codemap[$httpcode];
        } else {
            return self::UNKNOWN_SERVER_ERROR;
        }
    }

    // Put the given file to the server, using its MD5 checksum as the id.
    // Returns the HTTP response code, or -1 if the HTTP request fails
    // altogether.
    // Moodle curl class doesn't support an appropriate form of PUT so
    // we use raw PHP curl here.
    private function put_file($contents) {
        $id = md5($contents);
        $contentsb64 = base64_encode($contents);
        $resource = "files/$id";

        list($url, $headers) = $this->get_jobe_connection_info($resource);

        $body = array('file_contents' => $contentsb64);
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        $result = curl_exec($curl);
        $info = curl_getinfo($curl);
        curl_close($curl);
        return $result === false ? -1 : $info['http_code'];
    }

    /**
     * Helper method  used by put_file and http_request.
     *
     * Determine the URL for a particular API call, and
     * also get the HTTP headers that should be sent.
     *
     * @param string $resource specific REST API call to add to the URL.
     * @return array with two elements, the URL for the given resource,
     * and the HTTP headers that should be used in the request.
     */
    private function get_jobe_connection_info($resource) {
        global $CFG;
        // Hack to force use of a local jobe host when behat testing.
        if ($CFG->prefix == "b_") {
            $jobe = "localhost";
        } else {
            $jobe = $this->jobeserver;
        }
        $protocol = 'http://';
        $url = (strpos($jobe, 'http') === 0 ? $jobe : $protocol.$jobe)."/jobe/index.php/restapi/$resource";

        $headers = array(
                'User-Agent: CodeRunner',
                'Content-Type: application/json; charset=utf-8',
                'Accept-Charset: utf-8',
                'Accept: application/json',
        );
        if (!empty($this->apikey)) {
            $headers[] = "X-API-KEY: $this->apikey";
        }
        if (!empty($this->currentjobid)) {
            $headers[] = "X-CodeRunner-Job-Id: $this->currentjobid";
        }

        return array($url, $headers);
    }

    // Submit the given job, which must be an associative array with at
    // least a key 'run_spec'. Return value is the HTTP response code.
    // The actual response is copied into $this->response.
    // In cases where the response code is not 200, the response is typically
    // the message associated with the response, e.g. Bad Parameter is the
    // response was 400 Bad Parameter.
    // We don't at this stage deal with Jobe servers that may defer requests
    // i.e. that return 202 Accepted rather than 200 OK.
    private function submit($job) {
        list($returncode, $response) = $this->http_request('runs', self::HTTP_POST, $job);
        $this->response = $response;
        return $returncode;

    }

    // Send an http request to the Jobe server at the given
    // resource using the given method (self::HTTP_GET or self::HTTP_POST).
    // The body, if given, is json encoded and added to the request.
    // Return value is a 2-element
    // array containing the http response code and the response body (decoded
    // from json).
    // The code is -1 if the request fails utterly.
    private function http_request($resource, $method, $body=null) {
        list($url, $headers) = $this->get_jobe_connection_info($resource);

        $curl = new curl();
        $curl->setHeader($headers);

        if ($method === self::HTTP_GET) {
            if (!empty($body)) {
                throw new coding_exception("Illegal HTTP GET: non-empty body");
            }
            $response = $curl->get($url);
        } else if ($method === self::HTTP_POST) {
            if (empty($body)) {
                throw new coding_exception("Illegal HTTP POST: empty body");
            }
            $bodyjson = json_encode($body);
            $response = $curl->post($url, $bodyjson);
        } else {
            throw new coding_exception('Invalid method passed to http_request');
        }

        if ($response !== false) {
            $returncode = $curl->info['http_code'];
            $responsebody = $response === '' ? '' : json_decode($response);
        } else {
            $returncode = -1;
            $responsebody = '';
        }

        return array($returncode, $responsebody);
    }


    // Replace jobe filepaths of the form /home/jobe/runs/<directory>/filename
    // with filename.
    private function filter_file_path($s) {
        return preg_replace('|(/home/jobe/runs/jobe_[a-zA-Z0-9_]+/)([a-zA-Z0-9_]+)|', '$2', $s);
    }
}

