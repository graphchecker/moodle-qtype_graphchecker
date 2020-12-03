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

/**
 * Upgrade code for the GraphChecker question type.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

function xmldb_qtype_graphchecker_upgrade($oldversion) {
    global $CFG, $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2020080400) {
        $table = new xmldb_table('question_graphchecker_opts');

        // Conditionally launch add field allowed_vertex_edits.
        $field = new xmldb_field('allowed_vertex_edits', XMLDB_TYPE_TEXT, null, null, null, null, null, 'checks');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field allowed_edge_edits.
        $field = new xmldb_field('allowed_edge_edits', XMLDB_TYPE_TEXT, null, null, null, null, null, 'allowed_vertex_edits');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field vertex_highlight.
        $field = new xmldb_field('vertex_highlight', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0', 'allowed_edge_edits');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field edge_highlight.
        $field = new xmldb_field('edge_highlight', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0', 'vertex_highlight');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field vertex_labels.
        $field = new xmldb_field('vertex_labels', XMLDB_TYPE_TEXT, null, null, null, null, null, 'edge_highlight');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field edge_labels.
        $field = new xmldb_field('edge_labels', XMLDB_TYPE_TEXT, null, null, null, null, null, 'vertex_labels');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Graphchecker savepoint reached.
        upgrade_plugin_savepoint(true, 2020080400, 'qtype', 'graphchecker');
    }

    if ($oldversion < 2020100700) {
        $table = new xmldb_table('question_graphchecker_opts');

        // Conditionally launch add field vertex_highlight.
        $field = new xmldb_field('lock_preload', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0', 'edge_labels');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Graphchecker savepoint reached.
        upgrade_plugin_savepoint(true, 2020100700, 'qtype', 'graphchecker');
    }

    if ($oldversion < 2020102800) {
        $table = new xmldb_table('question_graphchecker_opts');

        // Conditionally launch add field vertex_attr_labels.
        $field = new xmldb_field('vertex_attr_labels', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '1', 'lock_preload');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field edge_attr_labels.
        $field = new xmldb_field('edge_attr_labels', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '1', 'lock_preload');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field vertex_attr_colors.
        $field = new xmldb_field('vertex_attr_colors', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '1', 'lock_preload');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Conditionally launch add field edge_attr_colors.
        $field = new xmldb_field('edge_attr_colors', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '1', 'lock_preload');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Graphchecker savepoint reached.
        upgrade_plugin_savepoint(true, 2020102800, 'qtype', 'graphchecker');
    }

    return true;
}
