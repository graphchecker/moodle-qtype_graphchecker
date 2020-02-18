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
 * Upgrade code for the CodeRunner question type.
 *
 * @param $oldversion the version of this plugin we are upgrading from.
 * @return bool success/failure.
 */
defined('MOODLE_INTERNAL') || die();

function xmldb_qtype_graphchecker_upgrade($oldversion) {
    global $CFG, $DB;
    $dbman = $DB->get_manager();

    /*if ($oldversion < 2019111900) {

        // Conditionally drop the tests table.
        if ($dbman->table_exists('question_graphchecker_tests')) {
            $table = new xmldb_table('question_graphchecker_tests');
            $dbman->drop_table($table);
        }

        // Coderunner savepoint reached.
        upgrade_plugin_savepoint(true, 2019111900, 'qtype', 'graphchecker');
    }*/

    return true;
}
