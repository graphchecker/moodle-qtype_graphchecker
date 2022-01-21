/**
 * Implementation for the wrapper of the graph's canvas object.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/ui_graph/globals', 'qtype_graphchecker/ui_graph/graphutil',
        'qtype_graphchecker/ui_graph/graph_components/graph_nodes',
        'qtype_graphchecker/ui_graph/graph_components/graph_links', 'qtype_graphchecker/ui_graph/toolbar_elements'],
    function ($, globals, util, node_elements, link_elements, toolbar_elements) {

    /**
     * Function: GraphEventHandler
     * Constructor of the GraphEventHandler class, which handles (i.e. processes) events, upon notice of events happening
     * from to the registered event listeners
     *
     * Parameters:
     *    parent - The parent of this object, i.e. the graph ui
     *    graphRepresentation - The object containing the graph data
     *    isGraphReadonly - Whether the graph is readonly or editable
     */
    function GraphEventHandler(parent, graphRepresentation, isGraphReadonly) {
        this.ui = parent;
        this.graphRepr = graphRepresentation;
        this.isGraphReadonly = isGraphReadonly;
        this.previousClientPos = {x: 0, y: 0};
    }

    /**
     * Function: allowEvents
     *
     * Returns:
     *    Whether events (and the results of users' actions) are allowed in this application, depending on some conditions
     */
    GraphEventHandler.prototype.allowEvents = function() {
        return !this.isGraphReadonly;
    };

    /***********************************************************************
     *
     * Event handler functions.
     *
     ***********************************************************************/

    /**
     * Function: mousedown
     * Event handler for the mousedown action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.mousedown = function(e) {
        let mouse = util.mousePos(e);
        let allowedEditsFunc = this.ui.allowEdits;
        let isTypeFunc = this.ui.isType;

        // Otherwise, set the clicked object (if any)
        this.ui.setClickedObject(this.graphRepr.getObjectOnMousePos(this.graphRepr, mouse.x, mouse.y, true));

        // If the click was a left mouse click, then proceed with event handling
        if (e.button === 0) {
            // Depending on the mode, perform different tasks
            if (this.ui.getUIMode() === util.ModeType.MOVE || this.ui.getClickedObject()) {
                // Potentially select one object, or add/remove multiple objects to/from the selection, or initialize
                // the selection rectangle
                this.selectObjects(e, mouse);

                // Display the according toolbar elements
                this.displayToolbarElementsOnSelect(allowedEditsFunc, isTypeFunc);

                // Perform selection-interaction with the canvas
                this.initializeObjectDragging(mouse);
            } else if (this.ui.getUIMode() === util.ModeType.ADD) {
                // Potentially create a new node
                this.createNewNode(mouse, allowedEditsFunc, isTypeFunc);
            }

            // Redraw the Canvas
            this.ui.draw();
        }
    };

    /**
     * Function: mouseup
     * Event handler for the mouseup action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.mouseup = function(e) {
        // Define some used functions
        let allowedEditsFunc = this.ui.allowEdits;
        let isTypeFunc = this.ui.isType;

        if (!e.ctrlKey && this.ui.getTempMoveModeActive()) {
            // If the CTRL key is not pressed while the temporary draw mode is active, we disable temporary draw mode
            // This happens for example when releasing the CTRL key on an alert box popup
            this.ui.disableTemporaryMoveMode();
        }

        // Upon mouseup, check what condition applies and perform according actions
        if (this.ui.getCurrentLink()) {
            if (!(this.ui.getCurrentLink() instanceof link_elements.TemporaryLink) && this.ui.allowEdits(this.ui,
                util.Edit.EDIT_EDGE)) {
                this.createNewLink(allowedEditsFunc, isTypeFunc);
            }
            this.ui.setCurrentLink(null);
            this.ui.setClickedObject(false);
        } else if (this.ui.getSelectionRectangle()) {
            this.selectWithinSelectionRectangle(e, allowedEditsFunc, isTypeFunc);
        /*} else if (this.ui.getUIMode() === util.ModeType.SELECT) {
            this.uponGraphDragRelease(e, allowedEditsFunc, isTypeFunc);
            this.ui.setClickedObject(null);*/
        } else {
            this.ui.setClickedObject(null);
        }

        this.ui.draw();
    };

    /**
     * Function: mouseenter
     * Event handler for the mouseenter action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.mouseenter = function(e) {
        if (!e.ctrlKey && this.ui.isTempMoveModeActive) {
            // If the CTRL key is not pressed while the temporary draw mode is active, we disable temporary draw mode
            // This happens for example when releasing the CTRL key on an alert box popup
            this.ui.disableTemporaryMoveMode();
        }
    };

    /**
     * Function: mouseleave
     * Event handler for the mouseleave action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.mouseleave = function(e) {
        // Set the mouse position to null
        this.ui.setMousePosition(null);

        // Call the mouseup event, as it uses the same code
        this.mouseup(e);
    };

    /**
     * Function: mousemove
     * Event handler for the mousemove action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.mousemove = function(e) {
        let mouse = util.mousePos(e);
        this.previousClientPos = {x: e.clientX, y: e.clientY};
        let allowedEditsFunc = this.ui.allowEdits;
        let isTypeFunc = this.ui.isType;

        // Set the new (internally saved) mouse position to the current mouse position
        this.ui.setMousePosition({x: mouse.x, y: mouse.y});

        // Depending on the mode, perform different tasks
        if (this.ui.getUIMode() === util.ModeType.ADD) {
            this.provisionallyCreateLink(mouse, allowedEditsFunc, isTypeFunc);

            // Disable the selection rectangle if we are in temporary draw mode
            if (this.ui.getTempMoveModeActive()) {
                this.ui.setSelectionRectangle(null);
            }
        } else if (this.ui.getUIMode() === util.ModeType.MOVE) {
            // Move selected objects and possible apply snapping
            this.moveObjects(mouse, allowedEditsFunc, isTypeFunc);

            // Overwrite the other corner of the selection rectangle
            if (!this.ui.getClickedObject() && this.ui.getSelectionRectangle()) {
                let sRect = this.ui.getSelectionRectangle();
                sRect[1] = {x: mouse.x, y: mouse.y};
                this.ui.setSelectionRectangle(sRect);
            }
        }

        this.ui.draw();
    };

    /**
     * Function: keydown
     * Event handler for the keydown action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.keydown = function(e) {
        let key = util.crossBrowserKey(e);

        // Find the name and type of the active HTML elements, and don't proceed if they are input fields
        let elementName = document.activeElement.localName;
        let elementType = document.activeElement.type;
        if (elementName === "input" && (elementType === "text" || elementType === "number")) {
            return;
        }

        // Otherwise, if configuration keys (i.e. non-character keys) are pressed
        this.checkConfigurationKeysPressed(key, this.ui.allowEdits, this.ui.isType);

        // When an object is selected, and control is not pressed, and the user presses a key producing a character,
        // then focus the input field and add that character. Also works with backspace key
        let specialDoubleCharacters = ['``', '~~', '\'\'', '^^', '""']; // Typed 'characters' which are not of length 1
        if ((e.key.length === 1 || specialDoubleCharacters.includes(e.key) || e.key === "Backspace") &&
            !e.originalEvent.ctrlKey) {

            // If the input field exists, and a number (or backspace) is entered for a number input field, continue
            let inputField = this.ui.toolbar.middleInput['label'];
            if (inputField && (!(isNaN(parseInt(e.key, 10)) &&
                inputField instanceof toolbar_elements.NumberInputField) || e.key === "Backspace")) {
                // Find the input field
                let element;
                if (inputField instanceof toolbar_elements.TextField) {
                    element = inputField.object[0].childNodes[1].childNodes[0];
                } else if (inputField instanceof toolbar_elements.NumberInputField) {
                    element = inputField.object[0].childNodes[1];
                }

                if (e.key !== "Backspace") {
                    // Add the typed character to the input field and to the object's label
                    element.value += e.key;
                    this.ui.getSelectedObjects()[0].text += e.key; // There is only one selected object if there is a label

                    if (element.value > inputField.maxValue) {
                        // Set to the max value
                        element.value = inputField.maxValue + '';
                        this.ui.getSelectedObjects()[0].text = inputField.maxValue + '';
                    }
                } else {
                    // Remove the last character from the input field
                    element.value = element.value.slice(0, -1);
                    this.ui.getSelectedObjects()[0].text = this.ui.getSelectedObjects()[0].text.slice(0, -1);
                }

                // Check for the validity of the label and take corresponding actions
                this.ui.checkLabelValidity(element, element.value);

                // Focus the label
                this.ui.focusElement(element, 100);
            }
        }

        if (e.key === "Backspace") {
            // Backspace is a shortcut for the back button, but we do NOT want to change pages. Therefore return false
            return false;
        }

        this.ui.draw();
    };

    /**
     * Function: keyup
     * Event handler for the keyup action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.keyup = function(e) {
        let pressedKey = util.crossBrowserKey(e);

        // Check whether the control key is pressed
        if (pressedKey === 17) {
            // Set the mode to ADD if it is not set already
            if (this.ui.getUIMode() !== util.ModeType.ADD && this.ui.getTempMoveModeActive()) {
                this.ui.disableTemporaryMoveMode();
            }
        }
    };

    /**
     * Function: keypress
     * Event handler for the keypress action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.keypress = function(e) {
        let pressedKey = util.crossBrowserKey(e);

        // Disable scrolling on backspace, tab and space.
        if (pressedKey === 8 || pressedKey === 0x20 || pressedKey === 9) {
            return false;
        }
    };

    /***********************************************************************
     *
     * Event handler action functions.
     *
     ***********************************************************************/

    /**
     * Function: createNewNode
     * Creates a new node, and assigns properties according to the current graph settings
     *
     * Parameters:
     *    mousePos - The position of the mouse in the format {x: number, y: number}
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.createNewNode = function(mousePos, allowedEditsFunc, isTypeFunc) {
        if (!this.ui.getClickedObject() && !this.ui.getCurrentLink() && allowedEditsFunc(this.ui, util.Edit.EDIT_VERTEX)) {
            // Create a new node
            let newNode = new node_elements.Node(this.ui, mousePos.x, mousePos.y);

            // If the graph is a Petri net, assign place/transition accordingly to what is set in the toolbar
            if (isTypeFunc(this.ui, util.Type.PETRI)) {
                newNode.petriNodeType = this.ui.petriNodeType;
            }

            // Add it to the graph representation
            this.graphRepr.addNode(newNode);

            // Set it as the initial node if it is the first node, and if the type is FSM
            if (this.graphRepr.getNodes().length === 1 && isTypeFunc(this.ui, util.Type.FSM)) {
                this.ui.setInitialFSMVertex(newNode);
            }

            // Set this node as the only selected object, so it shows a blue outline, and update the previously selected
            // objects
            this.ui.setSelectedObjects([newNode]);
            this.ui.setPreviousSelectedObjects(this.ui.getSelectedObjects());

            // Also enable the editing fields
            this.ui.toolbar.updateButtonVisibility(this.ui.getSelectedObjects());
            this.ui.toolbar.rightButtons['delete'].setEnabled();
            if (isTypeFunc(this.ui, util.Type.FSM)) {
                this.ui.toolbar.addFSMNodeSelectionOptions(this.ui.getSelectedObjects());
            }
            if (isTypeFunc(this.ui, util.Type.PETRI)) {
                this.ui.toolbar.addPetriSelectionOptions(this.ui.getSelectedObjects());
            }
            this.ui.onGraphChange();
        }
    };

    /**
     * Function: selectObjects
     * Depending on the conditions, select no object, one object, or add/remove multiple objects to/from the selection.
     * Also initialize the selection rectangle if no object is clicked
     *
     * Parameters:
     *    e - The generated event
     *    mousePos - The position of the mouse in the format {x: number, y: number}
     */
    GraphEventHandler.prototype.selectObjects = function(e, mousePos) {
        if (e.shiftKey) {
            if (this.ui.getClickedObject()) {
                if (!this.ui.getSelectedObjects().includes(this.ui.getClickedObject())) {
                    // Add the object to selection
                    this.ui.getSelectedObjects().push(this.ui.getClickedObject());
                } else {
                    // Remove from selection
                    let filteredSelection = this.ui.getSelectedObjects().filter(e => e !== this.ui.getClickedObject());
                    this.ui.setSelectedObjects(filteredSelection);
                }
            }
        } else {
            if (!this.ui.getSelectedObjects().includes(this.ui.getClickedObject())) {
                // Set this object as the only selected if it was not selected yet
                let newSelection = (this.ui.getClickedObject()) ? [this.ui.getClickedObject()] : [];
                this.ui.setSelectedObjects(newSelection);
            }
        }

        if (!this.ui.getClickedObject()) {
            // Clicking on an empty canvas spot marks one corner of the selection rectangle
            // The other one will be the same position
            this.ui.setSelectionRectangle([{x: mousePos.x, y :mousePos.y}, {x: mousePos.x, y :mousePos.y}]);
        }
    };

    /**
     * Function: displayToolbarElementsOnSelect
     * Depending on the conditions, display the according elements in the toolbar on selection of objects
     *
     * Parameters:
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.displayToolbarElementsOnSelect = function(allowedEditsFunc, isTypeFunc) {
        // Check whether there are selected objects which are locked, a vertex, or an edge
        let containsObjectsInfo = this.containsCertainObjects(this.ui.getSelectedObjects());
        let containsLockedObjects = containsObjectsInfo['containsLockedObjects'];
        let containsVertex = containsObjectsInfo['containsVertex'];
        let containsEdge = containsObjectsInfo['containsEdge'];

        // If a new object is selected (apart from TemporaryLinks), display the according input elements in the
        // toolbar
        if (this.ui.getClickedObject() instanceof node_elements.Node || this.isObjectLink(this.ui.getClickedObject())) {

            // Activate the delete button
            if (!containsLockedObjects) {
                // Check if we can activate the delete button
                if(!((containsVertex && !allowedEditsFunc(this.ui, util.Edit.EDIT_VERTEX)) ||
                    (containsEdge && !allowedEditsFunc(this.ui, util.Edit.EDIT_EDGE)))) {
                    this.ui.toolbar.rightButtons['delete'].setEnabled();
                } else {
                    this.ui.toolbar.rightButtons['delete'].setDisabled();
                }
            } else {
                this.ui.toolbar.rightButtons['delete'].setDisabled();
            }
        } else {
            // Deactivate the delete button
            if (allowedEditsFunc(this.ui, util.Edit.EDIT_VERTEX) || allowedEditsFunc(this.ui, util.Edit.EDIT_EDGE)) {
                this.ui.toolbar.rightButtons['delete'].setDisabled();
            }
        }
        this.ui.toolbar.updateButtonVisibility(this.ui.getSelectedObjects());

        // If the type is FSM, display the according buttons in the toolbar
        if (isTypeFunc(this.ui, util.Type.FSM)) {
            let hasSelectionOneNode = false;
            for (let i = 0; i < this.ui.getSelectedObjects().length; i++) {
                if (this.ui.getSelectedObjects()[i] instanceof node_elements.Node) {
                    hasSelectionOneNode = true;
                }
            }
            if (hasSelectionOneNode) {
                this.ui.toolbar.addFSMNodeSelectionOptions(this.ui.getSelectedObjects());
            } else {
                this.ui.toolbar.removeFSMNodeSelectionOptions();
            }
        }

        // If the type is Petri, display the according token input field in the toolbar
        if (isTypeFunc(this.ui, util.Type.PETRI)) {
            if (this.ui.getSelectedObjects().length) {
                this.ui.toolbar.addPetriSelectionOptions(this.ui.getSelectedObjects());
            } else {
                this.ui.toolbar.removePetriSelectionOptions();
            }
        }
    };

    /**
     * Function: containsCertainObjects
     *
     * Parameters:
     *    objects - The objects to be checked
     *
     * Returns:
     *    Whether the objects contain locked objects, vertices, or edges
     */
    GraphEventHandler.prototype.containsCertainObjects = function(objects) {
        let containsLockedObjects = false;
        let containsVertex = false;
        let containsEdge = false;
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].locked) {
                containsLockedObjects = true;
            }
            if (objects[i] instanceof node_elements.Node) {
                containsVertex = true;
            }
            if (this.isObjectLink(objects[i])) {
                containsEdge = true;
            }
        }
        return {'containsLockedObjects': containsLockedObjects, 'containsVertex': containsVertex, 'containsEdge': containsEdge};
    };

    /**
     * Function: isObjectLink
     *
     * Parameters:
     *    object - The object to be checked
     *
     * Returns:
     *    Whether the object was a link of any type
     */
    GraphEventHandler.prototype.isObjectLink = function(object) {
        return (object instanceof link_elements.Link || object instanceof link_elements.SelfLink ||
            object instanceof link_elements.StartLink);
    };

    /**
     * Function: initializeObjectDragging
     * Initializes the dragging of objects
     *
     * Parameters:
     *    mousePos - The position of the mouse in the format {x: number, y: number}
     */
    GraphEventHandler.prototype.initializeObjectDragging = function(mousePos) {
        // Start dragging objects
        if (!(this.ui.templateParams.locknodes && this.ui.getClickedObject() instanceof node_elements.Node)
            && !(this.ui.templateParams.lockedges && this.ui.getClickedObject() instanceof link_elements.Link)) {
            this.ui.setDraggedObjects([...this.ui.getSelectedObjects()]);
            if (this.ui.getClickedObject() !== null && !this.ui.getDraggedObjects().includes(this.ui.getClickedObject())) {
                this.ui.getDraggedObjects().push(this.ui.getClickedObject());
            }
            for (let i = 0; i < this.ui.getDraggedObjects().length; i++) {
                let object = this.ui.getDraggedObjects()[i];
                if (object && object.setMouseStart) {
                    object.setMouseStart(mousePos.x, mousePos.y);
                }
            }
        }
    };

    /**
     * Function: provisionallyCreateLink
     * Create a provisional link, while still busy dragging. This can be a temporary (i.e. unattached) link, self link,
     * or a regular link
     *
     * Parameters:
     *    mousePos - The position of the mouse in the format {x: number, y: number}
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.provisionallyCreateLink = function(mousePos, allowedEditsFunc, isTypeFunc) {
        // Check whether we have clicked a node, and if creating edges is allowed
        if (this.ui.getClickedObject() instanceof node_elements.Node && allowedEditsFunc(this.ui, util.Edit.EDIT_EDGE)) {
            // Find the target node (we are hovering over), if any
            let targetNode = this.graphRepr.getObjectOnMousePos(this.graphRepr, mousePos.x, mousePos.y, true);
            let targetNodeStrict = this.graphRepr.getObjectOnMousePos(this.graphRepr, mousePos.x, mousePos.y, false);

            // If the target node is not a node (e.g. an edge) set it to null
            if(!(targetNode instanceof node_elements.Node)) {
                targetNode = null;
            }

            // Depending on the mouse position, and the target node, draw different kind of links
            if (targetNode === this.ui.getClickedObject() &&
                (isTypeFunc(this.ui, util.Type.DIRECTED) || isTypeFunc(this.ui, util.Type.FSM))) {
                this.ui.setCurrentLink(new link_elements.SelfLink(this.ui, this.ui.getClickedObject(), mousePos));
            } else if (targetNode && targetNode !== this.ui.getClickedObject()) {
                this.ui.setCurrentLink(new link_elements.Link(this.ui, this.ui.getClickedObject(), targetNode));
            } else if (!targetNodeStrict) {
                let closestPoint = this.ui.getClickedObject().closestPointOnNode(mousePos.x, mousePos.y);
                this.ui.setCurrentLink(new link_elements.TemporaryLink(this.ui, closestPoint, mousePos));
            } else {
                // Case triggered when an invalid self link is made (i.e. in undirected graphs or Petri nets)
                // Set the current link from the node to itself, so in the UI no partial link is visible
                this.ui.setCurrentLink(new link_elements.TemporaryLink(this.ui, this.ui, mousePos));
            }
        }
    };

    /**
     * Function: moveObjects
     * Move selected objects, and apply horizontal/vertical snapping to all these objects if they align
     * horizontally/vertically
     *
     * Parameters:
     *    mousePos - The position of the mouse in the format {x: number, y: number}
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.moveObjects = function(mousePos, allowedEditsFunc, isTypeFunc) {
        if (this.ui.getDraggedObjects().length && this.ui.getClickedObject()) {
            // Check whether the objects are all aligned
            let isAlignedHorizontally = true;
            let isAlignedVertically = true;
            for (let i = 0; i < this.ui.getDraggedObjects().length - 1; i++) {
                if (this.ui.getDraggedObjects()[i].x !== this.ui.getDraggedObjects()[i + 1].x) {
                    isAlignedVertically = false;
                }
                if (this.ui.getDraggedObjects()[i].y !== this.ui.getDraggedObjects()[i + 1].y) {
                    isAlignedHorizontally = false;
                }
            }

            // Get all remaining nodes, i.e. those that are not in the draggedObjects
            let nodesSet = new Set(this.graphRepr.getNodes());
            let draggedObjectsSet = new Set(this.ui.getDraggedObjects());
            let nodesNotSelected = [...nodesSet].filter(x => !draggedObjectsSet.has(x));

            // If moving is allowed, perform the movement of the dragged objects. Also perform snapping for nodes
            // w.r.t. other nodes, and perform snapping for regular links when they are straight
            if (allowedEditsFunc(this.ui, util.Edit.MOVE)) {
                for (let i = 0; i < this.ui.getDraggedObjects().length; i++) {
                    let object = this.ui.getDraggedObjects()[i];

                    if (this.ui.getClickedObject() instanceof node_elements.Node && object instanceof node_elements.Node) {
                        // Move and snap nodes
                        object.setAnchorPoint(mousePos.x, mousePos.y);
                        util.snapNode(object, nodesNotSelected, isAlignedVertically, isAlignedHorizontally);
                    } else if (this.isObjectLink(this.ui.getClickedObject()) && this.ui.getClickedObject() === object) {
                        // Move and snap links
                        let isSnapped = object.setAnchorPoint(mousePos.x, mousePos.y);
                        if (!isSnapped) {
                            // Deselect all other objects if the link has moved. In case of SelfLinks, which cannot be
                            // snapped, all objects are also deselected
                            this.ui.setDraggedObjects([this.ui.getClickedObject()]);
                        }
                    }

                    // Recalculate all initial nodes' start edges in case of an FSM
                    this.recalculateFSMInitialLink(isTypeFunc);

                    // Set the object to have moved
                    object.hasMoved = true;
                }
            }
        }
    };

    /**
     * Function: recalculateFSMInitialLink
     * Recalculates all initial FSM links, in case of an FSM graph
     *
     * Parameters:
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.recalculateFSMInitialLink = function(isTypeFunc) {
        if (isTypeFunc(this.ui, util.Type.FSM)) {
            // Remove all initial links
            for (let j = 0; j < this.graphRepr.links.length; j++) {
                if (this.graphRepr.links[j] instanceof link_elements.StartLink) {
                    this.graphRepr.links.splice(j--, 1);
                }
            }

            for (let j = 0; j < this.graphRepr.nodes.length; j++) {
                if (this.graphRepr.nodes[j].isInitial) {
                    // Re-add all initial links
                    this.ui.setInitialFSMVertex(this.graphRepr.nodes[j]);
                }
            }
        }
    };

    /**
     * Function: createNewLink
     * Creates a new link, and assigns properties according to the current graph settings
     *
     * Parameters:
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.createNewLink = function(allowedEditsFunc, isTypeFunc) {
        // Determine the start node of the current to be created link
        let startNode = (this.ui.getCurrentLink() instanceof link_elements.SelfLink)?
            this.ui.getCurrentLink().node : this.ui.getCurrentLink().nodeA;

        // Find out cases in which creating a node would be invalid. In such cases: Deny the creation of a link,
        // and display a warning in the form of an alert
        if (isTypeFunc(this.ui, util.Type.PETRI) && startNode.petriNodeType === this.ui.getCurrentLink().nodeB.petriNodeType
            && this.ui.getCurrentLink().nodeA !== this.ui.getCurrentLink().nodeB) {
            // In case of a petri net, if a link is made to a node of the same type (e.g. place->place, or
            // transition->transition), deny it
            let nodeType = this.ui.getCurrentLink().nodeA.petriNodeType;
            this.ui.alertPopup('An edge between two ' + nodeType + 's of a Petri net is not permitted.');
            return;
        } else if (isTypeFunc(this.ui, util.Type.UNDIRECTED)) {
            // In case of an undirected graph, only 1 edge in between two nodes is permitted
            for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
                if ((this.graphRepr.getLinks()[i].nodeA === this.ui.getCurrentLink().nodeA &&
                    this.graphRepr.getLinks()[i].nodeB === this.ui.getCurrentLink().nodeB) ||
                    (this.graphRepr.getLinks()[i].nodeA === this.ui.getCurrentLink().nodeB &&
                        this.graphRepr.getLinks()[i].nodeB === this.ui.getCurrentLink().nodeA)) {
                    this.ui.alertPopup('Two edges between two nodes is not permitted.');
                    return;
                }
            }
        } else if (isTypeFunc(this.ui, util.Type.DIRECTED) && !isTypeFunc(this.ui, util.Type.FSM) &&
            !isTypeFunc(this.ui, util.Type.PETRI)) {
            // In case of a directed graph (non-FSM, non-Petri), only 1 edge from two arbitrary nodes v_1 to v_2 is
            // permitted
            for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
                if (!(this.ui.getCurrentLink() instanceof link_elements.SelfLink)) {
                    if (this.graphRepr.getLinks()[i].nodeA === this.ui.getCurrentLink().nodeA &&
                        this.graphRepr.getLinks()[i].nodeB === this.ui.getCurrentLink().nodeB) {
                        this.ui.alertPopup('Two edges from one node to another is not permitted.');
                        return;
                    }
                } else {
                    if (this.graphRepr.getLinks()[i].node === this.ui.getCurrentLink().node) {
                        this.ui.alertPopup('Two self-loops for a node is not permitted.');
                        return;
                    }
                }
            }
        }

        // If creating a node would not be invalid, create it
        this.ui.addLink(this.ui.getCurrentLink());

        // Set this link as the only selected object, so it shows a blue outline
        this.ui.setSelectedObjects([this.ui.getCurrentLink()]);
        this.ui.setPreviousSelectedObjects(this.ui.getSelectedObjects());

        // Recalculate all initial nodes' start edges in case of an FSM
        this.recalculateFSMInitialLink(isTypeFunc);

        // Remove FSM/Petri selection fields in the toolbar
        if (isTypeFunc(this.ui, util.Type.FSM)) {
            this.ui.toolbar.removeFSMNodeSelectionOptions();
        } else if (isTypeFunc(this.ui, util.Type.PETRI)) {
            this.ui.toolbar.removePetriNodeTypeOptions();
            this.ui.toolbar.removePetriSelectionOptions();
        }

        // (Re)Enable the correct editing fields
        this.ui.toolbar.updateButtonVisibility(this.ui.getSelectedObjects());

        // Enable the delete button as well
        if (allowedEditsFunc(this.ui, util.Edit.EDIT_EDGE)) {
            this.ui.toolbar.rightButtons['delete'].setEnabled();
        }

        this.ui.onGraphChange();
    };

    /**
     * Function: selectWithinSelectionRectangle
     * Removes the selection rectangle, and selects or deselects all elements in it
     *
     * Parameters:
     *    e - The event from the event handler function from which this function is called
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.selectWithinSelectionRectangle = function(e, allowedEditsFunc, isTypeFunc) {
        let objects = this.graphRepr.getObjectsInRectangle(this.ui.getSelectionRectangle());
        if (e.shiftKey) {
            // If shift: If all selected objects (within the rectangle) are already selected, deselect these
            // Otherwise, add all items to the selection
            let areAllObjectsAlreadySelected = true;
            for (let i = 0; i < objects.length; i++) {
                if (!this.ui.getSelectedObjects().includes(objects[i])) {
                    areAllObjectsAlreadySelected = false;
                }
            }

            // Perform the addition/deletion of the selected objects, depending on areAllObjectsAlreadySelected
            for (let i = 0; i < objects.length; i++) {
                if (!areAllObjectsAlreadySelected) {
                    this.ui.getSelectedObjects().push(objects[i]);
                } else {
                    this.ui.setSelectedObjects(this.ui.getSelectedObjects().filter(e => e !== objects[i]));
                }
            }
        } else {
            // If not shift: select only those object within the rectangle
            this.ui.setSelectedObjects(objects);
        }

        // Check whether there are selected objects which are locked
        let containsLockedObjects = false;
        for (let i = 0; i < this.ui.getSelectedObjects().length; i++) {
            if (this.ui.getSelectedObjects()[i].locked) {
                containsLockedObjects = true;
            }
        }

        // Add the appropriate selection options in the toolbar
        if (this.ui.getSelectedObjects().length) {
            this.ui.toolbar.updateButtonVisibility(this.ui.getSelectedObjects());

            if (!containsLockedObjects) {
                if (allowedEditsFunc(this.ui, util.Edit.EDIT_VERTEX) || allowedEditsFunc(this.ui, util.Edit.EDIT_EDGE)) {
                    this.ui.toolbar.rightButtons['delete'].setEnabled();
                }
                if (isTypeFunc(this.ui, util.Type.FSM)) {
                    this.ui.toolbar.addFSMNodeSelectionOptions(this.ui.getSelectedObjects());
                }
                if (isTypeFunc(this.ui, util.Type.PETRI)) {
                    this.ui.toolbar.addPetriSelectionOptions(this.ui.getSelectedObjects());
                }
            }
        }

        // Disable the selection rectangle
        this.ui.setSelectionRectangle(null);
    };

    /**
     * Function: uponGraphDragRelease
     * Saves the graph upon release of dragging, and sets certain parameters
     * If the selection did not move while dragged, set the clicked object as the sole selected object
     *
     * Parameters:
     *    e - The event from the event handler function from which this function is called
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.uponGraphDragRelease = function(e, allowedEditsFunc, isTypeFunc) {
        // Determine whether the selection has moved or not
        let hasSelectionMoved = false;
        this.ui.getDraggedObjects().forEach(element => {
            hasSelectionMoved = (element.hasMoved) ? true : hasSelectionMoved;
        });

        // Save a different graph state if the user dragged (and thus clicked) and the selection has moved
        if (this.ui.getClickedObject() && hasSelectionMoved) {
            this.ui.onGraphChange();
        }

        // If none of the selected objects have moved, and shift is not pressed, set the selected object to the
        // clicked object. I.e., unselect all other selected objects
        if (this.ui.getClickedObject() && !hasSelectionMoved && !e.shiftKey) {
            this.ui.setSelectedObjects([this.ui.getClickedObject()]);

            // Display the according toolbar elements
            this.displayToolbarElementsOnSelect(allowedEditsFunc, isTypeFunc);
        }

        // Reset the 'hasMoved' parameter of all selected objects
        this.ui.getSelectedObjects().forEach(element => element.resetHasMoved());
    };

    /**
     * Function: checkConfigurationKeysPressed
     * Check whether configuration keys (i.e. non-character keys) are pressed, and take according action
     *
     * Parameters:
     *    pressedKey - The key that has been pressed
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     */
    GraphEventHandler.prototype.checkConfigurationKeysPressed = function(pressedKey, allowedEditsFunc, isTypeFunc) {
        if (pressedKey === 46) {
            // Delete key. If it is allowed, delete the object
            // Check if no selected object is locked, a vertex (while not allowed to be removed), or edge (while not allowed
            // to be removed)
            let containsObjectsInfo = this.containsCertainObjects(this.ui.getSelectedObjects());
            let containsLockedObjects = containsObjectsInfo['containsLockedObjects'];
            let containsVertex = containsObjectsInfo['containsVertex'];
            let containsEdge = containsObjectsInfo['containsEdge'];


            if(!containsLockedObjects &&
                !((containsVertex && !allowedEditsFunc(this.ui, util.Edit.EDIT_VERTEX)) ||
                (containsEdge && !allowedEditsFunc(this.ui, util.Edit.EDIT_EDGE)))) {
                this.ui.deleteSelectedObjects(this.ui);
            }
        } else if (pressedKey === 27) {
            // Escape key. Deselect the objects, and remove the selection options
            this.ui.setSelectedObjects([]);
            this.ui.toolbar.updateButtonVisibility([]);
            if (isTypeFunc(this.ui, util.Type.FSM)) {
                this.ui.toolbar.removeFSMNodeSelectionOptions();
            }
            if (isTypeFunc(this.ui, util.Type.PETRI)) {
                this.ui.toolbar.removePetriSelectionOptions();
            }
        }

        if (pressedKey === 17) {
            // Control key: temporary Move mode
            if (this.ui.getUIMode() !== util.ModeType.MOVE) {
                this.ui.enableTemporaryMoveMode();
            }
        }
    };

    return {
        GraphEventHandler: GraphEventHandler
    };

});
