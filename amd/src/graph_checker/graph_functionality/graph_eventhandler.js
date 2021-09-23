/**
 * Implementation for the wrapper of the graph's canvas object.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil',
        'qtype_graphchecker/graph_checker/graph_components/graph_nodes',
        'qtype_graphchecker/graph_checker/graph_components/graph_links', 'qtype_graphchecker/graph_checker/toolbar_elements'],
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
        this.par = parent;
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
        let allowedEditsFunc = this.par.allowEdits;
        let isTypeFunc = this.par.isType;

        // Otherwise, set the clicked object (if any)
        this.par.setClickedObject(this.graphRepr.getObjectOnMousePos(this.graphRepr, mouse.x, mouse.y, true));

        // If the click was a left mouse click, then proceed with event handling
        if (e.button === 0) {
            console.log('clicked:', this.par.getClickedObject());  // eslint-disable-line

            // Depending on the mode, perform different tasks
            if (this.par.getUIMode() === util.ModeType.MOVE || this.par.getClickedObject()) {
                // Potentially select one object, or add/remove multiple objects to/from the selection, or initialize
                // the selection rectangle
                this.selectObjects(e, mouse);

                // Display the according toolbar elements
                this.displayToolbarElementsOnSelect(allowedEditsFunc, isTypeFunc);

                // Perform selection-interaction with the canvas
                this.initializeObjectDragging(mouse);
            } else if (this.par.getUIMode() === util.ModeType.ADD) {
                // Potentially create a new node
                this.createNewNode(mouse, allowedEditsFunc, isTypeFunc);
            }

            // Redraw the Canvas
            this.par.draw();
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
        let allowedEditsFunc = this.par.allowEdits;
        let isTypeFunc = this.par.isType;

        if (!e.ctrlKey && this.par.getTempMoveModeActive()) {
            // If the CTRL key is not pressed while the temporary draw mode is active, we disable temporary draw mode
            // This happens for example when releasing the CTRL key on an alert box popup
            this.par.disableTemporaryMoveMode();
        }

        // Upon mouseup, check what condition applies and perform according actions
        if (this.par.getCurrentLink()) {
            if (!(this.par.getCurrentLink() instanceof link_elements.TemporaryLink) && this.par.allowEdits(this.par,
                util.Edit.EDIT_EDGE)) {
                this.createNewLink(allowedEditsFunc, isTypeFunc);
            }
            this.par.setCurrentLink(null);
            this.par.setClickedObject(false);
        } else if (this.par.getSelectionRectangle()) {
            this.selectWithinSelectionRectangle(e, allowedEditsFunc, isTypeFunc);
        /*} else if (this.par.getUIMode() === util.ModeType.SELECT) {
            this.uponGraphDragRelease(e, allowedEditsFunc, isTypeFunc);
            this.par.setClickedObject(null);*/
        } else {
            this.par.setClickedObject(null);
        }

        this.par.draw();
    };

    /**
     * Function: mouseenter
     * Event handler for the mouseenter action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.mouseenter = function(e) {
        if (!e.ctrlKey && this.par.isTempMoveModeActive) {
            // If the CTRL key is not pressed while the temporary draw mode is active, we disable temporary draw mode
            // This happens for example when releasing the CTRL key on an alert box popup
            this.par.disableTemporaryMoveMode();
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
        this.par.setMousePosition(null);

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
        let allowedEditsFunc = this.par.allowEdits;
        let isTypeFunc = this.par.isType;

        // Set the new (internally saved) mouse position to the current mouse position
        this.par.setMousePosition({x: mouse.x, y: mouse.y});

        // Depending on the mode, perform different tasks
        if (this.par.getUIMode() === util.ModeType.ADD) {
            this.provisionallyCreateLink(mouse, allowedEditsFunc, isTypeFunc);

            // Disable the selection rectangle if we are in temporary draw mode
            if (this.par.getTempMoveModeActive()) {
                this.par.setSelectionRectangle(null);
            }
        } else if (this.par.getUIMode() === util.ModeType.MOVE) {
            // Move selected objects and possible apply snapping
            this.moveObjects(mouse, allowedEditsFunc, isTypeFunc);

            // Overwrite the other corner of the selection rectangle
            if (!this.par.getClickedObject() && this.par.getSelectionRectangle()) {
                let sRect = this.par.getSelectionRectangle();
                sRect[1] = {x: mouse.x, y: mouse.y};
                this.par.setSelectionRectangle(sRect);
            }
        }

        this.par.draw();
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
        this.checkConfigurationKeysPressed(key, this.par.allowEdits, this.par.isType);

        // When an object is selected, and control is not pressed, and the user presses a key producing a character,
        // then focus the input field and add that character. Also works with backspace key
        let specialDoubleCharacters = ['``', '~~', '\'\'', '^^', '""']; // Typed 'characters' which are not of length 1
        if ((e.key.length === 1 || specialDoubleCharacters.includes(e.key) || e.key === "Backspace") &&
            !e.originalEvent.ctrlKey) {

            // If the input field exists, and a number (or backspace) is entered for a number input field, continue
            let inputField = this.par.toolbar.middleInput['label'];
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
                    this.par.getSelectedObjects()[0].text += e.key; // There is only one selected object if there is a label

                    if (element.value > inputField.maxValue) {
                        // Set to the max value
                        element.value = inputField.maxValue + '';
                        this.par.getSelectedObjects()[0].text = inputField.maxValue + '';
                    }
                } else {
                    // Remove the last character from the input field
                    element.value = element.value.slice(0, -1);
                    this.par.getSelectedObjects()[0].text = this.par.getSelectedObjects()[0].text.slice(0, -1);
                }

                // Check for the validity of the label and take corresponding actions
                this.par.checkLabelValidity(element, element.value);

                // Focus the label
                this.par.focusElement(element, 100);
            }
        }

        if (e.key === "Backspace") {
            // Backspace is a shortcut for the back button, but we do NOT want to change pages. Therefore return false
            return false;
        }

        this.par.draw();
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
            if (this.par.getUIMode() !== util.ModeType.ADD && this.par.getTempMoveModeActive()) {
                this.par.disableTemporaryMoveMode();
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
        if (!this.par.getClickedObject() && !this.par.getCurrentLink() && allowedEditsFunc(this.par, util.Edit.EDIT_VERTEX)) {
            // Create a new node
            let newNode = new node_elements.Node(this.par, mousePos.x, mousePos.y);

            // If the graph is a Petri net, assign place/transition accordingly to what is set in the toolbar
            if (isTypeFunc(this.par, util.Type.PETRI)) {
                newNode.petriNodeType = this.par.petriNodeType;
            }

            // Add it to the graph representation
            this.graphRepr.addNode(newNode);

            // Set it as the initial node if it is the first node, and if the type is FSM
            if (this.graphRepr.getNodes().length === 1 && isTypeFunc(this.par, util.Type.FSM)) {
                this.par.setInitialFSMVertex(newNode);
            }

            // Set this node as the only selected object, so it shows a blue outline, and update the previously selected
            // objects
            this.par.setSelectedObjects([newNode]);
            this.par.setPreviousSelectedObjects(this.par.getSelectedObjects());

            // Also enable the editing fields
            this.par.toolbar.addSelectionOptions(this.par.getSelectedObjects());
            this.par.toolbar.rightButtons['delete'].setEnabled();
            if (isTypeFunc(this.par, util.Type.FSM)) {
                this.par.toolbar.addFSMNodeSelectionOptions(this.par.getSelectedObjects());
            }
            if (isTypeFunc(this.par, util.Type.PETRI)) {
                this.par.toolbar.addPetriSelectionOptions(this.par.getSelectedObjects());
            }
            this.par.onGraphChange();
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
            if (this.par.getClickedObject()) {
                if (!this.par.getSelectedObjects().includes(this.par.getClickedObject())) {
                    // Add the object to selection
                    this.par.getSelectedObjects().push(this.par.getClickedObject());
                } else {
                    // Remove from selection
                    let filteredSelection = this.par.getSelectedObjects().filter(e => e !== this.par.getClickedObject());
                    this.par.setSelectedObjects(filteredSelection);
                }
            }
        } else {
            if (!this.par.getSelectedObjects().includes(this.par.getClickedObject())) {
                // Set this object as the only selected if it was not selected yet
                let newSelection = (this.par.getClickedObject()) ? [this.par.getClickedObject()] : [];
                this.par.setSelectedObjects(newSelection);
            }
        }

        if (!this.par.getClickedObject()) {
            // Clicking on an empty canvas spot marks one corner of the selection rectangle
            // The other one will be the same position
            this.par.setSelectionRectangle([{x: mousePos.x, y :mousePos.y}, {x: mousePos.x, y :mousePos.y}]);
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
        let containsObjectsInfo = this.containsCertainObjects(this.par.getSelectedObjects());
        let containsLockedObjects = containsObjectsInfo['containsLockedObjects'];
        let containsVertex = containsObjectsInfo['containsVertex'];
        let containsEdge = containsObjectsInfo['containsEdge'];

        // If a new object is selected (apart from TemporaryLinks), display the according input elements in the
        // toolbar
        if (this.par.getClickedObject() instanceof node_elements.Node || this.isObjectLink(this.par.getClickedObject())) {

            // Display the selection options
            this.par.toolbar.addSelectionOptions(this.par.getSelectedObjects());

            // Activate the delete button
            if (!containsLockedObjects) {
                // Check if we can activate the delete button
                if(!((containsVertex && !allowedEditsFunc(this.par, util.Edit.EDIT_VERTEX)) ||
                    (containsEdge && !allowedEditsFunc(this.par, util.Edit.EDIT_EDGE)))) {
                    this.par.toolbar.rightButtons['delete'].setEnabled();
                } else {
                    this.par.toolbar.rightButtons['delete'].setDisabled();
                }
            } else {
                this.par.toolbar.rightButtons['delete'].setDisabled();
            }
        } else {
            // Remove displaying the selection options
            this.par.toolbar.removeSelectionOptions();

            // Deactivate the delete button
            if (allowedEditsFunc(this.par, util.Edit.EDIT_VERTEX) || allowedEditsFunc(this.par, util.Edit.EDIT_EDGE)) {
                this.par.toolbar.rightButtons['delete'].setDisabled();
            }
        }

        // If the type is FSM, display the according buttons in the toolbar
        if (isTypeFunc(this.par, util.Type.FSM)) {
            let hasSelectionOneNode = false;
            for (let i = 0; i < this.par.getSelectedObjects().length; i++) {
                if (this.par.getSelectedObjects()[i] instanceof node_elements.Node) {
                    hasSelectionOneNode = true;
                }
            }
            if (hasSelectionOneNode) {
                this.par.toolbar.addFSMNodeSelectionOptions(this.par.getSelectedObjects());
            } else {
                this.par.toolbar.removeFSMNodeSelectionOptions();
            }
        }

        // If the type is Petri, display the according token input field in the toolbar
        if (isTypeFunc(this.par, util.Type.PETRI)) {
            if (this.par.getSelectedObjects().length) {
                this.par.toolbar.addPetriSelectionOptions(this.par.getSelectedObjects());
            } else {
                this.par.toolbar.removePetriSelectionOptions();
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
        if (!(this.par.templateParams.locknodes && this.par.getClickedObject() instanceof node_elements.Node)
            && !(this.par.templateParams.lockedges && this.par.getClickedObject() instanceof link_elements.Link)) {
            this.par.setDraggedObjects([...this.par.getSelectedObjects()]);
            if (this.par.getClickedObject() !== null && !this.par.getDraggedObjects().includes(this.par.getClickedObject())) {
                this.par.getDraggedObjects().push(this.par.getClickedObject());
            }
            for (let i = 0; i < this.par.getDraggedObjects().length; i++) {
                let object = this.par.getDraggedObjects()[i];
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
        if (this.par.getClickedObject() instanceof node_elements.Node && allowedEditsFunc(this.par, util.Edit.EDIT_EDGE)) {
            // Find the target node (we are hovering over), if any
            let targetNode = this.graphRepr.getObjectOnMousePos(this.graphRepr, mousePos.x, mousePos.y, true);
            let targetNodeStrict = this.graphRepr.getObjectOnMousePos(this.graphRepr, mousePos.x, mousePos.y, false);

            // If the target node is not a node (e.g. an edge) set it to null
            if(!(targetNode instanceof node_elements.Node)) {
                targetNode = null;
            }

            // Depending on the mouse position, and the target node, draw different kind of links
            if (targetNode === this.par.getClickedObject() &&
                (isTypeFunc(this.par, util.Type.DIRECTED) || isTypeFunc(this.par, util.Type.FSM))) {
                this.par.setCurrentLink(new link_elements.SelfLink(this.par, this.par.getClickedObject(), mousePos));
            } else if (targetNode && targetNode !== this.par.getClickedObject()) {
                this.par.setCurrentLink(new link_elements.Link(this.par, this.par.getClickedObject(), targetNode));
            } else if (!targetNodeStrict) {
                let closestPoint = this.par.getClickedObject().closestPointOnNode(mousePos.x, mousePos.y);
                this.par.setCurrentLink(new link_elements.TemporaryLink(this.par, closestPoint, mousePos));
            } else {
                // Case triggered when an invalid self link is made (i.e. in undirected graphs or Petri nets)
                // Set the current link from the node to itself, so in the UI no partial link is visible
                this.par.setCurrentLink(new link_elements.TemporaryLink(this.par, this.par, mousePos));
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
        if (this.par.getDraggedObjects().length && this.par.getClickedObject()) {
            // Check whether the objects are all aligned
            let isAlignedHorizontally = true;
            let isAlignedVertically = true;
            for (let i = 0; i < this.par.getDraggedObjects().length - 1; i++) {
                if (this.par.getDraggedObjects()[i].x !== this.par.getDraggedObjects()[i + 1].x) {
                    isAlignedVertically = false;
                }
                if (this.par.getDraggedObjects()[i].y !== this.par.getDraggedObjects()[i + 1].y) {
                    isAlignedHorizontally = false;
                }
            }

            // Get all remaining nodes, i.e. those that are not in the draggedObjects
            let nodesSet = new Set(this.graphRepr.getNodes());
            let draggedObjectsSet = new Set(this.par.getDraggedObjects());
            let nodesNotSelected = [...nodesSet].filter(x => !draggedObjectsSet.has(x));

            // If moving is allowed, perform the movement of the dragged objects. Also perform snapping for nodes
            // w.r.t. other nodes, and perform snapping for regular links when they are straight
            if (allowedEditsFunc(this.par, util.Edit.MOVE)) {
                for (let i = 0; i < this.par.getDraggedObjects().length; i++) {
                    let object = this.par.getDraggedObjects()[i];

                    if (this.par.getClickedObject() instanceof node_elements.Node && object instanceof node_elements.Node) {
                        // Move and snap nodes
                        object.setAnchorPoint(mousePos.x, mousePos.y);
                        util.snapNode(object, nodesNotSelected, isAlignedVertically, isAlignedHorizontally);
                    } else if (this.isObjectLink(this.par.getClickedObject()) && this.par.getClickedObject() === object) {
                        // Move and snap links
                        let isSnapped = object.setAnchorPoint(mousePos.x, mousePos.y);
                        if (!isSnapped) {
                            // Deselect all other objects if the link has moved. In case of SelfLinks, which cannot be
                            // snapped, all objects are also deselected
                            this.par.setDraggedObjects([this.par.getClickedObject()]);
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
        if (isTypeFunc(this.par, util.Type.FSM)) {
            // Remove all initial links
            for (let j = 0; j < this.graphRepr.links.length; j++) {
                if (this.graphRepr.links[j] instanceof link_elements.StartLink) {
                    this.graphRepr.links.splice(j--, 1);
                }
            }

            for (let j = 0; j < this.graphRepr.nodes.length; j++) {
                if (this.graphRepr.nodes[j].isInitial) {
                    // Re-add all initial links
                    this.par.setInitialFSMVertex(this.graphRepr.nodes[j]);
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
        let startNode = (this.par.getCurrentLink() instanceof link_elements.SelfLink)?
            this.par.getCurrentLink().node : this.par.getCurrentLink().nodeA;

        // Find out cases in which creating a node would be invalid. In such cases: Deny the creation of a link,
        // and display a warning in the form of an alert
        if (isTypeFunc(this.par, util.Type.PETRI) && startNode.petriNodeType === this.par.getCurrentLink().nodeB.petriNodeType
            && this.par.getCurrentLink().nodeA !== this.par.getCurrentLink().nodeB) {
            // In case of a petri net, if a link is made to a node of the same type (e.g. place->place, or
            // transition->transition), deny it
            let nodeType = this.par.getCurrentLink().nodeA.petriNodeType;
            this.par.alertPopup('An edge between two ' + nodeType + 's of a Petri net is not permitted.');
            return;
        } else if (isTypeFunc(this.par, util.Type.UNDIRECTED)) {
            // In case of an undirected graph, only 1 edge in between two nodes is permitted
            for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
                if ((this.graphRepr.getLinks()[i].nodeA === this.par.getCurrentLink().nodeA &&
                    this.graphRepr.getLinks()[i].nodeB === this.par.getCurrentLink().nodeB) ||
                    (this.graphRepr.getLinks()[i].nodeA === this.par.getCurrentLink().nodeB &&
                        this.graphRepr.getLinks()[i].nodeB === this.par.getCurrentLink().nodeA)) {
                    this.par.alertPopup('Two edges between two nodes is not permitted.');
                    return;
                }
            }
        } else if (isTypeFunc(this.par, util.Type.DIRECTED) && !isTypeFunc(this.par, util.Type.FSM) &&
            !isTypeFunc(this.par, util.Type.PETRI)) {
            // In case of a directed graph (non-FSM, non-Petri), only 1 edge from two arbitrary nodes v_1 to v_2 is
            // permitted
            for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
                if (!(this.par.getCurrentLink() instanceof link_elements.SelfLink)) {
                    if (this.graphRepr.getLinks()[i].nodeA === this.par.getCurrentLink().nodeA &&
                        this.graphRepr.getLinks()[i].nodeB === this.par.getCurrentLink().nodeB) {
                        this.par.alertPopup('Two edges from one node to another is not permitted.');
                        return;
                    }
                } else {
                    if (this.graphRepr.getLinks()[i].node === this.par.getCurrentLink().node) {
                        this.par.alertPopup('Two self-loops for a node is not permitted.');
                        return;
                    }
                }
            }
        }

        // If creating a node would not be invalid, create it
        this.par.addLink(this.par.getCurrentLink());

        // Set this link as the only selected object, so it shows a blue outline
        this.par.setSelectedObjects([this.par.getCurrentLink()]);
        this.par.setPreviousSelectedObjects(this.par.getSelectedObjects());

        // Recalculate all initial nodes' start edges in case of an FSM
        this.recalculateFSMInitialLink(isTypeFunc);

        // Remove FSM/Petri selection fields in the toolbar
        if (isTypeFunc(this.par, util.Type.FSM)) {
            this.par.toolbar.removeFSMNodeSelectionOptions();
        } else if (isTypeFunc(this.par, util.Type.PETRI)) {
            this.par.toolbar.removePetriNodeTypeOptions();
            this.par.toolbar.removePetriSelectionOptions();
        }

        // (Re)Enable the correct editing fields
        this.par.toolbar.addSelectionOptions(this.par.getSelectedObjects());

        // Enable the delete button as well
        if (allowedEditsFunc(this.par, util.Edit.EDIT_EDGE)) {
            this.par.toolbar.rightButtons['delete'].setEnabled();
        }

        this.par.onGraphChange();
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
        let objects = this.graphRepr.getObjectsInRectangle(this.par.getSelectionRectangle());
        if (e.shiftKey) {
            // If shift: If all selected objects (within the rectangle) are already selected, deselect these
            // Otherwise, add all items to the selection
            let areAllObjectsAlreadySelected = true;
            for (let i = 0; i < objects.length; i++) {
                if (!this.par.getSelectedObjects().includes(objects[i])) {
                    areAllObjectsAlreadySelected = false;
                }
            }

            // Perform the addition/deletion of the selected objects, depending on areAllObjectsAlreadySelected
            for (let i = 0; i < objects.length; i++) {
                if (!areAllObjectsAlreadySelected) {
                    this.par.getSelectedObjects().push(objects[i]);
                } else {
                    this.par.setSelectedObjects(this.par.getSelectedObjects().filter(e => e !== objects[i]));
                }
            }
        } else {
            // If not shift: select only those object within the rectangle
            this.par.setSelectedObjects(objects);
        }

        // Check whether there are selected objects which are locked
        let containsLockedObjects = false;
        for (let i = 0; i < this.par.getSelectedObjects().length; i++) {
            if (this.par.getSelectedObjects()[i].locked) {
                containsLockedObjects = true;
            }
        }

        // Add the appropriate selection options in the toolbar
        if (this.par.getSelectedObjects().length) {
            this.par.toolbar.addSelectionOptions(this.par.getSelectedObjects());

            if (!containsLockedObjects) {
                if (allowedEditsFunc(this.par, util.Edit.EDIT_VERTEX) || allowedEditsFunc(this.par, util.Edit.EDIT_EDGE)) {
                    this.par.toolbar.rightButtons['delete'].setEnabled();
                }
                if (isTypeFunc(this.par, util.Type.FSM)) {
                    this.par.toolbar.addFSMNodeSelectionOptions(this.par.getSelectedObjects());
                }
                if (isTypeFunc(this.par, util.Type.PETRI)) {
                    this.par.toolbar.addPetriSelectionOptions(this.par.getSelectedObjects());
                }
            }
        }

        // Disable the selection rectangle
        this.par.setSelectionRectangle(null);
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
        this.par.getDraggedObjects().forEach(element => {
            hasSelectionMoved = (element.hasMoved) ? true : hasSelectionMoved;
        });

        // Save a different graph state if the user dragged (and thus clicked) and the selection has moved
        if (this.par.getClickedObject() && hasSelectionMoved) {
            this.par.onGraphChange();
        }

        // If none of the selected objects have moved, and shift is not pressed, set the selected object to the
        // clicked object. I.e., unselect all other selected objects
        if (this.par.getClickedObject() && !hasSelectionMoved && !e.shiftKey) {
            this.par.setSelectedObjects([this.par.getClickedObject()]);

            // Display the according toolbar elements
            this.displayToolbarElementsOnSelect(allowedEditsFunc, isTypeFunc);
        }

        // Reset the 'hasMoved' parameter of all selected objects
        this.par.getSelectedObjects().forEach(element => element.resetHasMoved());
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
            let containsObjectsInfo = this.containsCertainObjects(this.par.getSelectedObjects());
            let containsLockedObjects = containsObjectsInfo['containsLockedObjects'];
            let containsVertex = containsObjectsInfo['containsVertex'];
            let containsEdge = containsObjectsInfo['containsEdge'];


            if(!containsLockedObjects &&
                !((containsVertex && !allowedEditsFunc(this.par, util.Edit.EDIT_VERTEX)) ||
                (containsEdge && !allowedEditsFunc(this.par, util.Edit.EDIT_EDGE)))) {
                this.par.deleteSelectedObjects(this.par);
            }
        } else if (pressedKey === 27) {
            // Escape key. Deselect the objects, and remove the selection options
            this.par.setSelectedObjects([]);
            this.par.toolbar.removeSelectionOptions();
            if (isTypeFunc(this.par, util.Type.FSM)) {
                this.par.toolbar.removeFSMNodeSelectionOptions();
            }
            if (isTypeFunc(this.par, util.Type.PETRI)) {
                this.par.toolbar.removePetriSelectionOptions();
            }
        }

        if (pressedKey === 17) {
            // Control key. If adding objects is allowed, set the mode to Draw
            if (this.par.getUIMode() !== util.ModeType.MOVE) {
                this.par.enableTemporaryMoveMode();
            }
        }
    };

    return {
        GraphEventHandler: GraphEventHandler
    };

});
