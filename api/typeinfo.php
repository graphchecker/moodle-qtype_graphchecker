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
 * AJAX script to return information (most notably, the available checks) for
 * an answer type.
 *
 * When the question editing form is loaded, it is provided with a list of
 * the available checks and the UI params for the answer type of the question
 * that is being edited. However, when the user changes the answer type, this
 * information needs to be updated dynamically. That is what this script is
 * for.
 *
 * The JavaScript for the editing page calls this script with the new answer
 * type as a parameter. This script then responds with a JSON object with the
 * necessary information.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once('../../../../config.php');
require_once($CFG->dirroot . '/question/engine/lib.php');
require_once($CFG->dirroot . '/question/type/graphchecker/question.php');

require_login();

$type = required_param('answertype', PARAM_RAW_TRIMMED);

header('Content-type: application/json; charset=utf-8');

$types = qtype_graphchecker_util::get_type_data();
$response = $types[$type];
$response['available_checks'] = qtype_graphchecker_check::get_available_checks($type);
echo(json_encode($response));

die();

