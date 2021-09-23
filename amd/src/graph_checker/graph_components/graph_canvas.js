/**
 * Implementation for the wrapper of the graph's canvas object.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil',
        'qtype_graphchecker/graph_checker/graph_components/graph_nodes',
        'qtype_graphchecker/graph_checker/graph_components/graph_links',],
    function ($, globals, util, node_elements, link_elements) {

    /**
     * Function: GraphCanvas
     * Constructor for the GraphCanvas, i.e. a wrapper for a Graph object's HTML canvas object.
     * It creates and contains the canvas, and according event and resize functions.
     *
     * Parameters:
     *    parent - The parent of the canvas object
     *    w - The width of the wrapper enclosing the canvas
     *    h - The height of the wrapper enclosing the canvas
     *    eventHandler - The object that handles events, upon notice of the listeners implemented in this object
     */
    function GraphCanvas(parent, w, h, eventHandler) {
        this.selectionRectangleOffset = 0; // Used for animating the border of the selection rectangle (marching ants)

        this.parent = parent;
        this.canvas = $(document.createElement("canvas"));
        this.canvas.attr({
            class: "graphchecker_graphcanvas",
            tabindex: 1 // So canvas can get focus.
        });
        this.canvas.css({'background-color': util.Color.WHITE});

        this.canvas.on('mousedown', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.mousedown(e);
            }
        });

        this.canvas.on('mouseup', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.mouseup(e);
            }
        });

        this.canvas.on('mouseenter', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.mouseenter(e);
            }
        });

        this.canvas.on('mouseleave', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.mouseleave(e);
            }
        });

        this.canvas.on('mousemove', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.mousemove(e);
            }
        });

        this.canvas.on('keydown', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.keydown(e);
            }
        });

        this.canvas.on('keyup', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.keyup(e);
            }
        });

        this.canvas.on('keypress', function (e) {
            if (eventHandler.allowEvents()) {
                eventHandler.keypress(e);
            }
        });

        this.resize = function (w, h) {
            // Resize to given dimensions.
            this.canvas.attr("width", w);
            this.canvas.attr("height", h);
        };

        this.resize(w, h);
    }

    /**
     * Function: draw
     * Draws the graph, all its components, and any visualization of user interactions
     * (e.g. shadows, selection, highlight), on the canvas
     *
     * Parameters:
     *    graphUi - The graph UI object
     *    graphRepr - The graph representation object
     *    nodes - The nodes which to draw
     *    links - The links which to draw
     *    uiMode - The UI mode of the graph (e.g. drawing or selecting)
     *    petriNodeType - The type of Petri node, if any
     *    fontSize - The font size of the drawn text
     *    allowEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     *    getObjectOnMousePosFunc - A callable reference to the GraphRepresentation.getObjectOnMousePos function
     *    selectionRectangle - The rectangle (i.e. top-left/bottom-right corners) representing the selection rectangle,
     *        if it exists, used in the form [{x: null, y: null}, {x: null, y: null}]
     *    currentLink - The current (temporary) draggable link. Used to create new links
     *    mousePosition - The current position of the mouse
     */
    GraphCanvas.prototype.draw = function (graphUi, graphRepr, uiMode, petriNodeType, fontSize, allowEditsFunc,
                                           isTypeFunc, getObjectOnMousePosFunc, selectionRectangle, currentLink,
                                           mousePosition) {
        let canvas = this.canvas,
            c = canvas[0].getContext('2d');

        // Clear the rectangle each draw, so we can redraw on a clean canvas
        c.clearRect(0, 0, canvas[0].width, canvas[0].height);
        c.save();

        // Scale the canvas so that it is nominalWidth 'virtual pixels' wide
        const scaleFactor = canvas[0].width / util.nominalWidth;
        c.scale(scaleFactor, scaleFactor);

        // Use Segoe UI as that is the default Moodle font (at least on Windows)
        c.font = fontSize + 'px "Segoe UI"';

        // If draw mode is active and the user hovers over an empty area, draw a shadow node to indicate that the user
        // can create a node here
        if (uiMode === util.ModeType.ADD && mousePosition && !currentLink &&
            !getObjectOnMousePosFunc(graphRepr, mousePosition.x, mousePosition.y, true) &&
            allowEditsFunc(graphUi, util.Edit.EDIT_VERTEX)) {

            // Create the shadow node and draw it
            let shadowNode = new node_elements.Node(graphUi, mousePosition.x, mousePosition.y);
            if (isTypeFunc(graphUi, util.Type.PETRI) && petriNodeType === util.PetriNodeType.TRANSITION) {
                shadowNode.petriNodeType = util.PetriNodeType.TRANSITION;
            }
            shadowNode.draw(c, true, util.DrawOption.HOVER);
        }

        // Draw the node/link objects, including possible shading (e.g. from selection or locked objects) and highlighting
        this.drawNodes(c, graphUi, graphRepr, util.DrawOption.OBJECT, uiMode, mousePosition, allowEditsFunc,
            getObjectOnMousePosFunc);
        this.drawLinks(c, graphRepr, util.DrawOption.OBJECT);

        // Draw the current link (i.e. a temporary (dragging) link)
        if (currentLink) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = util.Color.BLACK;
            currentLink.draw(c, util.DrawOption.OBJECT);
        }

        // Draw the selection rectangle, if it exists
        let sRect = selectionRectangle;
        if (sRect) {
            c.beginPath();
            c.setLineDash([5, 5]); // Set the dashes to be 5px wide and 3px apart
            c.lineDashOffset = this.selectionRectangleOffset;
            c.strokeStyle = 'rgba(0,0,0,0.75)';
            // Using +0.5 to make the width of the rectangle's border 1px
            c.rect(sRect[0].x + 0.5, sRect[0].y + 0.5, sRect[1].x - sRect[0].x, sRect[1].y - sRect[0].y);
            c.fillStyle = 'rgba(160,209,255,0.5)';
            c.fillRect(sRect[0].x + 0.5, sRect[0].y + 0.5, sRect[1].x - sRect[0].x, sRect[1].y - sRect[0].y);
            c.stroke();
            this.selectionRectangleOffset = (this.selectionRectangleOffset - 1) % 10;
        }

        c.restore();
    };

    /**
     * Function: drawNodes
     * Draws the graph, all its components, and any visualization of user interactions
     * (e.g. shadows, selection, highlight), on the canvas
     *
     * Parameters:
     *    c - The canvas 2D context object
     *    graphUi - The graphUI object
     *    graphRepr - The graph representation object
     *    drawOption - The draw option with which to draw the links (i.e. the object itself, selection, or highlighting)
     *    uiMode - The UI mode of the graph (e.g. drawing or selecting)
     *    mousePosition - The current position of the mouse
     *    allowEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    getObjectOnMousePosFunc - A callable reference to the GraphRepresentation.getObjectOnMousePos function
     */
    GraphCanvas.prototype.drawNodes = function(c, graphUi, graphRepr, drawOption, uiMode, mousePosition, allowEditsFunc,
                                               getObjectOnMousePosFunc) {
        // If the option is not defined, don't draw anything
        if (!Object.values(util.DrawOption).includes(drawOption)) {
            return;
        }

        let nodes = graphRepr.getNodes();

        // Draw the nodes with the draw option
        for (let i = 0; i < nodes.length; i++) {
            let drawNodeShadow = uiMode === util.ModeType.ADD && mousePosition &&
                getObjectOnMousePosFunc(graphRepr, mousePosition.x, mousePosition.y, true) === nodes[i] &&
                allowEditsFunc(graphUi, util.Edit.EDIT_VERTEX);
            if (drawNodeShadow) {
                // Enable the shadow
                let shadowAlpha = 0.5;
                c.shadowColor = 'rgb(150,150,150,' + shadowAlpha + ')';
                c.shadowBlur = 10;

                // If the node is highlighted, draw another node below it, so the shadow is visible
                if (nodes[i].isHighlighted) {
                    let shadowNode = new node_elements.Node(graphUi, nodes[i].x, nodes[i].y);
                    c.lineWidth = 1;
                    c.fillStyle = c.strokeStyle = 'rgb(192,192,192,' + shadowAlpha + ')';
                    shadowNode.draw(c, drawNodeShadow, null);
                }
            }

            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = util.Color.BLACK;
            nodes[i].draw(c, drawNodeShadow, drawOption);

            if (drawNodeShadow && allowEditsFunc(graphUi, util.Edit.EDIT_VERTEX)) {
                // Disable the shadow
                c.shadowBlur = 0;
                c.globalAlpha = 1;
            }
        }
    };

    /**
     * Function: drawLinks
     * Draws all specified links of the graph, according to a draw option
     *
     * Parameters:
     *    c - The canvas 2D context object
     *    graphRepr - The graph representation object
     *    drawOption - The draw option with which to draw the links (i.e. the object itself, selection, or highlighting)
     */
    GraphCanvas.prototype.drawLinks = function(c, graphRepr, drawOption) {
        let links = graphRepr.getLinks();

        // Draw the links with the draw option
        for (let i = 0; i < links.length; i++) {
            c.lineWidth = 1;
            links[i].draw(c, drawOption);
        }
    };

    /**
     * Function: drawText
     * Draws the specified text for the specified object and parameters
     *
     * Parameters:
     *    graphUi - The graphUi object
     *    originalObject - The object for which to place the text
     *    originalText - The original (i.e. unprocessed) text to be used
     *    x - The x-position at which to place the text
     *    y - The y-position at which to place the text
     *    angleOrNull - The angle, if any, for which to place the text intelligently around the object
     *    links - The array of links used in the graph
     *    nodeRadius - The radius of nodes
     *    fontSize - The text size
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphCanvas.prototype.drawText = function(graphUi, originalObject, originalText, x, y, angleOrNull, links, nodeRadius,
                                              fontSize, isTypeFunc) {
        // Get the context, and convert any LaTeX shortcuts in the text to according symbols
        let c = this.canvas[0].getContext('2d'),
            text = util.convertLatexShortcuts(originalText),
            width,
            dy;

        c.fillStyle = util.Color.BLACK;
        width = c.measureText(text).width;

        // Test whether the text can fit inside the node, depending on the node width and the type of node
        let isSmallWidth = width <= 2 * nodeRadius - globals.TEXT_NODE_HORIZONTAL_PADDING;
        if (isSmallWidth &&
            !(isTypeFunc(graphUi, util.Type.PETRI) && originalObject instanceof node_elements.Node &&
                originalObject.petriNodeType === util.PetriNodeType.PLACE) ||
            (originalObject instanceof link_elements.Link ||
                originalObject instanceof link_elements.SelfLink)) {
            // Center the text inside the node if it fits
            x -= width / 2;

            // If the node is a dark color, enhance the visibility of the text by changing the color to white
            if (originalObject instanceof node_elements.Node && originalObject.colorObject.isDark) {
                c.fillStyle = util.Color.WHITE;
            }
        } else if (originalObject instanceof node_elements.Node && (!isSmallWidth ||
            originalObject.petriNodeType === util.PetriNodeType.PLACE)) {
            // If the text does not fit, or if it is a Place node (of a Petri net), position the element either on the
            // bottom, right, top or left of the node, depending on which side do not have incoming nodes
            // If all sides have incoming nodes, place it at the bottom
            let sidesOfNodeLinkIntersections = originalObject.getLinkIntersectionSides(links);
            if (!sidesOfNodeLinkIntersections.bottom ||
                (sidesOfNodeLinkIntersections.bottom && sidesOfNodeLinkIntersections.right &&
                    sidesOfNodeLinkIntersections.top && sidesOfNodeLinkIntersections.left)) {
                x -= width / 2;
                y += nodeRadius + globals.TEXT_NODE_VERTICAL_PADDING;
            } else if (!sidesOfNodeLinkIntersections.right) {
                x += nodeRadius + globals.TEXT_NODE_HORIZONTAL_PADDING;
            } else if (!sidesOfNodeLinkIntersections.top) {
                x -= width / 2;
                y -= nodeRadius + globals.TEXT_NODE_VERTICAL_PADDING;
            } else if (!sidesOfNodeLinkIntersections.left) {
                x -= width + nodeRadius + globals.TEXT_NODE_HORIZONTAL_PADDING;
            }
        }

        // If given an angle, position the text intelligently accordingly around the object
        if (angleOrNull) {
            let cos = Math.cos(angleOrNull);
            let sin = Math.sin(angleOrNull);
            let cornerPointX = (width / 2) * (cos > 0 ? 1 : -1);
            let cornerPointY = 10 * (sin > 0 ? 1 : -1);
            let slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
            x += cornerPointX - sin * slide;
            y += cornerPointY + cos * slide;
        }

        // Finally, draw text
        if ('advancedFillText' in c) {
            c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
        } else {
            x = Math.round(x);
            y = Math.round(y);
            dy = Math.round(fontSize / 3); // Define how close the text is to the object
            c.fillText(text, x, y + dy);
        }
    };

    return {
        GraphCanvas: GraphCanvas
    };

});
