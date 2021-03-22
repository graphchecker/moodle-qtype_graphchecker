/**
 * Implementation of the graph editor, which is used both in the question
 * editing page and in the student question submission page.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil',
        'qtype_graphchecker/graph_checker/graph_components/graph_elements',
        'qtype_graphchecker/graph_checker/graph_components/graph_links'],
    function($, globals, util, graph_elements, link_elements) {

        /***********************************************************************
         *
         * Define a class Node that represents a node in a graph
         *
         ***********************************************************************/
        function Node(parent, x, y) {
            graph_elements.GraphElement.call(this, parent);
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

        Node.prototype = Object.create(graph_elements.GraphElement.prototype);
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
                    c.arc(this.x, this.y, this.parent.nodeRadius(this.parent), 0, 2 * Math.PI, false);
                } else if (this.petriNodeType === util.PetriNodeType.TRANSITION) {
                    c.rect(this.x - this.parent.nodeRadius(this.parent), this.y - this.parent.nodeRadius(this.parent),
                        this.parent.nodeRadius(this.parent)*2, this.parent.nodeRadius(this.parent)*2);
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
                    c.arc(this.x, this.y, this.parent.nodeRadius(this.parent) - 6, 0, 2 * Math.PI, false);
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
                    x: this.x + dx * this.parent.nodeRadius(this.parent) / scale,
                    y: this.y + dy * this.parent.nodeRadius(this.parent) / scale,
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
                let sideHalfLength = this.parent.nodeRadius(this.parent);
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
            let halfSideLength = this.parent.nodeRadius(this.parent);

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
            let radius = this.parent.nodeRadius(this.parent);
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
                if (links[i] instanceof link_elements.StartLink && links[i].node === this) {
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
                if (links[i] instanceof link_elements.Link) {
                    let linkInfo = links[i].getLinkInfo();
                    if (links[i].nodeA === this) {
                        v2[0] = {x: this.x - linkInfo.startX, y: linkInfo.startY - this.y};
                        isAdjacentLink = true;
                    } else if (links[i].nodeB === this) {
                        v2[0] = {x: this.x - linkInfo.endX, y: linkInfo.endY - this.y};
                        isAdjacentLink = true;
                    }
                } else if (links[i] instanceof link_elements.SelfLink) {
                    let linkInfo = links[i].getLinkInfo();
                    if (links[i].node === this) {
                        v2[0] = {x: this.x - linkInfo.startX, y: linkInfo.startY - this.y};
                        v2[1] = {x: this.x - linkInfo.endX, y: linkInfo.endY - this.y};
                        isAdjacentLink = true;
                    }
                } else if (links[i] instanceof link_elements.StartLink) {
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

    return {
        Node: Node,
    };
});