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

/**
 * Strings for component 'qtype_graphchecker', language 'en', branch 'MOODLE_20_STABLE'
 *
 * @package   qtype_graphchecker
 * @copyright Richard Lobb 2012
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['aborted'] = 'Testing was aborted due to an error.';
$string['allok'] = 'Passed all checks! ';
$string['answer'] = 'Sample answer';
$string['answerprompt'] = 'Answer:';
$string['answer_help'] = 'A sample answer can be entered here, so that it can be shown to students during review. The correctness of a non-empty answer is checked when saving unless \'Validate on save\' is unchecked.';
$string['answer'] = 'Sample answer';
$string['answerbox_group'] = 'Answer box';
$string['answerpreload'] = 'Answer box preload';
$string['answerpreload_help'] = 'The student\'s answer box will be pre-filled with the contents of this field.';
$string['answertype'] = 'Answer type';
$string['answertype_help'] = 'Change which type of answer the student is required to give. Depending on the selection, the proper editor will be shown. Changing the answer type will clear the Answer box preload, Checks, and Sample answer sections below.';
$string['answertype_changed'] = 'Changing the answer type will clear the Answer box preload, Checks, and Sample answer sections. Are you sure you want to continue?';
$string['asolutionis'] = 'Example solution:';

$string['badquestion'] = 'Error in question';
$string['brokentemplategrader'] = 'Bad output from grader: {$a->output}. Something may be wrong with the question; please notify your tutor.';

$string['confirmreset'] = 'Are you sure you want reset the answer box to the original value? This will discard all your work on the question.';

$string['enable'] = 'Enable';
$string['errorstring-ok'] = 'OK';
$string['errorstring-autherror'] = 'Unauthorised to use sandbox';
$string['errorstring-jobe400'] = 'Error from Jobe sandbox server: ';
$string['errorstring-overload'] = 'Job could not be run due to server overload. Perhaps try again shortly?';
$string['errorstring-pastenotfound'] = 'Requesting status of non-existent job';
$string['errorstring-wronglangid'] = 'Non-existent language requested';
$string['errorstring-accessdenied'] = 'Access to sandbox denied';
$string['errorstring-submissionlimitexceeded'] = 'Sandbox submission limit reached';
$string['errorstring-submissionfailed'] = 'Submission to sandbox failed';
$string['errorstring-unknown'] = 'Unexpected error while executing checks. The sandbox server may be down or overloaded. Perhaps try again shortly?';

$string['failedntests'] = 'Failed {$a->numerrors} check(s)';
$string['failedtesting'] = 'Failed testing.';

$string['graphhelp'] = '- Double click at a blank space to create a new node/state.
- Double click an existing node to "mark" it e.g. as an accept state for Finite State Machines
  (FSMs). Double click again to unmark it.
- Click and drag to move a node.
- Alt click and drag to move a (sub)graph.
- Shift click inside one node and drag to another to create a link.
- Shift click on a blank space, drag to a node to create a start link (FSMs only).
- Click and drag a link to alter its curve.
- Click on a link/node to edit its text.
- Typing _ followed by a digit makes that digit a subscript.
- Typing \\epsilon creates an epsilon character (and similarly for \\alpha, \\beta etc).
- Click on a link/node then press the Delete key to remove it (or function-delete on a Mac).';
$string['graphcheckersettings'] = 'GraphChecker settings';
$string['graph_ui_invalidserialisation'] = 'GraphUI: invalid serialisation';

$string['ideone_user'] = 'Ideone server user';
$string['ideone_user_desc'] = 'The login name to use when connecting to the deprecated Ideone server (if the ideone sandbox is enabled)';
$string['ideone_pass'] = 'Ideone server password';
$string['ideone_pass_desc'] = 'The password to use when connecting to the deprecated Ideone server (if the ideone sandbox is enabled)';

$string['jobe_apikey'] = 'Jobe API-key';
$string['jobe_apikey_desc'] = 'The API key to be included in all REST requests to the Jobe server (if required). Max 40 chars. Leave blank to omit the API Key from requests';
$string['jobe_host'] = 'Jobe server';
$string['jobe_host_desc'] = 'The host name of the Jobe server plus the port number if other than port 80, e.g. jobe.somewhere.edu:4010. The URL for the Jobe request is obtained by default by prefixing this string with http:// and appending /jobe/index.php/restapi/<REST_METHOD>. You may either specify the https:// protocol in front of the host name (e.g. https://jobe.somewhere.edu) if the Jobe server is set behind a reverse proxy which acts as an SSL termination.';

$string['noerrorsallowed'] = 'Your answer must pass all checks to earn any marks. Try again.';

$string['options'] = 'Options';

$string['pluginname'] = 'GraphChecker';
$string['pluginnameadding'] = 'Adding a GraphChecker question';
$string['pluginnameediting'] = 'Editing a GraphChecker question';
$string['pluginnamesummary'] = 'Allows students to draw graphs and other discrete structures, which are graded automatically.';
$string['pluginname_help'] = 'Use the \'Answer type\' combo box to select the type of structure the student needs to construct to answer the question. Then, specify which checks need to be run to verify if the student\'s answer is correct.';
$string['pluginname_link'] = 'question/type/graphchecker';
$string['privacy:metadata'] = 'The GraphChecker question type plugin does not store any personal data.';

$string['reset'] = 'Reset answer';
$string['resethover'] = 'Discard changes and reset answer to original preloaded value';
$string['resultstring-norun'] = 'No run';
$string['resultstring-compilationerror'] = 'Compilation error';
$string['resultstring-runtimeerror'] = 'Error';
$string['resultstring-timelimit'] = 'Time limit exceeded';
$string['resultstring-success'] = 'OK';
$string['resultstring-memorylimit'] = 'Memory limit exceeded';
$string['resultstring-illegalsyscall'] = 'Illegal function call';
$string['resultstring-internalerror'] = 'CodeRunner error (IE): please tell a tutor';
$string['resultstring-sandboxpending'] = 'CodeRunner error (PD): please tell a tutor';
$string['resultstring-sandboxpolicy'] = 'CodeRunner error (BP): please tell a tutor';
$string['resultstring-sandboxoverload'] = 'Sandbox server overload. Perhaps try again soon?';
$string['resultstring-outputlimit'] = 'Excessive output';
$string['resultstring-abnormaltermination'] = 'Abnormal termination';
$string['run_failed'] = 'Failed to run checks';

$string['syntax_errors'] = 'Syntax Error(s)';

$string['tests'] = 'Checks';
$string['tests_help'] = 'Checks used to verify if the student\'s answer is correct.';

$string['ui_fallback'] = 'Falling back to raw text area.';
$string['unknownerror'] = 'An unexpected error occurred. The sandbox may be down. Try again shortly.';
$string['unserializefailed'] = 'Stored test results could not be deserialised. Perhaps try regrading?';

