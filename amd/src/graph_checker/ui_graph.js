// This file is part of Moodle - http://moodle.org/
//
// Much of this code is from Finite State Machine Designer:
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


define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil',
        'qtype_graphchecker/graph_checker/graphelements',
        'qtype_graphchecker/graph_checker/graph_components/graph_representation',
        'qtype_graphchecker/graph_checker/graph_components/graph_canvas',
        'qtype_graphchecker/graph_checker/graph_components/help_overlay', 'qtype_graphchecker/graph_checker/ui_toolbar',
        'qtype_graphchecker/graph_checker/toolbar_elements'],
    function($, globals, util, elements, graph_representation, graph_canvas, help_overlay, ui_toolbar, toolbar_elements) {

    let self;

    /**
     * Function: GraphUI
     * Constructor for the GraphUI object, the ui component for a graph-drawing graphchecker question
     *
     * Parameters:
     *    textareaId - The id of the text area that this graph UI is to manage
     *    uiWrapper - The wrapper object of this graph
     *    width - The width of the wrapper node
     *    height - The height of the wrapper node
     *    templateParams - The parameters used for defining the graph
     */
    function GraphUI(textareaId, uiWrapper, width, height, templateParams) {
        self = this;
        this.canvasId = 'graphcanvas_' + textareaId;
        this.textArea = $(document.getElementById(textareaId));
        this.uiMode = util.ModeType.SELECT; // Set the UI mode to be 'Select' initially //TODO
        this.isTempDrawModeActive = false;
        this.petriNodeType = util.PetriNodeType.NONE;
        this.readOnly = this.textArea.prop('readonly');
        this.templateParams = templateParams;
        this.uiWrapper = uiWrapper;

        this.graphRepr = new graph_representation.GraphRepresentation(this, this.nodeRadius);

        this.graphCanvas = new graph_canvas.GraphCanvas(this, this.canvasId, width, height);

        let helpOverlayId = 'graphcanvas_overlay_' + textareaId;
        this.helpOverlay = new help_overlay.HelpOverlay(this, helpOverlayId, this.uiWrapper);

        this.toolbarId = 'toolbar_' + textareaId;
        this.toolbar = null;
        if (!this.readOnly) {
            // Set the toolbar only if readonly is disabled
            this.toolbar = new ui_toolbar.GraphToolbar(this, this.toolbarId, width, this.uiMode, this.helpOverlay);
        }

        // The div that contains the entire graph UI (i.e. the toolbar, graph, and help overlay)
        this.containerDiv = $(document.createElement('div'));
        $(this.containerDiv).addClass('graph_ui_container_div');

        this.selectedObjects = []; // One or more elements.Link or elements.Node objects. Default: empty array
        this.previousSelectedObjects = []; // Same as selectedObjects, but previous selected ones
        this.draggedObjects = []; // The elements that are currently being dragged; [] if not dragging
        this.clickedObject = null; // The last manually clicked object
        this.selectionRectangle = null; // The top-left/bottom-right corners of the selection rectangle,
        // used in the form [{x: null, y: null}, {x: null, y: null}]
        this.currentLink = null;
        this.mousePosition = null; // A variable to denote the position of the mouse on the canvas.
        // Format: {x: number, y: number}
        this.canMoveObjects = false;
        this.fail = false;  // Will be set true if load fails (can't deserialise).
        this.failString = null;  // Language string key for fail error message.

        // Creates and sets the HTML help text for the help overlay
        this.helpOverlay.setHelpText(this.templateParams, this.isType, this.allowEdits);

        // A variable denoting the edit-history of the graph, in the form of a stack (LIFO), used in the undo/redo mechanism
        // Load it with the initial graph
        this.historyStack = [$(this.textArea).val()];
        this.historyStackPointer = 0; // A pointer pointing to an entry in the historyStack

        this.load();
        if (!this.fail) {
            this.draw();
        }

        // Call the update function at a fixed interval
        this.updateTimer = window.setInterval(function(){ self.update(); }, 50);
    }

    /**
     * Function: failed
     *
     * Returns:
     *    Whether the graph failed on load or not
     */
    GraphUI.prototype.failed = function() {
        return this.fail;
    };

    /**
     * Function: failMessage
     *
     * Returns:
     *    String for the fail error message
     */
    GraphUI.prototype.failMessage = function() {
        return this.failString;
    };

    /**
     * Function: getElement
     *
     * Returns:
     *    The HTML element that the wrapper is to insert into the HTML DOM.
     */
    GraphUI.prototype.getElement = function() {
        this.containerDiv.append(this.getHelpOverlay());
        this.containerDiv.append(this.getToolbar());
        this.containerDiv.append(this.getCanvas());
        return this.containerDiv;
    };

    /**
     * Function: hasFocus
     *
     * Returns:
     *    Whether the canvas is the focused object
     */
    GraphUI.prototype.hasFocus = function() {
        return document.activeElement === this.getCanvas();
    };

    /**
     * Function: getCanvas
     *
     * Returns:
     *    The canvas HTML element of this graph
     */
    GraphUI.prototype.getCanvas = function() {
        return this.graphCanvas.canvas[0];
    };

    /**
     * Function: getToolbar
     *
     * Returns:
     *    The toolbar HTML element of this graph
     */
    GraphUI.prototype.getToolbar = function() {
        if (this.toolbar !== null) {
            return this.toolbar.div[0];
        } else {
            return null;
        }
    };

    /**
     * Function: getHelpOverlay
     *
     * Returns:
     *    The help overlay HTML element of this graph
     */
    GraphUI.prototype.getHelpOverlay = function() {
        return this.helpOverlay.div;
    };

    /**
     * Function: setUIMode
     * Sets the interaction UI mode type, which is either selecting or drawing
     *
     * Parameters:
     *    modeType - The mode type which is to be set
     */
    GraphUI.prototype.setUIMode = function(modeType) {
        this.uiMode = modeType;
        this.clickedObject = null;

        if (this.uiMode === util.ModeType.DRAW) {
            // Deselect all selected objects
            this.selectedObjects = [];

            // Disable the delete button
            if (this.allowEdits(util.Edit.DELETE_VERTEX) || this.allowEdits(util.Edit.DELETE_EDGE)) {
                this.toolbar.rightButtons['delete'].setDisabled();
            }

            // If the graph type is Petri net
            if (this.isType(util.Type.PETRI)) {
                this.toolbar.addPetriNodeTypeOptions();
            }

            // Style the buttons correctly
            if (this.toolbar.leftButtons['select']) {
                this.toolbar.leftButtons['select'].setDeselected();
            }
            if (this.toolbar.leftButtons['draw']) {
                this.toolbar.leftButtons['draw'].setSelected();
            }
        } else if (this.uiMode === util.ModeType.SELECT) {
            if (this.isType(util.Type.PETRI)) {
                this.toolbar.removePetriNodeTypeOptions();
            }

            // Style the buttons correctly
            if (this.toolbar.leftButtons['select']) {
                this.toolbar.leftButtons['select'].setSelected();
            }
            if (this.toolbar.leftButtons['draw']) {
                this.toolbar.leftButtons['draw'].setDeselected();
            }
        }
    };

    /**
     * Function: nodeRadius
     *
     * Returns:
     *    The node radius used for drawing nodes on the canvas
     */
    GraphUI.prototype.nodeRadius = function() {
        return self.templateParams.noderadius ? self.templateParams.noderadius : globals.DEFAULT_NODE_RADIUS;
    };

    /**
     * Function: fontSize
     *
     * Returns:
     *    The font size used for drawing text on the canvas
     */
    GraphUI.prototype.fontSize = function() {
        return self.templateParams.fontsize ? self.templateParams.fontsize : globals.DEFAULT_FONT_SIZE;
    };

    /**
     * Function: isType
     *
     * Parameters:
     *    type - The type of graph (i.e.. directed/undirected/fsm/petri) as a string
     *
     * Returns:
     *    Whether the graph is of the type as denoted by the input parameter
     */
    GraphUI.prototype.isType = function(type) {
        return self.templateParams.type === type;
    };

    /**
     * Function: allowEdits
     *
     * Parameters:
     *    edits - One or more enum values (as an array) of possible edits which the user can conduct
     *
     * Returns:
     *    Whether the graph allows the supplied edit(s), as specified by the allow_edits parameter
     */
    GraphUI.prototype.allowEdits = function(edits) {
        let editsArray = [];
        let allowed_edits = self.templateParams.allow_edits;

        if (!allowed_edits) {
            // If the input parameter is undefined (or equal to null) then allow everything
            return true;
        } else if ((Array.isArray(allowed_edits) && !allowed_edits.length) || (self.readOnly)) {
            // If the array is empty, or the graph is readonly, don't allow anything
            return false;
        }

        // Else, check whether the supplied arguments (i.e. edits) are allowed
        if (typeof edits === 'string') {
            // Check if the variable is a single enum (string)
            editsArray.push(edits);
        } else if (Array.isArray(edits) && edits.every(x => (typeof x === "string"))) {
            // Check if the variable is an array of enums (strings)
            editsArray = edits;
        } else {
            return false;
        }

        // For each of the edits, check if the enum is valid, and whether it is present as an input parameter
        for (let i = 0; i < editsArray.length; i++) {
            if (!(typeof editsArray[i] === 'string' &&
                Object.values(util.Edit).includes(editsArray[i]) &&
                allowed_edits.includes(editsArray[i]))) {
                return false;
            }
        }

        return true;
    };

    /**
     * Function: allowsOneEdit
     *
     * Returns:
     *    Whether the graph allows at least one type of edit
     */
    GraphUI.prototype.allowsOneEdit = function() {
        for (let i = 0; i < Object.values(util.Edit).length; i++) {
            let edit = Object.values(util.Edit)[i];
            if (this.allowEdits(edit)) {
                return true;
            }
        }

        return false;
    };

    /**
     * Function: checkStringValidity
     *
     * Parameters:
     *    string - The string for which to check the validity
     *    selectedObject - The object (one) which is selected by the user, e.g. a node or a link
     *
     * Returns:
     *    Whether the string is valid, as per the regex in the template parameters, for the selected object
     */
    GraphUI.prototype.checkStringValidity = function(string, selectedObject) {
        // A variable denoting the used regex, without forward slashes around the regex. /.*/ is the default regex
        let regexString = '.*';
        if (selectedObject instanceof elements.Node && this.templateParams.vertex_label_regex) { //TODO: fix changed templateParams
            regexString = this.templateParams.vertex_label_regex;
        } else if ((selectedObject instanceof elements.Link || selectedObject instanceof elements.SelfLink) &&
            this.templateParams.edge_label_regex) {
            regexString = this.templateParams.edge_label_regex;
        }

        return new RegExp(regexString).test(string);
    };

    /**
     * Function: checkStringValidity
     * If the label is invalid, this is indicated by a red border around the input field
     *
     * Parameters:
     *    labelInputField - The HTML input field of the label, used to indicate invalidity
     *    labelText - The text of the label (i.e. node or link text) for which to check the validity
     */
    GraphUI.prototype.checkLabelValidity = function(labelInputField, labelText) {
        let isValid = this.checkStringValidity(labelText, this.selectedObjects[0]);

        if (!isValid) {
            // Set the textfield border to red by applying a class to the input field
            $(labelInputField).addClass('invalid');
        } else {
            // Remove the red border
            $(labelInputField).removeClass('invalid');
        }
    };

    /**
     * Function: arrowIfReqd
     * Draws an arrow head if the current graph is a directed graph. Otherwise don't draw it
     *
     * Parameters:
     *    c - The canvas rendering context, on which to draw the arrow head
     *    x - The x-coordinate of the arrow head's tip
     *    y - The y-coordinate of the arrow head's tip
     *    angle - The angle for which to draw the arrow head, in radians TODO: DRAW
     */
    GraphUI.prototype.arrowIfReqd = function(c, x, y, angle) {
        if (this.isType(util.Type.DIRECTED) || this.isType(util.Type.FSM) || this.isType(util.Type.PETRI)) {
            util.drawArrow(c, x, y, angle);
        }
    };

    GraphUI.prototype.enableTemporaryDrawMode = function() {
        if (this.allowEdits(util.Edit.ADD_VERTEX) || this.allowEdits(util.Edit.ADD_EDGE)) {
            // Assign the latest selected object
            this.previousSelectedObjects = this.selectedObjects;

            // Set the mode to Draw
            this.setUIMode(util.ModeType.DRAW);
            this.selectedObjects = this.previousSelectedObjects; // Re-add the selected objects
            this.isTempDrawModeActive = true;
        }
    };

    GraphUI.prototype.disableTemporaryDrawMode = function() {
        if (this.allowEdits(util.Edit.ADD_VERTEX) || this.allowEdits(util.Edit.ADD_EDGE)) {
            // A variable denoting whether the label input has focus or not
            let hasLabelFocus = false;
            let label = this.toolbar.middleInput['label'];
            let inputElement = null;
            if (label && label instanceof toolbar_elements.TextField) {
                inputElement = label.object[0].childNodes[1].childNodes[0];
                hasLabelFocus = $(inputElement).is(":focus");
            } else if (label && label instanceof toolbar_elements.NumberInputField) {
                inputElement = label.object[0].childNodes[1];
                hasLabelFocus = $(inputElement).is(":focus");
            }

            // Set the UI mode, and set the selected objects
            this.setUIMode(util.ModeType.SELECT);
            this.selectedObjects = this.previousSelectedObjects;
            this.isTempDrawModeActive = false;

            // Enable the delete button if something is selected
            if ((this.allowEdits(util.Edit.DELETE_VERTEX) || this.allowEdits(util.Edit.DELETE_EDGE)) &&
                this.selectedObjects.length) {
                this.toolbar.rightButtons['delete'].setEnabled();
            }

            // Set the label focus for Petri net graphs
            if (this.isType(util.Type.PETRI) && hasLabelFocus) {
                // If the element was previously focused on, re-add the focus
                this.focusElement(inputElement, 10);
            }
            this.draw();
        }
    };

    // Copy the serialised version of the graph to the TextArea.
    // TODO: Keep function
    GraphUI.prototype.sync = function() {
        // Nothing to do ... always sync'd.
    };

    GraphUI.prototype.focusElement = function(element, timeout) {
        // Applying a focus with a short unnoticable delay works. Directly applying without delay does not work
        setTimeout(function () {
            if (element) {
                $(element).focus();
            }
        }, timeout);
    };

    GraphUI.prototype.keypress = function(e) {
        var key = util.crossBrowserKey(e);

        if (this.readOnly) {
            return;
        }

        if (key === 8 || key === 0x20 || key === 9) {
            // Disable scrolling on backspace, tab and space.
            return false;
        }
    };

    GraphUI.prototype.mousedown = function(e) {
        var mouse = util.mousePos(e);

        if (this.readOnly) {
            return;
        }

        this.clickedObject = this.graphRepr.getObjectOnMousePos(mouse.x, mouse.y, true);
        this.canMoveObjects = false;

        // Check whether the click is a left mouse click
        if (e.button === 0) {
            // Depending on the mode, perform different tasks
            if (this.uiMode === util.ModeType.DRAW) {
                if (!this.clickedObject && !this.currentLink && this.allowEdits(util.Edit.ADD_VERTEX)) {
                    // Draw a node
                    let newNode = new elements.Node(this, mouse.x, mouse.y);
                    if (this.isType(util.Type.PETRI)) { // Consider the node a place if it is a petri net
                        newNode.petriNodeType = this.petriNodeType;
                    }
                    this.graphRepr.addNode(newNode);

                    // Set as initial node if it is the first node, and if the type is FSM
                    if (this.graphRepr.getNodes().length === 1 && this.isType(util.Type.FSM)) {
                        this.setInitialFSMVertex(newNode);
                    }

                    // Set this node as the only selected object, so it shows a blue outline
                    this.selectedObjects = [newNode];
                    this.previousSelectedObjects = this.selectedObjects;

                    // Also enable the editing fields
                    this.toolbar.addSelectionOptions(this.selectedObjects);
                    if (this.allowEdits(util.Edit.DELETE_VERTEX)) {
                        this.toolbar.rightButtons['delete'].setEnabled();
                    }
                    if (this.isType(util.Type.FSM)) {
                        this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
                    }
                    if (this.isType(util.Type.PETRI)) {
                        this.toolbar.addPetriSelectionOptions(this.selectedObjects);
                    }
                    this.onGraphChange();
                }

            } else if (this.uiMode === util.ModeType.SELECT) {
                if (e.shiftKey) {
                    if (this.clickedObject && !this.clickedObject.locked) {
                        if (!this.selectedObjects.includes(this.clickedObject)) {
                            // Add to selection
                            this.selectedObjects.push(this.clickedObject);
                        } else {
                            // Remove from selection
                            this.selectedObjects = this.selectedObjects.filter(e => e !== this.clickedObject);
                        }
                    }
                } else {
                    if (!this.selectedObjects.includes(this.clickedObject)) {
                        // Set this object as the only selected if it was not selected yet
                        this.selectedObjects = (this.clickedObject && !this.clickedObject.locked) ? [this.clickedObject] : [];
                    }
                }

                // If a new object is selected (apart from TemporaryLinks),
                // display the according input elements in the toolbar
                if (this.clickedObject instanceof elements.Node || this.clickedObject instanceof elements.Link ||
                    this.clickedObject instanceof elements.SelfLink ||
                    this.clickedObject instanceof elements.StartLink) {
                    this.toolbar.addSelectionOptions(this.selectedObjects);
                } else {
                    this.toolbar.removeSelectionOptions();
                }

                // If the type is FSM, display the according buttons in the toolbar, depending on the situation
                if (this.isType(util.Type.FSM)) {
                    let hasSelectionOneNode = false;
                    for (let i = 0; i < this.selectedObjects.length; i++) {
                        if (this.selectedObjects[i] instanceof elements.Node) {
                            hasSelectionOneNode = true;
                        }
                    }
                    if (hasSelectionOneNode) {
                        this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
                    } else {
                        this.toolbar.removeFSMNodeSelectionOptions();
                    }
                }

                // If the type is Petri, display the according token input field in the toolbar
                if (this.isType(util.Type.PETRI)) {
                    if (this.selectedObjects.length) {
                        this.toolbar.addPetriSelectionOptions(this.selectedObjects);
                    } else {
                        this.toolbar.removePetriSelectionOptions();
                    }
                }

                // Start dragging objects
                if (!(this.templateParams.locknodes && this.clickedObject instanceof elements.Node)
                    && !(this.templateParams.lockedges && this.clickedObject instanceof elements.Link)) {
                    this.canMoveObjects = true;
                    this.draggedObjects = [...this.selectedObjects];
                    if (this.clickedObject !== null && !this.draggedObjects.includes(this.clickedObject)) {
                        this.draggedObjects.push(this.clickedObject);
                    }
                    for (let i = 0; i < this.draggedObjects.length; i++) {
                        let object = this.draggedObjects[i];
                        if (object && object.setMouseStart) {
                            object.setMouseStart(mouse.x, mouse.y);
                        }
                    }
                }

                // If an object is selected, activate the delete button.
                // Else, deactivate it
                if (this.clickedObject instanceof elements.Node || this.clickedObject instanceof elements.Link ||
                    this.clickedObject instanceof elements.SelfLink ||
                    this.clickedObject instanceof elements.StartLink) {
                    if (this.allowEdits(util.Edit.DELETE_VERTEX) || this.allowEdits(util.Edit.DELETE_EDGE)) {
                        this.toolbar.rightButtons['delete'].setEnabled();
                    }
                } else {
                    if (this.allowEdits(util.Edit.DELETE_VERTEX) || this.allowEdits(util.Edit.DELETE_EDGE)) {
                        this.toolbar.rightButtons['delete'].setDisabled();
                    }
                }

                if (!this.clickedObject) {
                    // Clicking on an empty canvas spot marks one corner of the selection rectangle
                    // The other one will be the same position
                    this.selectionRectangle = [{x: mouse.x, y :mouse.y}, {x: mouse.x, y :mouse.y}];
                }
            }
        }

        this.draw();

        if(this.hasFocus()) {
            // Disable drag-and-drop only if the canvas is already focused.
            return false;
        } else {
            // Otherwise, let the browser switch the focus away from wherever it was.
            return true;
        }
    };

    GraphUI.prototype.keydown = function(e) {
        var key = util.crossBrowserKey(e);

        let elementName = document.activeElement.localName;
        let elementType = document.activeElement.type;

        if (this.readOnly || (elementName === "input" && (elementType === "text" || elementType === "number"))) {
            return;
        }

        if (key === 46) { // Delete key.
            if (this.allowEdits(util.Edit.DELETE_VERTEX) || this.allowEdits(util.Edit.DELETE_EDGE)) {
                this.deleteSelectedObjects(this);
            }
        } else if (key === 27) { // Escape key.
            // Deselect the objects, and remove the select bar
            this.selectedObjects = [];
            this.toolbar.removeSelectionOptions();
            if (this.isType(util.Type.FSM)) {
                this.toolbar.removeFSMNodeSelectionOptions();
            }
            if (this.isType(util.Type.PETRI)) {
                this.toolbar.removePetriSelectionOptions();
            }
            this.draw();
        }

        if (key === 17) { // Control key

            // Set the mode to Draw if it is not set already, and if drawing (i.e. adding) is allowed
            if (this.uiMode !== util.ModeType.DRAW &&
                (this.allowEdits(util.Edit.ADD_VERTEX) || this.allowEdits(util.Edit.ADD_EDGE))) {
                this.enableTemporaryDrawMode();
            }
        }

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
    };

    GraphUI.prototype.keyup = function(e) {
        var key = util.crossBrowserKey(e);

        if (this.readOnly) {
            return;
        }

        if (key === 17) { // Control key
            // Set the mode to SELECT if it is not set already
            if (this.uiMode !== util.ModeType.SELECT && this.isTempDrawModeActive) {
                this.disableTemporaryDrawMode();
            }
        }
    };

    // This function is executed to check for certain key presses
    GraphUI.prototype.checkKeyPressed = function(e) {
        if (!e.ctrlKey && this.isTempDrawModeActive) {
            // If the CTRL key is not pressed while the temporary draw mode is active, we disable temporary draw mode
            // This happens for example when releasing the CTRL key on an alert box popup
            this.disableTemporaryDrawMode();
        }
    };

    GraphUI.prototype.resize = function(w, h) {
        // Setting w to w+1 in order to fill the resizable area's width with the canvases completely
        w = w+1;
        let isToolbarNull = this.toolbar === null;
        let toolbarHeight = 0;
        if (!isToolbarNull) {
            toolbarHeight = $(this.toolbar.div[0]).height();
        }

        // Resize the canvas (possibly with additional height if there is no toolbar) and the toolbar (possibly)
        this.graphCanvas.resize(w, h - toolbarHeight);// + (toolbarHeight - this.BASE_TOOLBAR_HEIGHT)));
        if (!isToolbarNull) {
            this.toolbar.resize();
        }
        this.draw();
    };

    GraphUI.prototype.mousemove = function(e) {
        var mouse = util.mousePos(e),
            closestPoint;

        if (this.readOnly) {
            return;
        }

        this.mousePosition = {x: mouse.x, y: mouse.y};

        // Depending on the mode, perform different tasks
        if (this.uiMode === util.ModeType.DRAW) {
            if (this.clickedObject instanceof elements.Node && this.allowEdits(util.Edit.ADD_EDGE)) {
                let targetNode = this.graphRepr.getObjectOnMousePos(mouse.x, mouse.y, true);
                let targetNodeStrict = this.graphRepr.getObjectOnMousePos(mouse.x, mouse.y, false);
                if(!(targetNode instanceof elements.Node)) {
                    // If the target node is not a node (e.g. an edge) set it to null
                    targetNode = null;
                }

                // Depending on the mouse position, draw different kind of links
                if (targetNode === this.clickedObject &&
                    (this.isType(util.Type.DIRECTED) || this.isType(util.Type.FSM))) {
                    this.currentLink = new elements.SelfLink(this, this.clickedObject, mouse);
                } else if (targetNode && targetNode !== this.clickedObject) {
                    this.currentLink = new elements.Link(this, this.clickedObject, targetNode);
                } else if (!targetNodeStrict) {
                    closestPoint = this.clickedObject.closestPointOnNode(mouse.x, mouse.y);
                    this.currentLink = new elements.TemporaryLink(this, closestPoint, mouse);
                } else {
                    this.currentLink = new elements.TemporaryLink(this, this, mouse);
                }
            }

            if (this.isTempDrawModeActive) {
                this.selectionRectangle = null;
            }
        } else if (this.uiMode === util.ModeType.SELECT) {
            if (this.draggedObjects.length) {
                if (this.canMoveObjects && this.clickedObject) {
                    // Apply horizontal/vertical snapping to all selected objects if they align horizontally/vertically
                    let isAlignedHorizontally = true;
                    let isAlignedVertically = true;
                    for (let i = 0; i < this.draggedObjects.length - 1; i++) {
                        if (this.draggedObjects[i].x !== this.draggedObjects[i + 1].x) {
                            isAlignedVertically = false;
                        }
                        if (this.draggedObjects[i].y !== this.draggedObjects[i + 1].y) {
                            isAlignedHorizontally = false;
                        }
                    }

                    // Get all nodes that are not in the draggedObjects
                    let nodesSet = new Set(this.graphRepr.getNodes());
                    let draggedObjectsSet = new Set(this.draggedObjects);
                    let nodesNotSelected = [...nodesSet].filter(x => !draggedObjectsSet.has(x));

                    if (this.allowEdits(util.Edit.MOVE)) {
                        for (let i = 0; i < this.draggedObjects.length; i++) {
                            let object = this.draggedObjects[i];
                            if (this.clickedObject instanceof elements.Node && object instanceof elements.Node) {
                                object.setAnchorPoint(mouse.x, mouse.y);
                                this.snapNode(object, nodesNotSelected, isAlignedVertically, isAlignedHorizontally);
                            } else if ((this.clickedObject instanceof elements.Link ||
                                this.clickedObject instanceof elements.SelfLink ||
                                this.clickedObject instanceof elements.StartLink) && this.clickedObject === object) {
                                let isSnapped = object.setAnchorPoint(mouse.x, mouse.y);
                                if (!isSnapped) {
                                    // Deselect all other objects if the link has moved.
                                    // In case of SelfLinks and StartLinks, which cannot be snapped,
                                    // all objects are also deselected
                                    this.draggedObjects = [this.clickedObject];
                                }
                            }

                            // Set the object to have moved
                            object.hasMoved = true;
                        }
                    }
                }
            }

            if (!this.clickedObject && this.selectionRectangle) {
                // Overwrite the other corner of the selection rectangle
                this.selectionRectangle[1] = {x: mouse.x, y: mouse.y};
            }
        }

        this.draw();
    };

    GraphUI.prototype.mouseup = function(e) {
        if (this.readOnly) {
            return;
        }
        // After an alert popup (e.g. originating from this function), this function is called again
        // Check what keys are pressed (used to for example deactive temporary draw mode, if applicable)
        this.checkKeyPressed(e);

        if (this.currentLink) {
            if (!(this.currentLink instanceof elements.TemporaryLink) && this.allowEdits(util.Edit.ADD_EDGE)) {
                // Remove the created link if the graph is of type 'Petri' and a link is made to a node of the same
                // Petri type (e.g. place->place, or transition->transition).
                // Also display a warning in the form of an alert
                let node;
                if (this.currentLink instanceof elements.SelfLink) {
                    node = this.currentLink.node;
                } else {
                    node = this.currentLink.nodeA;
                }
                if (this.isType(util.Type.PETRI) && node.petriNodeType === this.currentLink.nodeB.petriNodeType &&
                    this.currentLink.nodeA !== this.currentLink.nodeB) {
                    let nodeType = this.currentLink.nodeA.petriNodeType;
                    this.alertPopup('An edge between two ' + nodeType + 's of a Petri net is not permitted.');
                    return;
                } else if (this.isType(util.Type.UNDIRECTED)) {
                    // In case of an undirected graph, only 1 edge in between two nodes is permitted
                    for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
                        if ((this.graphRepr.getLinks()[i].nodeA === this.currentLink.nodeA &&
                            this.graphRepr.getLinks()[i].nodeB === this.currentLink.nodeB) ||
                            (this.graphRepr.getLinks()[i].nodeA === this.currentLink.nodeB &&
                                this.graphRepr.getLinks()[i].nodeB === this.currentLink.nodeA)) {
                            this.alertPopup('Two edges between two nodes is not permitted.');
                            return;
                        }
                    }
                } else if (this.isType(util.Type.DIRECTED) && !this.isType(util.Type.FSM) &&
                    !this.isType(util.Type.PETRI)) {
                    // In case of a directed graph (non-FSM, non-Petri), only 1 edge from two arbitrary
                    // nodes v_1 to v_2 is permitted
                    for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
                        if (!(this.currentLink instanceof elements.SelfLink)) {
                            if (this.graphRepr.getLinks()[i].nodeA === this.currentLink.nodeA &&
                                this.graphRepr.getLinks()[i].nodeB === this.currentLink.nodeB) {
                                this.alertPopup('Two edges from one node to another is not permitted.');
                                return;
                            }
                        } else {
                            if (this.graphRepr.getLinks()[i].node === this.currentLink.node) {
                                this.alertPopup('Two self-loops for a node is not permitted.');
                                return;
                            }
                        }
                    }
                }
                this.addLink(this.currentLink);

                // Set this link as the only selected object, so it shows a blue outline
                this.selectedObjects = [this.currentLink];
                this.previousSelectedObjects = this.selectedObjects;

                // Remove FSM/Petri fields
                if (this.isType(util.Type.FSM)) {
                    this.toolbar.removeFSMNodeSelectionOptions();
                }
                if (this.isType(util.Type.PETRI)) {
                    this.toolbar.removePetriNodeTypeOptions();
                    this.toolbar.removePetriSelectionOptions();
                }

                // Enable the editing fields
                this.toolbar.addSelectionOptions(this.selectedObjects);

                // Enable the delete button as well
                if (this.allowEdits(util.Edit.DELETE_EDGE)) {
                    this.toolbar.rightButtons['delete'].setEnabled();
                }

                this.onGraphChange();
            }
            this.currentLink = null;
            this.clickedObject = null;
        } else if (this.selectionRectangle) {
            // Remove the selection rectangle, and select or deselect all elements in it
            // Also set appropriate property selection options (e.g. initial state or final state for FSMs)
            let objects = this.graphRepr.getObjectsInRectangle(this.selectionRectangle);
            if (e.shiftKey) {
                // If all selected objects (within the rectangle) are already selected, deselect these
                // Otherwise, add all items to the selection
                let areAllObjectsAlreadySelected = true;
                for (let i = 0; i < objects.length; i++) {
                    if (!this.selectedObjects.includes(objects[i])) {
                        areAllObjectsAlreadySelected = false;
                    }
                }

                // Perform the addition/deletion of the selected objects
                for (let i = 0; i < objects.length; i++) {
                    if (!areAllObjectsAlreadySelected) {
                        this.selectedObjects.push(objects[i]);
                    } else {
                        this.selectedObjects = this.selectedObjects.filter(e => e !== objects[i]);
                    }
                }
            } else {
                this.selectedObjects = objects;
            }

            // Add the appropriate selection functions
            if (this.selectedObjects.length) {
                this.toolbar.addSelectionOptions(this.selectedObjects);
                if (this.allowEdits(util.Edit.DELETE_VERTEX) || this.allowEdits(util.Edit.DELETE_EDGE)) {
                    this.toolbar.rightButtons['delete'].setEnabled();
                }
                if (this.isType(util.Type.FSM)) {
                    this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
                }
                if (this.isType(util.Type.PETRI)) {
                    this.toolbar.addPetriSelectionOptions(this.selectedObjects);
                }
            }
            this.selectionRectangle = null;
        } else if (this.uiMode === util.ModeType.SELECT) {

            // Save the graph when dragged nodes and/or edges have moved
            let hasSelectionMoved = false;
            this.draggedObjects.forEach(element => {
                hasSelectionMoved = (element.hasMoved) ? true : hasSelectionMoved;
            });

            // Save a different graph state if applicable
            if (this.clickedObject && hasSelectionMoved) {
                this.onGraphChange();
            }

            // If none of the selected objects has moved, and shift is not pressed,
            // set the selected object to the clicked object. I.e., unselect all other selected objects
            if (this.clickedObject && !this.clickedObject.locked && !hasSelectionMoved && !e.shiftKey) {
                this.selectedObjects = [this.clickedObject];
            }

            // Reset the 'hasMoved' parameter of all selected objects
            this.selectedObjects.forEach(element => element.resetHasMoved());

            this.clickedObject = null;
            this.canMoveObjects = false;
        } else {
            this.clickedObject = null;
            this.canMoveObjects = false;
        }
        this.draw();
    };

    // This event function is activated when the mouse enters the graph canvas
    GraphUI.prototype.mouseenter = function(e) {
        // Check what keys are pressed (used to for example deactive temporary draw mode, if applicable)
        this.checkKeyPressed(e);
    };

    // This event function is activated when the mouse leaves the graph canvas
    GraphUI.prototype.mouseleave = function(e) {
        // Set the mouse position to null
        this.mousePosition = null;
        this.mouseup(e);
    };

    GraphUI.prototype.alertPopup = function(message) {
        this.currentLink = null;
        this.clickedObject = null;
        this.draw();
        window.alert(message);
    };

    GraphUI.prototype.deleteSelectedObjects = function(graphUI) {
        if (graphUI.selectedObjects.length) {
            if (graphUI.allowEdits(util.Edit.DELETE_VERTEX)) {
                for (let i = 0; i < graphUI.graphRepr.getNodes().length; i++) {
                    if (graphUI.selectedObjects.includes(graphUI.graphRepr.getNodes()[i])) {
                        graphUI.graphRepr.getNodes().splice(i--, 1);
                    }
                }
            }
            if (graphUI.allowEdits(util.Edit.DELETE_EDGE)) {
                for (let i = 0; i < graphUI.graphRepr.getLinks().length; i++) {
                    if (graphUI.selectedObjects.includes(graphUI.graphRepr.getLinks()[i]) ||
                        graphUI.selectedObjects.includes(graphUI.graphRepr.getLinks()[i].node) ||
                        graphUI.selectedObjects.includes(graphUI.graphRepr.getLinks()[i].nodeA) ||
                        graphUI.selectedObjects.includes(graphUI.graphRepr.getLinks()[i].nodeB)) {
                        graphUI.graphRepr.getLinks().splice(i--, 1);
                    }
                }
            }
            graphUI.selectedObjects = [];
            graphUI.previousSelectedObjects = [];
            graphUI.draw();

            // Set the deleted button as disabled
            if (graphUI.allowEdits(util.Edit.DELETE_VERTEX) || graphUI.allowEdits(util.Edit.DELETE_EDGE)) {
                graphUI.toolbar.rightButtons['delete'].setDisabled();
            }

            // Remove the options in the toolbar based on the selected object
            graphUI.toolbar.removeSelectionOptions();
            graphUI.toolbar.removeFSMNodeSelectionOptions();
            graphUI.toolbar.removePetriSelectionOptions();

            graphUI.onGraphChange();
        }
    };

    GraphUI.prototype.setInitialFSMVertex = function(vertex) {
        // TODO: use the input parameter to decide whether there is only 1 input vertex, or whether there can be any
        //  number of input vertices

        // Set the selected vertex as the initial vertex, and draw it
        if (this.isType(util.Type.FSM) && vertex instanceof elements.Node) {
            vertex.isInitial = true;

            // Get the angles of all incident (i.e. incoming and outgoing) edges of this vertex
            let angles = util.getAnglesOfIncidentLinks(this.graphRepr.getLinks(), vertex);

            let topLeft = (3.0/4.0 * Math.PI); // The top-left of the vertex's circle in radians
            let nodeLinkDrawRadius = this.nodeRadius() + globals.INITIAL_FSM_NODE_LINK_LENGTH*2; // The radius used to draw
            // edges in the last two cases

            // Execute different cases, to fill the startLinkPos variable's x and y values
            let startLinkPos = {};
            if (angles.length === 0) {
                // Set the start link position to the top-left of the vertex
                startLinkPos.x = vertex.x - (this.nodeRadius() + globals.INITIAL_FSM_NODE_LINK_LENGTH);
                startLinkPos.y = vertex.y - (this.nodeRadius() + globals.INITIAL_FSM_NODE_LINK_LENGTH);
            } else if (angles.length === 1) {
                // Divide the circle of the vertex in an arbitrary number of equal parts (e.g. 8).
                // For each of these parts' borders (except for the location of the incident edge itself) check which
                // border's angle (w.r.t. the selected vertex) is closest to the top-left corner.
                // The start link will then be created based on this border's angle

                let oppositeAngle = (angles[0] + Math.PI) % (2*Math.PI); // Angle opposite of incident edge's angle

                // Get all possible (i.e. candidate) angles
                angles = util.getAnglesStartLinkFSMOneIncident(oppositeAngle, 2*Math.PI, topLeft,8);

                // Sort the possible angles, and use the one closest to the top-left
                angles = angles.sort(function (a, b) {
                    return Math.abs(topLeft - a) - Math.abs(topLeft - b);
                });

                startLinkPos.x = vertex.x + (nodeLinkDrawRadius * Math.cos(angles[0]));
                startLinkPos.y = vertex.y - (nodeLinkDrawRadius * Math.sin(angles[0]));
            } else {
                // Sort the incident angles
                angles = angles.sort(function (a, b) { return a - b; });

                // Create all candidate angles, based on a division (as in the case of angles.length === 1), and filter
                // out angles which are too close to existing incoming links, to not obscure them
                let candidateAngles = util.getAnglesStartLinkFSMMultipleIncident(angles, topLeft, 8);
                let candidateAnglesTemp = candidateAngles;
                candidateAngles = util.filterOutCloseAngles(candidateAngles, angles, 0.05);

                if (candidateAngles.length > 0) {
                    // If there are angles which are far enough away, use the one which is closest to the top-left
                    // to create the start link
                    candidateAngles.sort(function (a, b) {
                        return Math.abs(topLeft - a) - Math.abs(topLeft - b);
                    });

                    startLinkPos.x = vertex.x + (nodeLinkDrawRadius * Math.cos(candidateAngles[0]));
                    startLinkPos.y = vertex.y - (nodeLinkDrawRadius * Math.sin(candidateAngles[0]));
                } else {
                    // If there are no angles which are far enough away (i.e. the vertex has too many incident edges),
                    // use the one most far away (i.e. with the most space around itself)
                    //TODO: not tested yet; this is a rare case
                    let candidateAngle = util.getAngleMaximumMinimumProximity(candidateAnglesTemp, angles);

                    startLinkPos.x = vertex.x + (nodeLinkDrawRadius * Math.cos(candidateAngle));
                    startLinkPos.y = vertex.y - (nodeLinkDrawRadius * Math.sin(candidateAngle));
                }
            }
            //TODO: clicking in draw mode AFTER having set an initial link doesn't work smoothly (needs 2 clicks)

            this.currentLink = new elements.StartLink(this, vertex, startLinkPos);
            this.addLink(this.currentLink);
            this.currentLink = null;
            this.toolbar.parent.draw();
        }
    };

    GraphUI.prototype.removeInitialFSMVertex = function(vertex) {
        vertex.isInitial = false;
        // Remove all start links incoming to this vertex
        for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
            if (this.graphRepr.getLinks()[i] instanceof elements.StartLink && this.graphRepr.getLinks()[i].node === vertex) {
                this.graphRepr.getLinks().splice(i--, 1);
            }
        }
    };

    // A function to snap the input node to any other node not present in the selection. This snapping happens either
    // horizontally or vertically
    GraphUI.prototype.snapNode = function(node, notSelectedNodes, snapXDirection, snapYDirection) {
        for (let i = 0; i < notSelectedNodes.length; i++) {
            if (notSelectedNodes[i] === node) {
                continue;
            }

            if (Math.abs(node.x - notSelectedNodes[i].x) < globals.SNAP_TO_PADDING && snapXDirection) {
                node.x = notSelectedNodes[i].x;
            }

            if (Math.abs(node.y - notSelectedNodes[i].y) < globals.SNAP_TO_PADDING && snapYDirection) {
                node.y = notSelectedNodes[i].y;
            }
        }
    };

    // Add a new link (always 'this.currentLink') to the set of links.
    // If the link connects two nodes already linked, the angle of the new link
    // is tweaked so it is distinguishable from the existing links.
    GraphUI.prototype.addLink = function(newLink) {
        var maxPerpRHS = null;
        for (var i = 0; i < this.graphRepr.getLinks().length; i++) {
            var link = this.graphRepr.getLinks()[i];
            if (link.nodeA === newLink.nodeA && link.nodeB === newLink.nodeB) {
                if (maxPerpRHS === null || link.perpendicularPart > maxPerpRHS) {
                    maxPerpRHS = link.perpendicularPart;
                }
            }
            if (link.nodeA === newLink.nodeB && link.nodeB === newLink.nodeA) {
                if (maxPerpRHS === null || -link.perpendicularPart > maxPerpRHS ) {
                    maxPerpRHS = -link.perpendicularPart;
                }
            }
        }
        if (maxPerpRHS) {
            newLink.perpendicularPart = maxPerpRHS + globals.DUPLICATE_LINK_OFFSET;
        }
        this.graphRepr.addLink(newLink);
    };

    // A function to add a new graph instance, upon a change of the graph, to the history stack
    GraphUI.prototype.onGraphChange = function() {
        // Remove the part of the stack above the pointer, so the 'redo-able' graph instances are lost
        this.historyStack.length = this.historyStackPointer + 1;

        // Save the graph, so the new graph instance can be used. This instance will be added to the end of the array.
        // Furthermore, increase the pointer
        this.save();
        let graphInstance = $(this.textArea).val();
        this.historyStack.push(graphInstance);
        if (this.historyStack.length > globals.MAX_UNDO_REDO + 1) {
            this.historyStack.shift();
        } else {
            this.historyStackPointer++;
        }

        // Enable the undo button, and disable the redo button
        this.toolbar.rightButtons['undo'].setEnabled();
        this.toolbar.rightButtons['redo'].setDisabled();
    };

    // A function to handle the undo operation of the graph UI
    GraphUI.prototype.undo = function(graphUI) {
        let g = graphUI;

        // If there is something on the stack, retrieve it
        if (g.historyStackPointer >= 1) {
            // Decrease the stack pointer, and queue the (previous) graph instance
            g.historyStackPointer--;
            let graphInstance = g.historyStack[g.historyStackPointer];

            // Update the graph
            g.updateGraph(g, graphInstance);

            // Set the buttons accordingly
            if (g.historyStackPointer <= 0) {
                g.toolbar.rightButtons['undo'].setDisabled();
            } else {
                g.toolbar.rightButtons['undo'].setEnabled();
            }
            g.toolbar.rightButtons['redo'].setEnabled();
        }
    };

    // A function to handle the redo operation of the graph UI
    GraphUI.prototype.redo = function(graphUI) {
        let g = graphUI;

        // Check if there is an operation to be redone
        if (g.historyStackPointer < g.historyStack.length - 1) {
            // Update the pointer and update the graph with the new graph
            g.historyStackPointer++;
            let graphInstance = g.historyStack[g.historyStackPointer];

            g.updateGraph(g, graphInstance);

            if (g.historyStackPointer >= g.historyStack.length - 1) {
                g.toolbar.rightButtons['redo'].setDisabled();
            } else {
                g.toolbar.rightButtons['redo'].setEnabled();
            }
            g.toolbar.rightButtons['undo'].setEnabled();
        }
    };

    //TODO: historystack functions here: get, update pointers etc

    // A function to update the graph with a new graph
    GraphUI.prototype.updateGraph = function(graphUI, graphInstance) {
        // Update the value:
        $(this.textArea).val(graphInstance);

        // Clear all objects
        this.graphRepr.clearNodes();
        this.graphRepr.clearLinks();
        this.selectedObjects = [];
        this.previousSelectedObjects = [];

        // Save and load the graphUI
        this.load();

        // Reload the toolbar
        this.toolbar.addSelectionOptions(this.selectedObjects);

        if (this.isType(util.Type.FSM)) {
            this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
        }
        if (this.isType(util.Type.PETRI)) {
            this.toolbar.addPetriSelectionOptions(this.selectedObjects);
        }
    };

    /**
     * Function: load
     * Loads the graph representation from the JSON string in the textArea. Calls a function in GraphRepresentation
     */
    GraphUI.prototype.load = function() {
        this.graphRepr.load(this.textArea, this.templateParams, this.isType);
    };

    /**
     * Function: save
     * Saves the graph representation to the JSON string in the textArea. Calls a function in GraphRepresentation
     */
    GraphUI.prototype.save = function() {
        this.graphRepr.save(this.textArea, this.templateParams, this.isType);
    };

    /**
     * Function: update
     * A function which is configured, in the constructor of this class, to run periodically. It draws the graph
     */
    GraphUI.prototype.update = function() {
        this.draw();
    };

    /**
     * Function: destroy
     * A function, called by the UI wrapper, that destroys all created HTML elements
     */
    GraphUI.prototype.destroy = function () {
        this.graphCanvas.canvas.off(); // The off() method removes all event handlers
        this.graphCanvas.canvas.remove(); // Remove the HTML element

        this.toolbar.div.off();
        this.toolbar.div.remove();

        this.helpOverlay.div.off();
        this.helpOverlay.div.remove();

        this.containerDiv.remove();

        // Stop the update function from repeatedly executing
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
    };

    /**
     * Function: draw
     * Draws the graph and its components, and saves the graph in the JSON object afterwards
     */
    GraphUI.prototype.draw = function() {
        this.graphCanvas.draw(this, this.graphRepr.getNodes(), this.graphRepr.getLinks(), this.uiMode, this.petriNodeType,
            this.fontSize(), this.allowEdits, this.isType, this.graphRepr.getObjectOnMousePos, this.selectionRectangle,
            this.currentLink, this.mousePosition);
        this.save();
    };

    /**
     * Function: drawText
     * Calls a function to draw the specified text for the specified object and parameters
     *
     * Parameters:
     *    originalObject - The object for which to place the text
     *    originalText - The original (i.e. unprocessed) text to be used
     *    x - The x-position at which to place the text
     *    y - The y-position at which to place the text
     *    angleOrNull - The angle, if any, for which to place the text intelligently around the object
     */
    GraphUI.prototype.drawText = function(originalObject, originalText, x, y, angleOrNull) {
        this.graphCanvas.drawText(originalObject, originalText, x, y, angleOrNull, this.graphRepr.getLinks(), this.nodeRadius(),
            this.fontSize(), this.isType);
    };

    return {
        Constructor: GraphUI
    };
});
