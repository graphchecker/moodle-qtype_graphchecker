/******************************************************************************
 *
 * A module for use by ui_graph, defining classes Node, Link, SelfLink,
 * StartLink, TemporaryLink, and HTML elements
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
        this.hasMoved = false;
        this.isInitial = false;
        this.isFinal = false;
        // When in Petri mode, this variable denotes whether the node is a place or a transition:
        this.petriNodeType = util.PetriNodeType.NONE;
        this.petriTokens = 0;
        this.colorObject = (this.parent.templateParams.vertex_colors) ?
            util.colors[this.parent.templateParams.vertex_colors[0]] : null;
        this.isHighlighted = false;
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
        this.hasMoved = true;
    };

    Node.prototype.resetHasMoved = function() {
        this.hasMoved = false;
    };

    // Given a new mouse position during a drag, move to the appropriate
    // new position.
    Node.prototype.trackMouse = function(mouseX, mouseY) {
        this.x = this.mouseOffsetX + mouseX;
        this.y = this.mouseOffsetY + mouseY;
    };

    // This function draws the node on the canvas.
    Node.prototype.draw = function(c, isShadowNode, drawOption) {
        // A function used to draw the node
        const drawShape = function () {
            if (this.petriNodeType === util.PetriNodeType.NONE || this.petriNodeType === util.PetriNodeType.PLACE) {
                c.arc(this.x, this.y, this.parent.nodeRadius(), 0, 2 * Math.PI, false);
            } else if (this.petriNodeType === util.PetriNodeType.TRANSITION) {
                c.rect(this.x - this.parent.nodeRadius(), this.y - this.parent.nodeRadius(),
                    this.parent.nodeRadius()*2, this.parent.nodeRadius()*2);
            }
        }.bind(this);

        // Draw the selection, highlight and object of the node
        if (drawOption === util.DrawOption.SELECTION) {
            this.drawSelection(c, drawShape, isShadowNode);
        } else if (drawOption === util.DrawOption.OBJECT) {
            this.drawObject(c, drawShape, isShadowNode, false);

            // Draw the label.
            c.fillStyle = util.Color.BLACK;
            this.parent.drawText(this, this.text, this.x, this.y, null);

            if (this.petriNodeType === util.PetriNodeType.PLACE && this.petriTokens > 0) {
                // Draw the token values.
                this.parent.drawText(null, this.petriTokens.toString(), this.x, this.y, null);
            }

            // Draw a double circle for an accept state.
            if(this.isFinal) {
                c.beginPath();
                c.arc(this.x, this.y, this.parent.nodeRadius() - 6, 0, 2 * Math.PI, false);
                c.stroke();
            }
        } else if (drawOption === util.DrawOption.HOVER) {
            this.drawHoverObject(c, drawShape);
        }
    };

    // A function to draw the selection halo around the object
    Node.prototype.drawSelection = function(c, drawShape, isShadowNode) {
        // Enable the selection effect when applicable
        if (this.parent.selectedObjects.includes(this)) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawShape, isShadowNode, true);
    };

    // A function to draw the object itself and the according highlighting
    Node.prototype.drawObject = function(c, drawShape, isShadowNode, invisible) {
        // If the node is highlighted, draw a highlight ring around it
        if (this.isHighlighted) {
            // Set the stroke color and the line width
            let oldStrokeStyle = c.strokeStyle;
            c.strokeStyle = util.colors[util.Color.RED].colorCode;
            let oldLineWidth = c.lineWidth;
            c.lineWidth = 15;

            // Draw the shape
            c.beginPath();
            drawShape();
            c.stroke();

            if (isShadowNode) {
                // Draw a special shadow if it is a highlighted node
                c.shadowColor = 'rgb(150,150,150,0.7)';
                c.shadowBlur = 10;
                c.stroke();
            }

            // Reset the draw parameters
            c.strokeStyle = oldStrokeStyle;
            c.lineWidth = oldLineWidth;
            c.shadowBlur = 0;
        }

        // Draw the node itself, on top of the highlighting
        c.beginPath();
        c.strokeStyle = (!invisible)? util.Color.BLACK : 'rgba(0,0,0,0)';
        drawShape();

        // Use the color to fill the node
        let fillColor = (this.colorObject) ? this.colorObject.colorCode : null;
        if (!fillColor) {
            fillColor = util.colors[util.Color.WHITE].colorCode; // White is the default color
            this.colorObject = util.colorObjectFromColorCode(fillColor);
        }
        c.fillStyle = fillColor;
        c.fill();

        // If the node is a shadow node, apply the effect more to enhance the visibility
        if (isShadowNode) {
            c.fill();
        }

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;

        // Draw the node border
        c.stroke();
    };

    Node.prototype.drawHoverObject = function(c, drawShape) {
        // Draw the hover node
        c.beginPath();

        // Set the styles
        c.shadowColor = 'rgb(220,220,220,1)';
        c.shadowBlur = 10;
        c.lineWidth = 1;
        c.strokeStyle = 'rgb(192,192,192,0.5)';

        // Draw the shape of the shadow
        drawShape();
        c.stroke();

        // Draw a white circle, to not show the inner shadow
        c.fillStyle = util.Color.WHITE;
        c.fill();

        // Unset the styles
        c.shadowBlur = 0;
        c.globalAlpha = 1;
    };

    Node.prototype.closestPointOnNode = function(x, y) {
        let dx = x - this.x;
        let dy = y - this.y;
        if (this.petriNodeType !== util.PetriNodeType.TRANSITION) {
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
        if (this.petriNodeType !== util.PetriNodeType.TRANSITION) {
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

    Node.prototype.containsPoint = function(x, y, usePadding) {
        let radius = this.parent.nodeRadius();
        if (usePadding) {
            radius += this.parent.HIT_TARGET_PADDING;
        }
        if (this.petriNodeType !== util.PetriNodeType.TRANSITION) {
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

    // This function determines which sides of a node have an incoming or outgoing edge.
    // The sides are: right, top, left, and bottom.
    Node.prototype.getLinkIntersectionSides = function(links) {
        // Get all angles of the incoming/outgoing links w.r.t. the node
        let angles = [];
        for (let i = 0; i < links.length; i++) {
            let v1 = {x: 1, y: 0};
            let v2 = [{x: 0, y: 0}];
            let isAdjacentLink = false;
            if (links[i] instanceof Link) {
                let linkInfo = links[i].getEndPointsAndCircle();
                if (links[i].nodeA === this) {
                    v2[0] = {x: this.x - linkInfo.startX, y: linkInfo.startY - this.y};
                    isAdjacentLink = true;
                } else if (links[i].nodeB === this) {
                    v2[0] = {x: this.x - linkInfo.endX, y: linkInfo.endY - this.y};
                    isAdjacentLink = true;
                }
            } else if (links[i] instanceof SelfLink) {
                let linkInfo = links[i].getEndPointsAndCircle();
                if (links[i].node === this) {
                    v2[0] = {x: this.x - linkInfo.startX, y: linkInfo.startY - this.y};
                    v2[1] = {x: this.x - linkInfo.endX, y: linkInfo.endY - this.y};
                    isAdjacentLink = true;
                }
            } else if (links[i] instanceof StartLink) {
                let linkInfo = links[i].getEndPoints();
                if (links[i].node === this) {
                    v2[0] = {x: this.x - linkInfo.endX, y: linkInfo.endY - this.y};
                    isAdjacentLink = true;
                }
            }

            if (isAdjacentLink) {
                for (let j = 0; j < v2.length; j++) {
                    angles.push(util.calculateAngle(v1, v2[j]));
                }
            }
        }

        // Determine whether there are intersections for each of the 45degree-rotated quadrants:
        // right, top, left, and bottom
        let result = {right: false, top: false, left: false, bottom: false};
        for (let i = 0; i < angles.length; i++) {
            if ((0 <= angles[i] && angles[i] <= 1/4 * Math.PI) || (7/4 * Math.PI <= angles[i] && angles[i] <= 2 * Math.PI)) {
                result.right = true;
            } else if (1/4 * Math.PI <= angles[i] && angles[i] <= 3/4 * Math.PI) {
                result.top = true;
            } else if (3/4 * Math.PI <= angles[i] && angles[i] <= 5/4 * Math.PI) {
                result.left = true;
            } else if (5/4 * Math.PI <= angles[i] && angles[i] <= 7/4 * Math.PI) {
                result.bottom = true;
            }
        }

        return result;
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
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;
        this.isHighlighted = false;
        this.lineAngleAdjust = 0; // Value to add to textAngle when link is straight line.

        // Make anchor point relative to the locations of nodeA and nodeB.
        this.parallelPart = 0.5;    // Percentage from nodeA to nodeB.
        this.perpendicularPart = 0.1; // Pixels from line between nodeA and nodeB.
        // This is set to 0.1, to enable the tweaking of links (when there are multiple links present) to enhance visibility
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
            this.hasMoved = true;
            return false;
        }
    };

    Link.prototype.resetHasMoved = function() {
        this.hasMoved = false;
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
        if (this.nodeA.petriNodeType === util.PetriNodeType.TRANSITION) {
            linkInfo = this.nodeA.getadjustedLinkInfo(circle, linkInfo, reverseScale, this.nodeA, this.nodeB, true);
        }
        // If the end node is a TRANSITION node
        if (this.nodeB.petriNodeType === util.PetriNodeType.TRANSITION) {
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

    Link.prototype.draw = function(c, drawOption) {
        var linkInfo = this.getEndPointsAndCircle(), textX, textY, textAngle;

        // A function used to draw the link
        const drawLink = function () {
            if (linkInfo.hasCircle) {
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
        }.bind(this);

        // A function used to draw the arrow head
        const drawArrowHead = function () {
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
        }.bind(this);

        // Draw the selection, and object and according highlight
        if (drawOption === util.DrawOption.SELECTION) {
            this.drawSelection(c, drawLink, drawArrowHead);
        } else if (drawOption === util.DrawOption.OBJECT) {
            this.drawObject(c, drawLink, drawArrowHead, false);

            // Draw the text.
            c.strokeStyle = c.fillStyle = util.Color.BLACK;
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
        }
    };

    Link.prototype.drawSelection = function(c, drawLink, drawArrowHead) {
        // Enable the selection effect
        let isSelected = this.parent.selectedObjects.includes(this);
        if (isSelected) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawLink, drawArrowHead, true);
    };

    Link.prototype.drawObject = function(c, drawLink, drawArrowHead) {
        // Enable the highlight effect
        if (this.isHighlighted) {
            // Set the stroke color and the line width
            let oldStrokeStyle = c.strokeStyle;
            c.strokeStyle = util.colors[util.Color.RED].colorCode;
            let oldLineWidth = c.lineWidth;
            c.lineWidth = 15;

            // Draw the highlight bar of the link
            c.beginPath();
            drawLink();
            c.stroke();

            // Reset the draw parameters
            c.strokeStyle = oldStrokeStyle;
            c.lineWidth = oldLineWidth;
            c.shadowBlur = 0;
        }

        // Draw the link itself, on top of the highlighting
        // The multiple executions of c.stroke();, and the if-statements are placed to ensure that the selection
        // is drawn visibly
        if (this.colorObject !== util.colors[util.Color.BLACK] && this.colorObject !== null) {
            c.strokeStyle = c.fillStyle = this.colorObject.colorCode;
        } else {
            c.strokeStyle = c.fillStyle = util.Color.WHITE;
        }
        c.beginPath();
        drawLink();
        c.stroke();
        c.stroke();
        c.stroke();
        c.stroke();
        if (this.colorObject === util.colors[util.Color.BLACK] || this.colorObject === null) {
            c.strokeStyle = c.fillStyle = (this.colorObject !== null)? this.colorObject.colorCode :
                util.colors[util.Color.BLACK].colorCode;
        }
        c.stroke();
        c.stroke();
        drawArrowHead();
        c.stroke();

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;
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
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;
        this.isHighlighted = false;
        this.text = '';

        if (mouse) {
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

        this.hasMoved = true;
    };

    SelfLink.prototype.resetHasMoved = function() {
        this.hasMoved = false;
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

    SelfLink.prototype.draw = function(c, drawOption) {
        var linkInfo = this.getEndPointsAndCircle();

        // A function used to draw the link
        const drawLink = function() {
            c.arc(linkInfo.circleX, linkInfo.circleY, linkInfo.circleRadius, linkInfo.startAngle, linkInfo.endAngle, false);
        }.bind(this);

        // A function used to draw the arrow head
        const drawArrowHead = function() {
            this.parent.arrowIfReqd(c, linkInfo.endX, linkInfo.endY, linkInfo.endAngle + Math.PI * 0.4);
        }.bind(this);

        // Draw the selection, and object and according highlight
        if (drawOption === util.DrawOption.SELECTION) {
            this.drawSelection(c, drawLink, drawArrowHead);
        } else if (drawOption === util.DrawOption.OBJECT) {
            this.drawObject(c, drawLink, drawArrowHead);

            // Draw the text on the loop farthest from the node.
            c.strokeStyle = c.fillStyle = util.Color.BLACK;
            var textX = linkInfo.circleX + linkInfo.circleRadius * Math.cos(this.anchorAngle);
            var textY = linkInfo.circleY + linkInfo.circleRadius * Math.sin(this.anchorAngle);
            this.parent.drawText(this, this.text, textX, textY, this.anchorAngle);
        }
    };

    SelfLink.prototype.drawSelection = function(c, drawLink, drawArrowHead) {
        // Enable the selection effect when applicable
        if (this.parent.selectedObjects.includes(this)) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawLink, drawArrowHead); //TODO: this function, and funct below
    };

    SelfLink.prototype.drawObject = function(c, drawLink, drawArrowHead) {
        // Enable the highlight effect
        if (this.isHighlighted) {
            // Set stroke color and line width
            let oldStrokeStyle = c.strokeStyle;
            c.strokeStyle = util.colors[util.Color.RED].colorCode;
            let oldLineWidth = c.lineWidth;
            c.lineWidth = 15;

            // Draw the highlight bar of the link
            c.beginPath();
            drawLink();
            c.stroke();

            // Reset the draw parameters
            c.strokeStyle = oldStrokeStyle;
            c.lineWidth = oldLineWidth;
            c.shadowBlur = 0;
        }

        // Draw the link itself, on top of the highlighting
        // The multiple executions of c.stroke();, and the if-statements are placed to ensure that the selection
        // is drawn visibly
        if (this.colorObject !== util.colors[util.Color.BLACK] && this.colorObject !== null) {
            c.strokeStyle = c.fillStyle = this.colorObject.colorCode;
        } else {
            c.strokeStyle = c.fillStyle = util.Color.WHITE;
        }
        c.beginPath();
        drawLink();
        c.stroke();
        c.stroke();
        c.stroke();
        c.stroke();
        if (this.colorObject === util.colors[util.Color.BLACK] || this.colorObject === null) {
            c.strokeStyle = c.fillStyle = (this.colorObject !== null)? this.colorObject.colorCode :
                util.colors[util.Color.BLACK].colorCode;
        }
        c.stroke();
        c.stroke();
        drawArrowHead();
        c.stroke();

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;
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
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;
        this.isHighlighted = false;

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

        this.hasMoved = true;
    };

    StartLink.prototype.resetHasMoved = function() {
        this.hasMoved = false;
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

    StartLink.prototype.draw = function(c, drawOption) {
        var endPoints = this.getEndPoints();

        // A function used to draw the link
        const drawLink = function() {
            c.moveTo(endPoints.startX, endPoints.startY);
            c.lineTo(endPoints.endX, endPoints.endY);
        }.bind(this);

        // A function used to draw the arrow head
        const drawArrowHead = function() {
            this.parent.arrowIfReqd(c, endPoints.endX, endPoints.endY, Math.atan2(-this.deltaY, -this.deltaX));
        }.bind(this);

        // Draw the selection, and the object and according highlight
        if (drawOption === util.DrawOption.SELECTION) {
            this.drawSelection(c, drawLink, drawArrowHead);
        } else if (drawOption === util.DrawOption.OBJECT) {
            this.drawObject(c, drawLink, drawArrowHead, false);
        }
    };

    StartLink.prototype.drawSelection = function(c, drawLink, drawArrowHead) {
        // Enable the selection effect when applicable
        if (this.parent.selectedObjects.includes(this)) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawLink, drawArrowHead, true); //TODO: this function, and funct below
    };

    StartLink.prototype.drawObject = function(c, drawLink, drawArrowHead) {
        // Enable the highlight effect
        if (this.isHighlighted) {
            // Set the stroke color and the line width
            let oldStrokeStyle = c.strokeStyle;
            c.strokeStyle = util.colors[util.Color.RED].colorCode;
            let oldLineWidth = c.lineWidth;
            c.lineWidth = 15;

            // Draw the highlight bar of the link
            c.beginPath();
            drawLink();
            c.stroke();

            // Reset the draw parameters
            c.strokeStyle = oldStrokeStyle;
            c.lineWidth = oldLineWidth;
            c.shadowBlur = 0;
        }

        // Draw the link itself, on top of the highlighting
        // The multiple executions of c.stroke();, and the if-statements are placed to ensure that the selection
        // is drawn visibly
        if (this.colorObject !== util.colors[util.Color.BLACK] && this.colorObject !== null) {
            c.strokeStyle = c.fillStyle = this.colorObject.colorCode;
        } else {
            c.strokeStyle = c.fillStyle = util.Color.WHITE;
        }
        c.beginPath();
        drawLink();
        c.stroke();
        c.stroke();
        c.stroke();
        c.stroke();
        if (this.colorObject === util.colors[util.Color.BLACK] || this.colorObject === null) {
            c.strokeStyle = c.fillStyle = (this.colorObject !== null)? this.colorObject.colorCode :
                util.colors[util.Color.BLACK].colorCode;
        }
        c.stroke();
        c.stroke();
        drawArrowHead();
        c.stroke();

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;
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
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;
    }

    TemporaryLink.prototype.draw = function(c) {
        // Draw the line.
        c.beginPath();

        // Use the color to draw the link
        let drawColor = (this.colorObject) ? this.colorObject.colorCode : null;
        if (!drawColor) {
            drawColor = util.colors[util.Color.BLACK].colorCode; // black is the default color
            this.colorObject = util.colorObjectFromColorCode(drawColor);
        }
        c.strokeStyle = c.fillStyle = drawColor;

        c.moveTo(this.to.x, this.to.y);
        c.lineTo(this.from.x, this.from.y);
        c.stroke();

        // Draw the head of the arrow.
        this.parent.arrowIfReqd(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
    };

    return {
        Node: Node,
        Link: Link,
        SelfLink: SelfLink,
        TemporaryLink: TemporaryLink,
        StartLink: StartLink
    };
});
