/******************************************************************************
 *
 * A module for use by ui_graph, defining (generic) graph elements TODO: accurate description
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

    /***********************************************************************
     *
     * Define a class Node that represents a node in a graph
     *
     ***********************************************************************/
    function Node(parent, x, y) {
        GraphElement.call(this, parent);
        // The x and y positions of the node
        this.x = x;
        this.y = y;

        // The position of the mouse
        this.mouseOffsetX = 0;
        this.mouseOffsetY = 0;

        // Information relating to fsm nodes
        this.isInitial = false;
        this.isFinal = false;

        // When in Petri mode, this variable denotes whether the node is a place or a transition:
        this.petriNodeType = util.PetriNodeType.NONE;
        this.petriTokens = 0;

        // The color of the node
        this.colorObject = (this.parent.templateParams.vertex_colors) ?
            util.colors[this.parent.templateParams.vertex_colors[0]] : null;
    }

    Node.prototype = Object.create(GraphElement.prototype);
    Node.prototype.constructor = Node;

    /**
     * Function: setMouseStart
     * Records the position relative to the mouse. Performed at the start of a drag
     *
     * Parameters:
     *    mouseX - The x coordinate of the mouse position
     *    mouseY - The y coordinate of the mouse position
     */
    Node.prototype.setMouseStart = function(mouseX, mouseY) {
        this.mouseOffsetX = this.x - mouseX;
        this.mouseOffsetY = this.y - mouseY;
    };

    /**
     * Function: setAnchorPoint
     * Sets the anchor point of this node, using the mouse position
     *
     * Parameters:
     *    x - The x coordinate to be used
     *    y - The y coordinate to be used
     */
    Node.prototype.setAnchorPoint = function(x, y) {
        this.x = x + this.mouseOffsetX;
        this.y = y + this.mouseOffsetY;
        this.hasMoved = true;
    };

    /**
     * Function: draw
     * Draws the node on the canvas
     *
     * Parameters:
     *    c - The context object
     *    isShadowNode - Whether the node has a shadow or not
     *    drawOption - Denotes how to draw the node
     */
    Node.prototype.draw = function(c, isShadowNode, drawOption) {
        // Define function used to draw the node
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
            if (this.isFinal) {
                c.beginPath();
                c.arc(this.x, this.y, this.parent.nodeRadius() - 6, 0, 2 * Math.PI, false);
                c.stroke();
            }
        } else if (drawOption === util.DrawOption.HOVER) {
            this.drawHoverObject(c, drawShape);
        }
    };

    /**
     * Function: drawSelection
     * Draws the selection halo around the node
     *
     * Parameters:
     *    c - The context object
     *    drawShape - A function used to draw nodes
     *    isShadowNode - Whether the node has a shadow or not
     */
    Node.prototype.drawSelection = function(c, drawShape, isShadowNode) {
        // Enable the selection effect when applicable
        if (this.parent.selectedObjects.includes(this)) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        } else if (this.locked) {
            c.shadowColor = '#999999';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawShape, isShadowNode, true);
    };

    /**
     * Function: drawObject
     * Draws the node itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawShape - A function used to draw nodes
     *    isShadowNode - Whether the node has a shadow or not
     *    drawInvisible - Whether or not to draw the node invisibly
     */
    Node.prototype.drawObject = function(c, drawShape, isShadowNode, drawInvisible) {
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
        c.strokeStyle = (!drawInvisible)? util.Color.BLACK : 'rgba(0,0,0,0)';
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

    /**
     * Function: drawHoverObject
     * Draws the hover node (when the user hovers over an empty area)
     *
     * Parameters:
     *    c - The context object
     *    drawShape - A function used to draw nodes
     */
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

    /**
     * Function: closestPointOnNode
     *
     * Parameters:
     *    x - The x coordinate of the input point
     *    y - The y coordinate of the input point
     *
     * Returns:
     *    The closest point on the node's circle from the input point
     */
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

    /**
     * Function: calculateIntersectionsCircle
     * For a Petri transition node (i.e. a square) calculate the intersections given a circle
     *
     * Parameters:
     *    circleX - The x coordinate of the circle's center
     *    circleY - The y coordinate of the circle's center
     *    circleR - The radius of the circle
     *
     * Returns:
     *    The points of intersection
     */
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
        // with the top and bottom side of the square. Using the Quadratic Formula (i.e. the abc formula)
        let x, y, a, b, c, results;
        y = [this.y - halfSideLength, this.y + halfSideLength];
        a = 1;
        b = -circleX*2;
        for (let j = 0; j < y.length; j++) {
            c = Math.pow(circleX, 2) + Math.pow(y[j] - circleY, 2) - Math.pow(circleR, 2);
            results = util.quadraticFormula(a, b, c);
            for (let i = 0; i < 2; i++) {
                if (this.x - halfSideLength <= results[i] && results[i] <= this.x + halfSideLength) {
                    points.push({x: results[i], y: y[j]});
                }
            }
        }

        // Intersections with the right side
        x = [this.x + halfSideLength, this.x - halfSideLength];
        a = 1;
        b = -circleY*2;
        for (let j = 0; j < y.length; j++) {
            c = Math.pow(x[j] - circleX, 2) + Math.pow(circleY, 2) - Math.pow(circleR, 2);
            results = util.quadraticFormula(a, b, c);
            for (let i = 0; i < 2; i++) {
                if (this.y - halfSideLength <= results[i] && results[i] <= this.y + halfSideLength) {
                    points.push({x: x[j], y: results[i]});
                }
            }
        }

        return points;
    };

    /**
     * Function: getAdjustedLinkInfoTransition
     * For a Petri transition node get adjusted link information
     *
     * Parameters:
     *    circle - Circle object based on three points
     *    linkInfo - Former link information
     *    reverseScale - Whether the link is reversed or not
     *    nodeA - The start node of the link
     *    nodeB - The end node of the link
     *    isStart - Whether the node (i.e. this node) is a start node w.r.t. the link
     *
     * Returns:
     *    The linkInfo object with new information
     */
    Node.prototype.getAdjustedLinkInfoTransition = function(circle, linkInfo, reverseScale, nodeA, nodeB, isStart) {
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

    /**
     * Function: containsPoint
     *
     * Parameters:
     *    x - The x coordinate of the point
     *    y - The y coordinate of the point
     *    usePadding - Whether to use padding or not (to make clicking easier)
     *
     * Returns:
     *    Whether the point is contained in the node
     */
    Node.prototype.containsPoint = function(x, y, usePadding) {
        let radius = this.parent.nodeRadius();
        if (usePadding) {
            radius += globals.HIT_TARGET_PADDING;
        }
        if (this.petriNodeType !== util.PetriNodeType.TRANSITION) {
            // Check for a circle
            return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) <= radius * radius;
        } else {
            // Check for a square
            return this.x - radius <= x && x <= this.x + radius && this.y - radius <= y && y <= this.y + radius;
        }
    };

    /**
     * Function: neighbours
     * Return, given a list of links, a list of any other nodes that contain a link to this node
     * (excluding StartLinks and SelfLinks), i.e. neighbours
     *
     * Parameters:
     *    links - The input list of links
     *
     * Returns:
     *    The neighbours
     */
    Node.prototype.neighbours = function(links) {
        let neighbours = [], link;
        for (let i = 0; i < links.length; i++) {
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

    /**
     * Function: hasStartLink
     *
     * Parameters:
     *    links - The input list of links
     *
     * Returns:
     *    Whether or not the node has any incoming start links, from the input list
     */
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

    /**
     * Function: traverseGraph
     * Traverses the graph, defined by links, starting at 'this' node and updating the visited list for each new node.
     * Returns the updated visited list, which (for the root call) is a list of all nodes connected to the given start node.
     *
     * Parameters:
     *    links - The input list of links
     *    visited - A list of visited nodes
     *
     * Returns:
     *    The list of visited nodes
     */
    Node.prototype.traverseGraph = function(links, visited) {
        let neighbours,
            neighbour;
        if (!visited.includes(this)) {
            visited.push(this);
            neighbours = this.neighbours(links);
            for (let i = 0; i < neighbours.length; i++) {
                neighbour = neighbours[i];
                if (!visited.includes(neighbour)) {
                    neighbour.traverseGraph(links, visited);
                }
            }
        }
        return visited;
    };

    /**
     * Function: getLinkIntersectionSides
     *
     * Parameters:
     *    links - The input list of considered links
     *
     * Returns:
     *    A dictionary determining which sides (right, top, left, and bottom) of a node have an incoming or outgoing edge
     */
    Node.prototype.getLinkIntersectionSides = function(links) {
        // Get all angles of the incoming/outgoing links w.r.t. the node
        let angles = [];
        for (let i = 0; i < links.length; i++) {
            let v1 = {x: 1, y: 0};
            let v2 = [{x: 0, y: 0}];
            let isAdjacentLink = false;
            if (links[i] instanceof Link) {
                let linkInfo = links[i].getLinkInfo();
                if (links[i].nodeA === this) {
                    v2[0] = {x: this.x - linkInfo.startX, y: linkInfo.startY - this.y};
                    isAdjacentLink = true;
                } else if (links[i].nodeB === this) {
                    v2[0] = {x: this.x - linkInfo.endX, y: linkInfo.endY - this.y};
                    isAdjacentLink = true;
                }
            } else if (links[i] instanceof SelfLink) {
                let linkInfo = links[i].getLinkInfo();
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
        GraphElement.call(this, parent);
        this.nodeA = a;
        this.nodeB = b;
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;
        this.lineAngleAdjust = 0; // Value to add to textAngle when link is straight line.

        // Make anchor point relative to the locations of nodeA and nodeB.
        this.parallelPart = 0.5;    // Percentage from nodeA to nodeB.
        this.perpendicularPart = 0.1; // Pixels from line between nodeA and nodeB.
        // This is set to 0.1, to enable the tweaking of links (when there are multiple links present) to enhance visibility
    }

    Link.prototype = Object.create(GraphElement.prototype);
    Link.prototype.constructor = Link;

    /**
     * Function: getAnchorPoint
     * Gets the anchor point of this link
     *
     * Returns:
     *    The anchor point in the form of a dictionary
     */
    Link.prototype.getAnchorPoint = function() {
        let dx = this.nodeB.x - this.nodeA.x;
        let dy = this.nodeB.y - this.nodeA.y;
        let scale = Math.sqrt(dx * dx + dy * dy);
        return {
            'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
            'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
        };
    };

    /**
     * Function: setAnchorPoint
     * Sets the anchor point of this link, using the mouse position
     *
     * Parameters:
     *    x - The x coordinate to be used
     *    y - The y coordinate to be used
     *
     * Returns:
     *    Whether the link is snapped or not
     */
    Link.prototype.setAnchorPoint = function(x, y) {
        let dx = this.nodeB.x - this.nodeA.x;
        let dy = this.nodeB.y - this.nodeA.y;
        let scale = Math.sqrt(dx * dx + dy * dy);
        this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
        this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
        // Snap to a straight line.
        if (this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < globals.SNAP_TO_PADDING) {
            this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
            this.perpendicularPart = 0;
            return true;
        } else {
            this.hasMoved = true;
            return false;
        }
    };

    /**
     * Function: resetHasMoved
     *
     * Returns:
     *    The this.hasMoved parameter
     */
    Link.prototype.resetHasMoved = function() {
        this.hasMoved = false;
    };

    /**
     * Function: getLinkInfo
     *
     * Returns:
     *    Information about the link, most notably the endpoints and the circle on which this link is located (if any!)
     */
    Link.prototype.getLinkInfo = function() {
        if (this.perpendicularPart === 0) {
            let midX = (this.nodeA.x + this.nodeB.x) / 2;
            let midY = (this.nodeA.y + this.nodeB.y) / 2;
            let start = this.nodeA.closestPointOnNode(midX, midY);
            let end = this.nodeB.closestPointOnNode(midX, midY);
            return {
                'hasCircle': false,
                'startX': start.x,
                'startY': start.y,
                'endX': end.x,
                'endY': end.y,
            };
        }
        let anchor = this.getAnchorPoint();
        let circle = util.circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
        let isReversed = (this.perpendicularPart > 0);
        let reverseScale = isReversed ? 1 : -1;
        let linkInfo = util.calculateLinkInfo(this.nodeA, this.nodeB, circle, reverseScale, this.parent.nodeRadius());
        // If the start node is a TRANSITION node, adjust the start of the link
        if (this.nodeA.petriNodeType === util.PetriNodeType.TRANSITION) {
            linkInfo = this.nodeA.getAdjustedLinkInfoTransition(circle, linkInfo, reverseScale, this.nodeA, this.nodeB,
                true);
        }
        // If the end node is a TRANSITION node
        if (this.nodeB.petriNodeType === util.PetriNodeType.TRANSITION) {
            linkInfo = this.nodeB.getAdjustedLinkInfoTransition(circle, linkInfo, reverseScale, this.nodeA, this.nodeB,
                false);
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

    /**
     * Function: draw
     * Draws the link on the canvas
     *
     * Parameters:
     *    c - The context object
     *    drawOption - Denotes how to draw the node
     */
    Link.prototype.draw = function(c, drawOption) {
        let linkInfo = this.getLinkInfo(), textX, textY, textAngle;

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
            if (linkInfo.hasCircle) {
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
            if (linkInfo.hasCircle) {
                let startAngle = linkInfo.startAngle;
                let endAngle = linkInfo.endAngle;
                if (endAngle < startAngle) {
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

    /**
     * Function: drawSelection
     * Draws the selection halo around the link
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - Whether or not to draw the link's arrow head
     */
    Link.prototype.drawSelection = function(c, drawLink, drawArrowHead) {
        // Enable the selection effect
        let isSelected = this.parent.selectedObjects.includes(this);
        if (isSelected) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        } else if (this.locked) {
            c.shadowColor = '#999999';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawLink, drawArrowHead, true);
    };

    /**
     * Function: drawObject
     * Draws the link itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - Whether or not to draw the link's arrow head
     */
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
        if (this.colorObject === util.colors[util.Color.BLACK] || this.colorObject === null) {
            c.strokeStyle = c.fillStyle = (this.colorObject !== null) ?
                this.colorObject.colorCode : util.colors[util.Color.BLACK].colorCode;
        }
        c.stroke();

        // Draw the arrow head
        drawArrowHead();
        c.stroke();

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;
    };

    /**
     * Function: containsPoint
     *
     * Parameters:
     *    x - The x coordinate of the point
     *    y - The y coordinate of the point
     *
     * Returns:
     *    Whether the point is contained in the link, incorporating padding
     */
    Link.prototype.containsPoint = function(x, y) {
        let linkInfo = this.getLinkInfo(), dx, dy, distance;
        if (linkInfo.hasCircle) {
            dx = x - linkInfo.circleX;
            dy = y - linkInfo.circleY;
            distance = Math.sqrt(dx * dx + dy * dy) - linkInfo.circleRadius;
            if (Math.abs(distance) < globals.HIT_TARGET_PADDING) {
                let angle = Math.atan2(dy, dx);
                let startAngle = linkInfo.startAngle;
                let endAngle = linkInfo.endAngle;
                if (linkInfo.isReversed) {
                    let temp = startAngle;
                    startAngle = endAngle;
                    endAngle = temp;
                }
                if (endAngle < startAngle) {
                    endAngle += Math.PI * 2;
                }
                if (angle < startAngle) {
                    angle += Math.PI * 2;
                } else if (angle > endAngle) {
                    angle -= Math.PI * 2;
                }
                return (angle > startAngle && angle < endAngle);
            }
        } else {
            dx = linkInfo.endX - linkInfo.startX;
            dy = linkInfo.endY - linkInfo.startY;
            let length = Math.sqrt(dx * dx + dy * dy);
            let percent = (dx * (x - linkInfo.startX) + dy * (y - linkInfo.startY)) / (length * length);
            distance = (dx * (y - linkInfo.startY) - dy * (x - linkInfo.startX)) / length;
            return (percent > 0 && percent < 1 && Math.abs(distance) < globals.HIT_TARGET_PADDING);
        }
        return false;
    };

    /**
     * Function: calculateAngle
     *
     * Parameters:
     *    node - The node to be used in the calculation
     *
     * Returns:
     *    The angle (radians) of the point of the link touching the selected node's circle, with the selected node itself.
     *    I.e. the incident angle
     */
    Link.prototype.calculateAngle = function(node) {
        let linkPoint = {};
        let linkInfo = this.getLinkInfo();

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
        GraphElement.call(this, parent);
        this.node = node;
        this.anchorAngle = 0;
        this.mouseOffsetAngle = 0;
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;

        if (mouse) {
            this.setAnchorPoint(mouse.x, mouse.y);
        }
    }

    SelfLink.prototype = Object.create(GraphElement.prototype);
    SelfLink.prototype.constructor = SelfLink;

    /**
     * Function: setMouseStart
     * Records the position relative to the mouse. Performed at the start of a drag
     *
     * Parameters:
     *    mouseX - The x coordinate of the mouse position
     *    mouseY - The y coordinate of the mouse position
     */
    SelfLink.prototype.setMouseStart = function(x, y) {
        this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
    };

    /**
     * Function: setAnchorPoint
     * Sets the anchor point of this link, using the mouse position
     *
     * Parameters:
     *    x - The x coordinate to be used
     *    y - The y coordinate to be used
     */
    SelfLink.prototype.setAnchorPoint = function(x, y) {
        this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
        // Snap to 90 degrees.
        let snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
        if (Math.abs(this.anchorAngle - snap) < 0.1) {
            this.anchorAngle = snap;
        }
        // Keep in the range -pi to pi so our containsPoint() function always works.
        if (this.anchorAngle < -Math.PI) {
            this.anchorAngle += 2 * Math.PI;
        }
        if (this.anchorAngle > Math.PI) {
            this.anchorAngle -= 2 * Math.PI;
        }

        this.hasMoved = true;
    };

    /**
     * Function: resetHasMoved
     *
     * Returns:
     *    The this.hasMoved parameter
     */
    SelfLink.prototype.resetHasMoved = function() {
        this.hasMoved = false;
    };

    /**
     * Function: getLinkInfo
     *
     * Returns:
     *    Information about the link, most notably the endpoints and the circle on which this link is located
     */
    SelfLink.prototype.getLinkInfo = function() {
        let circleX = this.node.x + 1.5 * this.parent.nodeRadius() * Math.cos(this.anchorAngle);
        let circleY = this.node.y + 1.5 * this.parent.nodeRadius() * Math.sin(this.anchorAngle);
        let circleRadius = 0.75 * this.parent.nodeRadius();
        let startAngle = this.anchorAngle - Math.PI * 0.8;
        let endAngle = this.anchorAngle + Math.PI * 0.8;
        let startX = circleX + circleRadius * Math.cos(startAngle);
        let startY = circleY + circleRadius * Math.sin(startAngle);
        let endX = circleX + circleRadius * Math.cos(endAngle);
        let endY = circleY + circleRadius * Math.sin(endAngle);
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

    /**
     * Function: draw
     * Draws the link on the canvas
     *
     * Parameters:
     *    c - The context object
     *    drawOption - Denotes how to draw the node
     */
    SelfLink.prototype.draw = function(c, drawOption) {
        let linkInfo = this.getLinkInfo();

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
            let textX = linkInfo.circleX + linkInfo.circleRadius * Math.cos(this.anchorAngle);
            let textY = linkInfo.circleY + linkInfo.circleRadius * Math.sin(this.anchorAngle);
            this.parent.drawText(this, this.text, textX, textY, this.anchorAngle);
        }
    };

    /**
     * Function: drawSelection
     * Draws the selection halo around the link
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - Whether or not to draw the link's arrow head
     */
    SelfLink.prototype.drawSelection = function(c, drawLink, drawArrowHead) {
        // Enable the selection effect when applicable
        if (this.parent.selectedObjects.includes(this)) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawLink, drawArrowHead);
    };

    /**
     * Function: drawObject
     * Draws the link itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - Whether or not to draw the link's arrow head
     */ //TODO: DRAW LINK AS ONE FUNCTION FOR MULTIPLE LINKS
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
        if (this.colorObject === util.colors[util.Color.BLACK] || this.colorObject === null) {
            c.strokeStyle = c.fillStyle = (this.colorObject !== null) ?
                this.colorObject.colorCode : util.colors[util.Color.BLACK].colorCode;
        }
        c.stroke();

        // Draw the arrow head
        drawArrowHead();
        c.stroke();

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;
    };

    /**
     * Function: containsPoint
     *
     * Parameters:
     *    x - The x coordinate of the point
     *    y - The y coordinate of the point
     *
     * Returns:
     *    Whether the point is contained in the link, incorporating padding
     */
    SelfLink.prototype.containsPoint = function(x, y) {
        let linkInfo = this.getLinkInfo();
        let dx = x - linkInfo.circleX;
        let dy = y - linkInfo.circleY;
        let distance = Math.sqrt(dx * dx + dy * dy) - linkInfo.circleRadius;
        return (Math.abs(distance) < globals.HIT_TARGET_PADDING);
    };

    /***********************************************************************
     *
     * Define a class StartLink that represents a start link in a finite
     * state machine. Not useful in general digraphs.
     *
     ***********************************************************************/
    function StartLink(parent, node, start) {
        GraphElement.call(this, parent);
        this.node = node;
        this.deltaX = 0;
        this.deltaY = 0;
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;

        if (start) {
            this.setAnchorPoint(start.x, start.y);
        }
    }

    StartLink.prototype = Object.create(GraphElement.prototype);
    StartLink.prototype.constructor = StartLink;

    /**
     * Function: setAnchorPoint
     * Sets the anchor point of this link, using the mouse position
     *
     * Parameters:
     *    x - The x coordinate to be used
     *    y - The y coordinate to be used
     *
     * Returns:
     *    Whether the link is snapped or not
     */
    StartLink.prototype.setAnchorPoint = function(x, y) {
        this.deltaX = x - this.node.x;
        this.deltaY = y - this.node.y;

        if (Math.abs(this.deltaX) < globals.SNAP_TO_PADDING) {
            this.deltaX = 0;
        }

        if (Math.abs(this.deltaY) < globals.SNAP_TO_PADDING) {
            this.deltaY = 0;
        }

        this.hasMoved = true;
    };

    /**
     * Function: resetHasMoved
     *
     * Returns:
     *    The this.hasMoved parameter
     */
    StartLink.prototype.resetHasMoved = function() {
        this.hasMoved = false;
    };

    /**
     * Function: getEndPoints
     *
     * Returns:
     *    The start and endpoints of this link
     */
    StartLink.prototype.getEndPoints = function() {
        let startX = this.node.x + this.deltaX;
        let startY = this.node.y + this.deltaY;
        let end = this.node.closestPointOnNode(startX, startY);
        return {
            'startX': startX,
            'startY': startY,
            'endX': end.x,
            'endY': end.y,
        };
    };

    /**
     * Function: draw
     * Draws the link on the canvas
     *
     * Parameters:
     *    c - The context object
     *    drawOption - Denotes how to draw the node
     */
    StartLink.prototype.draw = function(c, drawOption) {
        let endPoints = this.getEndPoints();

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

    /**
     * Function: drawSelection
     * Draws the selection halo around the link
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - Whether or not to draw the link's arrow head
     */
    StartLink.prototype.drawSelection = function(c, drawLink, drawArrowHead) {
        // Enable the selection effect when applicable
        if (this.parent.selectedObjects.includes(this)) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        }

        // Now invisibly draw the object itself, with or without the highlight ring, showing the selection effect
        this.drawObject(c, drawLink, drawArrowHead, true);
    };

    /**
     * Function: drawObject
     * Draws the link itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - Whether or not to draw the link's arrow head
     */
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
        if (this.colorObject === util.colors[util.Color.BLACK] || this.colorObject === null) {
            c.strokeStyle = c.fillStyle = (this.colorObject !== null) ?
                this.colorObject.colorCode : util.colors[util.Color.BLACK].colorCode;
        }
        c.stroke();

        // Draw the arrow head
        drawArrowHead();
        c.stroke();

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;
    };

    /**
     * Function: containsPoint
     *
     * Parameters:
     *    x - The x coordinate of the point
     *    y - The y coordinate of the point
     *
     * Returns:
     *    Whether the point is contained in the link, incorporating padding
     */
    StartLink.prototype.containsPoint = function(x, y) {
        let endPoints = this.getEndPoints();
        let dx = endPoints.endX - endPoints.startX;
        let dy = endPoints.endY - endPoints.startY;
        let length = Math.sqrt(dx * dx + dy * dy);
        let percent = (dx * (x - endPoints.startX) + dy * (y - endPoints.startY)) / (length * length);
        let distance = (dx * (y - endPoints.startY) - dy * (x - endPoints.startX)) / length;
        return (percent > 0 && percent < 1 && Math.abs(distance) < globals.HIT_TARGET_PADDING);
    };

    /***********************************************************************
     *
     * Define a class TemporaryLink that represents a link that's in the
     * process of being created.
     *
     ***********************************************************************/
    function TemporaryLink(parent, from, to) {
        GraphElement.call(this, parent);
        this.from = from;
        this.to = to;
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;
    }

    TemporaryLink.prototype = Object.create(GraphElement.prototype);
    TemporaryLink.prototype.constructor = TemporaryLink;

    /**
     * Function: draw
     * Draws the link on the canvas
     *
     * Parameters:
     *    c - The context object
     */
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
