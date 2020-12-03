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

/*
 * Setting definitions for GraphChecker. (Only the Jobe settings: URL and
 * API-key.)
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


$settings->add(new admin_setting_heading('graphcheckersettings',
        get_string('graphcheckersettings', 'qtype_graphchecker'), ''));

$settings->add(new admin_setting_configtext(
        "qtype_graphchecker/jobe_host",
        get_string('jobe_host', 'qtype_graphchecker'),
        get_string('jobe_host_desc', 'qtype_graphchecker'),
        ''));

$settings->add(new admin_setting_configtext(
        "qtype_graphchecker/jobe_apikey",
        get_string('jobe_apikey', 'qtype_graphchecker'),
        get_string('jobe_apikey_desc', 'qtype_graphchecker'),
        ''
        ));

