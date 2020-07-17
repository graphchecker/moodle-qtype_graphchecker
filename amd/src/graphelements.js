/******************************************************************************
 *
 * A module for use by ui_graph, defining classes Node, Link, SelfLink,
 * StartLink and TemporaryLink
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


define(['jquery', 'qtype_graphchecker/graphutil'], function($, util) {

    // An enum for defining the node types of petri nets
    const PetriNodeType = Object.freeze({
        NONE: 'none',               // Indicates not a petri node
        PLACE: 'place',             // Indicates not a petri place
        TRANSITION: 'transition'    // Indicates not a petri transition
    });

    // An enum for defining the mode type of the graph UI
    const ModeType = Object.freeze({
        SELECT: 'select',           // Indicates that the UI is in select mode
        DRAW: 'draw'                // Indicates that the UI is in draw mode
    });

    // An enum for defining the type of the checkboxes graph UI
    const CheckboxType = Object.freeze({
        FSM_INITIAL: 'fsm_initial',         // Indicates that the checkbox controls the initial fsm state
        FSM_FINAL: 'fsm_final'             // Indicates that the checkbox controls the final fsm state
    });

    /***********************************************************************
     *
     * Define a class Node that represents a node in a graph
     *
     ***********************************************************************/

    function Node(parent, x, y) {
        this.parent = parent;  // The ui_graph instance.
        this.x = x;
        this.y = y;
        this.mouseOffsetX = 0;
        this.mouseOffsetY = 0;
        this.isInitial = false;
        this.isFinal = false;
        // When in Petri mode, this variable denotes whether the node is a place or a transition:
        this.petriNodeType = PetriNodeType.NONE; //TODO: create a new subtype of node perhaps?
        this.petriTokens = 0;
        this.text = '';
    }

    // At the start of a drag, record our position relative to the mouse.
    Node.prototype.setMouseStart = function(mouseX, mouseY) {
        this.mouseOffsetX = this.x - mouseX;
        this.mouseOffsetY = this.y - mouseY;
    };

    Node.prototype.setAnchorPoint = function(x, y) {
        this.x = x + this.mouseOffsetX;
        this.y = y + this.mouseOffsetY;
    };

    // Given a new mouse position during a drag, move to the appropriate
    // new position.
    Node.prototype.trackMouse = function(mouseX, mouseY) {
        this.x = this.mouseOffsetX + mouseX;
        this.y = this.mouseOffsetY + mouseY;
    };

    Node.prototype.draw = function(c) {
        // Draw the circle.
        c.beginPath();
        if (this.petriNodeType === PetriNodeType.NONE || this.petriNodeType === PetriNodeType.PLACE) {
            c.arc(this.x, this.y, this.parent.nodeRadius(), 0, 2 * Math.PI, false);
        } else if (this.petriNodeType === PetriNodeType.TRANSITION) {
            c.rect(this.x - this.parent.nodeRadius(), this.y - this.parent.nodeRadius(),
                this.parent.nodeRadius()*2, this.parent.nodeRadius()*2);
        }
        c.stroke();

        // Draw the label.
        this.parent.drawText(this, this.text, this.x, this.y, null);

        if (this.petriNodeType === PetriNodeType.PLACE && this.petriTokens > 0) {
            // Draw the token values.
            this.parent.drawText(null, this.petriTokens.toString(), this.x, this.y, null);
        }

        // Draw a double circle for an accept state.
        if(this.isFinal) {
            c.beginPath();
            c.arc(this.x, this.y, this.parent.nodeRadius() - 6, 0, 2 * Math.PI, false);
            c.stroke();
        }
    };

    Node.prototype.closestPointOnNode = function(x, y) {
        let dx = x - this.x;
        let dy = y - this.y;
        if (this.petriNodeType !== PetriNodeType.TRANSITION) {
            // Calculate the closest point on the node's circle
            let scale = Math.sqrt(dx * dx + dy * dy);
            return {
                x: this.x + dx * this.parent.nodeRadius() / scale,
                y: this.y + dy * this.parent.nodeRadius() / scale,
            };
        } else {
            // Calculate the closest point on the node's square
            // Calculate the angle between the vector of the link's midpoint (x, y) and the midpoint of the node, and
            // the right vector (1, 0)
            let nodeToLinkVector = {
                x: dx,
                y: dy
            };
            let rightVector = {
                x: 1,
                y: 0
            };
            let angle = util.calculateAngle(nodeToLinkVector, rightVector);

            // Determine the equation of the line of the link's midpoint to the node's midpoint, in the form:
            // y = a*x + b
            let a = nodeToLinkVector.y/nodeToLinkVector.x;
            let b = y - a*x;

            // The length of half the side of the square
            let sideHalfLength = this.parent.nodeRadius();
            let xRes, yRes;
            if (angle < util.degToRad(45) || angle >= util.degToRad(315)) {
                xRes = this.x - sideHalfLength;
                yRes = a*xRes + b;
            } else if (util.degToRad(45) <= angle && angle < util.degToRad(135)) {
                yRes = this.y + sideHalfLength;
                if (Math.abs(a) !== Infinity) {
                    xRes = (yRes - b) / a;
                } else {
                    xRes = this.x;
                }
            } else if (util.degToRad(135) <= angle && angle < util.degToRad(225)) {
                xRes = this.x + sideHalfLength;
                yRes = a*xRes + b;
            } else if (util.degToRad(225) <= angle && angle < util.degToRad(315)) {
                yRes = this.y - sideHalfLength;
                if (Math.abs(a) !== Infinity) {
                    xRes = (yRes - b) / a;
                } else {
                    xRes = this.x;
                }
            }

            return {
                x: xRes,
                y: yRes,
            };
        }
    };

    // Method of a Node, being of PetriNodeType 'TRANSITION', that given a circle, calculates
    // the points of intersection
    Node.prototype.calculateIntersectionsCircle = function(circleX, circleY, circleR) {
        if (this.petriNodeType !== PetriNodeType.TRANSITION) {
            // Currently no functionality is implemented to calculate the intersections of
            // non 'TRANSITION' type nodes
            return;
        }
        // The half side length of the square
        let halfSideLength = this.parent.nodeRadius();

        // An array of valid points at which the circle intersects the square
        let points = [];

        // Intersections of the circle, in the form (x-circleX)^2 + (y-circleY)^2 - circleR^2 = 0,
        // with the top side of the square. Using the Quadratic Formula (i.e. the abc formula)
        let y = this.y - halfSideLength;
        let a = 1;
        let b = -circleX*2;
        let c = Math.pow(circleX, 2) + Math.pow(y - circleY, 2) - Math.pow(circleR, 2);
        let results = util.quadraticFormula(a, b, c);
        for (let i = 0; i < 2; i++) {
            if (this.x - halfSideLength <= results[i] && results[i] <= this.x + halfSideLength) {
                points.push({x: results[i], y: y});
            }
        }

        // Intersections with the bottom side. The variables a and b remain the same
        y = this.y + halfSideLength;
        c = Math.pow(circleX, 2) + Math.pow(y - circleY, 2) - Math.pow(circleR, 2);
        results = util.quadraticFormula(a, b, c);
        for (let i = 0; i < 2; i++) {
            if (this.x - halfSideLength <= results[i] && results[i] <= this.x + halfSideLength) {
                points.push({x: results[i], y: y});
            }
        }

        // Intersections with the right side
        let x = this.x + halfSideLength;
        a = 1;
        b = -circleY*2;
        c = Math.pow(x - circleX, 2) + Math.pow(circleY, 2) - Math.pow(circleR, 2);
        results = util.quadraticFormula(a, b, c);
        for (let i = 0; i < 2; i++) {
            if (this.y - halfSideLength <= results[i] && results[i] <= this.y + halfSideLength) {
                points.push({x: x, y: results[i]});
            }
        }

        // Intersections with the left side. The variables a and b remain the same
        x = this.x - halfSideLength;
        c = Math.pow(x - circleX, 2) + Math.pow(circleY, 2) - Math.pow(circleR, 2);
        results = util.quadraticFormula(a, b, c);
        for (let i = 0; i < 2; i++) {
            if (this.y - halfSideLength <= results[i] && results[i] <= this.y + halfSideLength) {
                points.push({x: x, y: results[i]});
            }
        }

        return points;
    };

    Node.prototype.getadjustedLinkInfo = function(circle, linkInfo, reverseScale, nodeA, nodeB, isStart) {
        // Calculate the intersections of the circle with the square
        let intersections = this.calculateIntersectionsCircle(circle.x, circle.y, circle.radius);

        // Choose the one which is the closest to the original location of the intersection with the circle
        let closestPoint = null;
        let closestPointDistance = Infinity;
        for (let i = 0; i < intersections.length; i++) {
            let dx, dy;
            if (isStart) {
                dx = linkInfo.startX - intersections[i].x;
                dy = linkInfo.startY - intersections[i].y;
            } else {
                dx = linkInfo.endX - intersections[i].x;
                dy = linkInfo.endY - intersections[i].y;
            }
            let dist = Math.sqrt( Math.pow(dx, 2) + Math.pow(dy, 2));
            if (dist < closestPointDistance) {
                closestPointDistance = dist;
                closestPoint = intersections[i];
            }
        }

        // Recalculate other variables,
        // using the distance from this node, the TRANSITION node, to the calculated closest point
        if (closestPoint !== null) {
            let dx = this.x - closestPoint.x;
            let dy = this.y - closestPoint.y;
            let transitionNodeDist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            let adjustedLinkInfo = util.calculateLinkInfo(nodeA, nodeB, circle, reverseScale, transitionNodeDist);
            if (isStart) {
                linkInfo.startAngle = adjustedLinkInfo.startAngle;
                linkInfo.startX = adjustedLinkInfo.startX;
                linkInfo.startY = adjustedLinkInfo.startY;
            } else {
                linkInfo.endAngle = adjustedLinkInfo.endAngle;
                linkInfo.endX = adjustedLinkInfo.endX;
                linkInfo.endY = adjustedLinkInfo.endY;
            }
        }

        return linkInfo;
    };

    Node.prototype.containsPoint = function(x, y) {
        let radius = this.parent.nodeRadius() + this.parent.HIT_TARGET_PADDING;
        if (this.petriNodeType !== PetriNodeType.TRANSITION) {
            // Check for a circle
            return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) <= radius * radius;
        } else {
            // Check for a square
            return this.x - radius <= x && x <= this.x + radius && this.y - radius <= y && y <= this.y + radius;
        }
    };

    // Method of a Node that, given a list of all links in a graph, returns
    // a list of any nodes that contain a link to this node (excluding StartLinks
    // and SelfLinks).
    Node.prototype.neighbours = function(links) {
        var neighbours = [], link;
        for (var i = 0; i < links.length; i++) {
            link = links[i];
            if (link instanceof Link) { // Exclude SelfLinks and StartLinks.
                if (link.nodeA === this && !neighbours.includes(link.nodeB)) {
                    neighbours.push(link.nodeB);
                } else if (link.nodeB === this && !neighbours.includes(link.nodeA)) {
                    neighbours.push(link.nodeA);
                }
            }
        }
        return neighbours;
    };

    // A function returning whether or not the node has any incoming start links
    Node.prototype.hasStartLink = function(links) {
        let hasStartLink = false;
        for (let i = 0; i < links.length; i++) {
            if (links[i] instanceof StartLink && links[i].node === this) {
                hasStartLink = true;
                break;
            }
        }
        return hasStartLink;
    };

    // Method of Node that traverses a graph defined by a given set of links
    // starting at 'this' node and updating the visited list for each new
    // node. Returns the updated visited list, which (for the root call)
    // is a list of all nodes connected to the given start node.
    Node.prototype.traverseGraph = function(links, visited) {
        var neighbours,
            neighbour;
        if (!visited.includes(this)) {
            visited.push(this);
            neighbours = this.neighbours(links);
            for (var i = 0; i < neighbours.length; i++) {
                neighbour = neighbours[i];
                if (!visited.includes(neighbour)) {
                    neighbour.traverseGraph(links, visited);
                }
            }
        }
        return visited;
    };

    /***********************************************************************
     *
     * Define a class Link that represents a connection between two nodes.
     *
     ***********************************************************************/
    function Link(parent, a, b) {
        this.parent = parent;  // The parent ui_digraph instance.
        this.nodeA = a;
        this.nodeB = b;
        this.text = '';
        this.lineAngleAdjust = 0; // Value to add to textAngle when link is straight line.

        // Make anchor point relative to the locations of nodeA and nodeB.
        this.parallelPart = 0.5;    // Percentage from nodeA to nodeB.
        this.perpendicularPart = 0; // Pixels from line between nodeA and nodeB.
    }

    Link.prototype.getAnchorPoint = function() {
        var dx = this.nodeB.x - this.nodeA.x;
        var dy = this.nodeB.y - this.nodeA.y;
        var scale = Math.sqrt(dx * dx + dy * dy);
        return {
            'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
            'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
        };
    };

    // Method to set the anchor point of a link. It returns whether the link is snapped (true) or not (false)
    Link.prototype.setAnchorPoint = function(x, y) {
        var dx = this.nodeB.x - this.nodeA.x;
        var dy = this.nodeB.y - this.nodeA.y;
        var scale = Math.sqrt(dx * dx + dy * dy);
        this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
        this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
        // Snap to a straight line.
        if(this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < this.parent.SNAP_TO_PADDING) {
            this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
            this.perpendicularPart = 0;
            return true;
        } else {
            return false;
        }
    };

    Link.prototype.getEndPointsAndCircle = function() {
        if(this.perpendicularPart === 0) {
            var midX = (this.nodeA.x + this.nodeB.x) / 2;
            var midY = (this.nodeA.y + this.nodeB.y) / 2;
            var start = this.nodeA.closestPointOnNode(midX, midY);
            var end = this.nodeB.closestPointOnNode(midX, midY);
            return {
                'hasCircle': false,
                'startX': start.x,
                'startY': start.y,
                'endX': end.x,
                'endY': end.y,
            };
        }
        var anchor = this.getAnchorPoint();
        var circle = util.circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
        var isReversed = (this.perpendicularPart > 0);
        var reverseScale = isReversed ? 1 : -1;
        let linkInfo = util.calculateLinkInfo(this.nodeA, this.nodeB, circle, reverseScale, this.parent.nodeRadius());
        // If the start node is a TRANSITION node, adjust the start of the link
        if (this.nodeA.petriNodeType === PetriNodeType.TRANSITION) {
            linkInfo = this.nodeA.getadjustedLinkInfo(circle, linkInfo, reverseScale, this.nodeA, this.nodeB, true);
        }
        // If the end node is a TRANSITION node
        if (this.nodeB.petriNodeType === PetriNodeType.TRANSITION) {
            linkInfo = this.nodeB.getadjustedLinkInfo(circle, linkInfo, reverseScale, this.nodeA, this.nodeB, false);
        }
        return {
            'hasCircle': true,
            'startX': linkInfo.startX,
            'startY': linkInfo.startY,
            'endX': linkInfo.endX,
            'endY': linkInfo.endY,
            'startAngle': linkInfo.startAngle,
            'endAngle': linkInfo.endAngle,
            'circleX': circle.x,
            'circleY': circle.y,
            'circleRadius': circle.radius,
            'reverseScale': reverseScale,
            'isReversed': isReversed,
        };
    };

    Link.prototype.draw = function(c) {
        var linkInfo = this.getEndPointsAndCircle(), textX, textY, textAngle;
        // Draw arc.
        c.beginPath();
        if(linkInfo.hasCircle) {
            c.arc(linkInfo.circleX,
                  linkInfo.circleY,
                  linkInfo.circleRadius,
                  linkInfo.startAngle,
                  linkInfo.endAngle,
                  linkInfo.isReversed);
        } else {
            c.moveTo(linkInfo.startX, linkInfo.startY);
            c.lineTo(linkInfo.endX, linkInfo.endY);
        }
        c.stroke();
        // Draw the head of the arrow.
        if(linkInfo.hasCircle) {
            this.parent.arrowIfReqd(c,
                      linkInfo.endX,
                      linkInfo.endY,
                      linkInfo.endAngle - linkInfo.reverseScale * (Math.PI / 2));
        } else {
            this.parent.arrowIfReqd(c,
                      linkInfo.endX,
                      linkInfo.endY,
                      Math.atan2(linkInfo.endY - linkInfo.startY, linkInfo.endX - linkInfo.startX));
        }
        // Draw the text.
        if(linkInfo.hasCircle) {
            var startAngle = linkInfo.startAngle;
            var endAngle = linkInfo.endAngle;
            if(endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }
            textAngle = (startAngle + endAngle) / 2 + linkInfo.isReversed * Math.PI;
            textX = linkInfo.circleX + linkInfo.circleRadius * Math.cos(textAngle);
            textY = linkInfo.circleY + linkInfo.circleRadius * Math.sin(textAngle);
            this.parent.drawText(this, this.text, textX, textY, textAngle);
        } else {
            textX = (linkInfo.startX + linkInfo.endX) / 2;
            textY = (linkInfo.startY + linkInfo.endY) / 2;
            textAngle = Math.atan2(linkInfo.endX - linkInfo.startX, linkInfo.startY - linkInfo.endY);
            this.parent.drawText(this, this.text, textX, textY, textAngle + this.lineAngleAdjust);
        }
    };

    Link.prototype.containsPoint = function(x, y) {
        var linkInfo = this.getEndPointsAndCircle(), dx, dy, distance;
        if(linkInfo.hasCircle) {
            dx = x - linkInfo.circleX;
            dy = y - linkInfo.circleY;
            distance = Math.sqrt(dx * dx + dy * dy) - linkInfo.circleRadius;
            if(Math.abs(distance) < this.parent.HIT_TARGET_PADDING) {
                var angle = Math.atan2(dy, dx);
                var startAngle = linkInfo.startAngle;
                var endAngle = linkInfo.endAngle;
                if(linkInfo.isReversed) {
                    var temp = startAngle;
                    startAngle = endAngle;
                    endAngle = temp;
                }
                if(endAngle < startAngle) {
                    endAngle += Math.PI * 2;
                }
                if(angle < startAngle) {
                    angle += Math.PI * 2;
                } else if(angle > endAngle) {
                    angle -= Math.PI * 2;
                }
                return (angle > startAngle && angle < endAngle);
            }
        } else {
            dx = linkInfo.endX - linkInfo.startX;
            dy = linkInfo.endY - linkInfo.startY;
            var length = Math.sqrt(dx * dx + dy * dy);
            var percent = (dx * (x - linkInfo.startX) + dy * (y - linkInfo.startY)) / (length * length);
            distance = (dx * (y - linkInfo.startY) - dy * (x - linkInfo.startX)) / length;
            return (percent > 0 && percent < 1 && Math.abs(distance) < this.parent.HIT_TARGET_PADDING);
        }
        return false;
    };

    Link.prototype.calculateAngle = function(node) {
        // Calculates the angle in radians of the point of the link touching the selected node's circle with
        // the selected node itself
        let linkPoint = {};
        let linkInfo = this.getEndPointsAndCircle();

        if (this.nodeA === node) {
            // If the link originates in the node
            linkPoint.x = linkInfo.startX;
            linkPoint.y = linkInfo.startY;
        } else if (this.nodeB === node) {
            // If the link ends in the node
            linkPoint.x = linkInfo.endX;
            linkPoint.y = linkInfo.endY;
        } else {
            // The link is not connected to the input node
            return;
        }

        let nodeToLinkVector = {
            x: node.x - linkPoint.x,
            y: node.y - linkPoint.y
        };
        let rightVector = {
            x: 1,
            y: 0
        };

        return util.calculateAngle(nodeToLinkVector, rightVector);
    };

    /***********************************************************************
     *
     * Define a class SelfLink that represents a connection from a node back
     * to itself.
     *
     ***********************************************************************/

    function SelfLink(parent, node, mouse) {
        this.parent = parent;
        this.node = node;
        this.anchorAngle = 0;
        this.mouseOffsetAngle = 0;
        this.text = '';

        if(mouse) {
            this.setAnchorPoint(mouse.x, mouse.y);
        }
    }

    SelfLink.prototype.setMouseStart = function(x, y) {
        this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
    };

    SelfLink.prototype.setAnchorPoint = function(x, y) {
        this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
        // Snap to 90 degrees.
        var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
        if(Math.abs(this.anchorAngle - snap) < 0.1) {
            this.anchorAngle = snap;
        }
        // Keep in the range -pi to pi so our containsPoint() function always works.
        if(this.anchorAngle < -Math.PI) {
            this.anchorAngle += 2 * Math.PI;
        }
        if(this.anchorAngle > Math.PI) {
            this.anchorAngle -= 2 * Math.PI;
        }
    };

    SelfLink.prototype.getEndPointsAndCircle = function() {
        var circleX = this.node.x + 1.5 * this.parent.nodeRadius() * Math.cos(this.anchorAngle);
        var circleY = this.node.y + 1.5 * this.parent.nodeRadius() * Math.sin(this.anchorAngle);
        var circleRadius = 0.75 * this.parent.nodeRadius();
        var startAngle = this.anchorAngle - Math.PI * 0.8;
        var endAngle = this.anchorAngle + Math.PI * 0.8;
        var startX = circleX + circleRadius * Math.cos(startAngle);
        var startY = circleY + circleRadius * Math.sin(startAngle);
        var endX = circleX + circleRadius * Math.cos(endAngle);
        var endY = circleY + circleRadius * Math.sin(endAngle);
        return {
            'hasCircle': true,
            'startX': startX,
            'startY': startY,
            'endX': endX,
            'endY': endY,
            'startAngle': startAngle,
            'endAngle': endAngle,
            'circleX': circleX,
            'circleY': circleY,
            'circleRadius': circleRadius
        };
    };

    SelfLink.prototype.draw = function(c) {
        var linkInfo = this.getEndPointsAndCircle();
        // Draw arc.
        c.beginPath();
        c.arc(linkInfo.circleX, linkInfo.circleY, linkInfo.circleRadius, linkInfo.startAngle, linkInfo.endAngle, false);
        c.stroke();
        // Draw the text on the loop farthest from the node.
        var textX = linkInfo.circleX + linkInfo.circleRadius * Math.cos(this.anchorAngle);
        var textY = linkInfo.circleY + linkInfo.circleRadius * Math.sin(this.anchorAngle);
        this.parent.drawText(this, this.text, textX, textY, this.anchorAngle);
        // Draw the head of the arrow.
        this.parent.arrowIfReqd(c, linkInfo.endX, linkInfo.endY, linkInfo.endAngle + Math.PI * 0.4);
    };

    SelfLink.prototype.containsPoint = function(x, y) {
        var linkInfo = this.getEndPointsAndCircle();
        var dx = x - linkInfo.circleX;
        var dy = y - linkInfo.circleY;
        var distance = Math.sqrt(dx * dx + dy * dy) - linkInfo.circleRadius;
        return (Math.abs(distance) < this.parent.HIT_TARGET_PADDING);
    };

    /***********************************************************************
     *
     * Define a class StartLink that represents a start link in a finite
     * state machine. Not useful in general digraphs.
     *
     ***********************************************************************/
    function StartLink(parent, node, start) {
        this.parent = parent;
        this.node = node;
        this.deltaX = 0;
        this.deltaY = 0;

        if(start) {
            this.setAnchorPoint(start.x, start.y);
        }
    }

    StartLink.prototype.setAnchorPoint = function(x, y) {
        this.deltaX = x - this.node.x;
        this.deltaY = y - this.node.y;

        if(Math.abs(this.deltaX) < this.parent.SNAP_TO_PADDING) {
            this.deltaX = 0;
        }

        if(Math.abs(this.deltaY) < this.parent.SNAP_TO_PADDING) {
            this.deltaY = 0;
        }
    };

    StartLink.prototype.getEndPoints = function() {
        var startX = this.node.x + this.deltaX;
        var startY = this.node.y + this.deltaY;
        var end = this.node.closestPointOnNode(startX, startY);
        return {
            'startX': startX,
            'startY': startY,
            'endX': end.x,
            'endY': end.y,
        };
    };

    StartLink.prototype.draw = function(c) {
        var endPoints = this.getEndPoints();

        // Draw the line.
        c.beginPath();
        c.moveTo(endPoints.startX, endPoints.startY);
        c.lineTo(endPoints.endX, endPoints.endY);
        c.stroke();

        // Draw the head of the arrow.
        this.parent.arrowIfReqd(c, endPoints.endX, endPoints.endY, Math.atan2(-this.deltaY, -this.deltaX));
    };

    StartLink.prototype.containsPoint = function(x, y) {
        var endPoints = this.getEndPoints();
        var dx = endPoints.endX - endPoints.startX;
        var dy = endPoints.endY - endPoints.startY;
        var length = Math.sqrt(dx * dx + dy * dy);
        var percent = (dx * (x - endPoints.startX) + dy * (y - endPoints.startY)) / (length * length);
        var distance = (dx * (y - endPoints.startY) - dy * (x - endPoints.startX)) / length;
        return (percent > 0 && percent < 1 && Math.abs(distance) < this.parent.HIT_TARGET_PADDING);
    };

    /***********************************************************************
     *
     * Define a class TemporaryLink that represents a link that's in the
     * process of being created.
     *
     ***********************************************************************/

    function TemporaryLink(parent, from, to) {
        this.parent = parent;
        this.from = from;
        this.to = to;
    }

    TemporaryLink.prototype.draw = function(c) {
        // Draw the line.
        c.beginPath();
        c.moveTo(this.to.x, this.to.y);
        c.lineTo(this.from.x, this.from.y);
        c.stroke();

        // Draw the head of the arrow.
        this.parent.arrowIfReqd(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
    };

    /***********************************************************************
     *
     * Define a class Button as a base class from which more specific
     * buttons can be derived.
     *
     ***********************************************************************/

    function Button(toolbar, parent, w, h, iconClass, title, eventFunction) { //TODO: put a button in a button group (used for draw/select mode buttons, or place/transition buttons) to easily switch between buttons in a group
        this.toolbar = toolbar;
        this.parent = parent;
        this.width = w; //In px.
        this.height = h; //In px.
        this.icon = iconClass;
        this.title = title;
        this.eventFunction = eventFunction;
    }

    // The create function should be called explicitly in order to create the HTML element(s) of the button
    Button.prototype.create = function () {
        // Create the button, and add an unclickable icon
        this.id = 'button_' + this.title.split(' ').join('_');

        let toolbarContainerHeight = $(this.parent[0]).height();
        let $button = $('<button/>')
            .attr({
                "id":       this.id,
                "class":    'toolbar_button',
                "type":     "button",
                "title":    this.title,
                "style":    "width: " + this.width + "px; height: " + this.height + "px; margin-top: " +
                    (toolbarContainerHeight - this.height)/2 + "px;",
            })
            .append($('<i/>')
            .addClass('icon fa ' + this.icon).attr({
                    "style":    "pointer-events: none",
                }));
        $(this.parent[0]).append($button);
        this.object = $button;

        // Add the event function to this button
        let self = this;
        $(this.object).click(function () {
            self.onClick(this.eventFunction, this);
        });
    };

    Button.prototype.onClick = function(eventFunction, eventObject) {
        if (eventFunction !== null) {
            if (eventObject === null) {
                eventFunction();
            } else {
                eventFunction(eventObject);
            }
        }
    };

    // This function should be called before the object is removed
    Button.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    }

    /***********************************************************************
     *
     * Define a class ModeButton for the buttons used to switch modes,
     * which are based on the general Button class
     *
     ***********************************************************************/

    function ModeButton(toolbar, parent, w, h, iconClass, title, buttonModeType, eventFunction) {
        Button.call(this, toolbar, parent, w, h, iconClass, title, eventFunction);
        this.buttonModeType = buttonModeType; // Denotes which UI mode pressing the button activates
    }

    ModeButton.prototype = Object.create(Button.prototype);
    ModeButton.prototype.constructor = ModeButton;

    ModeButton.prototype.create = function() {
        Button.prototype.create.call(this);

        // Add 'toggle' to the class
        this.object.addClass('toggle');

        // Add the not_clicked class name by default, based on the button type
        this.object.addClass('not_clicked');
    };

    ModeButton.prototype.onClick = function() {
        Button.prototype.onClick(this.eventFunction, this);
        this.setSelected();
    };

    ModeButton.prototype.setSelected = function() {
        this.object.addClass('clicked');
        this.object.removeClass('not_clicked');
    };

        ModeButton.prototype.setDeselected = function() {
        this.object.removeClass('clicked');
        this.object.addClass('not_clicked');
    };

    /***********************************************************************
     *
     * Define a class PetriNodeTypeButton for the buttons used to switch
     * the petri node to be placed, when in Draw mode and when the graph
     * type is Petri nets
     *
     ***********************************************************************/

    function PetriNodeTypeButton(toolbar, parent, w, h, iconClass, title, petriNodeType, eventFunction) {
        Button.call(this, toolbar, parent, w, h, iconClass, title, eventFunction);
        this.petriNodeType = petriNodeType; // Denotes which petri node type mode pressing the button activates
    }

    PetriNodeTypeButton.prototype = Object.create(Button.prototype);
    PetriNodeTypeButton.prototype.constructor = PetriNodeTypeButton;

    PetriNodeTypeButton.prototype.create = function() {
        Button.prototype.create.call(this);

        // Add 'toggle' to the class
        this.object.addClass('toggle');

        // Add 'petri_node_type' to the class
        this.object.addClass('petri_node_type');

        // Add the not_clicked class name by default, based on the button type
        this.object.addClass('not_clicked');
    };

    PetriNodeTypeButton.prototype.onClick = function() {
        Button.prototype.onClick(this.eventFunction, this);
        this.setSelected();
    };

    PetriNodeTypeButton.prototype.setSelected = function() {
        this.object.addClass('clicked');
        this.object.removeClass('not_clicked');
    };

    PetriNodeTypeButton.prototype.setDeselected = function() {
        this.object.removeClass('clicked');
        this.object.addClass('not_clicked');
    };

    /***********************************************************************
     *
     * Define a class DeleteButton for the delete button, which is based on
     * the general Button class
     *
     ***********************************************************************/

    function DeleteButton(toolbar, parent, w, h, iconClass, title, eventFunction) {
        Button.call(this, toolbar, parent, w, h, iconClass, title, eventFunction);
    }

    DeleteButton.prototype = Object.create(Button.prototype);
    DeleteButton.prototype.constructor = DeleteButton;

    DeleteButton.prototype.create = function() {
        Button.prototype.create.call(this);

        // Set the button as disabled
        this.setDisabled();
    };

    DeleteButton.prototype.onClick = function() {
        Button.prototype.onClick(this.eventFunction, this.toolbar.parent);
    };

    DeleteButton.prototype.setEnabled = function() {
        $(this.object[0]).attr('disabled', false);

        this.object.removeClass('disabled');
    };

    DeleteButton.prototype.setDisabled = function() {
        $(this.object[0]).attr('disabled', true);

        this.object.addClass('disabled');
    };

    /***********************************************************************
     *
     * Define a class HelpButton for the help button, which is based on
     * the general Button class
     *
     ***********************************************************************/

    function HelpButton(toolbar, parent, w, h, iconClass, title, eventFunction) {
        Button.call(this, toolbar, parent, w, h, iconClass, title, eventFunction);
    }

    HelpButton.prototype = Object.create(Button.prototype);
    HelpButton.prototype.constructor = HelpButton;

    HelpButton.prototype.onClick = function() {
        Button.prototype.onClick(this.eventFunction);

        this.toolbar.displayHelpOverlay();
    };

    /***********************************************************************
     *
     * Define a class NumberInputField for the number input field
     * This can be used to set the number of tokens in a petri net's place
     * for example
     *
     ***********************************************************************/

    function NumberInputField(toolbar, parent, w, h, minValue, maxValue, name, labelText, title, eventFunction) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.width = w;     // In px.
        this.height = h;    // In px.
        this.minValue = minValue;   // The minimum numeric value possible to be entered
        this.maxValue = maxValue;   // The maximum numeric value possible to be entered
        this.name = name;
        this.labelText = labelText;
        this.title = title;
        this.eventFunction = eventFunction;
    }

    NumberInputField.prototype.create = function() {
        // Create the number input field
        this.id = 'numberinput_' + this.title.split(' ').join('_');

        let $number_input = $('<label/>')
            .attr({
                'class':    'field_label',
            }).append(this.labelText).append($('<input/>')
            .attr({
                'id':       this.id,
                'class':    'toolbar_numberinput',
                'type':     'number',
                'title':    this.title,
                'name':     this.name,
                'min':      this.minValue,
                'max':      this.maxValue,
            }));
        $(this.parent[0]).append($number_input);

        // Add the event listener
        $number_input[0].addEventListener('input', (event) => this.handleInteraction(event));
        this.object = $number_input;
    };

    NumberInputField.prototype.handleInteraction = function(event) {
        this.eventFunction(event, this.toolbar);
    };

    // This function should be called before the object is removed
    NumberInputField.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    /***********************************************************************
     *
     * Define a class Checkbox which can be used in the graph toolbar
     *
     ***********************************************************************/

    function Checkbox(toolbar, parent, type, text, eventFunction) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.text = text;
        this.type = type;
        this.eventFunction = eventFunction;
    }

    // The create function should be called explicitly in order to create the HTML element(s) of the checkbox
    Checkbox.prototype.create = function () {
        this.id = 'checkbox_' + this.text.split(' ').join('_');
        let $checkbox = $('<label/>')
            .attr({
                'class':    'checkbox_label',
            }).append($('<div/>').text(this.text)
                .attr({
                    'class':    'checkbox_label',
                    'style':    'display: inline',
                })).append($('<input/>')
                .attr({
                    'id':       this.id,
                    'class':    'toolbar_checkbox',
                    'type':     'checkbox',
                })).append($('<span/>')
                .attr({
                    'class':    'toolbar_checkbox toolbar_checkbox_black',
            }));
        $(this.parent[0]).append($checkbox);

        // Add the event listener
        $checkbox[0].addEventListener('change', (event) => this.handleInteraction(event));
        this.object = $checkbox;
    };

    Checkbox.prototype.handleInteraction = function(event) {
        this.eventFunction(event);
    };

    // This function should be called before the object is removed
    Checkbox.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    /***********************************************************************
     *
     * Define a class TextField which can be used in the graph toolbar
     *
     ***********************************************************************/

    function TextField(toolbar, parent, w, placeholderText, eventFunction) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.w = w;
        this.placeholderText = placeholderText;
        this.eventFunction = eventFunction;
    }

    // The create function should be called explicitly in order to create the HTML element(s) of the text field
    TextField.prototype.create = function () {
        this.id = 'textfield_' + this.placeholderText.split(' ').join('_');
        let $textfield = $('<label/>')
            .attr({
                'class':    'field_label',
            }).append(this.placeholderText + ':')
            .append($('<input/>')
                .attr({
                    'id':           this.id,
                    'class':        'toolbar_textfield',
                    'type':         'text',
                    'placeholder':  this.placeholderText,
                    'size':         this.w,
                }));
        $(this.parent[0]).append($textfield);

        // Add the event listener
        $textfield[0].addEventListener('input', (event) => this.handleInteraction(event));
        this.object = $textfield;
    };

    TextField.prototype.handleInteraction = function(event) {
        this.eventFunction(event, this.toolbar);
    }

    // This function should be called before the object is removed
    TextField.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    return {
        PetriNodeType: PetriNodeType,
        ModeType: ModeType,
        CheckboxType: CheckboxType,
        Node: Node,
        Link: Link,
        SelfLink: SelfLink,
        TemporaryLink: TemporaryLink,
        StartLink: StartLink,
        ModeButton: ModeButton,
        PetriNodeTypeButton: PetriNodeTypeButton,
        HelpButton: HelpButton,
        NumberInputField: NumberInputField,
        DeleteButton: DeleteButton,
        Checkbox: Checkbox,
        TextField: TextField,
    };
});
