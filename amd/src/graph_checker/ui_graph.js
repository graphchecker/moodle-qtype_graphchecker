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
        'qtype_graphchecker/graph_checker/graph_components/graph_elements',
        'qtype_graphchecker/graph_checker/graph_components/graph_representation',
        'qtype_graphchecker/graph_checker/graph_functionality/graph_eventhandler',
        'qtype_graphchecker/graph_checker/graph_components/graph_canvas',
        'qtype_graphchecker/graph_checker/graph_components/help_overlay', 'qtype_graphchecker/graph_checker/graph_toolbar',
        'qtype_graphchecker/graph_checker/toolbar_elements'],
    function($, globals, util, elements, graph_representation, graph_eventhandler, graph_canvas, help_overlay,
             ui_toolbar, toolbar_elements) {

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
        // Variables for HTML IDs/elements
        this.textArea = $(document.getElementById(textareaId));
        this.uiWrapper = uiWrapper;
        this.id = 'graphcanvas_' + textareaId;

        // The template parameters, used in the graph configuration
        this.templateParams = templateParams; // TODO: fix changed templateParams

        // Some variables denoting the state of the graph, w.r.t. drawing
        this.readOnly = this.textArea.prop('readonly'); // Whether the graph is readonly or also editable
        this.uiMode = util.ModeType.SELECT; // Set the UI mode to be 'Select' initially
        this.isTempDrawModeActive = false;
        this.petriNodeType = util.PetriNodeType.NONE; // The current Petri node type, when creating new Petri net nodes

        // More variables for configuring the state of the graph, w.r.t. selection
        this.selectedObjects = []; // One or more elements.Link or elements.Node objects. Default: empty array
        this.previousSelectedObjects = []; // Same as selectedObjects, but previous selected ones
        this.draggedObjects = []; // The elements that are currently being dragged; [] if not dragging
        this.clickedObject = null; // The last manually clicked object, without releasing the mouse button
        this.selectionRectangle = null; // The top-left/bottom-right corners of the selection rectangle.
        // Form [{x: nr, y: nr}, {x: nr, y: nr}]
        this.currentLink = null; //The current (temporary) draggable link. Used to create new links
        this.mousePosition = null; // A variable to denote the position of the mouse on the canvas. Format: {x: nr, y: nr}

        // Variables regarding failure of loading the graph
        this.fail = false; // Will be set true if load fails (can't deserialise).
        this.failString = null; // Language string key for fail error message.

        // A variable denoting the edit-history of the graph, in the form of a stack (LIFO), used in the undo/redo mechanism
        // Load it with the initial graph
        this.historyStack = [$(this.textArea).val()];
        this.historyStackPointer = 0; // A pointer pointing to an entry in the historyStack

        // The help-overlay, representation, event handler, and canvas of the graph
        this.helpOverlay = new help_overlay.HelpOverlay(this, this.uiWrapper);
        this.graphRepr = new graph_representation.GraphRepresentation(this, this.nodeRadius);
        this.graphEventHandler = new graph_eventhandler.GraphEventHandler(this, this.graphRepr, this.readOnly);
        this.graphCanvas = new graph_canvas.GraphCanvas(this, width, height, this.graphEventHandler);

        // The graph toolbar. Set it only if readonly is disabled (i.e. we can edit)
        this.toolbar = (!this.readOnly)? new ui_toolbar.GraphToolbar(this, width, this.uiMode,
            this.helpOverlay, this.graphEventHandler) : null;

        // Creates and sets the HTML help text for the help overlay
        this.helpOverlay.setHelpText(this, this.templateParams, this.isType, this.allowEdits);

        // The div that contains the entire graph UI (i.e. the toolbar, graph, and help overlay, etc.)
        this.containerDiv = $(document.createElement('div'));
        $(this.containerDiv).addClass('graph_ui_container_div');

        // Load and draw the graph
        this.load();
        if (!this.fail) {
            this.draw();
        }

        // Call the update function at a fixed interval
        let self = this;
        this.updateTimer = window.setInterval(function(){ self.update(); }, 50);
    }

    /**
     * Function: allowEdits
     *
     * Parameters:
     *    graphUI - The graph UI object
     *    edits - One or more enum values (as an array) of possible edits which the user can conduct
     *
     * Returns:
     *    Whether the graph allows the supplied edit(s), as specified by the allow_edits parameter
     */
    GraphUI.prototype.allowEdits = function(graphUI, edits) {
        let editsArray = [];
        let allowed_edits = graphUI.templateParams.allow_edits;

        if (!allowed_edits) {
            // If the input parameter is undefined (or equal to null) then allow everything
            return true;
        } else if ((Array.isArray(allowed_edits) && !allowed_edits.length) || (graphUI.readOnly)) {
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
            if (this.allowEdits(this, edit)) {
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
        if (selectedObject instanceof elements.Node && this.templateParams.vertex_label_regex) {
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
     *    angle - The angle for which to draw the arrow head, in radians
     */
    GraphUI.prototype.arrowIfReqd = function(c, x, y, angle) {
        if (this.isType(this, util.Type.DIRECTED) || this.isType(this, util.Type.FSM) || this.isType(this, util.Type.PETRI)) {
            util.drawArrow(c, x, y, angle);
        }
    };

    /**
     * Function: enableTemporaryDrawMode
     * Enables temporary draw mode
     */
    GraphUI.prototype.enableTemporaryDrawMode = function() {
        if (this.allowEdits(this, util.Edit.ADD_VERTEX) || this.allowEdits(this, util.Edit.ADD_EDGE)) {
            // Assign the latest selected object
            this.previousSelectedObjects = this.selectedObjects;

            // Set the mode to Draw
            this.setUIMode(util.ModeType.DRAW);
            this.selectedObjects = this.previousSelectedObjects; // Re-add the selected objects
            this.isTempDrawModeActive = true;
        }
    };

    /**
     * Function: disableTemporaryDrawMode
     * Disables temporary draw mode. Sets the according settings (e.g. internal, selected objects, toolbar fields, etc.)
     */
    GraphUI.prototype.disableTemporaryDrawMode = function() {
        if (!(this.allowEdits(this, util.Edit.ADD_VERTEX) || this.allowEdits(this, util.Edit.ADD_EDGE))) {
            return;
        }

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
        if ((this.allowEdits(this, util.Edit.DELETE_VERTEX) || this.allowEdits(this, util.Edit.DELETE_EDGE)) &&
            this.selectedObjects.length) {
            this.toolbar.rightButtons['delete'].setEnabled();
        }

        // Set the label focus for Petri net graphs
        if (this.isType(this, util.Type.PETRI) && hasLabelFocus) {
            // If the element was previously focused on, re-add the focus
            this.focusElement(inputElement, 10);
        }
        this.draw();
    };

    /**
     * Function: sync
     * Synchronizing function. This graph UI object should have this function according to the graph wrapper's template.
     * In this graph UI instance, it does not do anything
     */
    GraphUI.prototype.sync = function() {
        // Nothing to do ... always sync'd.
    };

    /**
     * Function: focusElement
     * Focuses an element with a specified delay
     *
     * Parameters:
     *    element - The element to focus
     *    timeout - The timeout (i.e. delay) applied
     */
    GraphUI.prototype.focusElement = function(element, timeout) {
        // Most of the times it should be a short (unnoticeable) delay. Directly applying without delay does not work
        setTimeout(function () {
            if (element) {
                $(element).focus();
            }
        }, timeout);
    };

    /**
     * Function: resize
     * Resizes the graph canvas to the given width and height
     *
     * Parameters:
     *    w - The width to which the canvas is to be resized
     *    h - The height to which the canvas is to be resized
     */
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

    /**
     * Function: alertPopup
     * Presents an alert popup and resets the current link/clicked object
     *
     * Parameters:
     *    message - The message to be shown in the popup
     */
    GraphUI.prototype.alertPopup = function(message) {
        this.currentLink = null;
        this.clickedObject = null;
        this.draw();
        window.alert(message);
    };

    /**
     * Function: deleteSelectedObjects
     * Deletes the selected objects
     *
     * Parameters:
     *    graphUI - The graphUI object
     */
    GraphUI.prototype.deleteSelectedObjects = function(graphUI) {
        if (graphUI.selectedObjects.length) {
            if (graphUI.allowEdits(graphUI, util.Edit.DELETE_VERTEX)) {
                for (let i = 0; i < graphUI.graphRepr.getNodes().length; i++) {
                    if (graphUI.selectedObjects.includes(graphUI.graphRepr.getNodes()[i])) {
                        graphUI.graphRepr.getNodes().splice(i--, 1);
                    }
                }
            }
            if (graphUI.allowEdits(graphUI, util.Edit.DELETE_EDGE)) {
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
            if (graphUI.allowEdits(graphUI, util.Edit.DELETE_VERTEX) || graphUI.allowEdits(graphUI, util.Edit.DELETE_EDGE)) {
                graphUI.toolbar.rightButtons['delete'].setDisabled();
            }

            // Remove the options in the toolbar based on the selected object
            graphUI.toolbar.removeSelectionOptions();
            graphUI.toolbar.removeFSMNodeSelectionOptions();
            graphUI.toolbar.removePetriSelectionOptions();

            graphUI.onGraphChange();
        }
    };

    /**
     * Function: setInitialFSMVertex
     * Sets the given vertex as an initial FSM vertex, and draws the incoming arrow to an empty location around the vertex
     *
     * Parameters:
     *    vertex - The given vertex
     */
    GraphUI.prototype.setInitialFSMVertex = function(vertex) {
        if (!(this.isType(this, util.Type.FSM) && vertex instanceof elements.Node)) {
            // If we do not work with a FSM graph and a node, we do not proceed
            return;
        }

        // Set the selected vertex as the initial vertex, and draw it
        vertex.isInitial = true;

        // Get the angles of all incident (i.e. incoming and outgoing) edges of this vertex
        let angles = util.getAnglesOfIncidentLinks(this.graphRepr.getLinks(), vertex);

        let topLeft = (3.0/4.0 * Math.PI); // The top-left of the vertex's circle in radians
        let nodeLinkDrawRadius = this.nodeRadius(this) + globals.INITIAL_FSM_NODE_LINK_LENGTH*2; // The radius used to draw
        // edges with

        // Execute different cases, depending on the angles of the incoming edges, to fill the startLinkPos variable's
        // x and y values
        let startLinkPos;
        if (angles.length === 0) {
            startLinkPos = this.setFSMStartLinkTopLeft(vertex);
        } else {
            startLinkPos = this.setFSMStartLinkWhereSpace(vertex, angles, topLeft, nodeLinkDrawRadius);
        }

        this.currentLink = new elements.StartLink(this, vertex, startLinkPos);
        this.addLink(this.currentLink);
        this.currentLink = null;
        this.toolbar.parent.draw();
    };

    /**
     * Function: setFSMStartLinkTopLeft
     * Sets the initial link of a FSM node in the top-left
     *
     * Parameters:
     *    vertex - The given vertex for which to make an initial link
     *
     * Returns:
     *    startLinkPos - The new position of the start link
     */
    GraphUI.prototype.setFSMStartLinkTopLeft = function(vertex) {
        let startLinkPos = {};

        // Set the start link position to the top-left of the vertex
        startLinkPos.x = vertex.x - (this.nodeRadius(this) + globals.INITIAL_FSM_NODE_LINK_LENGTH);
        startLinkPos.y = vertex.y - (this.nodeRadius(this) + globals.INITIAL_FSM_NODE_LINK_LENGTH);
        return startLinkPos;
    };

    /**
     * Function: setFSMStartLinkWhereSpace
     * Sets the initial link of a FSM node where space, with preference near the top-left
     *
     * Parameters:
     *    vertex - The given vertex for which to make an initial link
     *    angles - The angles of the incoming edges
     *    topLeft - The top-left of the vertex's circle in radians
     *    nodeLinkDrawRadius - The radius used to draw edges with
     *
     * Returns:
     *    startLinkPos - The new position of the start link
     */
    GraphUI.prototype.setFSMStartLinkWhereSpace = function(vertex, angles, topLeft, nodeLinkDrawRadius) {
        let startLinkPos = {};

        // Sort the incident angles
        angles = angles.sort(function (a, b) { return a - b; });

        // Create all candidate (initial link) angles, based on a division (as in the case of angles.length === 1),
        // and filter out angles which are too close to existing incoming links, to not obscure them
        let candidateAngles = util.getAnglesStartLinkFSMMultipleIncident(angles, topLeft, 8);
        let candidateAnglesTemp = candidateAngles;
        candidateAngles = util.filterOutCloseAngles(candidateAngles, angles, 0.05);

        let bestCandidateAngle = null;
        if (candidateAngles.length > 0) {
            // If there are angles which are far enough away from each other, use the one which is closest to the top-left
            // to create the start link
            bestCandidateAngle = candidateAngles.sort(function (a, b) {
                return Math.abs(topLeft - a) - Math.abs(topLeft - b);
            })[0];
        } else {
            // If there are no angles which are far enough away (i.e. the vertex has too many incident edges),
            // use the one most far away (i.e. with the most space around itself)
            bestCandidateAngle = util.getAngleMaximumMinimumProximity(candidateAnglesTemp, angles);
        }

        // Assign and return the start link pos
        startLinkPos.x = vertex.x + (nodeLinkDrawRadius * Math.cos(bestCandidateAngle));
        startLinkPos.y = vertex.y - (nodeLinkDrawRadius * Math.sin(bestCandidateAngle));
        return startLinkPos;
    };

    /**
     * Function: removeInitialFSMVertex
     * Removes all incoming links (i.e. start links) for the given vertex
     *
     * Parameters:
     *    vertex - The given vertex
     */
    GraphUI.prototype.removeInitialFSMVertex = function(vertex) {
        vertex.isInitial = false;
        for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
            if (this.graphRepr.getLinks()[i] instanceof elements.StartLink && this.graphRepr.getLinks()[i].node === vertex) {
                this.graphRepr.getLinks().splice(i--, 1);
            }
        }
    };

    /**
     * Function: addLink
     * Adds a new link to the graph representation. In doing this, the perpendicular part is edited.
     * If the link connects two nodes already linked, the angle of the new link is tweaked so it is distinguishable
     * from the existing links.
     *
     * Parameters:
     *    newLink - The new link to be added to the graph representation
     */
    GraphUI.prototype.addLink = function(newLink) {
        let maxPerpRHS = null;
        for (let i = 0; i < this.graphRepr.getLinks().length; i++) {
            let link = this.graphRepr.getLinks()[i];
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

    /**
     * Function: onGraphChange
     * Function to be called on change of the graph. Updates the history stack and enables toolbar buttons
     */
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

    /**
     * Function: undo
     * Handles an undo operation of the graph ui
     *
     * Parameters:
     *    graphUI - The graphUI object
     */
    GraphUI.prototype.undo = function(graphUI) {
        // If there is something on the stack, retrieve it
        if (graphUI.historyStackPointer >= 1) {
            // Decrease the stack pointer, and queue the (previous) graph instance
            graphUI.historyStackPointer--;
            let graphInstance = graphUI.historyStack[graphUI.historyStackPointer];

            // Update the graph
            graphUI.updateGraph(graphInstance);

            // Set the buttons accordingly
            if (graphUI.historyStackPointer <= 0) {
                graphUI.toolbar.rightButtons['undo'].setDisabled();
            } else {
                graphUI.toolbar.rightButtons['undo'].setEnabled();
            }
            graphUI.toolbar.rightButtons['redo'].setEnabled();
        }
    };

    /**
     * Function: redo
     * Handles a redo operation of the graph ui
     *
     * Parameters:
     *    graphUI - The graphUI object
     */
    GraphUI.prototype.redo = function(graphUI) {
        // Check if there is an operation to be redone
        if (graphUI.historyStackPointer < graphUI.historyStack.length - 1) {
            // Update the pointer and update the graph with the new graph
            graphUI.historyStackPointer++;
            let graphInstance = graphUI.historyStack[graphUI.historyStackPointer];

            graphUI.updateGraph(graphInstance);

            if (graphUI.historyStackPointer >= graphUI.historyStack.length - 1) {
                graphUI.toolbar.rightButtons['redo'].setDisabled();
            } else {
                graphUI.toolbar.rightButtons['redo'].setEnabled();
            }
            graphUI.toolbar.rightButtons['undo'].setEnabled();
        }
    };

    /**
     * Function: updateGraph
     * Updates the graph with a new graph instance
     *
     * Parameters:
     *    graphInstance - The new instance of a graph
     */
    GraphUI.prototype.updateGraph = function(graphInstance) {
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

        if (this.isType(this, util.Type.FSM)) {
            this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
        }
        if (this.isType(this, util.Type.PETRI)) {
            this.toolbar.addPetriSelectionOptions(this.selectedObjects);
        }
    };

    /**
     * Function: load
     * Loads the graph representation from the JSON string in the textArea. Calls a function in GraphRepresentation
     */
    GraphUI.prototype.load = function() {
        this.graphRepr.load(this, this.textArea, this.templateParams, this.isType);
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
        this.graphCanvas.draw(this, this.graphRepr, this.uiMode, this.petriNodeType,
            this.fontSize(this), this.allowEdits, this.isType, this.graphRepr.getObjectOnMousePos, this.selectionRectangle,
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
        this.graphCanvas.drawText(this, originalObject, originalText, x, y, angleOrNull, this.graphRepr.getLinks(),
            this.nodeRadius(this), this.fontSize(this), this.isType);
    };

    /***********************************************************************
     *
     * Getters and setters of some variables
     *
     ***********************************************************************/

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
     * Function: isType
     *
     * Parameters:
     *    graphUI - The graphUI object
     *    type - The type of graph (i.e.. directed/undirected/fsm/petri) as a string
     *
     * Returns:
     *    Whether the graph is of the type as denoted by the input parameter
     */
    GraphUI.prototype.isType = function(graphUI, type) {
        return graphUI.templateParams.type === type;
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
     * Function: nodeRadius
     *
     * Returns:
     *    graphUI - The graphUI object
     *    The node radius used for drawing nodes on the canvas
     */
    GraphUI.prototype.nodeRadius = function(graphUI) {
        return graphUI.templateParams.noderadius ? graphUI.templateParams.noderadius : globals.DEFAULT_NODE_RADIUS;
    };

    /**
     * Function: fontSize
     *
     * Returns:
     *    graphUI - The graphUI object
     *    The font size used for drawing text on the canvas
     */
    GraphUI.prototype.fontSize = function(graphUI) {
        return graphUI.templateParams.fontsize ? graphUI.templateParams.fontsize : globals.DEFAULT_FONT_SIZE;
    };

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
     * Function: getUIMode
     *
     * Returns:
     *    The current UI mode of this application
     */
    GraphUI.prototype.getUIMode = function() {
        return this.uiMode;
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
            if (this.allowEdits(this, util.Edit.DELETE_VERTEX) || this.allowEdits(this, util.Edit.DELETE_EDGE)) {
                this.toolbar.rightButtons['delete'].setDisabled();
            }

            // If the graph type is Petri net
            if (this.isType(this, util.Type.PETRI)) {
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
            if (this.isType(this, util.Type.PETRI)) {
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
     * Function: getTempDrawModeActive
     *
     * Returns:
     *    Whether the temporary draw mode is currently active or not
     */
    GraphUI.prototype.getTempDrawModeActive = function() {
        return this.isTempDrawModeActive;
    };

    /**
     * Function: setTempDrawModeActive
     *
     * Parameters:
     *    value - The value to which to set the tempDrawmode variable
     */
    GraphUI.prototype.setTempDrawModeActive = function(value) {
        this.isTempDrawModeActive = value;
    };

    /**
     * Function: getMousePosition
     *
     * Returns:
     *    The position of the mouse, in the format: {x: number, y: number}
     */
    GraphUI.prototype.getMousePosition = function() {
        return this.mousePosition;
    };

    /**
     * Function: setMousePosition
     * Sets the position of the mouse, in the format: {x: number, y: number}
     *
     * Parameters:
     *    mousePosition -  The position of the mouse, in the format: {x: number, y: number}
     */
    GraphUI.prototype.setMousePosition = function(mousePosition) {
        this.mousePosition = mousePosition;
    };

    /**
     * Function: getClickedObject
     *
     * Returns:
     *    The last clicked object, if any, as clicked by the user
     */
    GraphUI.prototype.getClickedObject = function() {
        return this.clickedObject;
    };

    /**
     * Function: setClickedObject
     * Sets the object, if any, clicked by the user
     *
     * Parameters:
     *    object - The object clicked by the user, or null
     */
    GraphUI.prototype.setClickedObject = function(object) {
        this.clickedObject = object;
    };

    /**
     * Function: getSelectedObjects
     *
     * Returns:
     *    The currently selected objects, as selected by the user
     */
    GraphUI.prototype.getSelectedObjects = function() {
        return this.selectedObjects;
    };

    /**
     * Function: setSelectedObjects
     * Sets the selected objects, if any
     *
     * Parameters:
     *    selectedObjects - The selected object(s) to be set
     */
    GraphUI.prototype.setSelectedObjects = function(selectedObjects) {
        this.selectedObjects = selectedObjects;
    };

    /**
     * Function: getPreviousSelectedObjects
     *
     * Returns:
     *    The previously selected objects, as selected by the user
     */
    GraphUI.prototype.getPreviousSelectedObjects = function() {
        return this.previousSelectedObjects;
    };

    /**
     * Function: setPreviousSelectedObjects
     * Sets the previously selected objects, if any
     *
     * Parameters:
     *    prevSelectedObjects - The previously selected object(s) to be set
     */
    GraphUI.prototype.setPreviousSelectedObjects = function(prevSelectedObjects) {
        this.previousSelectedObjects = prevSelectedObjects;
    };

    /**
     * Function: getSelectionRectangle
     *
     * Returns:
     *    The currently-set selection rectangle
     */
    GraphUI.prototype.getSelectionRectangle = function() {
        return this.selectionRectangle;
    };

    /**
     * Function: setSelectionRectangle
     * Sets the current selection rectangle
     *
     * Parameters:
     *    selectionRectangle - The selection rectangle to be set. Format: [{x: number, y: number}, {x: number, y: number}]
     */
    GraphUI.prototype.setSelectionRectangle = function(selectionRectangle) {
        this.selectionRectangle = selectionRectangle;
    };

    /**
     * Function: getCurrentLink
     *
     * Returns:
     *    The currently selected objects, as selected by the user
     */
    GraphUI.prototype.getCurrentLink = function() {
        return this.currentLink;
    };

    /**
     * Function: setCurrentLink
     * Sets the selected objects, if any
     *
     * Parameters:
     *    selectedObjects - The selected object(s) to be set
     */
    GraphUI.prototype.setCurrentLink = function(selectedObjects) {
        this.currentLink = selectedObjects;
    };

    /**
     * Function: getDraggedObjects
     *
     * Returns:
     *    The elements that are currently being dragged, if any
     */
    GraphUI.prototype.getDraggedObjects = function() {
        return this.draggedObjects;
    };

    /**
     * Function: setDraggedObjects
     * Assigns objects which are currently being dragged
     *
     * Parameters:
     *    objects - The objects which are set to be dragged
     */
    GraphUI.prototype.setDraggedObjects = function(objects) {
        this.draggedObjects = objects;
    };

    return {
        Constructor: GraphUI
    };
});
