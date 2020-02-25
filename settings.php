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
 * Configuration settings declaration information for the CodeRunner question type.
 *
 * @package    qtype
 * @subpackage coderunner
 * @copyright  2014 Richard Lobb, The University of Canterbury.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$settings->add(new admin_setting_heading('graphcheckersettings',
        get_string('graphcheckersettings', 'qtype_graphchecker'), ''));

$sandboxes = qtype_graphchecker_sandbox::available_sandboxes();
foreach ($sandboxes as $sandbox => $classname) {
    $settings->add(new admin_setting_configcheckbox(
        "qtype_graphchecker/{$sandbox}_enabled",
        get_string('enable', 'qtype_graphchecker') . ' ' .$sandbox,
        get_string('enable_sandbox_desc', 'qtype_graphchecker'),
        $sandbox === 'jobesandbox')  // Only jobesandbox is enabled by default.
    );
}

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

$settings->add(new admin_setting_configtext(
        "qtype_graphchecker/ideone_user",
        get_string('ideone_user', 'qtype_graphchecker'),
        get_string('ideone_user_desc', 'qtype_graphchecker'),
        ''));

$settings->add(new admin_setting_configtext(
        "qtype_graphchecker/ideone_password",
        get_string('ideone_pass', 'qtype_graphchecker'),
        get_string('ideone_pass_desc', 'qtype_graphchecker'),
        ''));
