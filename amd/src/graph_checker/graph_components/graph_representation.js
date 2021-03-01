/**
 * Implementation for the help overlay of the Graph UI application
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'qtype_graphchecker/graph_checker/graphutil', 'qtype_graphchecker/graph_checker/graphelements'],
    function ($, util, elements) {

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
    };

    /**
     * Function: addNode
     *
     * Parameters:
     *    node - The node to be added to the array of nodes
     */
    GraphRepresentation.prototype.addNode = function(node) {
        this.nodes.push(node);
    };

    /**
     * Function: clearNodes
     * Sets the node array to the empty array
     */
    GraphRepresentation.prototype.clearNodes = function() {
        this.nodes = [];
    };

    /**
     * Function: getLinks
     *
     * Returns:
     *    The array of links in this graph representation
     */
    GraphRepresentation.prototype.getLinks = function() {
        return this.links;
    };

    /**
     * Function: addLink
     *
     * Parameters:
     *    link - The link to be added to the array of links
     */
    GraphRepresentation.prototype.addLink = function(link) {
        this.links.push(link);
    };

    /**
     * Function: clearLinks
     * Sets the link array to the empty array
     */
    GraphRepresentation.prototype.clearLinks = function() {
        this.links = [];
    };

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
     * Function: getObjectsInRectangle //TODO: refactor further
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

    /**
     * Function: load
     * Loads the graph representation, the nodes and links, in this object, and updates the state of the graph UI
     * accordingly
     *
     * Parameters:
     *    textArea - The HTML text area which contains the JSON string representing the graph
     *    templateParams - The parameters used for defining the graph
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphRepresentation.prototype.load = function(textArea, templateParams, isTypeFunc) {
        let content = $(textArea).val();
        if (content) {
            // If there is content in the text area
            try {
                // Load up the student's previous answer if non-empty.
                let input = JSON.parse(content), i;

                if (!input.hasOwnProperty('_version') || input['_version'] !== 1) {
                    throw "invalid version";
                }

                // Load all nodes, with their properties
                for (i = 0; i < input.vertices.length; i++) {
                    let inputNode = input.vertices[i];
                    let node = new elements.Node(this.parent, inputNode['position'][0], inputNode['position'][1]);
                    if (!templateParams.ignore_locked && 'locked' in inputNode) {
                        // note: don't set the locked flag if we're in ignore_locked mode,
                        // because then we're supposed to be able to edit locked objects
                        // (when saving this will lose the locked flags)
                        node.locked = inputNode['locked'];
                    }
                    node.text = inputNode['label'];
                    if (templateParams.vertex_colors) {
                        node.colorObject = util.colorObjectFromColorCode(inputNode['color']);
                    }
                    if (templateParams.highlight_vertices) {
                        node.isHighlighted = inputNode['highlighted'];
                    }
                    if (isTypeFunc(util.Type.FSM)) {
                        node.isInitial = inputNode['initial'];
                        node.isFinal = inputNode['final'];
                    }
                    if (isTypeFunc(util.Type.PETRI)) {
                        node.petriNodeType = inputNode['petri_type'];
                        if (inputNode['petri_type'] === util.PetriNodeType.PLACE) {
                            node.petriTokens = inputNode['tokens'];
                        }
                    }
                    this.addNode(node);
                }

                // Load all links, with their properties
                for (i = 0; i < input.edges.length; i++) {
                    let inputLink = input.edges[i];
                    let link = null;

                    if (inputLink['from'] === inputLink['to']) {
                        // Self link has two identical nodes.
                        link = new elements.SelfLink(this.parent, this.getNodes()[inputLink['from']]);
                        link.text = inputLink['label'];
                        link.colorObject = (templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                        link.isHighlighted = (templateParams.highlight_edges)? inputLink['highlighted'] : false;
                        link.anchorAngle = inputLink['bend']['anchorAngle'];
                    } else if (inputLink['from'] === -1) {
                        // Start link
                        link = new elements.StartLink(this.parent, this.getNodes()[inputLink['to']]);
                        link.deltaX = inputLink['bend']['deltaX'];
                        link.deltaY = inputLink['bend']['deltaY'];
                        link.colorObject = (templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                        link.isHighlighted = (templateParams.highlight_edges)? inputLink['highlighted'] : false;
                    } else {
                        // Normal link
                        link = new elements.Link(this.parent, this.getNodes()[inputLink['from']],
                            this.getNodes()[inputLink['to']]);
                        link.text = inputLink['label'];
                        link.colorObject = (templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                        link.isHighlighted = (templateParams.highlight_edges)? inputLink['highlighted'] : false;
                        link.parallelPart = inputLink['bend']['parallelPart'];
                        link.perpendicularPart = inputLink['bend']['perpendicularPart'];
                        link.lineAngleAdjust = inputLink['bend']['lineAngleAdjust'];
                    }
                    if (!templateParams.ignore_locked && 'locked' in inputLink) {
                        link.locked = inputLink['locked'];
                    }
                    this.addLink(link);
                }
            } catch(e) {
                this.fail = true;
                this.failString = 'graph_ui_invalidserialisation';
            }
        }
    };

    /**
     * Function: save
     * Creates from the graph representation (i.e. nodes and links) an output object, and writes that object as a JSON
     * string to the text area containing the graph definition
     *
     * Parameters:
     *    textArea - The HTML text area which contains the JSON string representing the graph
     *    templateParams - The parameters used for defining the graph
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphRepresentation.prototype.save = function(textArea, templateParams, isTypeFunc) {
        // Create an output structure, which is used to save the vertices and edges to the JSON string
        let output = {
            '_version': 1,
            'vertices': [],
            'edges': []
        };
        let i;

        if(!JSON || (textArea.val().trim() === '' && this.getNodes().length === 0)) {
            return;  // Don't save if we have an empty textbox and no graphic content.
        }

        // For every node in the representation, create a vertex object, in order to later save it to the JSON string
        for (i = 0; i < this.getNodes().length; i++) {
            let node = this.getNodes()[i];
            let vertex = {
                'label': node.text,
                'position': [node.x, node.y],
                'locked': node.locked
            };
            if (templateParams.vertex_colors && node.colorObject) {
                vertex['color'] = node.colorObject.colorCode;
            }
            if (templateParams.highlight_vertices) {
                vertex['highlighted'] = node.isHighlighted;
            }
            if (isTypeFunc(util.Type.FSM)) {
                vertex['initial'] = node.isInitial;
                vertex['final'] = node.isFinal;
            }
            if (isTypeFunc(util.Type.PETRI)) {
                vertex['petri_type'] = node.petriNodeType;
                if (vertex['petri_type'] === util.PetriNodeType.PLACE) {
                    vertex['tokens'] = node.petriTokens;
                }
            }
            // if we're in the save_locked mode, make sure to put the locked flag back on save
            if (templateParams.save_locked) {
                vertex['locked'] = true;
            }
            output.vertices.push(vertex);
        }

        // For every link in the representation, create a link object, in order to later save it to the JSON string
        for (i = 0; i < this.getLinks().length; i++) {
            let link = this.getLinks()[i];
            if (link instanceof elements.SelfLink) {
                let linkObject = {
                    'from': this.getNodes().indexOf(link.node),
                    'to': this.getNodes().indexOf(link.node),
                    'bend': {
                        'anchorAngle': link.anchorAngle
                    },
                    'label': link.text,
                    'locked': link.locked
                };
                linkObject = this.assignStandardLinkFields(link, templateParams, linkObject);
                output.edges.push(linkObject);
            } else if (link instanceof elements.StartLink) {
                let linkObject = {
                    'from': -1,
                    'to': this.getNodes().indexOf(link.node),
                    'bend': {
                        'deltaX': link.deltaX,
                        'deltaY': link.deltaY
                    },
                    'locked': link.locked
                };
                linkObject = this.assignStandardLinkFields(link, templateParams, linkObject);
                output.edges.push(linkObject);
            } else if (link instanceof elements.Link) {
                let linkObject = {
                    'from': this.getNodes().indexOf(link.nodeA),
                    'to': this.getNodes().indexOf(link.nodeB),
                    'bend': {
                        'lineAngleAdjust': link.lineAngleAdjust,
                        'parallelPart': link.parallelPart,
                        'perpendicularPart': link.perpendicularPart
                    },
                    'label': link.text,
                    'locked': link.locked
                };
                linkObject = this.assignStandardLinkFields(link, templateParams, linkObject);
                output.edges.push(linkObject);
            }
        }

        // Save the output object, including vertices and links, to the JSON string in the text area
        textArea.val(JSON.stringify(output));
    };

    /**
     * Function: assignStandardLinkFields
     * Linkobjects (to be saved) have common fields for different kind of links (i.e. self link, start link, or
     * regular link). These are assigned in this function to the object, to avoid repetition
     *
     * Parameters:
     *    link - The link in the graph representation which is iterated over, when performing the saving process
     *    templateParams - The parameters used for defining the graph
     *    linkObject - The link object which is to be saved to the JSON string
     */
    GraphRepresentation.prototype.assignStandardLinkFields = function(link, templateParams, linkObject) {
        if (templateParams.edge_colors && link.colorObject) {
            linkObject.color = link.colorObject.colorCode;
        }
        if (templateParams.highlight_edges) {
            linkObject.highlighted = link.isHighlighted;
        }
        if (templateParams.save_locked) {
            linkObject['locked'] = true;
        }
        return linkObject;
    };

    return {
        GraphRepresentation: GraphRepresentation
    };

});