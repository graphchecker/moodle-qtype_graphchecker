/******************************************************************************
 *
 * A module for use by ui_graph, defining (generic) graph elements
 *
 ******************************************************************************/
// This code is a modified version of Finite State Machine Designer
// (http://madebyevan.com/fsm/)
/*
 Finite State Machine Designer (http://madebyevan.com/fsm/)
 License: MIT License (see below)
 Copyright (c) 2010 Evan Wallace
 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:
 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more util.details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
/**
 * Implementation of the graph editor, which is used both in the question
 * editing page and in the student question submission page.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil'],
    function($, globals, util) {

    /***********************************************************************
     *
     * Define a generic class for graph elements
     *
     ***********************************************************************/
    function GraphElement(parent) {
        this.parent = parent; // The ui_graph instance

        this.locked = false; // Whether this element is locked or not
        this.hasMoved = false; // Whether the element has moved or not

        this.text = ''; // The (user-entered) text for this element
        this.isHighlighted = false; // Whether the element is highlighted or not
        this.colorObject = null; // The applicable colors to this element
    }

    GraphElement.prototype.resetHasMoved = function() {
        this.hasMoved = false;
    };

    return {
        GraphElement: GraphElement
    };
});
