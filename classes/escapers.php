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
 * coderunner escape functions for use with the Twig template library
 *
 * @package    qtype
 * @subpackage coderunner
 * @copyright  Richard Lobb, 2011, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// This class wraps the various escaper functions required by Twig.
class qtype_graphchecker_escapers {

    /**
     * An escaper for user with Python triple-doublequote delimiters. Escapes only
     * double quote characters plus backslashes.
     * @param type $environ   The Twig environment (currently ignored)
     * @param type $s         The string to convert
     * @param type $charset   The charset (currenly ignored)
     * @return typestudentanswervar
     */
    public static function python($environ, $s, $charset) {
        return str_replace('"', '\"', str_replace('\\', '\\\\', $s));
    }
}

