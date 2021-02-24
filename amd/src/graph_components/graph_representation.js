/**
 * Implementation for the help overlay of the Graph UI application
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'qtype_graphchecker/graphutil', 'qtype_graphchecker/graphelements'], function ($, util, elements) {

    let self;

    /**
     * Function: GraphRepresentation
     * Constructor for the GraphRepresentation (i.e. a graph data) object.
     * Furthermore, this class also contains methods with which the graph representation can be inspected and/or modified
     *
     * Parameters: todo
     *    parent - The parent of this object in the HTML DOM
     *    TODO - More parameters: e.g. nodes and links
     */
    function GraphRepresentation(parent, nodeRadius) {
        self = this;
        this.parent = parent;
        this.nodes = [];
        this.links = [];
        this.nodeRadiusFunction = nodeRadius;
    }

    /**
     * Function: getNodes
     *
     * Returns:
     *    The array of nodes in this graph representation
     */
    GraphRepresentation.prototype.getNodes = function() {
        return this.nodes;
    }

    /**
     * Function: addNode
     *
     * Parameters:
     *    node - The node to be added to the array of nodes
     */
    GraphRepresentation.prototype.addNode = function(node) {
        this.nodes.push(node);
    }

    /**
     * Function: clearNodes
     * Sets the node array to the empty array
     */
    GraphRepresentation.prototype.clearNodes = function() {
        this.nodes = [];
    }

    /**
     * Function: getLinks
     *
     * Returns:
     *    The array of links in this graph representation
     */
    GraphRepresentation.prototype.getLinks = function() {
        return this.links;
    }

    /**
     * Function: addLink
     *
     * Parameters:
     *    link - The link to be added to the array of links
     */
    GraphRepresentation.prototype.addLink = function(link) {
        this.links.push(link);
    }

    /**
     * Function: clearLinks
     * Sets the link array to the empty array
     */
    GraphRepresentation.prototype.clearLinks = function() {
        this.links = [];
    }

    /**
     * Function: getObjectOnMousePos
     *
     * Parameters:
     *    x - The x position of the mouse
     *    y - The y position of the mouse
     *    useNodePadding - Whether to include extra padding when selecting nodes. For links this is automatically enabled
     *
     * Returns:
     *    The first object (i.e. a node or a link), if any, encountered at the user's mouse position
     */
    GraphRepresentation.prototype.getObjectOnMousePos = function(x, y, useNodePadding) {
        // First check if the mouse position is over a node, i.e. nodes have precedence over links
        let node = self.getNodeOnMousePos(x, y, useNodePadding);
        if (node) {
            return node;
        }

        // If not, check if it's over a link
        let link = self.getLinkOnMousePos(x, y);
        if (link) {
            return link;
        }

        // If not either, return null
        return null;
    };

    /**
     * Function: getNodeOnMousePos
     *
     * Parameters:
     *    x - The x position of the mouse
     *    y - The y position of the mouse
     *    useNodePadding - Whether to include extra padding when selecting nodes. For links this is automatically enabled
     *
     * Returns:
     *    The first node, if any, encountered at the user's mouse position
     */
    GraphRepresentation.prototype.getNodeOnMousePos = function(x, y, useNodePadding) {
        for (let i = 0; i < self.nodes.length; i++) {
            if (self.nodes[i].containsPoint(x, y, useNodePadding)) {
                return self.nodes[i];
            }
        }
        return null;
    };

    /**
     * Function: getLinkOnMousePos
     *
     * Parameters:
     *    x - The x position of the mouse
     *    y - The y position of the mouse
     *
     * Returns:
     *    The first link, if any, encountered at the user's mouse position
     */
    GraphRepresentation.prototype.getLinkOnMousePos = function(x, y) {
        for (let i = 0; i < self.links.length; i++) {
            if (self.links[i].containsPoint(x, y)) {
                return self.links[i];
            }
        }
        return null;
    };

    /**
     * Function: getObjectsInRectangle
     *
     * Parameters:
     *    rect - The input rectangle in the form: [{x: null, y: null}, {x: null, y: null}], representing two opposite corners
     *
     * Returns:
     *    All non-locked objects which are completely located in the input rectangle
     */
    GraphRepresentation.prototype.getObjectsInRectangle = function(rect) {
        let objects = [];

        // Check all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].locked) {
                continue;
            }

            // Calculate the corners of the smallest square around the (circular) node
            let topLeft = {x: this.nodes[i].x - this.nodeRadiusFunction(), y: this.nodes[i].y - this.nodeRadiusFunction()};
            let bottomRight = {x: this.nodes[i].x + this.nodeRadiusFunction(), y: this.nodes[i].y + this.nodeRadiusFunction()};
            let testRect = [topLeft, bottomRight];

            // Perform the check
            if (util.isRectInsideRect(rect, testRect)) {
                objects.push(this.nodes[i]);
            }
        }

        // Check all links
        for (let i = 0; i < this.links.length; i++) {
            if (this.links[i].locked) {
                continue;
            }

            // If the link is a straight line, check if the two endpoints are located inside the rectangle
            // If the link is an arc, generate 'steps' number of points on the arc,
            // and check if they are all located inside the rectangle
            let points = [];
            if (this.links[i] instanceof elements.StartLink) {
                let l = this.links[i].getEndPoints();
                points.push({x: l.startX, y: l.startY});
                points.push({x: l.endX, y: l.endY});
            } else {
                // Else if normal link or self link
                let l = this.links[i].getEndPointsAndCircle();
                let r = l.circleRadius;
                let circleStartAngle = Math.atan2(((l.startY - l.circleY) / r), ((l.startX - l.circleX) / r));
                let circleEndAngle = Math.atan2(((l.endY - l.circleY) / r), ((l.endX - l.circleX) / r));
                let steps = 100;

                let angleDifference = Math.abs(circleEndAngle - circleStartAngle);
                if (!l.isReversed && this.links[i].perpendicularPart !== 0) {
                    // When the link is an arc which goes clockwise
                    // Generate the 'steps' number of points on the arc
                    circleEndAngle = (circleEndAngle < circleStartAngle) ? circleEndAngle + 2 * Math.PI : circleEndAngle;
                    for (let j = circleStartAngle; j < circleEndAngle; j += angleDifference / steps) {
                        let x = r * Math.cos(j) + l.circleX;
                        let y = r * Math.sin(j) + l.circleY;
                        points.push({x: x, y: y});
                    }
                } else if (l.isReversed) {
                    // When the link is an arc which goes counterclockwise
                    // Generate the 'steps' number of points on the arc
                    circleEndAngle = (circleEndAngle > circleStartAngle) ? circleEndAngle - 2 * Math.PI : circleEndAngle;
                    for (let j = circleStartAngle; j > circleEndAngle; j -= angleDifference / steps) {
                        let x = r * Math.cos(j) + l.circleX;
                        let y = r * Math.sin(j) + l.circleY;
                        points.push({x: x, y: y});
                    }
                } else if (!l.isReversed && this.links[i].perpendicularPart === 0) {
                    // When the link is a straight line
                    let startPoint = {x: l.startX, y: l.startY};
                    let endPoint = {x: l.endX, y: l.endY};
                    points.push(startPoint);
                    points.push(endPoint);
                }
            }

            // If all points of the arc/endpoints are inside the input rectangle, add the link to be returned
            let isLinkInside = true;
            for (let j = 0; j < points.length; j++) {
                if (!util.isRectInsideRect(rect, [points[j], points[j]])) {
                    isLinkInside = false;
                    break;
                }
            }
            if (isLinkInside) {
                objects.push(this.links[i]);
            }
        }

        return objects;
    };

    return {
        GraphRepresentation: GraphRepresentation
    };

});