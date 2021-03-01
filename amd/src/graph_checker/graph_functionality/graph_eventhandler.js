/**
 * Implementation for the wrapper of the graph's canvas object.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil',
        'qtype_graphchecker/graph_checker/graphelements'], //TODO
    function ($, globals, util, elements) { //TODO

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
        this.par.setClickedObject(this.graphRepr.getObjectOnMousePos(mouse.x, mouse.y, true));
        this.par.setCanMoveObjects(false); //TODO: refactor away if possible

        // If the click was a left mouse click, then proceed with event handling
        if (e.button === 0) {
            // Depending on the mode, perform different tasks
            if (this.par.getUIMode() === util.ModeType.DRAW) {
                // Potentially create a new node
                this.createNewNode(mouse, allowedEditsFunc, isTypeFunc);
            } else if (this.par.getUIMode() === util.ModeType.SELECT) {
                // Potentially select one object, or add/remove multiple objects to/from the selection, or initialize
                // the selection rectangle
                this.selectObjects(e, mouse);

                // Display the according toolbar elements
                this.displayToolbarElementsOnSelect(allowedEditsFunc, isTypeFunc);

                // Perform selection-interaction with the canvas
                this.initializeObjectDragging(mouse);
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
    /* TODO: create
    GraphEventHandler.prototype.mouseup = function(e) {
        //console.log(e);
    };
     */

    /**
     * Function: mouseenter
     * Event handler for the mouseenter action
     *
     * Parameters:
     *    e - The generated event
     */
    GraphEventHandler.prototype.mouseenter = function(e) {
        if (!e.ctrlKey && this.isTempDrawModeActive) {
            // If the CTRL key is not pressed while the temporary draw mode is active, we disable temporary draw mode
            // This happens for example when releasing the CTRL key on an alert box popup
            this.par.disableTemporaryDrawMode();
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
        this.par.mouseup(e); // TODO
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
        let allowedEditsFunc = this.par.allowEdits;
        let isTypeFunc = this.par.isType;

        // Set the new (internally saved) mouse position to the current mouse position
        this.par.setMousePosition({x: mouse.x, y: mouse.y});

        // Depending on the mode, perform different tasks
        if (this.par.getUIMode() === util.ModeType.DRAW) {
            this.provisionallyCreateLink(mouse, allowedEditsFunc, isTypeFunc);

            // Disable the selection rectangle if we are in temporary draw mode
            if (this.par.getTempDrawModeActive()) {
                this.par.setSelectionRectangle(null);
            }
        } else if (this.par.getUIMode() === util.ModeType.SELECT) {
            // Move selected objects and possible apply snapping
            this.moveObjects(mouse, allowedEditsFunc);

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
    /* TODO: create
    GraphEventHandler.prototype.keydown = function(e) {
        let pressedKey = util.crossBrowserKey(e);

        // Find the name and type of the active HTML elements, and don't proceed if they are input fields
        let elementName = document.activeElement.localName;
        let elementType = document.activeElement.type;
        if (elementName === "input" && (elementType === "text" || elementType === "number")) {
            return;
        }

        // Define functions to be used
        let allowedEditsFunc = this.par.allowEdits;
        let isTypeFunc = this.par.isType;

        // Otherwise, if configuration keys (i.e. non-character keys) are pressed
        this.checkConfigurationKeysPressed();

        // If an object, having a label or token input field, is selected in SELECT mode, and the user presses a key
        // which produces a character, then focus the input field and add the typed character to the input field.
        // This enables the delete key to delete the item, instead of deleting the input field text
        // Furthermore, also check if the control key is not pressed, to still enable keyboad-control actions
        let specialDoubleCharacters = ['``', '~~', '\'\'', '^^', '""']; // Typed 'characters' which are not of length 1
        if ((e.key.length === 1 || specialDoubleCharacters.includes(e.key) || e.key === "Backspace") &&
            !e.originalEvent.ctrlKey) {
            let inputField = this.toolbar.middleInput['label'];

            // If the input field exists, and a number (or backspace) is entered for a number input field, continue
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
                    this.selectedObjects[0].text += e.key; // There is only one selected object if there is a label

                    if (element.value > inputField.maxValue) {
                        // Set to the max value
                        element.value = inputField.maxValue + '';
                        this.selectedObjects[0].text = inputField.maxValue + '';
                    }
                } else {
                    // Remove the last character from the input field
                    element.value = element.value.slice(0, -1);
                    this.selectedObjects[0].text = this.selectedObjects[0].text.slice(0, -1);
                }

                // Check for the validity of the label and take corresponding actions
                this.checkLabelValidity(element, element.value);

                // Focus the label
                this.focusElement(element, 100);
            }
        }

        if (e.key === "Backspace") {
            // Backspace is a shortcut for the back button, but do NOT want to change pages. Therefore return false
            return false;
        }

        this.par.draw();
    };
     */

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
            // Set the mode to SELECT if it is not set already
            if (this.par.getUIMode() !== util.ModeType.SELECT && this.par.getTempDrawModeActive()) {
                this.par.disableTemporaryDrawMode();
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
        if (!this.par.getClickedObject() && !this.par.getCurrentLink() && allowedEditsFunc(util.Edit.ADD_VERTEX)) {
            // Create a new node
            let newNode = new elements.Node(this.par, mousePos.x, mousePos.y);

            // If the graph is a Petri net, assign place/transition accordingly to what is set in the toolbar
            if (isTypeFunc(util.Type.PETRI)) {
                newNode.petriNodeType = this.par.petriNodeType;
            }

            // Add it to the graph representation
            this.graphRepr.addNode(newNode);

            // Set it as the initial node if it is the first node, and if the type is FSM
            if (this.graphRepr.getNodes().length === 1 && isTypeFunc(util.Type.FSM)) {
                this.par.setInitialFSMVertex(newNode);
            }

            // Set this node as the only selected object, so it shows a blue outline, and update the previously selected
            // objects
            this.par.setSelectedObjects([newNode]);
            this.par.setPreviousSelectedObjects(this.par.getSelectedObjects());

            // Also enable the editing fields
            this.par.toolbar.addSelectionOptions(this.par.getSelectedObjects());
            if (allowedEditsFunc(util.Edit.DELETE_VERTEX)) {
                this.par.toolbar.rightButtons['delete'].setEnabled();
            }
            if (isTypeFunc(util.Type.FSM)) {
                this.par.toolbar.addFSMNodeSelectionOptions(this.par.getSelectedObjects());
            }
            if (isTypeFunc(util.Type.PETRI)) {
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
            if (this.par.getClickedObject() && !this.par.getClickedObject().locked) {
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
                let newSelection = (this.par.getClickedObject() && !this.par.getClickedObject().locked) ?
                    [this.par.getClickedObject()] : [];
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
        // If a new object is selected (apart from TemporaryLinks), display the according input elements in the
        // toolbar
        if (this.par.getClickedObject() instanceof elements.Node ||
            this.par.getClickedObject() instanceof elements.Link ||
            this.par.getClickedObject() instanceof elements.SelfLink ||
            this.par.getClickedObject() instanceof elements.StartLink) {
            // Display the selection options
            this.par.toolbar.addSelectionOptions(this.par.getSelectedObjects());

            // Activate the delete button
            if (allowedEditsFunc(util.Edit.DELETE_VERTEX) || allowedEditsFunc(util.Edit.DELETE_EDGE)) {
                this.par.toolbar.rightButtons['delete'].setEnabled();
            }
        } else {
            // Remove displaying the selection options
            this.par.toolbar.removeSelectionOptions();

            // Deactivate teh delete button
            if (allowedEditsFunc(util.Edit.DELETE_VERTEX) || allowedEditsFunc(util.Edit.DELETE_EDGE)) {
                this.par.toolbar.rightButtons['delete'].setDisabled();
            }
        }

        // If the type is FSM, display the according buttons in the toolbar
        if (isTypeFunc(util.Type.FSM)) {
            let hasSelectionOneNode = false;
            for (let i = 0; i < this.par.getSelectedObjects().length; i++) {
                if (this.par.getSelectedObjects()[i] instanceof elements.Node) {
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
        if (isTypeFunc(util.Type.PETRI)) {
            if (this.par.getSelectedObjects().length) {
                this.par.toolbar.addPetriSelectionOptions(this.par.getSelectedObjects());
            } else {
                this.par.toolbar.removePetriSelectionOptions();
            }
        }
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
        if (!(this.par.templateParams.locknodes && this.par.getClickedObject() instanceof elements.Node)
            && !(this.par.templateParams.lockedges && this.par.getClickedObject() instanceof elements.Link)) {
            this.par.setCanMoveObjects(true);
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
        if (this.par.getClickedObject() instanceof elements.Node && allowedEditsFunc(util.Edit.ADD_EDGE)) {
            // Find the target node (we are hovering over), if any
            let targetNode = this.graphRepr.getObjectOnMousePos(mousePos.x, mousePos.y, true);
            let targetNodeStrict = this.graphRepr.getObjectOnMousePos(mousePos.x, mousePos.y, false);

            // If the target node is not a node (e.g. an edge) set it to null
            if(!(targetNode instanceof elements.Node)) {
                targetNode = null;
            }

            // Depending on the mouse position, and the target node, draw different kind of links
            if (targetNode === this.par.getClickedObject() &&
                (isTypeFunc(util.Type.DIRECTED) || isTypeFunc(util.Type.FSM))) {
                this.par.setCurrentLink(new elements.SelfLink(this.par, this.par.getClickedObject(), mousePos));
            } else if (targetNode && targetNode !== this.par.getClickedObject()) {
                this.par.setCurrentLink(new elements.Link(this.par, this.par.getClickedObject(), targetNode));
            } else if (!targetNodeStrict) {
                let closestPoint = this.par.getClickedObject().closestPointOnNode(mousePos.x, mousePos.y);
                this.par.setCurrentLink(new elements.TemporaryLink(this.par, closestPoint, mousePos));
            } else {
                // TODO: does it ever get here? //TODO: this.par as 2nd arg works as intended?
                this.par.setCurrentLink(new elements.TemporaryLink(this.par, this.par, mousePos));
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
     */
    GraphEventHandler.prototype.moveObjects = function(mousePos, allowedEditsFunc) {
        if (this.par.getDraggedObjects().length && this.par.getCanMoveObjects() && this.par.getClickedObject()) {
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
            if (allowedEditsFunc(util.Edit.MOVE)) {
                for (let i = 0; i < this.par.getDraggedObjects().length; i++) {
                    let object = this.par.getDraggedObjects()[i];

                    if (this.par.getClickedObject() instanceof elements.Node && object instanceof elements.Node) {
                        // Move and snap nodes
                        object.setAnchorPoint(mousePos.x, mousePos.y);
                        util.snapNode(object, nodesNotSelected, isAlignedVertically, isAlignedHorizontally);
                    } else if ((this.par.getClickedObject() instanceof elements.Link ||
                        this.par.getClickedObject() instanceof elements.SelfLink ||
                        this.par.getClickedObject() instanceof elements.StartLink) && this.par.getClickedObject() === object) {
                        // Move and snap links
                        let isSnapped = object.setAnchorPoint(mousePos.x, mousePos.y);
                        if (!isSnapped) {
                            // Deselect all other objects if the link has moved. In case of SelfLinks and StartLinks,
                            // which cannot be snapped, all objects are also deselected
                            this.par.setDraggedObjects([this.par.getClickedObject()]);
                        }
                    }

                    // Set the object to have moved
                    object.hasMoved = true; //TODO: create and use .setHasMoved() function?
                }
            }
        }
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
            if (allowedEditsFunc(util.Edit.DELETE_VERTEX) || allowedEditsFunc(util.Edit.DELETE_EDGE)) {
                this.deleteSelectedObjects(this); //TODO: where to place this function
            }
        } else if (pressedKey === 27) {
            // Escape key. Deselect the objects, and remove the selection options
            this.par.setSelectedObjects([]);
            this.par.toolbar.removeSelectionOptions();
            if (isTypeFunc(util.Type.FSM)) {
                this.par.toolbar.removeFSMNodeSelectionOptions();
            }
            if (isTypeFunc(util.Type.PETRI)) {
                this.par.toolbar.removePetriSelectionOptions();
            }
        }

        if (pressedKey === 17) {
            // Control key. If adding objects is allowed, set the mode to Draw
            if (this.par.getUIMode() !== util.ModeType.DRAW &&
                (allowedEditsFunc(util.Edit.ADD_VERTEX) || allowedEditsFunc(util.Edit.ADD_EDGE))) {
                this.par.enableTemporaryDrawMode();
            }
        }
    };

    return {
        GraphEventHandler: GraphEventHandler
    };

});