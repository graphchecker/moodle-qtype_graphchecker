/**
 * Implementation of the graph editor, which is used both in the question
 * editing page and in the student question submission page.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil',
        'qtype_graphchecker/graph_checker/graph_components/graph_elements'],
    function($, globals, util, graph_elements) {

    /***********************************************************************
     *
     * Define a base class for links, that all kind of links derive from
     *
     ***********************************************************************/
    function BaseLink(parent) {
        graph_elements.GraphElement.call(this, parent);
        this.colorObject = (parent.templateParams.edge_colors) ?
            util.colors[parent.templateParams.edge_colors[0]] : null;
    }

    BaseLink.prototype = Object.create(graph_elements.GraphElement.prototype);
    BaseLink.prototype.constructor = BaseLink;

    /**
     * Function: drawObject
     * Draws the link itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - A function used to draw the link's arrow head
     *    isHighlighted - Whether highlighting is activated for this link
     *    colorObject - The color object for this link, used for coloring
     *    parent - The parent object of the link to be drawn
     *    thisObject - The object to be drawn
     */
    BaseLink.prototype.drawObject = function(c, drawLink, drawArrowHead, isHighlighted, colorObject, parent, thisObject) {
        // Enable the highlight effect
        if (isHighlighted) {
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
        if (colorObject !== util.colors[util.Color.BLACK] && colorObject !== null) {
            c.strokeStyle = c.fillStyle = colorObject.colorCode;
        } else {
            c.strokeStyle = c.fillStyle = util.Color.WHITE;
        }

        // If this object is selected, apply (blue selection) shading again to give more visibility
        if (parent.selectedObjects.includes(thisObject) || thisObject.locked) {
            c.shadowBlur = 7;
        }

        c.beginPath();
        drawLink();
        c.stroke();
        if (colorObject === util.colors[util.Color.BLACK] || colorObject === null) {
            c.strokeStyle = c.fillStyle = (colorObject !== null) ?
                colorObject.colorCode : util.colors[util.Color.BLACK].colorCode;
        }
        c.stroke();

        // Draw the arrow head
        drawArrowHead();
        c.stroke();

        // Reset the shadow parameter, in case the node was selected
        c.shadowBlur = 0;
    };

    /**
     * Function: drawSelection
     * Draws the selection halo around the link
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - Whether or not to draw the link's arrow head
     *    parent - The parent object of the link to be drawn
     *    thisObject - The object to be drawn
     */
    BaseLink.prototype.drawSelection = function(c, drawLink, drawArrowHead, parent, thisObject) {
        // Enable the selection effect
        let isSelected = parent.selectedObjects.includes(thisObject);
        if (isSelected) {
            // Set the shadow color to be blue
            c.shadowColor = '#1f78b4';
            c.shadowBlur = 15;
        } else if (thisObject.locked) {
            c.shadowColor = '#999999';
            c.shadowBlur = 15;
        }
    };

    /***********************************************************************
     *
     * Define a class Link that represents a connection between two nodes.
     *
     ***********************************************************************/
    function Link(parent, a, b) {
        BaseLink.call(this, parent);
        this.nodeA = a;
        this.nodeB = b;
        this.lineAngleAdjust = 0; // Value to add to textAngle when link is straight line.

        // Make anchor point relative to the locations of nodeA and nodeB.
        this.parallelPart = 0.5;    // Percentage from nodeA to nodeB.
        this.perpendicularPart = 0.1; // Pixels from line between nodeA and nodeB.
        // This is set to 0.1, to enable the tweaking of links (when there are multiple links present) to enhance visibility
    }

    Link.prototype = Object.create(BaseLink.prototype);
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
        let linkInfo = util.calculateLinkInfo(this.nodeA, this.nodeB, circle, reverseScale, this.parent.nodeRadius(this.parent));
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
            this.drawSelection(c, drawLink, drawArrowHead);
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
        BaseLink.prototype.drawSelection(c, drawLink, drawArrowHead, this.parent, this);

        // Now draw the object itself (again, to give it a more visible color/shadow), with or without the highlighting
        this.drawObject(c, drawLink, drawArrowHead);
    };

    /**
     * Function: drawObject
     * Draws the link itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - A function used to draw the link's arrow head
     */
    Link.prototype.drawObject = function(c, drawLink, drawArrowHead) {
        BaseLink.prototype.drawObject(c, drawLink, drawArrowHead, this.isHighlighted, this.colorObject, this.parent, this);
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
        graph_elements.GraphElement.call(this, parent);
        this.node = node;
        this.anchorAngle = 0;
        this.mouseOffsetAngle = 0;
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;

        if (mouse) {
            this.setAnchorPoint(mouse.x, mouse.y);
        }
    }

    SelfLink.prototype = Object.create(graph_elements.GraphElement.prototype);
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
        let circleX = this.node.x + 1.5 * this.parent.nodeRadius(this.parent) * Math.cos(this.anchorAngle);
        let circleY = this.node.y + 1.5 * this.parent.nodeRadius(this.parent) * Math.sin(this.anchorAngle);
        let circleRadius = 0.75 * this.parent.nodeRadius(this.parent);
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
            this.drawSelection(c, drawLink, drawArrowHead);
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
        BaseLink.prototype.drawSelection(c, drawLink, drawArrowHead, this.parent, this);

        // Now draw the object itself (again, to give it a more visible color/shadow), with or without the highlighting
        this.drawObject(c, drawLink, drawArrowHead);
    };

    /**
     * Function: drawObject
     * Draws the link itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - A function used to draw the link's arrow head
     */
    SelfLink.prototype.drawObject = function(c, drawLink, drawArrowHead) {
        BaseLink.prototype.drawObject(c, drawLink, drawArrowHead, this.isHighlighted, this.colorObject, this.parent, this);
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

    /**
     * Function: calculateAngle
     *
     * Returns:
     *    The angle (radians) of the points of the link touching the node's circle. I.e. the incident angles
     */
    SelfLink.prototype.calculateAngle = function() {
        let linkPoint1 = {}, linkPoint2 = {};
        let linkInfo = this.getLinkInfo();

        // Get the location of the two points
        linkPoint1.x = linkInfo.startX;
        linkPoint1.y = linkInfo.startY;
        linkPoint2.x = linkInfo.endX;
        linkPoint2.y = linkInfo.endY;

        let nodeToLinkVector1 = {
            x: this.node.x - linkPoint1.x,
            y: this.node.y - linkPoint1.y
        };
        let nodeToLinkVector2 = {
            x: this.node.x - linkPoint2.x,
            y: this.node.y - linkPoint2.y
        };
        let rightVector = {
            x: 1,
            y: 0
        };

        // Calculate and return the angles
        return [util.calculateAngle(nodeToLinkVector1, rightVector), util.calculateAngle(nodeToLinkVector2, rightVector)];
    };

    /***********************************************************************
     *
     * Define a class StartLink that represents a start link in a finite
     * state machine. Not useful in general digraphs.
     *
     ***********************************************************************/
    function StartLink(parent, node, start) {
        graph_elements.GraphElement.call(this, parent);
        this.node = node;
        this.deltaX = 0;
        this.deltaY = 0;
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;

        if (start) {
            this.setAnchorPoint(start.x, start.y);
        }
    }

    StartLink.prototype = Object.create(graph_elements.GraphElement.prototype);
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
            this.drawSelection(c, drawLink, drawArrowHead);
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
        BaseLink.prototype.drawSelection(c, drawLink, drawArrowHead, this.parent, this);

        // Now draw the object itself (again, to give it a more visible color/shadow), with or without the highlighting
        this.drawObject(c, drawLink, drawArrowHead);
    };

    /**
     * Function: drawObject
     * Draws the link itself and the according highlighting
     *
     * Parameters:
     *    c - The context object
     *    drawLink - A function used to draw links
     *    drawArrowHead - A function used to draw the link's arrow head
     */
    StartLink.prototype.drawObject = function(c, drawLink, drawArrowHead) {
        BaseLink.prototype.drawObject(c, drawLink, drawArrowHead, this.isHighlighted, this.colorObject, this.parent, this);
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
        graph_elements.GraphElement.call(this, parent);
        this.from = from;
        this.to = to;
        this.colorObject = (this.parent.templateParams.edge_colors) ?
            util.colors[this.parent.templateParams.edge_colors[0]] : null;
    }

    TemporaryLink.prototype = Object.create(graph_elements.GraphElement.prototype);
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
        Link: Link,
        SelfLink: SelfLink,
        TemporaryLink: TemporaryLink,
        StartLink: StartLink
    };
});