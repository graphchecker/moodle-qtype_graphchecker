/**
 * Implementation for the help overlay of the Graph UI application
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'qtype_graphchecker/ui_graph/globals', 'qtype_graphchecker/ui_graph/graphutil',
        'qtype_graphchecker/ui_graph/graph_components/graph_nodes',
        'qtype_graphchecker/ui_graph/graph_components/graph_links'],
    function ($, globals, util, node_elements, link_elements) {

    /**
     * Function: GraphRepresentation
     * Constructor for the GraphRepresentation (i.e. a graph data) object.
     * Furthermore, this class also contains methods with which the graph representation can be inspected and/or modified
     *
     * Parameters:
     *    parent - The parent of this object in the HTML DOM
     *    nodeRadius - A callable reference to the GraphUI.nodeRadius function
     */
    function GraphRepresentation(parent, nodeRadius) {
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
     *    graphRepr - The graph representation object
     *    x - The x position of the mouse
     *    y - The y position of the mouse
     *    useNodePadding - Whether to include extra padding when selecting nodes. For links this is automatically enabled
     *
     * Returns:
     *    The first object (i.e. a node or a link), if any, encountered at the user's mouse position
     */
    GraphRepresentation.prototype.getObjectOnMousePos = function(graphRepr, x, y, useNodePadding) {
        // First check if the mouse position is over a node, i.e. nodes have precedence over links
        let node = graphRepr.getNodeOnMousePos(graphRepr, x, y, useNodePadding);
        if (node) {
            return node;
        }

        // If not, check if it's over a link
        let link = graphRepr.getLinkOnMousePos(graphRepr, x, y);
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
     *    graphRepr - The graph representation object
     *    x - The x position of the mouse
     *    y - The y position of the mouse
     *    useNodePadding - Whether to include extra padding when selecting nodes. For links this is automatically enabled
     *
     * Returns:
     *    The first node, if any, encountered at the user's mouse position
     */
    GraphRepresentation.prototype.getNodeOnMousePos = function(graphRepr, x, y, useNodePadding) {
        for (let i = 0; i < graphRepr.nodes.length; i++) {
            if (graphRepr.nodes[i].containsPoint(x, y, useNodePadding)) {
                return graphRepr.nodes[i];
            }
        }
        return null;
    };

    /**
     * Function: getLinkOnMousePos
     *
     * Parameters:
     *    graphRepr - The graph representation object
     *    x - The x position of the mouse
     *    y - The y position of the mouse
     *
     * Returns:
     *    The first link (apart from start link, as these are not selectable), if any, encountered at the user's
     *    mouse position
     */
    GraphRepresentation.prototype.getLinkOnMousePos = function(graphRepr, x, y) {
        for (let i = 0; i < graphRepr.links.length; i++) {
            if (!(graphRepr.links[i] instanceof link_elements.StartLink) && graphRepr.links[i].containsPoint(x, y)) {
                return graphRepr.links[i];
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
     *    All non-locked objects (apart from StartLinks, as these are not selectable) which are completely located
     *    in the input rectangle
     */
    GraphRepresentation.prototype.getObjectsInRectangle = function(rect) {
        let objects = [];

        // Check all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            // Calculate the corners of the smallest square around the (circular) node
            let topLeft = {x: this.nodes[i].x - this.nodeRadiusFunction(this.parent),
                y: this.nodes[i].y - this.nodeRadiusFunction(this.parent)};
            let bottomRight = {x: this.nodes[i].x + this.nodeRadiusFunction(this.parent),
                y: this.nodes[i].y + this.nodeRadiusFunction(this.parent)};
            let testRect = [topLeft, bottomRight];

            // Perform the check
            if (util.isRectInsideRect(rect, testRect)) {
                objects.push(this.nodes[i]);
            }
        }

        // Check all links
        for (let i = 0; i < this.links.length; i++) {

            // If the link is a straight line, check if the two endpoints are located inside the rectangle
            // If the link is an arc, generate 'steps' number of points on the arc,
            // and check if they are all located inside the rectangle
            let points = [];
            if (!(this.links[i] instanceof link_elements.StartLink)) {
                // A normal link or self link
                let l = this.links[i].getLinkInfo();
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
            if (isLinkInside && !(this.links[i] instanceof link_elements.StartLink)) {
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
     *    graphUi - The graphUi object
     *    textArea - The HTML text area which contains the JSON string representing the graph
     *    templateParams - The parameters used for defining the graph
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphRepresentation.prototype.load = function(graphUi, textArea, templateParams, isTypeFunc) {
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

                    // If the position is not properly defined, set it to be (0, 0)
                    if (!inputNode['position'] ||
                        !util.isNum(inputNode['position'][0]) || !util.isNum(inputNode['position'][1])) {
                        inputNode['position'] = [0, 0];
                    }

                    let node = new node_elements.Node(this.parent, inputNode['position'][0], inputNode['position'][1]);
                    if (!templateParams.ignore_locked && 'locked' in inputNode && util.isBool(inputNode['locked'])) {
                        // note: don't set the locked flag if we're in ignore_locked mode,
                        // because then we're supposed to be able to edit locked objects
                        // (when saving this will lose the locked flags)
                        node.locked = inputNode['locked'];
                    }
                    if (util.isStr(inputNode['label'])) {
                        node.text = inputNode['label'];
                    }
                    if (templateParams.vertex_colors && util.isStr(inputNode['color'])) {
                        node.colorObject = util.colorObjectFromColorCode(inputNode['color']);
                    }
                    if (templateParams.highlight_vertices && util.isBool(inputNode['highlighted'])) {
                        node.isHighlighted = inputNode['highlighted'];
                    }
                    if (isTypeFunc(graphUi, util.Type.FSM)) {
                        if (util.isBool(inputNode['initial'])) {
                            node.isInitial = inputNode['initial'];
                        }
                        if (util.isBool(inputNode['final'])) {
                            node.isFinal = inputNode['final'];
                        }
                        // Do not create a start link yet, as we do not have loaded the links yet
                    }
                    if (isTypeFunc(graphUi, util.Type.PETRI) && util.isStr(inputNode['petri_type'])) {
                        node.petriNodeType = inputNode['petri_type'];
                        if (inputNode['petri_type'] === util.PetriNodeType.PLACE && util.isInt(inputNode['tokens'])) {
                            node.petriTokens = inputNode['tokens'];
                        }
                    }
                    this.addNode(node);
                }

                // Load all links, with their properties
                for (i = 0; i < input.edges.length; i++) {
                    let inputLink = input.edges[i];
                    let link = null;

                    // If the 'from' or 'to' nodes are not defined, continue
                    if (!util.isInt(inputLink['from']) || !util.isInt(inputLink['to'])) {
                        continue;
                    }

                    if (inputLink['from'] === inputLink['to']) {
                        if (inputLink['from'] >= 0) { // The node should exist
                            // Self link has two identical nodes.
                            link = new link_elements.SelfLink(this.parent, this.getNodes()[inputLink['from']]);
                            if (inputLink['bend'] && util.isNum(inputLink['bend']['anchorAngle'])) {
                                link.anchorAngle = inputLink['bend']['anchorAngle'];
                            }
                        } else {
                            continue;
                        }
                    } else if (inputLink['from'] < 0) {
                        // This is an old format for a start link. When we encounter this, we do not draw the start link
                        // directly (in case of an FSM), but we instead set the according node to be an initial node
                        if (this.parent.isType(this.parent, util.Type.FSM) && inputLink['to'] >= 0) {
                            this.nodes[inputLink['to']].isInitial = true;
                        }
                        continue;
                    } else {
                        if (inputLink['to'] < 0) {
                            continue;
                        }
                        // Normal link,
                        link = new link_elements.Link(this.parent, this.getNodes()[inputLink['from']],
                            this.getNodes()[inputLink['to']]);
                        if (inputLink['bend']) {
                            if (util.isNum(inputLink['bend']['parallelPart'])) {
                                link.parallelPart = inputLink['bend']['parallelPart'];
                            }
                            if (util.isNum(inputLink['bend']['perpendicularPart'])) {
                                link.perpendicularPart = inputLink['bend']['perpendicularPart'];
                            }
                            if (util.isNum(inputLink['bend']['lineAngleAdjust'])) {
                                link.lineAngleAdjust = inputLink['bend']['lineAngleAdjust'];
                            }
                        }
                    }

                    // Set general linkvalues
                    if (util.isStr(inputLink['label'])) {
                        link.text = inputLink['label'];
                    }
                    if (templateParams.edge_colors && util.isStr(inputLink['color'])) {
                        link.colorObject = (templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                    }
                    if (util.isBool(inputLink['highlighted'])) {
                        link.isHighlighted = (templateParams.highlight_edges) ? inputLink['highlighted'] : false;
                    }
                    if (!templateParams.ignore_locked && 'locked' in inputLink && util.isBool(inputLink['locked'])) {
                        link.locked = inputLink['locked'];
                    }

                    this.addLink(link);
                }

                // For all nodes, check if they are initial and then re-set the initial link. This can only be done now,
                // as all other links have been loaded
                for (let i = 0; i < this.nodes.length; i++) {
                    if (this.parent.isType(this.parent, util.Type.FSM) && this.nodes[i].isInitial) {
                        // Create and add a start link
                        this.parent.setInitialFSMVertex(this.nodes[i]);
                    }
                }
            } catch(e) {
                //TODO: Possibly throw an error message here, indicating that the graph loading has (partially) failed
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
            if (isTypeFunc(this.parent, util.Type.FSM)) {
                vertex['initial'] = node.isInitial;
                vertex['final'] = node.isFinal;
            }
            if (isTypeFunc(this.parent, util.Type.PETRI)) {
                vertex['petri_type'] = node.petriNodeType;
                if (vertex['petri_type'] === util.PetriNodeType.PLACE) {
                    // Ensure that the petri tokens are within the range as specified in the globals
                    node.petriTokens = Math.max(globals.NUMBER_TOKENS_INPUT_RANGE.min, Math.min(node.petriTokens,
                        globals.NUMBER_TOKENS_INPUT_RANGE.max));
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
            if (link instanceof link_elements.SelfLink) {
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
            } else if (link instanceof link_elements.Link) {
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