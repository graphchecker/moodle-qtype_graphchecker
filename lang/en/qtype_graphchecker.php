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
$string['allowed_vertex_edits'] = 'Allow adding/removing';
$string['allowed_vertex_edits_help'] = 'This decides whether the student is able to add/remove nodes and edges.';
$string['answer'] = 'Sample answer';
$string['answerprompt'] = 'Answer:';
$string['answer_help'] = 'A sample answer can be entered here, so that it can be shown to students during review. Note that this sample answer is not used for grading purposes: only the checks above determine if the student\'s answer is correct. The buttons below the editor can be used to copy the preloaded answer into the sample answer, or vice versa.';
$string['answer'] = 'Sample answer';
$string['answerbox_group'] = 'Answer box';
$string['answerpreload'] = 'Preloaded answer';
$string['answerpreload_help'] = 'The student\'s answer box will be pre-filled with the contents of this field. If the student is intended to draw a graph from scratch, this should be left empty.';
$string['answertype'] = 'Answer type';
$string['answertype_help'] = 'Change which type of answer the student is required to give. Depending on the selection, the proper editor will be shown. Changing the answer type will clear the Answer box preload, Checks, and Sample answer sections below.';
$string['answertype_changed'] = 'Changing the answer type will clear the Answer box preload, Checks, and Sample answer sections. Are you sure you want to continue?';
$string['asolutionis'] = 'Example solution:';

$string['badquestion'] = 'Error in question';

$string['checks'] = 'Checks';
$string['checks_help'] = 'Checks used to verify if the student\'s answer is correct.';
$string['confirmreset'] = 'Are you sure you want reset the answer box to the original value? This will discard all your work on the question.';

$string['edge_attributes'] = 'Edge attributes';
$string['edge_attributes_help'] = 'Specify which attributes edges have: labels, colors, or both.';
$string['enable'] = 'Enable';
$string['enable_sandbox_desc'] = 'Permit use of the specified sandbox for running student submissions';
$string['errorstring-ok'] = 'OK';
$string['errorstring-autherror'] = 'Unauthorised to use sandbox';
$string['errorstring-jobe400'] = 'Error from Jobe sandbox server: ';
$string['errorstring-overload'] = 'Your answer could not be checked due to server overload. Please wait a moment and try again.';
$string['errorstring-pastenotfound'] = 'Requesting status of non-existent job';
$string['errorstring-wronglangid'] = 'Non-existent language requested';
$string['errorstring-accessdenied'] = 'Access to sandbox denied';
$string['errorstring-submissionlimitexceeded'] = 'Sandbox submission limit reached';
$string['errorstring-submissionfailed'] = 'Submission to sandbox failed';
$string['errorstring-unknown'] = 'Unexpected error while executing checks. The sandbox server may be down or overloaded. Perhaps try again shortly?';
$string['errorstring-timelimit'] = 'It took too long to grade your answer. Please wait a moment and try again, or ask the teacher for help.';

$string['graphcheckersettings'] = 'GraphChecker settings';
$string['graph_ui_invalidserialisation'] = 'GraphUI: invalid serialisation';

$string['highlight'] = 'Highlighting';
$string['highlight_help'] = 'Selecting these checkboxes allows the student to highlight nodes / edges in the graph. (This is most effective when Allowed edits is set to none, so that the student can highlight nodes / edges in the given graph without being allowed to modify the graph itself.)';

$string['jobe_apikey'] = 'Jobe API-key';
$string['jobe_apikey_desc'] = 'The API key to be included in all REST requests to the Jobe server (if required). Max 40 chars. Leave blank to omit the API Key from requests';
$string['jobe_host'] = 'Jobe server';
$string['jobe_host_desc'] = 'The host name of the Jobe server plus the port number if other than port 80, e.g. jobe.somewhere.edu:4010. The URL for the Jobe request is obtained by default by prefixing this string with http:// and appending /jobe/index.php/restapi/<REST_METHOD>. You may either specify the https:// protocol in front of the host name (e.g. https://jobe.somewhere.edu) if the Jobe server is set behind a reverse proxy which acts as an SSL termination.';

$string['lock_preload_box'] = 'Lock preload';
$string['lock_preload_box_help'] = 'Checking this box will make the preloaded answer uneditable. That is, the student will not be able to remove nodes and edges from the preload, or change their attributes. However, it is still possible to drag nodes from the preload around, and to add new edges between them.';

$string['options'] = 'Options';

$string['pluginname'] = 'GraphChecker';
$string['pluginnameadding'] = 'Adding a GraphChecker question';
$string['pluginnameediting'] = 'Editing a GraphChecker question';
$string['pluginnamesummary'] = 'Allows students to draw graphs and other discrete structures, which are graded automatically.';
$string['pluginname_help'] = 'Use the \'Answer type\' combo box to select the type of structure the student needs to construct to answer the question. Then, specify which checks need to be run to verify if the student\'s answer is correct.';
$string['pluginname_link'] = 'question/type/graphchecker';
$string['privacy:metadata'] = 'The GraphChecker question type plugin does not store any personal data.';

$string['reset'] = 'Reset answer';
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

$string['ui_fallback'] = 'Falling back to raw text area.';
$string['unserializefailed'] = 'Stored test results could not be deserialised. Perhaps try regrading?';

$string['validateonsave'] = 'Check sample answer on save';
$string['validateonsave_help'] = 'The <b>Copy from/to preload</b> buttons allow you to use the preloaded answer set above as a base for drawing the sample answer, or the other way round.<br>The <b>Check sample answer on save</b> checkbox, if checked, will validate that the checks pass for the sample answer when you save this question; this ensures that the sample answer is actually correct.';
$string['vertex_attributes'] = 'Node attributes';
$string['vertex_attributes_help'] = 'Specify which attributes nodes have: labels, colors, or both.';
$string['vertexedits'] = 'Allowed edits';
$string['vertexedits_help'] = 'Specify if students should be able to edit the nodes / edges of the preloaded graph. Various values are possible:<ul><li><b>none</b>: prohibit any edits (in this case you probably want to allow highlighting);<li><b>layout</b>: allow dragging the nodes / edges around, but nothing else;<li><b>attributes</b>: additionally allow changing vertex and edge labels, colors, etc.;<li><b>all</b>: allow all edits, including adding new nodes / edges or deleting existing ones.</ul>';

