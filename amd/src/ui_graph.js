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


define(['jquery', 'qtype_graphchecker/graphutil', 'qtype_graphchecker/graphelements',
    'qtype_graphchecker/ui_toolbar', 'qtype_graphchecker/toolbar_elements'],
    function($, util, elements, ui_toolbar, toolbar_elements) {

    /***********************************************************************
     *
     * A GraphCanvas is a wrapper for a Graph's HTML canvas
     * object.
     *
     ************************************************************************/

    function GraphCanvas(parent, canvasId, w, h) {
        // Constructor, given the Graph that owns this canvas, the
        // required canvasId and the height and width of the wrapper that
        // encloses the Canvas.

        this.parent = parent;
        this.canvas = $(document.createElement("canvas"));
        this.canvas.attr({
            id:         canvasId,
            class:      "graphchecker_graphcanvas",
            tabindex:   1 // So canvas can get focus.
        });
        this.canvas.css({'background-color': util.Color.WHITE});

        this.canvas.on('mousedown', function(e) {
            return parent.mousedown(e);
        });

        this.canvas.on('mouseup', function(e) {
            return parent.mouseup(e);
        });

        // Added so that the mouseup event is executed when the mouse leaves the graph UI canvas
        this.canvas.on('mouseenter', function(e) {
            return parent.mouseenter(e);
        });

        // Added so that the mouseup event is executed when the mouse leaves the graph UI canvas
        this.canvas.on('mouseleave', function(e) {
            return parent.mouseleave(e);
        });

        this.canvas.on('keydown', function(e) {
            return parent.keydown(e);
        });

        this.canvas.on('keyup', function(e) {
            return parent.keyup(e);
        });

        this.canvas.on('mousemove', function(e) {
            return parent.mousemove(e);
        });

        this.canvas.on('keypress', function(e) {
            return parent.keypress(e);
        });

        this.resize = function(w, h) {
            // Resize to given dimensions.
            this.canvas.attr("width", w);
            this.canvas.attr("height", h);
        };

        this.resize(w, h);
    }

    /***********************************************************************
     *
     * Define a class HelpOverlay for the help overlay (i.e. a help 'box')
     *
     ***********************************************************************/

    function HelpOverlay(parent, divId, graphUIWrapper) {
        // Constructor, of the Help overlay

        let self = this;
        this.parent = parent;
        this.graphUIWrapper = graphUIWrapper;
        // Create the background div
        this.div = $(document.createElement("div"));
        this.div.attr({
            id:         divId + '_background',
            class:      "graphchecker_overlay",
            tabindex:   0
        });
        $(this.div).on('click', function() {
            // Hide the background element only after the CSS transition has finished
            self.div.removeClass('visible');
            setTimeout(function() {
                self.div.css('display', 'none');
                $('body').removeClass('unscrollable');

                // Enable the resizing of the graph interface wrapper again
                self.graphUIWrapper.enableResize();
            }.bind(this), 500);
        });

        // Create the dialog div
        this.divDialog = $(document.createElement("div"));
        this.divDialog.attr({
            id:         divId + 'dialog',
            class:      'dialog',
            tabindex:   0
        });
        $(this.divDialog).on('click', function() {
            return false;  // avoid bubbling to the backdrop
        });
        this.div.append(this.divDialog);
    }

    // Sets the (HTML) help text of the dialog
    HelpOverlay.prototype.insertHelpText = function(text) {
        this.divDialog.append(text);
    };

    /***********************************************************************
     *
     *  This is the ui component for a graph-drawing graphchecker question.
     *
     ***********************************************************************/

    function Graph(textareaId, uiWrapper, width, height, templateParams) {
        // Constructor.
        var self = this;

        this.SNAP_TO_PADDING = 6;
        this.DUPLICATE_LINK_OFFSET = 16; // Pixels offset for a duplicate link
        this.HIT_TARGET_PADDING = 6;    // Pixels. Denotes the extra pixels added to make selecting nodes/edges easier
        this.DEFAULT_NODE_RADIUS = 26;  // Pixels. Template parameter noderadius can override this.
        this.TEXT_NODE_HORIZONTAL_PADDING = 4;  // Pixels. Denotes the space between the text and the node border
        // (horizontally), when the text is on the inside of the node
        this.TEXT_NODE_VERTICAL_PADDING = 12;  // Pixels. Denotes the space between the text and the node border
        // (vertically), when the text is on the outside of the node
        //this.INITIAL_HEIGHT = 350;  // px. The initial height of the toolbar and the canvas combined
        this.DEFAULT_FONT_SIZE = 20;    // px. Template parameter fontsize can override this.
        this.NUMBER_TOKENS_INPUT_RANGE = {  // The range (inclusive) for entering the number of tokens for petri nets
            min: 0,
            max: 100,
        };       //TODO: assure that these values are met when saving (double check).
                 //if > 100, set to 100. If <0 or a char, set to 0
        this.INITIAL_FSM_NODE_LINK_LENGTH = 25; //px. The length of the initial FSM node's incoming link
        this.MAX_UNDO_REDO = 100; // The maximum number of undo-redo comands the user can issue

        this.canvasId = 'graphcanvas_' + textareaId;
        this.textArea = $(document.getElementById(textareaId));
        this.uiMode = util.ModeType.SELECT; // Set the UI mode to be 'Select' initially //TODO
        this.isTempDrawModeActive = false;
        this.petriNodeType = util.PetriNodeType.NONE;
        this.readOnly = this.textArea.prop('readonly');
        this.templateParams = templateParams;
        this.uiWrapper = uiWrapper;
        this.graphCanvas = new GraphCanvas(this, this.canvasId, width, height);

        this.helpOverlayId = 'graphcanvas_overlay_' + textareaId;
        this.helpOverlay = new HelpOverlay(this, this.helpOverlayId, this.uiWrapper);

        this.toolbarId = 'toolbar_' + textareaId;
        this.toolbar = null;
        if (!this.readOnly) {
            // Set the toolbar only if readonly is disabled
            this.toolbar = new ui_toolbar.GraphToolbar(this, this.toolbarId, width, this.uiMode, this.helpOverlay);
        }

        // The div that contains the entire graph UI (i.e. the toolbar, graph, and help overlay)
        this.containerDiv = $(document.createElement('div'));
        $(this.containerDiv).addClass('graph_ui_container_div');

        this.nodes = [];
        this.links = [];
        this.selectedObjects = []; // One or more elements.Link or elements.Node objects. Default: empty array
        this.previousSelectedObjects = []; // Same as selectedObjects, but previous selected ones
        this.draggedObjects = []; // The elements that are currently being dragged; [] if not dragging
        this.clickedObject = null; // The last manually clicked object
        this.selectionRectangle = null; // The top-left/bottom-right corners of the selection rectangle,
        // used in the form [{x: null, y: null}, {x: null, y: null}]
        this.selectionRectangleOffset = 0; // Used for animating the border of the rectangle (marching ants)
        this.currentLink = null;
        this.mousePosition = null; // A variable to denote the position of the mouse on the canvas.
        // Format: {x: number, y: number}
        this.canMoveObjects = false;
        this.fail = false;  // Will be set true if reload fails (can't deserialise).
        this.failString = null;  // Language string key for fail error message.

        let newHelpString = self.getHelpText();
        this.helpOverlay.insertHelpText(newHelpString);

        // A variable denoting the edit-history of the graph, in the form of a stack (LIFO), used in the undo/redo mechanism
        // Load it with the initial graph
        this.historyStack = [$(this.textArea).val()];
        this.historyStackPointer = 0; // A pointer pointing to an entry in the historyStack

        this.reload();
        if (!this.fail) {
            this.draw();
        }

        // Call the draw function at a fixed interval
        this.drawTimer = window.setInterval(function(){ self.update(); }, 50);
    }

    Graph.prototype.failed = function() {
        return this.fail;
    };

    Graph.prototype.failMessage = function() {
        return this.failString;
    };

    Graph.prototype.getElement = function() {
        this.containerDiv.append(this.getHelpOverlay());
        this.containerDiv.append(this.getToolbar());
        this.containerDiv.append(this.getCanvas());
        return this.containerDiv;
    };

    Graph.prototype.hasFocus = function() {
        return document.activeElement == this.getCanvas();
    };

    Graph.prototype.getCanvas = function() {
        return this.graphCanvas.canvas[0];
    };

    Graph.prototype.getToolbar = function() {
        if (this.toolbar !== null) {
            return this.toolbar.div[0];
        } else {
            return null;
        }
    };

    Graph.prototype.getHelpOverlay = function() {
        return this.helpOverlay.div;
    };

    Graph.prototype.setUIMode = function(modeType) {
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

    Graph.prototype.nodeRadius = function() {
        return this.templateParams.noderadius ? this.templateParams.noderadius : this.DEFAULT_NODE_RADIUS;
    };

    Graph.prototype.fontSize = function() {
        return this.templateParams.fontsize ? this.templateParams.fontsize : this.DEFAULT_FONT_SIZE;
    };

    // A function to return whether the graph is of the type denoted by the input parameter
    Graph.prototype.isType = function(type) {
        return this.templateParams.type === type;
    };

    // A function to return whether the graph allows the edits specified by the parameter.
    // This parameter can be a single enum value, or an array of enums, to denote either 1 or more allowed edits
    Graph.prototype.allowEdits = function(edits) {
        let editsArray = [];
        let allowed_edits = this.templateParams.allow_edits;

        if (!allowed_edits) {
            // If the input parameter is undefined (or equal to null) then allow everything
            return true;
        } else if ((Array.isArray(allowed_edits) && !allowed_edits.length) || (this.readOnly)) {
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

    // This function returns whether the graph allows at least one edit (true) or not (false)
    Graph.prototype.allowsOneEdit = function() {
        for (let i = 0; i < Object.values(util.Edit).length; i++) {
            let edit = Object.values(util.Edit)[i];
            if (this.allowEdits(edit)) {
                return true;
            }
        }

        return false;
    };

    // This function checks the validity of a string as per the given regex for one selected object
    Graph.prototype.checkStringValidity = function(string, selectedObject) {
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

    // This function checks the validity of a label as per the given regex, and applies effects
    Graph.prototype.checkLabelValidity = function(labelInputField, labelText) {
        let isValid = this.checkStringValidity(labelText, this.selectedObjects[0]);

        if (!isValid) {
            // Set the textfield border to red by applying a class to the input field
            $(labelInputField).addClass('invalid');
        } else {
            // Remove the red border
            $(labelInputField).removeClass('invalid');
        }
    };

    // Create the help text to be displayed. This depends on the type of the graph (FSM, Petri net, etc.)
    Graph.prototype.getHelpText = function() {

        let isFSM = this.isType(util.Type.FSM);
        let isPetri = this.isType(util.Type.PETRI);

        let node = "node";
        if (isFSM) {
            node = "state";
        } else if (isPetri) {
            node = "place/transition";
        }
        let aNode = "a " + node;
        let edge = "edge";
        if (isFSM) {
            edge = "transition";
        }
        let anEdge = (isFSM ? "a " : "an ") + edge;

        let hasDrawMode = this.allowEdits(util.Edit.ADD_VERTEX) ||
                this.allowEdits(util.Edit.ADD_EDGE);
        let canEditVertex = this.allowEdits(util.Edit.ADD_VERTEX);
        let canEditEdge = this.allowEdits(util.Edit.ADD_EDGE);
        let editableList = [];
        if (canEditVertex) {
            if (isFSM) {
                editableList.push("state");
            } else if (isPetri) {
                editableList.push("place");
                editableList.push("transition");
            } else {
                editableList.push("node");
            }
        }
        if (canEditEdge) {
            if (isFSM) {
                editableList.push("transition");
            } else {
                editableList.push("edge");
            }
        }
        let editable = editableList.join("/");
        let anEditable = (editableList[0] === "edge" ? "an " : "a ") + editable;
        let editables = editableList.map(e => e + "s").join("/");

        let labelEditableList = [];
        if (this.allowEdits(util.Edit.VERTEX_LABELS)) {
            labelEditableList.push(node);
        }
        if (this.allowEdits(util.Edit.EDGE_LABELS)) {
            labelEditableList.push(edge);
        }
        let labelEditable = labelEditableList.join("/");
        let aLabelEditable = (labelEditableList[0] === "edge" ? "an " : "a ") + labelEditable;

        let colorEditableList = [];
        if (this.allowEdits(util.Edit.VERTEX_COLORS)) {
            colorEditableList.push(node);
        }
        if (this.allowEdits(util.Edit.EDGE_COLORS)) {
            colorEditableList.push(edge);
        }
        let colorEditable = colorEditableList.join("/");
        let aColorEditable = (colorEditableList[0] === "edge" ? "an " : "a ") + colorEditable;

        let highlightableList = [];
        if (this.templateParams.highlight_vertices) {
            highlightableList.push(node);
        }
        if (this.templateParams.highlight_edges) {
            highlightableList.push(edge);
        }
        let highlightable = highlightableList.join("/");
        let aHighlightable = (highlightableList[0] === "edge" ? "an " : "a ") + highlightable;

        // Create the first part of the help text
        let introductoryText = "<div class='dialog-header'>Graph Help</div>";
        if (hasDrawMode) {
            introductoryText += "<p>To enter your answer as a graph, you can use Select mode (to edit existing " + editables + ") "
                + "and Draw mode (to draw new " + editables + ").</p>"
                + "<p>Toggle between the modes by clicking "
                + "<i class=\"fa fa-mouse-pointer\"></i>"
                + " and "
                + "<i class=\"fa fa-pencil\"></i>. "
                + "Additionally, while in Select mode you can temporarily use Draw mode "
                + "by pressing the Ctrl key.</p>";
        } else {
            introductoryText += "<p>To give your answer, you can do the following:</p>";
        }

        // Create the help text for the select mode
        let selectModeText = "";
        if (hasDrawMode) {
            selectModeText = "<div class='dialog-section'>Select mode:</div>";
        }
        selectModeText += "<ul class='dialog-help'>";
        selectModeText += "<li><b>Select " + node + ":</b> &nbsp;"
            + "Click " + aNode + "."
            + (canEditVertex ? " Dragging it moves the " + node + "." : "") + "</li>";
        selectModeText += "<li><b>Select " + edge + ":</b> &nbsp;"
            + "Click " + anEdge + "."
            + (canEditEdge ? " Dragging it changes the arc curvature." : "") + "</li>";

        if (isFSM && this.allowEdits(util.Edit.FSM_FLAGS)) {
            selectModeText += "<li><b>Mark state as initial/final:</b> &nbsp;"
                + "Select a state and click the initial/final checkboxes in the toolbar.</li>";
        }

        if (isPetri && this.allowEdits(util.Edit.PETRI_MARKING)) {
            selectModeText += "<li><b>Edit marking:</b> &nbsp;"
                + "Select a place and edit its number of tokens using the field "
                + "in the toolbar.</li>";
        }

        if (labelEditable) {
            selectModeText += "<li><b>Edit " + labelEditable + " label:</b> &nbsp;"
                + "Select " + aLabelEditable + " and edit the label text field "
                + "in the toolbar. You can add a one-character subscript by adding an underscore followed "
                + "by the subscript (i.e., <i>a_1</i>). You can type Greek letters using a backslash followed by "
                + "the letter name (i.e., <i>\\alpha</i>).</li>";
        }

        if (colorEditable) {
            selectModeText += "<li><b>Edit " + colorEditable + " color:</b> &nbsp;"
                + "Select " + aColorEditable + " and pick a color from the color dropdown in the toolbar.</li>";
        }

        if (highlightable) {
            selectModeText += "<li><b>Highlight " + highlightable + ":</b> &nbsp;"
                + "Select " + aHighlightable + " and select the highlight checkbox in the toolbar.</li>";
        }

        if (hasDrawMode) {
            selectModeText += "<li><b>Delete " + editable + ":</b> &nbsp;"
                + "Select " + anEditable + " and click "
                + "<i class=\"fa fa-trash\"></i>, or press the 'Delete' (Windows / Linux) or 'Fn-Delete' (Mac) key.</li>";
        }
        selectModeText += "</ul>";

        // Create the help text for the draw mode
        let drawModeText = "";
        if (hasDrawMode) {
            drawModeText = "<br><div class='dialog-section'>Draw mode:</div>"
                + "<ul class='dialog-help'>";
            if (canEditVertex) {
                if (isPetri) {
                    drawModeText += "<li><b>Create new place:</b> &nbsp;"
                        + "Click the "
                        + "<i class=\"fa fa-circle-o\"></i>"
                        + " button, and then on an empty space.</li>";
                    drawModeText += "<li><b>Create new transition:</b> &nbsp;"
                        + "Click the "
                        + "<i class=\"fa fa-square-o\"></i>"
                        + " button, and then on an empty space.</li>";
                } else {
                    drawModeText += "<li><b>Create new " + node + ":</b> &nbsp;"
                        + "Click on an empty space.</li>";
                }
            }
            if (canEditEdge) {
                drawModeText += "<li><b>Create new " + edge + ":</b> &nbsp;"
                    + "Click on " + aNode + " and drag to another " + node + ".</li>"
                    + "<li><b>Create self-loop:</b> &nbsp;"
                    + "Click on " + aNode + " and drag to the same " + node + ".</li>";
            }
            drawModeText += "</ul>";
        }

        let undoText = "<br><p>You can undo and redo any changes you made with the "
            + "<i class=\"fa fa-undo\"></i>"
            + " and "
            + "<i class=\"fa fa-repeat\"></i>"
            + " buttons. If any " + node + " or " + edge + " has a gray shadow, "
            + " it is locked, meaning it cannot be edited.</p>";

        // Return the concatenation
        return introductoryText + selectModeText + drawModeText + undoText;
    };

    // Draw an arrow head if this is a directed graph. Otherwise do nothing.
    Graph.prototype.arrowIfReqd = function(c, x, y, angle) {
        if (this.isType(util.Type.DIRECTED) || this.isType(util.Type.FSM) || this.isType(util.Type.PETRI)) {
            util.drawArrow(c, x, y, angle);
        }
    };

    Graph.prototype.enableTemporaryDrawMode = function() {
        if (this.allowEdits(util.Edit.ADD_VERTEX) || this.allowEdits(util.Edit.ADD_EDGE)) {
            // Assign the latest selected object
            this.previousSelectedObjects = this.selectedObjects;

            // Set the mode to Draw
            this.setUIMode(util.ModeType.DRAW);
            this.selectedObjects = this.previousSelectedObjects; // Re-add the selected objects
            this.isTempDrawModeActive = true;
        }
    };

    Graph.prototype.disableTemporaryDrawMode = function() {
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
    Graph.prototype.sync = function() {
        // Nothing to do ... always sync'd.
    };

    Graph.prototype.focusElement = function(element, timeout) {
        // Applying a focus with a short unnoticable delay works. Directly applying without delay does not work
        setTimeout(function () {
            if (element) {
                $(element).focus();
            }
        }, timeout);
    };

    Graph.prototype.keypress = function(e) {
        var key = util.crossBrowserKey(e);

        if (this.readOnly) {
            return;
        }

        if (key === 8 || key === 0x20 || key === 9) {
            // Disable scrolling on backspace, tab and space.
            return false;
        }
    };

    Graph.prototype.mousedown = function(e) {
        var mouse = util.mousePos(e);

        if (this.readOnly) {
            return;
        }

        this.clickedObject = this.getMouseOverObject(mouse.x, mouse.y, true);
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
                    this.nodes.push(newNode);

                    // Set as initial node if it is the first node, and if the type is FSM
                    if (this.nodes.length === 1 && this.isType(util.Type.FSM)) {
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
                    if (!this.draggedObjects.includes(this.clickedObject)) {
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

    Graph.prototype.keydown = function(e) {
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

    Graph.prototype.keyup = function(e) {
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
    Graph.prototype.checkKeyPressed = function(e) {
        if (!e.ctrlKey && this.isTempDrawModeActive) {
            // If the CTRL key is not pressed while the temporary draw mode is active, we disable temporary draw mode
            // This happens for example when releasing the CTRL key on an alert box popup
            this.disableTemporaryDrawMode();
        }
    };

    Graph.prototype.resize = function(w, h) {
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

    Graph.prototype.mousemove = function(e) {
        var mouse = util.mousePos(e),
            closestPoint;

        if (this.readOnly) {
            return;
        }

        this.mousePosition = {x: mouse.x, y: mouse.y};

        // Depending on the mode, perform different tasks
        if (this.uiMode === util.ModeType.DRAW) {
            if (this.clickedObject instanceof elements.Node && this.allowEdits(util.Edit.ADD_EDGE)) {
                let targetNode = this.getMouseOverObject(mouse.x, mouse.y, true);
                let targetNodeStrict = this.getMouseOverObject(mouse.x, mouse.y, false);
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
                    let nodesSet = new Set(this.nodes);
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

    Graph.prototype.mouseup = function(e) {
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
                    for (let i = 0; i < this.links.length; i++) {
                        if ((this.links[i].nodeA === this.currentLink.nodeA && this.links[i].nodeB === this.currentLink.nodeB) ||
                            (this.links[i].nodeA === this.currentLink.nodeB && this.links[i].nodeB === this.currentLink.nodeA)) {
                            this.alertPopup('Two edges between two nodes is not permitted.');
                            return;
                        }
                    }
                } else if (this.isType(util.Type.DIRECTED) && !this.isType(util.Type.FSM) &&
                    !this.isType(util.Type.PETRI)) {
                    // In case of a directed graph (non-FSM, non-Petri), only 1 edge from two arbitrary
                    // nodes v_1 to v_2 is permitted
                    for (let i = 0; i < this.links.length; i++) {
                        if (!(this.currentLink instanceof elements.SelfLink)) {
                            if (this.links[i].nodeA === this.currentLink.nodeA && this.links[i].nodeB === this.currentLink.nodeB) {
                                this.alertPopup('Two edges from one node to another is not permitted.');
                                return;
                            }
                        } else {
                            if (this.links[i].node === this.currentLink.node) {
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
            let objects = this.getObjectsInRectangle(this.selectionRectangle);
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
    Graph.prototype.mouseenter = function(e) {
        // Check what keys are pressed (used to for example deactive temporary draw mode, if applicable)
        this.checkKeyPressed(e);
    };

    // This event function is activated when the mouse leaves the graph canvas
    Graph.prototype.mouseleave = function(e) {
        // Set the mouse position to null
        this.mousePosition = null;
        this.mouseup(e);
    };

    Graph.prototype.alertPopup = function(message) {
        this.currentLink = null;
        this.clickedObject = null;
        this.draw();
        window.alert(message);
    };

    // This function returns all non-locked objects which are completely located in a rectangle
    // The input rectangle should be of the form: [{x: null, y: null}, {x: null, y: null}]
    Graph.prototype.getObjectsInRectangle = function(rect) {
        let objects = [];
        // Check all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].locked) {
                continue;
            }
            // Calculate the top-left corner of the circle/square
            let topLeft = {x: this.nodes[i].x - this.nodeRadius(), y: this.nodes[i].y - this.nodeRadius()};
            let bottomRight = {x: this.nodes[i].x + this.nodeRadius(), y: this.nodes[i].y + this.nodeRadius()};
            let testRect = [topLeft, bottomRight];

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
                let l = this.links[i].getEndPoints(); // Get information about the link
                points.push({x: l.startX, y: l.startY});
                points.push({x: l.endX, y: l.endY});
            } else {
                // Else if normal link or self link
                let l = this.links[i].getEndPointsAndCircle(); // Link info
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

            // If all points of the arc are inside the input rectangle, return this link
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

    // This function returns the first encountered object on which the user has clicked
    // A margin is used such that creating links is easier
    Graph.prototype.getMouseOverObject = function(x, y, useNodePadding) {

        // First check if the mouse hovers over a node
        let node = this.getMouseOverNode(x, y, useNodePadding);
        if (node) {
            return node;
        }

        for (let i = 0; i < this.links.length; i++) {
            if (this.links[i].containsPoint(x, y)) {
                return this.links[i];
            }
        }
        return null;
    };

    Graph.prototype.getMouseOverNode = function(x, y, useNodePadding) {
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].containsPoint(x, y, useNodePadding)) {
                return this.nodes[i];
            }
        }
        return null;
    };

    Graph.prototype.deleteSelectedObjects = function(graphUI) {
        if (graphUI.selectedObjects.length) {
            if (graphUI.allowEdits(util.Edit.DELETE_VERTEX)) {
                for (let i = 0; i < graphUI.nodes.length; i++) {
                    if (graphUI.selectedObjects.includes(graphUI.nodes[i])) {
                        graphUI.nodes.splice(i--, 1);
                    }
                }
            }
            if (graphUI.allowEdits(util.Edit.DELETE_EDGE)) {
                for (let i = 0; i < graphUI.links.length; i++) {
                    if (graphUI.selectedObjects.includes(graphUI.links[i]) ||
                        graphUI.selectedObjects.includes(graphUI.links[i].node) ||
                        graphUI.selectedObjects.includes(graphUI.links[i].nodeA) ||
                        graphUI.selectedObjects.includes(graphUI.links[i].nodeB)) {
                        graphUI.links.splice(i--, 1);
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

    Graph.prototype.setInitialFSMVertex = function(vertex) {
        // TODO: use the input parameter to decide whether there is only 1 input vertex, or whether there can be any
        //  number of input vertices

        // Set the selected vertex as the initial vertex, and draw it
        if (this.isType(util.Type.FSM) && vertex instanceof elements.Node) {
            vertex.isInitial = true;

            // Get the angles of all incident (i.e. incoming and outgoing) edges of this vertex
            let angles = util.getAnglesOfIncidentLinks(this.links, vertex);

            let topLeft = (3.0/4.0 * Math.PI); // The top-left of the vertex's circle in radians
            let nodeLinkDrawRadius = this.nodeRadius() + this.INITIAL_FSM_NODE_LINK_LENGTH*2; // The radius used to draw
            // edges in the last two cases

            // Execute different cases, to fill the startLinkPos variable's x and y values
            let startLinkPos = {};
            if (angles.length === 0) {
                // Set the start link position to the top-left of the vertex
                startLinkPos.x = vertex.x - (this.nodeRadius() + this.INITIAL_FSM_NODE_LINK_LENGTH);
                startLinkPos.y = vertex.y - (this.nodeRadius() + this.INITIAL_FSM_NODE_LINK_LENGTH);
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

    Graph.prototype.removeInitialFSMVertex = function(vertex) {
        vertex.isInitial = false;
        // Remove all start links incoming to this vertex
        for (let i = 0; i < this.links.length; i++) {
            if (this.links[i] instanceof elements.StartLink && this.links[i].node === vertex) {
                this.links.splice(i--, 1);
            }
        }
    };

    // A function to snap the input node to any other node not present in the selection. This snapping happens either
    // horizontally or vertically
    Graph.prototype.snapNode = function(node, notSelectedNodes, snapXDirection, snapYDirection) {
        for (let i = 0; i < notSelectedNodes.length; i++) {
            if (notSelectedNodes[i] === node) {
                continue;
            }

            if (Math.abs(node.x - notSelectedNodes[i].x) < this.SNAP_TO_PADDING && snapXDirection) {
                node.x = notSelectedNodes[i].x;
            }

            if (Math.abs(node.y - notSelectedNodes[i].y) < this.SNAP_TO_PADDING && snapYDirection) {
                node.y = notSelectedNodes[i].y;
            }
        }
    };

    // Add a new link (always 'this.currentLink') to the set of links.
    // If the link connects two nodes already linked, the angle of the new link
    // is tweaked so it is distinguishable from the existing links.
    Graph.prototype.addLink = function(newLink) {
        var maxPerpRHS = null;
        for (var i = 0; i < this.links.length; i++) {
            var link = this.links[i];
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
            newLink.perpendicularPart = maxPerpRHS + this.DUPLICATE_LINK_OFFSET;
        }
        this.links.push(newLink);
    };

    // A function to add a new graph instance, upon a change of the graph, to the history stack
    Graph.prototype.onGraphChange = function() {
        // Remove the part of the stack above the pointer, so the 'redo-able' graph instances are lost
        this.historyStack.length = this.historyStackPointer + 1;

        // Save the graph, so the new graph instance can be used. This instance will be added to the end of the array.
        // Furthermore, increase the pointer
        this.save();
        let graphInstance = $(this.textArea).val();
        this.historyStack.push(graphInstance);
        if (this.historyStack.length > this.MAX_UNDO_REDO + 1) {
            this.historyStack.shift();
        } else {
            this.historyStackPointer++;
        }

        // Enable the undo button, and disable the redo button
        this.toolbar.rightButtons['undo'].setEnabled();
        this.toolbar.rightButtons['redo'].setDisabled();
    };

    // A function to handle the undo operation of the graph UI
    Graph.prototype.undo = function(graphUI) {
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
    Graph.prototype.redo = function(graphUI) {
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

    // A function to update the graph with a new graph
    Graph.prototype.updateGraph = function(graphUI, graphInstance) {
        // Update the value:
        $(this.textArea).val(graphInstance);

        // Clear all objects
        this.nodes = [];
        this.links = [];
        this.selectedObjects = [];
        this.previousSelectedObjects = [];

        // Save and reload the graphUI
        this.reload();

        // Reload the toolbar
        this.toolbar.addSelectionOptions(this.selectedObjects);

        if (this.isType(util.Type.FSM)) {
            this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
        }
        if (this.isType(util.Type.PETRI)) {
            this.toolbar.addPetriSelectionOptions(this.selectedObjects);
        }
    };

    Graph.prototype.reload = function() {
        var content = $(this.textArea).val();
        if (content) {
            try {
                // Load up the student's previous answer if non-empty.
                var input = JSON.parse(content), i;

                if (!input.hasOwnProperty('_version') || input['_version'] !== 1) {
                    throw "invalid version";
                }

                for (i = 0; i < input.vertices.length; i++) {
                    var inputNode = input.vertices[i];
                    var node = new elements.Node(this, inputNode['position'][0], inputNode['position'][1]);
                    if (!this.templateParams.ignore_locked && 'locked' in inputNode) {
                        // note: don't set the locked flag if we're in ignore_locked mode,
                        // because then we're supposed to be able to edit locked objects
                        // (when saving this will lose the locked flags)
                        node.locked = inputNode['locked'];
                    }
                    node.text = inputNode['label'];
                    if (this.templateParams.vertex_colors) {
                        node.colorObject = util.colorObjectFromColorCode(inputNode['color']);
                    }
                    if (this.templateParams.highlight_vertices) {
                        node.isHighlighted = inputNode['highlighted'];
                    }
                    if (this.isType(util.Type.FSM)) {
                        node.isInitial = inputNode['initial'];
                        node.isFinal = inputNode['final'];
                    }
                    if (this.isType(util.Type.PETRI)) {
                        node.petriNodeType = inputNode['petri_type'];
                        if (inputNode['petri_type'] === util.PetriNodeType.PLACE) {
                            node.petriTokens = inputNode['tokens'];
                        }
                    }
                    this.nodes.push(node);
                }

                for (i = 0; i < input.edges.length; i++) {
                    var inputLink = input.edges[i];
                    var link = null;

                    if (inputLink['from'] === inputLink['to']) {
                        // Self link has two identical nodes.
                        link = new elements.SelfLink(this, this.nodes[inputLink['from']]);
                        link.text = inputLink['label'];
                        link.colorObject = (this.templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                        link.isHighlighted = (this.templateParams.highlight_edges)? inputLink['highlighted'] : false;
                        link.anchorAngle = inputLink['bend']['anchorAngle'];
                    } else if (inputLink['from'] === -1) {
                        link = new elements.StartLink(this, this.nodes[inputLink['to']]);
                        link.deltaX = inputLink['bend']['deltaX'];
                        link.deltaY = inputLink['bend']['deltaY'];
                        link.colorObject = (this.templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                        link.isHighlighted = (this.templateParams.highlight_edges)? inputLink['highlighted'] : false;
                    } else {
                        link = new elements.Link(this, this.nodes[inputLink['from']], this.nodes[inputLink['to']]);
                        link.text = inputLink['label'];
                        link.colorObject = (this.templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                        link.isHighlighted = (this.templateParams.highlight_edges)? inputLink['highlighted'] : false;
                        link.parallelPart = inputLink['bend']['parallelPart'];
                        link.perpendicularPart = inputLink['bend']['perpendicularPart'];
                        link.lineAngleAdjust = inputLink['bend']['lineAngleAdjust'];
                    }
                    if (!this.templateParams.ignore_locked && 'locked' in inputLink) {
                        link.locked = inputLink['locked'];
                    }
                    this.links.push(link);
                }

                // Update the history stack if it's empty
                if (this.historyStack.length === []) {
                    this.historyStack.push(content);
                    this.historyStackPointer++;
                }
            } catch(e) {
                this.fail = true;
                this.failString = 'graph_ui_invalidserialisation';
            }
        } else {
            // Push an empty graph to the history stack if it's empty
            if (this.historyStack.length === []) {
                this.historyStack.push("");
                this.historyStackPointer++;
            }
        }
    };

    Graph.prototype.save = function() {
        var output = {
            '_version': 1,
            'vertices': [],
            'edges': []
        };
        var i;

        if(!JSON || (this.textArea.val().trim() === '' && this.nodes.length === 0)) {
            return;  // Don't save if we have an empty textbox and no graphic content.
        }

        for (i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            let vertex = {
                'label': node.text,
                'position': [node.x, node.y],
                'locked': node.locked
            };
            if (this.templateParams.vertex_colors && node.colorObject) {
                vertex['color'] = node.colorObject.colorCode;
            }
            if (this.templateParams.highlight_vertices) {
                vertex['highlighted'] = node.isHighlighted;
            }
            if (this.isType(util.Type.FSM)) {
                vertex['initial'] = node.isInitial;
                vertex['final'] = node.isFinal;
            }
            if (this.isType(util.Type.PETRI)) {
                vertex['petri_type'] = node.petriNodeType;
                if (vertex['petri_type'] === util.PetriNodeType.PLACE) {
                    vertex['tokens'] = node.petriTokens;
                }
            }
            // if we're in the save_locked mode, make sure to put the locked flag back on save
            if (this.templateParams.save_locked) {
                vertex['locked'] = true;
            }
            output.vertices.push(vertex);
        }

        for (i = 0; i < this.links.length; i++) {
            var link = this.links[i];
            if (link instanceof elements.SelfLink) {
                let linkObject = {
                    'from': this.nodes.indexOf(link.node),
                    'to': this.nodes.indexOf(link.node),
                    'bend': {
                        'anchorAngle': link.anchorAngle
                    },
                    'label': link.text,
                    'locked': link.locked
                };
                if (this.templateParams.edge_colors && link.colorObject) {
                    linkObject.color = link.colorObject.colorCode;
                }
                if (this.templateParams.highlight_edges) {
                    linkObject.highlighted = link.isHighlighted;
                }
                // if we're in the save_locked mode, make sure to put the locked flag back on save
                if (this.templateParams.save_locked) {
                    linkObject['locked'] = true;
                }
                output.edges.push(linkObject);
            } else if (link instanceof elements.StartLink) {
                let linkObject = {
                    'from': -1,
                    'to': this.nodes.indexOf(link.node),
                    'bend': {
                        'deltaX': link.deltaX,
                        'deltaY': link.deltaY
                    },
                    'locked': link.locked
                };
                if (this.templateParams.edge_colors && link.colorObject) {
                    linkObject.color = link.colorObject.colorCode;
                }
                if (this.templateParams.highlight_edges) {
                    linkObject.highlighted = link.isHighlighted;
                }
                if (this.templateParams.save_locked) {
                    linkObject['locked'] = true;
                }
                output.edges.push(linkObject);
            } else if (link instanceof elements.Link) {
                let linkObject = {
                    'from': this.nodes.indexOf(link.nodeA),
                    'to': this.nodes.indexOf(link.nodeB),
                    'bend': {
                        'lineAngleAdjust': link.lineAngleAdjust,
                        'parallelPart': link.parallelPart,
                        'perpendicularPart': link.perpendicularPart
                    },
                    'label': link.text,
                    'locked': link.locked
                };
                if (this.templateParams.edge_colors && link.colorObject) {
                    linkObject.color = link.colorObject.colorCode;
                }
                if (this.templateParams.highlight_edges) {
                    linkObject.highlighted = link.isHighlighted;
                }
                if (this.templateParams.save_locked) {
                    linkObject['locked'] = true;
                }
                output.edges.push(linkObject);
            }
        }
        this.textArea.val(JSON.stringify(output));
    };

    // A function which is configured to be ran periodically
    Graph.prototype.update = function() {
        // Draw the graph
        this.draw();
    };

    Graph.prototype.destroy = function () {
        this.graphCanvas.canvas.off();  // Stop all events.
        this.graphCanvas.canvas.remove();

        this.toolbar.div.off();
        this.toolbar.div.remove();

        this.helpOverlay.div.off();
        this.helpOverlay.div.remove();

        this.containerDiv.remove();

        if (this.drawTimer) {
            clearInterval(this.drawTimer);
        }
    };

    Graph.prototype.draw = function() {
        var canvas = this.getCanvas(),
            c = canvas.getContext('2d');

        c.clearRect(0, 0, this.getCanvas().width, this.getCanvas().height);
        c.save();

        // scale the canvas so that it is nominalWidth 'virtual pixels' wide
        const scaleFactor = canvas.width / util.nominalWidth;
        c.scale(scaleFactor, scaleFactor);

        // use Segoe UI as that is the default Moodle font
        // (at least on Windows)
        c.font = this.fontSize() + 'px "Segoe UI"';

        // If draw mode is active and the user hovers over an empty area, draw a shadow node to indicate that the user
        // can create a node here
        if (this.uiMode === util.ModeType.DRAW && this.mousePosition && !this.currentLink &&
            !this.getMouseOverObject(this.mousePosition.x, this.mousePosition.y, true) &&
            this.allowEdits(util.Edit.ADD_VERTEX)) {

            // Create the shadow node and draw it
            let shadowNode = new elements.Node(this, this.mousePosition.x, this.mousePosition.y);
            if (this.isType(util.Type.PETRI) && this.petriNodeType === util.PetriNodeType.TRANSITION) {
                shadowNode.petriNodeType = util.PetriNodeType.TRANSITION;
            }
            shadowNode.draw(c, true, util.DrawOption.HOVER);
        }

        // Draw all selections of the nodes, and links
        this.drawNodes(c, util.DrawOption.SELECTION);
        this.drawLinks(c, util.DrawOption.SELECTION);

        // Draw all highlights of the nodes and the nodes themselves, and links
        this.drawNodes(c, util.DrawOption.OBJECT);
        this.drawLinks(c, util.DrawOption.OBJECT);

        // Draw the current link
        if (this.currentLink) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = util.Color.BLACK;
            this.currentLink.draw(c, util.DrawOption.OBJECT);
        }

        // Draw the selection rectangle, if it exists
        let sRect = this.selectionRectangle;
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
        this.save();
    };

    // A function to draw (a part of) the nodes
    Graph.prototype.drawNodes = function(c, drawOption) {
        // If the option is not defined, don't draw anything
        if (!Object.values(util.DrawOption).includes(drawOption)) {
            return;
        }

        // Draw the nodes with the draw option
        for (let i = 0; i < this.nodes.length; i++) {
            let drawNodeShadow = this.uiMode === util.ModeType.DRAW && this.mousePosition &&
                this.getMouseOverNode(this.mousePosition.x, this.mousePosition.y, true) === this.nodes[i] &&
                this.allowEdits(util.Edit.ADD_VERTEX);
            if (drawNodeShadow) {
                // Enable the shadow
                let shadowAlpha = 0.5;
                c.shadowColor = 'rgb(150,150,150,' + shadowAlpha + ')';
                c.shadowBlur = 10;

                // If the node is highlighted, draw another node below it, so the shadow is visible
                if (this.nodes[i].isHighlighted) {
                    let shadowNode = new elements.Node(this, this.nodes[i].x, this.nodes[i].y);
                    c.lineWidth = 1;
                    c.fillStyle = c.strokeStyle = 'rgb(192,192,192,' + shadowAlpha + ')';
                    shadowNode.draw(c, drawNodeShadow, null);
                }
            }

            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = util.Color.BLACK;
            this.nodes[i].draw(c, drawNodeShadow, drawOption);

            if (drawNodeShadow && this.allowEdits(util.Edit.ADD_VERTEX)) {
                // Disable the shadow
                c.shadowBlur = 0;
                c.globalAlpha = 1;
            }
        }
    };

    // A function to draw (a part of) the links
    Graph.prototype.drawLinks = function(c, drawOption) {
        // Draw the links with the draw option
        for (let i = 0; i < this.links.length; i++) {
            c.lineWidth = 1;
            this.links[i].draw(c, drawOption);
        }
    };

    Graph.prototype.drawText = function(originalObject, originalText, x, y, angleOrNull) {
        var c = this.getCanvas().getContext('2d'),
            text = util.convertLatexShortcuts(originalText),
            width,
            dy;

        c.fillStyle = util.Color.BLACK;
        width = c.measureText(text).width;

        let isSmallWidth = width <= 2 * this.nodeRadius() - this.TEXT_NODE_HORIZONTAL_PADDING;
        if (isSmallWidth &&
            !(this.isType(util.Type.PETRI) && originalObject instanceof elements.Node &&
                originalObject.petriNodeType === util.PetriNodeType.PLACE) ||
            (originalObject instanceof elements.Link ||
            originalObject instanceof elements.SelfLink ||
            originalObject instanceof elements.StartLink)) {
            // Center the text inside the node if it fits
            x -= width / 2;

            // If the node is a dark color, enhance the visibility of the text by changing the color to white
            if (originalObject instanceof elements.Node && originalObject.colorObject.isDark) {
                c.fillStyle = util.Color.WHITE;
            }
        } else if (originalObject instanceof elements.Node && (!isSmallWidth ||
            originalObject.petriNodeType === util.PetriNodeType.PLACE)) {
            // If the text does not fit, or if it is a Place node (of a petri net), position the element either on the
            // bottom, right, top or left of the node
            let sidesOfNodeLinkIntersections = originalObject.getLinkIntersectionSides(this.links);
            if (!sidesOfNodeLinkIntersections.bottom ||
                (sidesOfNodeLinkIntersections.bottom && sidesOfNodeLinkIntersections.right &&
                    sidesOfNodeLinkIntersections.top && sidesOfNodeLinkIntersections.left)) {
                x -= width / 2;
                y += this.nodeRadius() + this.TEXT_NODE_VERTICAL_PADDING;
            } else if (!sidesOfNodeLinkIntersections.right) {
                x += this.nodeRadius() + this.TEXT_NODE_HORIZONTAL_PADDING;
            } else if (!sidesOfNodeLinkIntersections.top) {
                x -= width / 2;
                y -= this.nodeRadius() + this.TEXT_NODE_VERTICAL_PADDING;
            } else if (!sidesOfNodeLinkIntersections.left) {
                x -= width + this.nodeRadius() + this.TEXT_NODE_HORIZONTAL_PADDING;
            }
        }

        // Position the text intelligently if given an angle.
        if(angleOrNull) {
            var cos = Math.cos(angleOrNull);
            var sin = Math.sin(angleOrNull);
            var cornerPointX = (width / 2) * (cos > 0 ? 1 : -1);
            var cornerPointY = 10 * (sin > 0 ? 1 : -1);
            var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
            x += cornerPointX - sin * slide;
            y += cornerPointY + cos * slide;
        }

        // Draw text
        if('advancedFillText' in c) {
            c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
        } else {
            x = Math.round(x);
            y = Math.round(y);
            dy = Math.round(this.fontSize() / 3); // Don't understand this.
            c.fillText(text, x, y + dy);
        }
    };

    return {
        Constructor: Graph
    };
});
