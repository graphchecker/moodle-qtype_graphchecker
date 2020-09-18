/***********************************************************************
 *
 * Utility functions/data/constants for the ui_graph module.
 *
 ***********************************************************************/
// Most of this code is taken from Finite State Machine Designer:
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


define(function() {

    function Util() {
        // Constructor for the Util class.

        this.greekLetterNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
                                'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda',
                                'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma',
                                'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega' ];

        // A dictionary containing the color code and whether the color is considered dark or not of the specified color
        this.colors = {
            'black': {name: 'black', colorCode: '#444444', isDark: true},
            'red': {name: 'red', colorCode: '#fb9a99', isDark: false},
            'blue': {name: 'blue', colorCode: '#a6cee3', isDark: false},
            'green': {name: 'green', colorCode: '#b2df8a', isDark: false},
            'yellow': {name: 'yellow', colorCode: '#ffff99', isDark: false},
            'orange': {name: 'orange', colorCode: '#fdbf6f', isDark: false},
            'purple': {name: 'purple', colorCode: '#cab2d6', isDark: false},
            'white': {name: 'white', colorCode: '#ffffff', isDark: false},
        };
    }

    // An enum for defining the different colors that can be used to color vertices and/or edges
    Util.prototype.Color = Object.freeze({
        BLACK: 'black',
        RED: 'red',
        BLUE: 'blue',
        GREEN: 'green',
        YELLOW: 'yellow',
        ORANGE: 'orange',
        PURPLE: 'purple',
        WHITE: 'white',
    });

    // An enum for defining the type of the graph
    Util.prototype.Type = Object.freeze({
        UNDIRECTED: 'undirected',
        DIRECTED: 'directed',
        FSM: 'fsm',
        PETRI: 'petri'
    });

    // An enum for defining the type of edits that can be set to allowed or disallowed
    Util.prototype.Edit = Object.freeze({
        MOVE: 'move',
        ADD: 'add',
        DELETE: 'delete',
        VERTEX_LABELS: 'vertex_labels',
        EDGE_LABELS: 'edge_labels',
        VERTEX_COLORS: 'vertex_colors',
        EDGE_COLORS: 'edge_colors',
        FSM_FLAGS: 'fsm_flags',
        PETRI_MARKING: 'petri_marking'
    });

    // An enum for defining the node types of petri nets
    Util.prototype.PetriNodeType = Object.freeze({
        NONE: 'none',               // Indicates not a petri node
        PLACE: 'place',             // Indicates not a petri place
        TRANSITION: 'transition'    // Indicates not a petri transition
    });

    // An enum for defining the mode type of the graph UI
    Util.prototype.ModeType = Object.freeze({
        SELECT: 'select',           // Indicates that the UI is in select mode
        DRAW: 'draw'                // Indicates that the UI is in draw mode
    });

    // An enum for defining the type of the checkboxes graph UI
    Util.prototype.CheckboxType = Object.freeze({
        FSM_INITIAL: 'fsm_initial',         // Indicates that the checkbox controls the initial fsm state
        FSM_FINAL: 'fsm_final',             // Indicates that the checkbox controls the final fsm state
        HIGHLIGHT: 'highlight'               // Indicates that the checkbox controls the highlighted state
    });

    // An enum for defining the type of draw operations that can be done on objects
    Util.prototype.DrawOption = Object.freeze({
        OBJECT: 'object',           // Solely draw the object
        SELECTION: 'selection',     // Draw the object and a blue selection halo
        HOVER: 'hover'              // Draw a shadow vertex when hovering over an empty area
    });

    // A function to find the according color object from the given color code, if the object exists
    Util.prototype.colorObjectFromColorCode = function(colorCode) {
        for (let key in this.colors) {
            if (this.colors[key].colorCode === colorCode) {
                return this.colors[key];
            }
        }

        return null;
    };

    Util.prototype.convertLatexShortcuts = function(text) {
        // Html greek characters.
        for(var i = 0; i < this.greekLetterNames.length; i++) {
            var name = this.greekLetterNames[i];
            text = text.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + (i > 16)));
            text = text.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + (i > 16)));
        }

        // Subscripts.
        for(var i = 0; i < 10; i++) {
            text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
        }
        text = text.replace(new RegExp('_a', 'g'), String.fromCharCode(8336));
        return text;
    };

    Util.prototype.drawArrow = function(c, x, y, angle) {
        // Draw an arrow head on the graphics context c at (x, y) with given angle.

        var dx = Math.cos(angle);
        var dy = Math.sin(angle);
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
        c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
        c.fill();
    };

    Util.prototype.det = function(a, b, c, d, e, f, g, h, i) {
        // Determinant of given matrix elements.
        return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g;
    };

    Util.prototype.circleFromThreePoints = function(x1, y1, x2, y2, x3, y3) {
        // Return {x, y, radius} of circle through (x1, y1), (x2, y2), (x3, y3).
        var a = this.det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
        var bx = -this.det(x1 * x1 + y1 * y1, y1, 1, x2 * x2 + y2 * y2, y2, 1, x3 * x3 + y3 * y3, y3, 1);
        var by = this.det(x1 * x1 + y1 * y1, x1, 1, x2 * x2 + y2 * y2, x2, 1, x3 * x3 + y3 * y3, x3, 1);
        var c = -this.det(x1 * x1 + y1 * y1, x1, y1, x2 * x2 + y2 * y2, x2, y2, x3 * x3 + y3 * y3, x3, y3);
        return {
            'x': -bx / (2 * a),
            'y': -by / (2 * a),
            'radius': Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a))
        };
    };

    Util.prototype.degToRad = function(deg) {
        // Converts degrees to radians
        return deg * (Math.PI/180.0);
    };

    Util.prototype.isInside = function(pos, rect) {
        // True iff given point pos is inside rectangle.
        return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y;
    };

    Util.prototype.crossBrowserKey = function(e) {
        // Return which key was pressed, given the event, in a browser-independent way.
        e = e || window.event;
        return e.which || e.keyCode;
    };

    Util.prototype.mousePos = function(e) {
        let rect = e.target.getBoundingClientRect();
        return {
            'x': e.clientX - rect.x,
            'y': e.clientY - rect.y
        };
    };

    Util.prototype.calculateAngle = function(v1, v2) {
        // Return an angle a, where 0 <= a <= 2*PI, in radians
        return (Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x) + Math.PI) % (2*Math.PI);
    };

    Util.prototype.getAnglesOfIncidentLinks = function(links, vertex) {
        let angles = [];
        for (let i = 0; i < links.length; i++) {
            let nodeA = links[i].nodeA;
            let nodeB = links[i].nodeB;
            //TODO: rekening houden met self links, zit er op dit moment nog niet in
            if (nodeA === vertex || nodeB === vertex) {
                // Calculate the angle (in radians) of the point of the link touching the selected vertex's
                // circle with the selected node itself
                angles.push(links[i].calculateAngle(vertex));
            }
        }
        return angles;
    };

    Util.prototype.getAnglesStartLinkFSMOneIncident = function(oppositeAngle, divisibleRange, topLeft, nrDivisions) {
        // It is to be noted that this function expects an even number of divisions
        if (nrDivisions % 2 !== 0) {
            throw 'nrDivisions in Util.prototype.getAnglesBasedOnDivision() is not an even number.';
        }
        let angles = [];
        let range = (nrDivisions / 2) - 1;
        for (let i = -range; i <= range; i++) {
            let angle = (oppositeAngle + (i / nrDivisions) * divisibleRange) % (2*Math.PI);
            if (angle < 0) {
                angle += 2*Math.PI;
            }
            angles.push(angle);
        }
        return angles;
    };

    Util.prototype.getAnglesStartLinkFSMMultipleIncident = function(angles, topLeft, nrDivisions) {
        // Create, for each space between two incident links (occurring in the angles array), all possible angles
        // based on the division
        let candidateAngles = [];
        for (let i = 0; i < angles.length; i++) {
            let startAngle = angles[i];
            let endAngle = angles[i+1];
            if (i === angles.length-1) {
                // Special case for the last value in the array
                endAngle = angles[0] + 2*Math.PI;
            }

            let averageAngle = (startAngle + endAngle) / 2.0;
            let divisibleRange = Math.abs(startAngle - endAngle);
            let foundAngles = this.getAnglesStartLinkFSMOneIncident(averageAngle, divisibleRange, topLeft, nrDivisions);
            for (let j = 0; j < foundAngles.length; j++) {
                candidateAngles.push(foundAngles[j]);
            }
        }
        return candidateAngles;
    };

    Util.prototype.filterOutCloseAngles = function(candidateAngles, fixedAngles, proximityPercentage) {
        // Filters out the angles in the possibleAngles array that are too close to angles in the fixedAngles array
        // An angle is deemed to close if it is withing proximityPercentage% of 2*Math.PI of another angle
        let validAngles = [];
        for (let i = 0; i < candidateAngles.length; i++) {
            let isValid = true;
            for (let j = 0; j < fixedAngles.length; j++) {
                let proximity = Math.abs(fixedAngles[j] - candidateAngles[i]);
                if (proximity < proximityPercentage * 2*Math.PI) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                validAngles.push(candidateAngles[i]);
            }
        }

        return validAngles;
    };

    Util.prototype.getAngleMaximumMinimumProximity = function(candidateAngles, angles) {
        let maximumSpace = 0;
        let candidateAngle = candidateAngles[0];
        for (let i = 0; i < candidateAngles.length; i++) {
            let minimumProximity = Number.MAX_SAFE_INTEGER;
            for (let j = 0; j < angles.length; j++) {
                let proximity = Math.abs(angles[j] - candidateAngles[i]);
                if (proximity < minimumProximity) {
                    minimumProximity = proximity;
                }
            }

            if (minimumProximity > maximumSpace) {
                maximumSpace = minimumProximity;
                candidateAngle = candidateAngles[i];
            }
        }

        return candidateAngle;
    };

    Util.prototype.quadraticFormula = function(a, b, c) {
        let D = Math.pow(b, 2) - 4*a*c;

        let res1 = (-b - Math.sqrt(D))/(2*a);
        let res2 = (-b + Math.sqrt(D))/(2*a);
        return [res1, res2];
    };

    // Function used to calculate information about the link. I.e. it calculates both the start and end point of the
    // link, and the start and end angles.
    // This code was originally written in the function graphelements.getEndPointsAndCircle()
    Util.prototype.calculateLinkInfo = function(nodeA, nodeB, circle, reverseScale, distance) {
        let rRatio = reverseScale * distance / circle.radius;
        let startAngle = Math.atan2(nodeA.y - circle.y, nodeA.x - circle.x) - rRatio;
        let endAngle = Math.atan2(nodeB.y - circle.y, nodeB.x - circle.x) + rRatio;
        let startX = circle.x + circle.radius * Math.cos(startAngle);
        let startY = circle.y + circle.radius * Math.sin(startAngle);
        let endX = circle.x + circle.radius * Math.cos(endAngle);
        let endY = circle.y + circle.radius * Math.sin(endAngle);

        return {startAngle: startAngle, endAngle: endAngle, startX: startX, startY: startY, endX: endX, endY:endY};
    };

    // Function used to test whether rectInner (rectangle) lies completely inside rectOuter (rectangle)
    // Rect1 and rect2 are both of the form: [{x: corner1X, y: corner1Y}, {x: corner2X, y: corner2Y}]
    Util.prototype.isRectInsideRect = function(rectOuter, rectInner) {
        // Find out top-left and bottom-right corner of rectOuter
        // Determine the lowest and highest x and y coordinates of the outer rectangle
        let minXRectOuter, maxXRectOuter;
        if (rectOuter[0].x <= rectOuter[1].x) {
            minXRectOuter = rectOuter[0].x;
            maxXRectOuter = rectOuter[1].x;
        } else {
            minXRectOuter = rectOuter[1].x;
            maxXRectOuter = rectOuter[0].x;
        }

        let minYRectOuter, maxYRectOuter;
        if (rectOuter[0].y <= rectOuter[1].y) {
            minYRectOuter = rectOuter[0].y;
            maxYRectOuter = rectOuter[1].y;
        } else {
            minYRectOuter = rectOuter[1].y;
            maxYRectOuter = rectOuter[0].y;
        }

        // Now check if each point of the inner rectangle lies within these coordinates
        return (minXRectOuter <= rectInner[0].x && rectInner[0].x <= maxXRectOuter &&
            minXRectOuter <= rectInner[1].x && rectInner[1].x <= maxXRectOuter &&
            minYRectOuter <= rectInner[0].y && rectInner[0].y <= maxYRectOuter &&
            minYRectOuter <= rectInner[1].y && rectInner[1].y <= maxYRectOuter);
    };

    // Checks if all elements in a1 occur in a2, and vice versa
    // This function assumes that both arrays do not have repeating elements, and are of equal length
    Util.prototype.checkSameElementsArrays = function(a1, a2) {
        if (a1.length !== a2.length) {
            return false;
        }

        for (let i = 0; i < a1.length; i++) {
            if (!a1.includes(a2[i]) || !a2.includes(a1[i])) {
                return false;
            }
        }

        return true;
    };

    return new Util();
});
