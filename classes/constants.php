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
/*
 * @package    qtype
 * @subpackage coderunner
 * @copyright  2012, 2015 Richard Lobb, University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace qtype_graphchecker;
defined('MOODLE_INTERNAL') || die();


class constants {
    const TEMPLATE_LANGUAGE = 0;
    const USER_LANGUAGE = 1;
    const FUNC_MIN_LENGTH = 1;  // Minimum no. of bytes for a valid bit of code.

    const PRECHECK_DISABLED = 0;
    const PRECHECK_EMPTY = 1;
    const PRECHECK_EXAMPLES = 2;
    const PRECHECK_SELECTED = 3;
    const PRECHECK_ALL = 4;

    const TESTTYPE_NORMAL = 0;
    const TESTTYPE_PRECHECK = 1;
    const TESTTYPE_BOTH = 2;

    const FEEDBACK_USE_QUIZ = 0;
    const FEEDBACK_SHOW = 1;
    const FEEDBACK_HIDE = 2;

    const MAX_STRING_LENGTH = 8000;  // Maximum length of a string for display in the result table.
    const MAX_LINE_LENGTH = 100;     // Maximum length of a string for display in the result table.
    const MAX_NUM_LINES = 200;       // Maximum number of lines of text to be displayed a result table cell.
}
