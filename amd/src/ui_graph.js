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
 * JavaScript to interfdigraph2 to the Graph editor, which is used both in
 * the author editing page and by the student question submission page.
 *
 * @package    qtype
 * @subpackage graphchecker
 * @copyright  Richard Lobb, 2015, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


define(['jquery', 'qtype_graphchecker/graphutil', 'qtype_graphchecker/graphelements'], function($, util, elements) {

    // An enum for defining the type of the graph
    const Type = Object.freeze({
        UNDIRECTED: 'undirected',
        DIRECTED: 'directed',
        FSM: 'fsm',
        PETRI: 'petri'
    });

    // An enum for defining the type of edits that can be set to allowed or disallowed
    const Edit = Object.freeze({
        MOVE: 'move',
        ADD: 'add',
        DELETE: 'delete',
        VERTEX_LABELS: 'vertex_labels',
        EDGE_LABELS: 'edge_labels',
        VERTEX_COLORS: 'vertex_colors',
        EDGE_COLORS: 'edge_colors',
        FSM_FLAGS: 'fsm_flags',
        PETRI_MARKING: 'petri_marking'
    });

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
     * A GraphToolbar is the Graph's toolbar HTML div
     * object.
     *
     ************************************************************************/

    function GraphToolbar(parent, divId, w, h, uiMode, helpOverlay) {
        // Constructor, given the Graph that owns this toolbar div, the canvas object of the graph,
        // the required canvasId and the height and width of the wrapper that
        // encloses the Div.

        let self = this;
        this.parent = parent;
        this.buttonSize = {     //px. The pre-set size of the buttons (width, w, and height, h)
            //TODO: set this in the style.css file instead of as a variable (a generic button class for this plugin)
            w:  35,
            h:  25,
        };
        this.uiMode = uiMode; //TODO: remove, or rename to initialUIMode
        this.helpOverlay = helpOverlay;
        this.div = $(document.createElement('div'));
        this.div.attr({
            id:         divId,
            class:      "graphchecker_toolbar",
            tabindex:   0
        });

        // A list for the buttons in this toolbar, and a list for the (possible) checkboxes
        // TODO: make one list per toolbar part (left, middle, right), and index by string, e.g. 'token'
        // TODO: make button groups
        this.leftButtons = {};
        this.middleInput = {};
        this.rightButtons = {};

        $(document).ready(function() {
            // Create the 3 parts of the toolbar: left, middle and right
            if (self.parent.allowEdits(Edit.ADD)) {
                self.toolbarLeftPart = self.createToolbarPartObject(self.div[0],
                    self.div[0].style.height, 'left');
            }
            self.toolbarMiddlePart = self.createToolbarPartObject(self.div[0],
                self.div[0].style.height, 'middle');
            self.toolbarRightPart = self.createToolbarPartObject(self.div[0],
                self.div[0].style.height, 'right');

            if (self.parent.allowEdits(Edit.ADD)) {
                // Left buttons
                // Create the select button
                let selectButton = new elements.ToggleButton(self, self.toolbarLeftPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-mouse-pointer', "Select mode", self.onModeButtonPressed,
                    elements.ModeType.SELECT);
                selectButton.create();
                self.leftButtons['select'] = selectButton;

                // Create the draw button
                let drawButton = new elements.ToggleButton(self, self.toolbarLeftPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-pencil', "Draw mode (Ctrl)", self.onModeButtonPressed,
                    elements.ModeType.DRAW);
                drawButton.create();
                self.leftButtons['draw'] = drawButton;
            }

            // Right buttons
            // Create the delete button
            if (self.parent.allowEdits(Edit.DELETE)) {
                let deleteButton = new elements.GrayOutButton(self, self.toolbarRightPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-trash', "Delete", self.parent.deleteSelectedObjects,
                    self.parent);
                deleteButton.create();
                self.rightButtons['delete'] = deleteButton;
            }

            // Create the undo button
            if (self.parent.allowsOneEdit()) {
                let undoButton = new elements.GrayOutButton(self, self.toolbarRightPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-undo', "Undo", self.parent.undo, self.parent);
                undoButton.create();
                self.rightButtons['undo'] = undoButton;
            }

            // Create the redo button
            if (self.parent.allowsOneEdit()) {
                let redoButton = new elements.GrayOutButton(self, self.toolbarRightPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-repeat', "Redo", self.parent.redo, self.parent);
                redoButton.create();
                self.rightButtons['redo'] = redoButton;
            }

            // Create the help button
            let helpButton = new elements.Button(self, self.toolbarRightPart,
                self.buttonSize.w, self.buttonSize.h, 'fa-question', "Help menu", self.displayHelpOverlay, self);
            helpButton.create();
            self.rightButtons['help'] = helpButton;

            // Enable one of the mode buttons at the start, depending on the UI mode
            for(let key in self.leftButtons) {
                if (self.leftButtons[key] instanceof elements.ToggleButton &&
                    self.leftButtons[key].buttonModeType === self.uiMode) {
                    self.leftButtons[key].setSelected();
                }
            }

            // If the graph type is 'Petri net', and the initial mode is 'Draw', show the buttons for selection
            // different types of petri nodes: places and transitions
            if (self.parent.isType(Type.PETRI) && self.uiMode === elements.ModeType.DRAW) {
                self.addPetriNodeTypeOptions();

                // Set the place button to highlighted
                self.onClickPetriNodeTypeButton(self.middleInput['place']);
            }

            self.resize(w, h);
            self.parent.setUIMode(elements.ModeType.SELECT);
        });

        this.div.on('keydown', function(e) {
            return parent.keydown(e);
        });

        this.div.on('keyup', function(e) {
            return parent.keyup(e);
        });

        this.onModeButtonPressed = function(buttonModeType) {
            // Activate the pressed mode
            self.parent.setUIMode(buttonModeType);

            // Remove the FSM options from display if the mode is switched to draw mode
            if (buttonModeType === elements.ModeType.DRAW) {
                self.removeSelectionOptions();
                self.removeFSMNodeSelectionOptions();
                self.removePetriSelectionOptions();
                if (self.parent.isType(Type.PETRI)) {
                    self.onClickPetriNodeTypeButton(self.middleInput['place']);
                }
            }
        };

        this.resize = function(w, h) {
            // Resize to given dimensions.
            this.div.css({'width': w});
            this.div.css({'height': h});

            // Update the width of the middle part of the toolbar
            if (this.toolbarMiddlePart !== undefined) {
                let leftWidth = 0;
                if (this.parent.allowEdits(Edit.ADD)) {
                    leftWidth = $(this.toolbarLeftPart[0]).outerWidth();
                }
                let rightWidth = $(this.toolbarRightPart[0]).outerWidth();
                let middlePadding = $(this.toolbarMiddlePart[0]).innerWidth() - $(this.toolbarMiddlePart[0]).width();
                let canvasWidth = $(this.parent.graphCanvas.canvas).width();
                let middleWidth = canvasWidth - leftWidth - rightWidth - middlePadding;
                $(this.toolbarMiddlePart).width(middleWidth);
            }
        };

        this.resize(w, h);
    }

    GraphToolbar.prototype.displayHelpOverlay = function(toolbar) {
        // Display a help overlay on the entire graph UI
        toolbar.helpOverlay.div[0].style.display = 'block';
        toolbar.helpOverlay.div.addClass('visible');
        $('body').addClass('unscrollable');

        // Disable resizing of the graphUI wrapper
        toolbar.helpOverlay.graphUIWrapper.disableResize();
    };

    GraphToolbar.prototype.createToolbarPartObject = function(parentDiv, parentHeight, side) {
        // A function to create a basic div for a part of the toolbar:
        // i.e. the left, middle, or right part of the toolbar, denoted by the variable 'side'
        let $part = $('<div/>')
            .attr({
                'id':       'toolbar_part_' + side,
                'class':    'toolbar_part',
                'style':    'height: ' + parseFloat(parentHeight) + 'px;',
            });
        $(parentDiv).append($part);
        return $part;
    };

    GraphToolbar.prototype.addSelectionOptions = function(selectedObjects) {
        // Clear the selection options, and re-add them below when there is only 1 object
        this.removeSelectionOptions();
        if (selectedObjects.length === 0) {
            return;
        }

        // Creating the color selection options
        // Check whether all selected objects are either nodes or edges, or whether the color options are the same
        let colors;
        let areSameColors;
        if (this.parent.templateParams.vertex_colors && this.parent.templateParams.edge_colors) {
            areSameColors = util.checkSameElementsArrays(this.parent.templateParams.vertex_colors,
                this.parent.templateParams.edge_colors);
        } else {
            areSameColors = false;
        }
        let areOnlyNodes = true;
        let areOnlyEdges = true;
        for (let i = 0; i < selectedObjects.length; i++) {
            if (!(selectedObjects[i] instanceof elements.Node)) {
                areOnlyNodes = false;
            }
            if (!(selectedObjects[i] instanceof elements.Link ||
                selectedObjects[i] instanceof elements.SelfLink ||
                selectedObjects[i] instanceof elements.StartLink)) {
                areOnlyEdges = false;
            }
        }

        if (!areSameColors) {
            if (areOnlyNodes && !areOnlyEdges) {
                colors = this.parent.templateParams.vertex_colors;
            } else if (!areOnlyNodes && areOnlyEdges) {
                colors = this.parent.templateParams.edge_colors;
            }
        } else {
            colors = this.parent.templateParams.vertex_colors;
        }

        // Create the color dropdown under the conditions specified by the following variables:
        let areOnlyNodesAndAllowed = areOnlyNodes && !areOnlyEdges && this.parent.allowEdits(Edit.VERTEX_COLORS);
        let areOnlyEdgesAndAllowed = !areOnlyNodes && areOnlyEdges && this.parent.allowEdits(Edit.EDGE_COLORS);
        let nodesEdgesSameColorsAndAllowed = areSameColors && this.parent.allowEdits(Edit.VERTEX_COLORS) &&
            this.parent.allowEdits(Edit.EDGE_COLORS);
        if (colors && (areOnlyNodesAndAllowed || areOnlyEdgesAndAllowed || nodesEdgesSameColorsAndAllowed)) {
            // Create the color dropdown menu
            let faIcons = []; // A variable denoting, for each node color: {typeOfIcon, iconColor}
            for (let i = 0; i < colors.length; i++) {
                if (colors[i] === util.Color.WHITE) {
                    faIcons.push({icon: 'fa-circle-thin', color: util.colors[util.Color.BLACK]});
                } else {
                    faIcons.push({icon: 'fa-circle', color: util.colors[colors[i]]});
                }
            }

            let colorDropdown = new elements.Dropdown(this, this.toolbarMiddlePart,
                    'Color', colors, faIcons, this.onClickColorDropdown);
            colorDropdown.create();
            this.middleInput['color'] = colorDropdown;
            this.middleInput['color'].setInitialFieldValue(selectedObjects);
        }

        let allow_vertex_labels = !(areOnlyNodes && !this.parent.allowEdits(Edit.VERTEX_LABELS));
        let allow_edge_labels = !(areOnlyEdges && !this.parent.allowEdits(Edit.EDGE_LABELS));
        if (selectedObjects.length === 1 && !(selectedObjects[0] instanceof elements.StartLink ||
            (selectedObjects[0] instanceof elements.Link
                && this.parent.isType(Type.PETRI))) && allow_vertex_labels && allow_edge_labels) {
            // Create the label textfield
            let labelTextField = new elements.TextField(this, this.toolbarMiddlePart,
                8, 'Label', this.onInteractLabelTextField, this.onFocusInLabelTextfield, this.onFocusOutLabelTextfield);
            labelTextField.create();
            this.middleInput['label'] = labelTextField;

            // Fill the value of the label text field according to the selected object
            let labelInput = this.middleInput['label'].object[0].children[0].children[0];
            labelInput.value = selectedObjects[0].text;

        } else if (selectedObjects.length === 1 && selectedObjects[0] instanceof elements.Link && this.parent.isType(Type.PETRI)
            && allow_edge_labels) {
            // Create the spinner to set the label
            let min = this.parent.NUMBER_TOKENS_INPUT_RANGE.min;
            let max = this.parent.NUMBER_TOKENS_INPUT_RANGE.max;
            let labelInputField = new elements.NumberInputField(this, this.toolbarMiddlePart,
                45, this.buttonSize.h, min, max, 'PetriLinkLable', 'Label:', 'Edge label',
                this.onEnterPetriLinkLabelInput);
            labelInputField.create();
            this.middleInput['label'] = labelInputField;

            // Set the value of the number input field, or an empty value
            let labelNumber = Number(selectedObjects[0].text);
            $(this.middleInput['label'].object)[0].childNodes[1].value = (labelNumber !== 0)? labelNumber : '';
        }

        // For the highlight checkbox, do the following
        // Check whether the selection contains nodes or links (or both). Also check the number of objects which
        // have the ability to be highlighted
        let containsVertices = false;
        let containsEdges = false;
        let nrOfPotentialObjects = 0;
        for (let i = 0; i < selectedObjects.length; i++) {
            if (selectedObjects[i] instanceof elements.Node) {
                containsVertices = true;
                if (this.parent.templateParams.highlight_vertices) {
                    nrOfPotentialObjects++;
                }
            } else if (selectedObjects[i] instanceof elements.Link ||
                selectedObjects[i] instanceof elements.SelfLink ||
                selectedObjects[i] instanceof elements.StartLink) {
                containsEdges = true;
                if (this.parent.templateParams.highlight_edges) {
                    nrOfPotentialObjects++;
                }
            }
        }

        if (!((!this.parent.templateParams.highlight_vertices && containsVertices) ||
            (!this.parent.templateParams.highlight_edges && containsEdges))) {
            // Create the highlight checkbox
            let highlightCheckbox = new elements.Checkbox(this, this.toolbarMiddlePart, elements.CheckboxType.HIGHLIGHT,
                'Highlight', this.onClickHighlightCheckbox);
            highlightCheckbox.create();

            // Find out the number of highlighted objects, from the current selection
            let nrOfHighlightedObjects = 0;
            for (let i = 0; i < selectedObjects.length; i++) {
                if (selectedObjects[i].isHighlighted) {
                    nrOfHighlightedObjects++;
                }
            }

            // Fill the value of the highlight checkbox according to the selected objects
            highlightCheckbox.setChecked(nrOfHighlightedObjects, nrOfPotentialObjects);
            this.middleInput['highlight'] = highlightCheckbox;
        }
    };

    GraphToolbar.prototype.removeSelectionOptions = function() {
        if (this.middleInput['color']) {
            this.middleInput['color'].end();
            $(this.middleInput['color'].object).remove();
        }
        this.middleInput['color'] = null;

        if (this.middleInput['label']) {
            this.middleInput['label'].end();
            $(this.middleInput['label'].object).remove();
        }
        this.middleInput['label'] = null;

        if (this.middleInput['highlight']) {
            this.middleInput['highlight'].end();
            $(this.middleInput['highlight'].object).remove();
        }
        this.middleInput['highlight'] = null;
    };

    GraphToolbar.prototype.onClickColorDropdown = function(event) {
        // Set the color of the selected objects
        for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
            this.toolbar.parent.selectedObjects[i].colorObject = util.colors[this.dropDownOptions[$(event.target).index()]];
        }

        // Display the colored icon and text in the dropdownFieldElement
        this.toolbar.middleInput['color'].displayInDropdownField(event.target);

        this.toolbar.parent.onGraphChange();
    };

    GraphToolbar.prototype.onInteractLabelTextField = function(event, labelObject, toolbar) {
        if (event instanceof KeyboardEvent) {
            if (event.key === 'Enter') {
                // Set the focus to be the graph canvas when the enter button is pressed
                $(toolbar.parent.graphCanvas.canvas).focus();
            } else if (event.key === 'Escape') {
                // Also set focus, and deselect the objects
                $(toolbar.parent.graphCanvas.canvas).focus();
                toolbar.parent.selectedObjects = [];
            } else if (event.key === 'Control' && toolbar.parent.allowEdits(Edit.ADD)) {
                // Also set focus, and activate temporary draw mode if draw mode is not active already
                if (toolbar.parent.uiMode !== elements.ModeType.DRAW) {
                    toolbar.parent.enableTemporaryDrawMode();
                }
            }
        } else if (event instanceof InputEvent) {
            // Add or remove character(s) to the label of the only selected object (i.e. node or link)
            // This function is only called when there is 1 selected object
            let selectedObject = toolbar.parent.selectedObjects[0];
            selectedObject.text = event.target.value;
        }
        toolbar.parent.draw();
    };

    GraphToolbar.prototype.onFocusInLabelTextfield = function(textfieldObject, event) {
        // Save the value of the label, upon selecting (focussing) it
        textfieldObject.labelOnFocusIn = event.target.value;
    };

    GraphToolbar.prototype.onFocusOutLabelTextfield = function(textfieldObject, event) {
        // If the label has changed, between the selecting and deselecting the label (focussing), update the graph stack
        if (event.target.value !== textfieldObject.labelOnFocusIn) {
            this.toolbar.parent.onGraphChange();
        }
    };

    GraphToolbar.prototype.onEnterPetriLinkLabelInput = function(event) {
        if (event instanceof InputEvent) {
            // Determine the token value
            let min = this.minValue;
            let max = this.maxValue;
            let labelValue = event.target.valueAsNumber;
            if (isNaN(event.target.valueAsNumber) || event.target.valueAsNumber <= min) {
                labelValue = min;
                if (min === 0) {
                    labelValue = '';
                }
            } else if (event.target.valueAsNumber > max) {
                // Set to 100
                labelValue = max;
            }

            // As only 1 object is selected when filling in a label, change the label in the object
            this.toolbar.parent.selectedObjects[0].text = labelValue.toString();

            // Furthermore, if the value is 0, display it as an empty string '', to easily be able to edit it
            $(this.toolbar.middleInput['label'].object)[0].childNodes[1].value = labelValue;

            this.toolbar.parent.onGraphChange();
        } else if (event instanceof KeyboardEvent) {
            if (event.key === 'Enter') {
                // Set the focus to be the graph canvas when the enter button is pressed
                $(this.toolbar.parent.graphCanvas.canvas).focus();
            } else if (event.key === 'Escape') {
                // Also set focus, and deselect the objects
                $(this.toolbar.parent.graphCanvas.canvas).focus();
                this.toolbar.parent.selectedObjects = [];
            } else if (event.key === 'Control' && this.toolbar.parent.allowEdits(Edit.ADD)) {
                // Also set focus, and activate temporary draw mode if draw mode is not active already
                if (this.toolbar.parent.uiMode !== elements.ModeType.DRAW) {
                    this.toolbar.parent.enableTemporaryDrawMode();
                }
            }
        }

        // Draw the new label
        this.toolbar.parent.draw();
    };

    GraphToolbar.prototype.onClickHighlightCheckbox = function(event) {
        // Variables to denoting the state before incorporating the change made by this function
        let areAllHighlighted = true;
        for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
            if (!this.toolbar.parent.selectedObjects[i].isHighlighted) {
                areAllHighlighted = false;
            }
        }
        for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
            if (!areAllHighlighted) {
                this.toolbar.parent.selectedObjects[i].isHighlighted = true;
                // Enable the check
                event.target.checked = true;
            } else {
                this.toolbar.parent.selectedObjects[i].isHighlighted = false;
            }
        }

        // Set black tick mark
        event.target.nextElementSibling.classList.remove('toolbar_checkbox_gray');
        event.target.nextElementSibling.classList.add('toolbar_checkbox_black');

        this.toolbar.parent.onGraphChange();

        this.toolbar.parent.draw();
    };

    GraphToolbar.prototype.addFSMNodeSelectionOptions = function(selectedObjects) {
        // Clear the selection options, and re-add them below
        this.removeFSMNodeSelectionOptions();

        if (!this.parent.allowEdits(Edit.FSM_FLAGS)) {
            return;
        }

        // Count the number of initial and final vertices
        let numberOfVertices = 0, numberOfInitialVertices = 0, numberOfFinalVertices = 0;
        for (let i = 0; i < selectedObjects.length; i++) {
            if (selectedObjects[i] instanceof elements.Node) {
                if (selectedObjects[i].hasStartLink(this.parent.links)) {
                    numberOfInitialVertices++;
                }
                if (selectedObjects[i].isFinal) {
                    numberOfFinalVertices++;
                }
                numberOfVertices++;
            }
        }

        if (numberOfVertices === 0) {
            return;
        }

        // Create the FSM initial checkbox
        let fsmInitialCheckbox = new elements.Checkbox(
            this, this.toolbarMiddlePart, elements.CheckboxType.FSM_INITIAL, 'Initial',
            this.onClickFSMInitialCheckbox);
        fsmInitialCheckbox.create();

        // Set the initial checkbox value accordingly (in case it was pressed before) and save it
        fsmInitialCheckbox.setChecked(numberOfInitialVertices, numberOfVertices);
        this.middleInput['initial'] = fsmInitialCheckbox;

        // Create the FSM final checkbox
        let fsmFinalCheckbox = new elements.Checkbox(
            this, this.toolbarMiddlePart, elements.CheckboxType.FSM_FINAL, 'Final',
            this.onClickFSMFinalCheckbox);
        fsmFinalCheckbox.create();

        // Set the final checkbox value accordingly (in case it was pressed before) and save it
        fsmFinalCheckbox.setChecked(numberOfFinalVertices, numberOfVertices);
        this.middleInput['final'] = fsmFinalCheckbox;
    };

    GraphToolbar.prototype.removeFSMNodeSelectionOptions = function() {
        // Remove the FSM initial checkboxes if they are present
        if (this.middleInput['initial']) {
            this.middleInput['initial'].end();
            $(this.middleInput['initial'].object).remove();
        }
        this.middleInput['initial'] = null;

        if (this.middleInput['final']) {
            this.middleInput['final'].end();
            $(this.middleInput['final'].object).remove();
        }
        this.middleInput['final'] = null;
    };

    GraphToolbar.prototype.addPetriNodeTypeOptions = function() {
        // Clear the existing petri node type options, and re-add them below
        this.removePetriNodeTypeOptions();

        if (this.parent.allowEdits(Edit.ADD)) {
            // Create the transition PetriNodeType button
            let petriNodeTypeTransitionButton = new elements.PetriNodeTypeButton(this, this.toolbarMiddlePart,
                this.buttonSize.w, this.buttonSize.h, 'fa-square-o', 'Petri net transition', elements.PetriNodeType.TRANSITION,
                this.onClickPetriNodeTypeButton);
            petriNodeTypeTransitionButton.create();
            petriNodeTypeTransitionButton.setDeselected();
            this.middleInput['transition'] = petriNodeTypeTransitionButton;

            // Create the place PetriNodeType button
            let petriNodeTypePlaceButton = new elements.PetriNodeTypeButton(this, this.toolbarMiddlePart,
                this.buttonSize.w, this.buttonSize.h, 'fa-circle-o', 'Petri net place', elements.PetriNodeType.PLACE,
                this.onClickPetriNodeTypeButton);
            petriNodeTypePlaceButton.create();
            petriNodeTypePlaceButton.setSelected();
            this.middleInput['place'] = petriNodeTypePlaceButton;

            // Reset the active petri node type to be 'Place'
            this.parent.petriNodeType = elements.PetriNodeType.PLACE;
        }
    };

    GraphToolbar.prototype.removePetriNodeTypeOptions = function() {
        // Remove the PetriNodeType buttons if they are present
        if (this.middleInput['place']) {
            this.middleInput['place'].end();
            $(this.middleInput['place'].object).remove();
        }
        this.middleInput['place'] = null;

        if (this.middleInput['transition']) {
            this.middleInput['transition'].end();
            $(this.middleInput['transition'].object).remove();
        }
        this.middleInput['transition'] = null;
    };

    GraphToolbar.prototype.addPetriSelectionOptions = function(selectedObjects) {
        // Remove any fields if present
        this.removePetriSelectionOptions();

        // Only add the petri place selection options (e.g. the token input field) when at least 1 place
        // node is selected, and when no transition nodes are selected
        // The listSelectedPlaces variable is also later used to set the token field
        let listSelectedPlaces = [];
        let areTransitionsSelected = false;
        for (let i = 0; i < selectedObjects.length; i++) {
            if (selectedObjects[i] instanceof elements.Node &&
                selectedObjects[i].petriNodeType === elements.PetriNodeType.PLACE) {
                listSelectedPlaces.push(selectedObjects[i]);
            }
            if (selectedObjects[i] instanceof elements.Node &&
                selectedObjects[i].petriNodeType === elements.PetriNodeType.TRANSITION) {
                areTransitionsSelected = true;
            }
        }
        if (!(listSelectedPlaces.length && !areTransitionsSelected)) {
            return;
        }

        if (selectedObjects.length && this.parent.allowEdits(Edit.PETRI_MARKING)) {
            let min = this.parent.NUMBER_TOKENS_INPUT_RANGE.min;
            let max = this.parent.NUMBER_TOKENS_INPUT_RANGE.max;
            let tokenInputField = new elements.NumberInputField(this, this.toolbarMiddlePart,
                45, this.buttonSize.h, min, max, 'PetriToken', 'Tokens:', 'Number of tokens (' + min + '-' + max + ')',
                this.onEnterPetriTokenInput);
            tokenInputField.create();
            this.middleInput['tokens'] = tokenInputField;

            // Set the value of the number input field depending on the selected object
            if (listSelectedPlaces.length === 1) {
                // Set the value of the only selected node object
                $(this.middleInput['tokens'].object)[0].childNodes[1].value = listSelectedPlaces[0].petriTokens;
            } else {
                // In case of listSelectedPlaces >= 2
                // Set the value to be empty if the token values do not correspond. Otherwise set it to the value
                let areTokenValuesEqual = true;
                for (let i = 0; i < listSelectedPlaces.length - 1; i++) {
                    if (listSelectedPlaces[i].petriTokens !== listSelectedPlaces[i + 1].petriTokens) {
                        areTokenValuesEqual = false;
                    }
                }
                $(this.middleInput['tokens'].object)[0].childNodes[1].value =
                    (areTokenValuesEqual)? listSelectedPlaces[0].petriTokens : '';
            }
        }
    };

    GraphToolbar.prototype.removePetriSelectionOptions = function() {
        if (this.middleInput['tokens']) {
            // Remove the input field from the DOM
            this.middleInput['tokens'].end();
            $(this.middleInput['tokens'].object).remove();
        }
        this.middleInput['tokens'] = null;
    };

    GraphToolbar.prototype.onEnterPetriTokenInput = function(event) {
        // Determine the token value
        let min = this.minValue;
        let max = this.maxValue;
        let tokenValue;
        if (isNaN(event.target.valueAsNumber) || event.target.valueAsNumber < min) {
            tokenValue = min;
        } else if (event.target.valueAsNumber > max) {
            // Set to 100
            tokenValue = max;
        } else {
            // Set to the value
            tokenValue = event.target.valueAsNumber;
        }

        // Set the token value in all objects which are place nodes
        for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
            let object = this.toolbar.parent.selectedObjects[i];
            if (object instanceof elements.Node &&
                object.petriNodeType === elements.PetriNodeType.PLACE) {
                // Set the value
                object.petriTokens = tokenValue;
            }
        }

        // If some pre-defined buttons are pressed, execute different actions
        if (event instanceof KeyboardEvent) {
            if (event.key === 'Enter') {
                // Set the focus to be the graph canvas when the enter button is pressed
                $(this.toolbar.parent.graphCanvas.canvas).focus();
            } else if (event.key === 'Escape') {
                // Also set focus, and deselect the objects
                $(this.toolbar.parent.graphCanvas.canvas).focus();
                this.toolbar.parent.selectedObjects = [];
            } else if (event.key === 'Control' && this.toolbar.parent.allowEdits(Edit.ADD)) {
                // Also set focus, and activate temporary draw mode if draw mode is not active already
                $(this.toolbar.parent.graphCanvas.canvas).focus();
                if (this.toolbar.parent.uiMode !== elements.ModeType.DRAW) {
                    this.toolbar.parent.enableTemporaryDrawMode();
                }
            }
        } else {
            this.toolbar.parent.onGraphChange();
        }

        // Draw the number of tokens
        this.toolbar.parent.draw();
    };

    GraphToolbar.prototype.onClickFSMInitialCheckbox = function(event) {
        if (!this.toolbar.parent.isType(Type.FSM)) {
            return;
        }

        if (event.target.checked) {
            for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
                let vertex = this.toolbar.parent.selectedObjects[i];
                this.toolbar.parent.setInitialFSMVertex(vertex);
            }
            // Set the styling of the checkbox
            event.target.nextElementSibling.classList.remove('toolbar_checkbox_gray');
            event.target.nextElementSibling.classList.add('toolbar_checkbox_black');
        } else {
            //TODO: Possibly fix for cases where there must be an initial vertex, depending on the input parameter
            if (event.target.nextElementSibling.classList.contains('toolbar_checkbox_gray')) {
                // If a gray checkmark was just clicked, set this the checkbox to check and create a black checkmark
                event.target.checked = true;
                event.target.nextElementSibling.classList.remove('toolbar_checkbox_gray');
                event.target.nextElementSibling.classList.add('toolbar_checkbox_black');

                // Remove all start links from the selected objects and create new ones
                for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
                    let vertex = this.toolbar.parent.selectedObjects[i];
                    this.toolbar.parent.removeInitialFSMVertex(vertex);
                    this.toolbar.parent.setInitialFSMVertex(vertex);
                }
            } else {
                for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
                    let vertex = this.toolbar.parent.selectedObjects[i];
                    this.toolbar.parent.removeInitialFSMVertex(vertex);
                }
            }
        }

        this.toolbar.parent.onGraphChange();

        this.toolbar.parent.draw();
    };

    GraphToolbar.prototype.onClickFSMFinalCheckbox = function(event) {
        if (this.toolbar.parent.isType(Type.FSM)) {
            // Variables to denoting the state before incorporating the change made by this function
            let areAllNodesFinal = true;
            for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
                if (this.toolbar.parent.selectedObjects[i] instanceof elements.Node) {
                    if (!this.toolbar.parent.selectedObjects[i].isFinal) {
                        areAllNodesFinal = false;
                    }
                }
            }
            for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
                if (this.toolbar.parent.selectedObjects[i] instanceof elements.Node) {
                    if (!areAllNodesFinal) {
                        this.toolbar.parent.selectedObjects[i].isFinal = true;
                        // Enable the check
                        event.target.checked = true;
                    } else {
                        this.toolbar.parent.selectedObjects[i].isFinal = false;
                    }
                }
            }

            // Set black tick mark
            event.target.nextElementSibling.classList.remove('toolbar_checkbox_gray');
            event.target.nextElementSibling.classList.add('toolbar_checkbox_black');
        }

        this.toolbar.parent.onGraphChange();

        this.toolbar.parent.draw();
    };

    GraphToolbar.prototype.onClickPetriNodeTypeButton = function(object) {
        // Set the button to selected (in case it was not already), and set the other button to deselected.
        // Furthermore, set the petriNodeType of the graphUI
        let clickedButton = null;
        let otherButton = null;
        let tb = object.toolbar;
        if (tb.middleInput['place'] === object) {
            clickedButton = tb.middleInput['place'];
            otherButton = tb.middleInput['transition'];
        } else if (tb.middleInput['transition'] === object) {
            clickedButton = tb.middleInput['transition'];
            otherButton = tb.middleInput['place'];
        } else {
            return;
        }

        tb.parent.petriNodeType = clickedButton.petriNodeType;
        clickedButton.setSelected();
        otherButton.setDeselected();

    };

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
        this.DEFAULT_FONT_SIZE = 20;    // px. Template parameter fontsize can override this.
        this.TOOLBAR_HEIGHT = 42.75;       // px. The height of the toolbar above the graphCanvas
        this.NUMBER_TOKENS_INPUT_RANGE = {  // The range (inclusive) for entering the number of tokens for petri nets
            min: 0,
            max: 100,
        };       //TODO: assure that these values are met when saving (double check).
                 //if > 100, set to 100. If <0 or a char, set to 0
        this.INITIAL_FSM_NODE_LINK_LENGTH = 25; //px. The length of the initial FSM node's incoming link
        this.MAX_UNDO_REDO = 100; // The maximum number of undo-redo comands the user can issue

        this.canvasId = 'graphcanvas_' + textareaId;
        this.textArea = $(document.getElementById(textareaId));
        this.uiMode = elements.ModeType.SELECT; // Set the UI mode to be 'Select' initially
        this.isTempDrawModeActive = false;
        this.petriNodeType = elements.PetriNodeType.NONE;
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
            this.toolbar = new GraphToolbar(this, this.toolbarId, width, this.TOOLBAR_HEIGHT,
                this.uiMode, this.helpOverlay);
        }

        // The div that contains the entire graph UI (i.e. the toolbar, graph, and help overlay)
        this.containerDiv = $(document.createElement('div'));
        $(this.containerDiv).addClass('graph_ui_container_div');

        this.nodes = [];
        this.links = [];
        this.selectedObjects = []; // One or more elements.Link or elements.Node objects. Default: empty array
        this.previousSelectedObjects = []; // Same as selectedObjects, but previous selected ones
        this.clickedObject = null; // The last manually clicked object
        this.selectionRectangle = null; // The top-left/bottom-right corners of the selection rectangle,
        // used in the form [{x: null, y: null}, {x: null, y: null}]
        this.selectionRectangleOffset = 0; // Used for animating the border of the rectangle (marching ants)
        this.currentLink = null;
        this.mousePosition = null; // A variable to denote the position of the mouse on the canvas.
        // Format: {x: numbe, y: numbe}
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

        if (this.uiMode === elements.ModeType.DRAW) {
            // Deselect all selected objects
            this.selectedObjects = [];

            // Disable the delete button
            if (this.allowEdits(Edit.DELETE)) {
                this.toolbar.rightButtons['delete'].setDisabled();
            }

            // If the graph type is Petri net
            if (this.isType(Type.PETRI)) {
                this.toolbar.addPetriNodeTypeOptions();
            }

            // Style the buttons correctly
            this.toolbar.leftButtons['draw'].setSelected();
            this.toolbar.leftButtons['select'].setDeselected();
        } else if (this.uiMode === elements.ModeType.SELECT) {
            if (this.isType(Type.PETRI)) {
                this.toolbar.removePetriNodeTypeOptions();
            }

            // Style the buttons correctly
            this.toolbar.leftButtons['draw'].setDeselected();
            this.toolbar.leftButtons['select'].setSelected();
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
                Object.values(Edit).includes(editsArray[i]) &&
                allowed_edits.includes(editsArray[i]))) {
                return false;
            }
        }

        return true;
    };

    // This function returns whether the graph allows at least one edit (true) or not (false)
    Graph.prototype.allowsOneEdit = function() {
        for (let i = 0; i < Object.values(Edit).length; i++) {
            let edit = Object.values(Edit)[i];
            if (this.allowEdits(edit)) {
                return true;
            }
        }

        return false;
    };

    // Create the help text to be displayed. This depends on the type of the graph (FSM, Petri net, etc.)
    Graph.prototype.getHelpText = function() {
        // Create the first part of the help text
        let introductoryText = "<div class='dialog-header'>Graph Help</div>"
            + "<p>To enter your answer as a graph, you can use Select mode (to edit existing nodes/edges) "
            + "and Draw mode (to draw new nodes/edges).</p>"
            + "<p>Toggle between the modes by clicking "
            + "<i class=\"fa fa-mouse-pointer\"></i>"
            + " and "
            + "<i class=\"fa fa-pencil\"></i>. "
            + "Additionally, while in Select mode you can temporarily use Draw mode "
            + "by pressing the Ctrl key.</p>";

        // Create the help text for the select mode
        let selectModeText = "<div class='dialog-section'>Select mode:</div>"
            + "<ul class='dialog-help'>"
            + "<li><b>Select node:</b> &nbsp;Click a node. Dragging it moves the node.</li>"
            + "<li><b>Select edge:</b> &nbsp;Click an edge. Dragging it changes the arc curvature.</li>"
            + "<li><b>Edit node/edge label:</b> &nbsp;Select a node/edge and edit the label text field "
            + "in the toolbar. You can add a one-character subscript by adding an underscore followed "
            + "by the subscript (i.e., a_1). You can type Greek letters using a backslash followed by "
            + "the letter name (i.e., \\alpha).</li>"
            + "<li><b>Delete node/edge:</b> &nbsp;Select a node/edge and click "
            + "<i class=\"fa fa-trash\"></i>, or press the 'Delete' (Windows / Linux) or 'Fn-Delete' (Mac) key.</li>";

        if (this.isType(Type.FSM)) {
            // If the current graph type is FSM, add specific help for FSMs
            selectModeText += "<li><b>Mark node as initial or final state:</b> &nbsp;"
                + "Select a node to show the corresponding checkboxes.</li>";
        }
        selectModeText += "</ul><br>";

        // Create the help text for the draw mode
        let drawModeText = "<div class='dialog-section'>Draw mode:</div>"
            + "<ul class='dialog-help'>"
            + "<li><b>Create new node:</b> &nbsp;Click on an empty space.</li>"
            + "<li><b>Create new edge:</b> &nbsp;Click on a node and drag to another node.</li>"
            + "<li><b>Create self-loop:</b> &nbsp;Click on a node and drag to the same node.</li>"
            + "</ul>";

        // Return the concatenation
        return introductoryText + selectModeText + drawModeText;
    };

    // Draw an arrow head if this is a directed graph. Otherwise do nothing.
    Graph.prototype.arrowIfReqd = function(c, x, y, angle) {
        if (this.isType(Type.DIRECTED) || this.isType(Type.FSM) || this.isType(Type.PETRI)) {
            util.drawArrow(c, x, y, angle);
        }
    };

    Graph.prototype.enableTemporaryDrawMode = function() {
        if (this.allowEdits(Edit.ADD)) {
            // Assign the latest selected object
            this.previousSelectedObjects = this.selectedObjects;

            // Set the mode to Draw
            this.setUIMode(elements.ModeType.DRAW);
            this.selectedObjects = this.previousSelectedObjects; // Re-add the selected objects
            this.isTempDrawModeActive = true;
        }
    };

    Graph.prototype.disableTemporaryDrawMode = function() {
        if (this.allowEdits(Edit.ADD)) {
            // A variable denoting whether the label input has focus or not
            let hasLabelFocus = false;
            let label = this.toolbar.middleInput['label'];
            let inputElement = null;
            if (label && label instanceof elements.TextField) {
                inputElement = label.object[0].childNodes[1].childNodes[0];
                hasLabelFocus = $(inputElement).is(":focus");
            } else if (label && label instanceof elements.NumberInputField) {
                inputElement = label.object[0].childNodes[1];
                hasLabelFocus = $(inputElement).is(":focus");
            }

            // Set the UI mode, and set the selected objects
            this.setUIMode(elements.ModeType.SELECT);
            this.selectedObjects = this.previousSelectedObjects;
            this.isTempDrawModeActive = false;

            // Enable the delete button if something is selected
            if (this.allowEdits(Edit.DELETE) && this.selectedObjects.length) {
                this.toolbar.rightButtons['delete'].setEnabled();
            }

            // Set the label focus for Petri net graphs
            if (this.isType(Type.PETRI) && hasLabelFocus) {
                // If the element was previously focused on, re-add the focus
                this.focusElement(inputElement);
            }
            this.draw();
        }
    };

    // Copy the serialised version of the graph to the TextArea.
    Graph.prototype.sync = function() {
        // Nothing to do ... always sync'd.
    };

    Graph.prototype.focusElement = function(element) {
        // Applying a focus with a short unnoticable delay works. Directly applying without delay does not work
        setTimeout(function () {
            if (element) {
                $(element).focus();
            }
        },0);
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
        //TODO: test all functionality out with lock nodes, I assume these are nodes that cannot be moved/edited?
        var mouse = util.mousePos(e);

        if (this.readOnly) {
            return;
        }

        this.clickedObject = this.getMouseOverObject(mouse.x, mouse.y, true);
        this.canMoveObjects = false;

        // Check whether the click is a left mouse click
        if (e.button === 0) {
            // Depending on the mode, perform different tasks
            if (this.uiMode === elements.ModeType.DRAW) {
                if (!this.clickedObject && !this.currentLink && this.allowEdits(Edit.ADD)) {
                    // Draw a node
                    let newNode = new elements.Node(this, mouse.x, mouse.y);
                    if (this.isType(Type.PETRI)) { // Consider the node a place if it is a petri net
                        newNode.petriNodeType = this.petriNodeType;
                    }
                    this.nodes.push(newNode);

                    // Set as initial node if it is the first node, and if the type is FSM
                    if (this.nodes.length === 1 && this.isType(Type.FSM)) {
                        this.setInitialFSMVertex(newNode);
                    }

                    // Set this node as the only selected object, so it shows a blue outline
                    this.selectedObjects = [newNode];
                    this.previousSelectedObjects = this.selectedObjects;

                    // Also enable the editing fields
                    this.toolbar.addSelectionOptions(this.selectedObjects);
                    if (this.allowEdits(Edit.DELETE)) {
                        this.toolbar.rightButtons['delete'].setEnabled();
                    }
                    if (this.isType(Type.FSM)) {
                        this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
                    }
                    if (this.isType(Type.PETRI)) {
                        this.toolbar.addPetriSelectionOptions(this.selectedObjects);
                    }
                    this.onGraphChange();
                }

            } else if (this.uiMode === elements.ModeType.SELECT) {
                if (e.shiftKey) {
                    if (this.clickedObject) {
                        if (!this.selectedObjects.includes(this.clickedObject)) {
                            // Add to selection
                            this.selectedObjects.push(this.clickedObject);
                        } else {
                            // Remove from selection
                            this.selectedObjects = this.selectedObjects.filter(e => e !== this.clickedObject);
                        }
                    }
                } else if (!e.shiftKey) {
                    if (!this.selectedObjects.includes(this.clickedObject)) {
                        // Set this object as the only selected if it was not selected yet
                        this.selectedObjects = (this.clickedObject) ? [this.clickedObject] : [];
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
                if (this.isType(Type.FSM)) {
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
                if (this.isType(Type.PETRI)) {
                    if (this.selectedObjects.length) {
                        this.toolbar.addPetriSelectionOptions(this.selectedObjects);
                    } else {
                        this.toolbar.removePetriSelectionOptions();
                    }
                }

                if (!(this.templateParams.locknodes && this.clickedObject instanceof elements.Node)
                    && !(this.templateParams.lockedges && this.clickedObject instanceof elements.Link)) {
                    this.canMoveObjects = true;
                    for (let i = 0; i < this.selectedObjects.length; i++) {
                        let object = this.selectedObjects[i];
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
                    if (this.allowEdits(Edit.DELETE)) {
                        this.toolbar.rightButtons['delete'].setEnabled();
                    }
                } else {
                    if (this.allowEdits(Edit.DELETE)) {
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

        if (key === 8) { // Backspace key.
            // Backspace is a shortcut for the back button, but do NOT want to change pages.
            return false;
        } else if (key === 46) { // Delete key.
            if (this.allowEdits(Edit.DELETE)) {
                this.deleteSelectedObjects(this);
            }
        } else if (key === 27) { // Escape key.
            // Deselect the objects
            this.selectedObjects = [];
            this.draw();
        }

        if (key === 17) { // Control key

            // Set the mode to Draw if it is not set already, and if drawing (i.e. adding) is allowed
            if (this.uiMode !== elements.ModeType.DRAW && this.allowEdits(Edit.ADD)) {
                this.enableTemporaryDrawMode();
            }
        }

        // If an object, having a label or token input field, is selected in SELECT mode, and the user presses a key
        // which produces a character, then focus the input field and add the typed character to the input field.
        // This enables the delete key to delete the item, instead of deleting the input field text
        // Furthermore, also check if the control key is not pressed, to still enable keyboad-control actions
        let specialDoubleCharacters = ['``', '~~', '\'\'', '^^', '""']; // Typed 'characters' which are not of length 1
        if ((e.key.length === 1 || specialDoubleCharacters.includes(e.key)) && !e.originalEvent.ctrlKey) {
            let inputField = this.toolbar.middleInput['label']; //TODO: number input field
            if (inputField) {
                let element = inputField.object[0].childNodes[1].childNodes[0];

                // Add the typed character to the input field and to the object's label
                element.value += e.key;
                this.selectedObjects[0].text += e.key; // There is only one selected object if there is a label
            }
        }
    };

    Graph.prototype.keyup = function(e) {
        var key = util.crossBrowserKey(e);

        if (this.readOnly) {
            return;
        }

        if (key === 17) { // Control key
            // Set the mode to SELECT if it is not set already
            if (this.uiMode !== elements.ModeType.SELECT && this.isTempDrawModeActive) {
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
        // Setting h to h-7, in order to not make the canvas change size when the help button is pressed (which causes
        // the screen to resize). TODO: not sure why this happens, but -7 seems to fix it
        let isToolbarNull = this.toolbar === null;
        let additionalHeight = 0;
        if (isToolbarNull) {
            additionalHeight += this.TOOLBAR_HEIGHT;
        }

        // Resize the canvas (possibly with additional height if there is no toolbar) and the toolbar (possibly)
        this.graphCanvas.resize(w, h-7 + additionalHeight);
        if (!isToolbarNull) {
            this.toolbar.resize(w, this.TOOLBAR_HEIGHT);
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
        if (this.uiMode === elements.ModeType.DRAW) {
            if (this.clickedObject instanceof elements.Node && this.allowEdits(Edit.ADD)) {
                let targetNode = this.getMouseOverObject(mouse.x, mouse.y, true);
                let targetNodeStrict = this.getMouseOverObject(mouse.x, mouse.y, false);
                if(!(targetNode instanceof elements.Node)) {
                    // If the target node is not a node (e.g. an edge) set it to null
                    targetNode = null;
                }

                // Depending on the mouse position, draw different kind of links
                if (targetNode === this.clickedObject && (this.isType(Type.DIRECTED) || this.isType(Type.FSM))) {
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
        } else if (this.uiMode === elements.ModeType.SELECT) {
            if (this.selectedObjects.length) {
                /*
                //TODO: remove this part? This was previous code
                if (this.movingGraph) {
                    var nodes = this.movingNodes;
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].trackMouse(mouse.x, mouse.y);
                        this.snapNode(nodes[i]);
                    }

                 */
                if (this.canMoveObjects && this.clickedObject) {
                    // Apply horizontal/vertical snapping to all selected objects if they align horizontally/vertically
                    let isAlignedHorizontally = true;
                    let isAlignedVertically = true;
                    for (let i = 0; i < this.selectedObjects.length - 1; i++) {
                        if (this.selectedObjects[i].x !== this.selectedObjects[i + 1].x) {
                            isAlignedVertically = false;
                        }
                        if (this.selectedObjects[i].y !== this.selectedObjects[i + 1].y) {
                            isAlignedHorizontally = false;
                        }
                    }

                    // Get all nodes that are not in the selectedObjects
                    let nodesSet = new Set(this.nodes);
                    let selectedObjectsSet = new Set(this.selectedObjects);
                    let nodesNotSelected = [...nodesSet].filter(x => !selectedObjectsSet.has(x));

                    if (this.allowEdits(Edit.MOVE)) {
                        for (let i = 0; i < this.selectedObjects.length; i++) {
                            let object = this.selectedObjects[i];
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
                                    this.selectedObjects = [this.clickedObject];
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
            if (!(this.currentLink instanceof elements.TemporaryLink) && this.allowEdits(Edit.ADD)) {
                // Remove the created link if the graph is of type 'Petri' and a link is made to a node of the same
                // Petri type (e.g. place->place, or transition->transition).
                // Also display a warning in the form of an alert
                let node;
                if (this.currentLink instanceof elements.SelfLink) {
                    node = this.currentLink.node;
                } else {
                    node = this.currentLink.nodeA;
                }
                if (this.isType(Type.PETRI) && node.petriNodeType === this.currentLink.nodeB.petriNodeType &&
                    this.currentLink.nodeA !== this.currentLink.nodeB) {
                    let nodeType = this.currentLink.nodeA.petriNodeType;
                    this.alertPopup('An edge between two ' + nodeType + 's of a Petri net is not permitted.');
                    return;
                } else if (this.isType(Type.UNDIRECTED)) {
                    // In case of an undirected graph, only 1 edge in between two nodes is permitted
                    for (let i = 0; i < this.links.length; i++) {
                        if ((this.links[i].nodeA === this.currentLink.nodeA && this.links[i].nodeB === this.currentLink.nodeB) ||
                            (this.links[i].nodeA === this.currentLink.nodeB && this.links[i].nodeB === this.currentLink.nodeA)) {
                            this.alertPopup('Two edges between two nodes is not permitted.');
                            return;
                        }
                    }
                } else if (this.isType(Type.DIRECTED) && !this.isType(Type.FSM) && !this.isType(Type.PETRI)) {
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
                if (this.isType(Type.FSM)) {
                    this.toolbar.removeFSMNodeSelectionOptions();
                }
                if (this.isType(Type.PETRI)) {
                    this.toolbar.removePetriNodeTypeOptions();
                    this.toolbar.removePetriSelectionOptions();
                }

                // Enable the editing fields
                this.toolbar.addSelectionOptions(this.selectedObjects);

                // Enable the delete button as well
                if (this.allowEdits(Edit.DELETE)) {
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
                if (this.allowEdits(Edit.DELETE)) {
                    this.toolbar.rightButtons['delete'].setEnabled();
                }
                if (this.isType(Type.FSM)) {
                    this.toolbar.addFSMNodeSelectionOptions(this.selectedObjects);
                }
                if (this.isType(Type.PETRI)) {
                    this.toolbar.addPetriSelectionOptions(this.selectedObjects);
                }
            }
            this.selectionRectangle = null;
        } else {

            // Save the graph when selected nodes and/or edges have moved
            let hasSelectionMoved = false;
            this.selectedObjects.forEach(element => {
                hasSelectionMoved = (element.hasMoved) ? true : hasSelectionMoved;
            });

            // Save a different graph state if applicable
            if (this.clickedObject && hasSelectionMoved) {
                this.onGraphChange();
            }

            // If none of the selected objects has moved, and shift is not pressed,
            // set the selected object to the clicked object. I.e., unselect all other selected objects
            if (this.clickedObject && !hasSelectionMoved && !e.shiftKey) {
                this.selectedObjects = [this.clickedObject];
            }

            // Reset the 'hasMoved' parameter of all selected objects
            this.selectedObjects.forEach(element => element.resetHasMoved());

            this.clickedObject = null;
            this.canMoveObjects = false;
            this.draw();
        }
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

    // This function returns all objects which are completely located in a rectangle
    // The input rectangle should be of the form: [{x: null, y: null}, {x: null, y: null}]
    Graph.prototype.getObjectsInRectangle = function(rect) {
        let objects = [];
        // Check all nodes
        for (let i = 0; i < this.nodes.length; i++) {
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
        if(graphUI.selectedObjects.length) {
            for(let i = 0; i < graphUI.nodes.length; i++) {
                if(graphUI.selectedObjects.includes(graphUI.nodes[i])) {
                    graphUI.nodes.splice(i--, 1);
                }
            }
            for(let i = 0; i < graphUI.links.length; i++) {
                if(graphUI.selectedObjects.includes(graphUI.links[i]) ||
                    graphUI.selectedObjects.includes(graphUI.links[i].node) ||
                    graphUI.selectedObjects.includes(graphUI.links[i].nodeA) ||
                    graphUI.selectedObjects.includes(graphUI.links[i].nodeB)) {
                    graphUI.links.splice(i--, 1);
                }
            }
            graphUI.selectedObjects = [];
            graphUI.previousSelectedObjects = [];
            graphUI.draw();

            // Set the deleted button as disabled
            if (graphUI.allowEdits(Edit.DELETE)) {
                graphUI.toolbar.rightButtons['delete'].setDisabled();
            }

            // Remove the options in the toolbar based on the selected object
            graphUI.toolbar.removeSelectionOptions();
            graphUI.toolbar.removeFSMNodeSelectionOptions();
            graphUI.toolbar.removePetriSelectionOptions();
        }
    };

    Graph.prototype.setInitialFSMVertex = function(vertex) {
        // TODO: use the input parameter to decide whether there is only 1 input vertex, or whether there can be any
        //  number of input vertices

        // Set the selected vertex as the initial vertex, and draw it
        if (this.isType(Type.FSM) && vertex instanceof elements.Node) {
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
                    node.text = inputNode['label'];
                    if (this.templateParams.vertex_colors) {
                        node.colorObject = util.colorObjectFromColorCode(inputNode['color']);
                    }
                    if (this.templateParams.highlight_vertices) {
                        node.isHighlighted = inputNode['highlighted'];
                    }
                    if (this.isType(Type.FSM)) {
                        node.isInitial = inputNode['initial'];
                        node.isFinal = inputNode['final'];
                    }
                    if (this.isType(Type.PETRI)) {
                        node.petriNodeType = inputNode['petri_type'];
                        if (inputNode['petri_type'] === elements.PetriNodeType.PLACE) {
                            node.petriTokens = inputNode['tokens'];
                        }
                    }
                    this.nodes.push(node);
                }

                for (i = 0; i < input.edges.length; i++) {
                    var inputLink = input.edges[i];
                    var link = null;

                    if(inputLink['from'] === inputLink['to']) {
                        // Self link has two identical nodes.
                        link = new elements.SelfLink(this, this.nodes[inputLink['from']]);
                        link.text = inputLink['label'];
                        link.colorObject = (this.templateParams.edge_colors) ?
                            util.colorObjectFromColorCode(inputLink['color']) : null;
                        link.isHighlighted = (this.templateParams.highlight_edges)? inputLink['highlighted'] : false;
                        link.anchorAngle = inputLink['bend']['anchorAngle'];
                    } else if(inputLink['from'] === -1) {
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
            };
            if (this.templateParams.vertex_colors) {
                vertex['color'] = node.colorObject.colorCode;
            }
            if (this.templateParams.highlight_vertices) {
                vertex['highlighted'] = node.isHighlighted;
            }
            if (this.isType(Type.FSM)) {
                vertex['initial'] = node.isInitial;
                vertex['final'] = node.isFinal;
            }
            if (this.isType(Type.PETRI)) {
                vertex['petri_type'] = node.petriNodeType;
                if (vertex['petri_type'] === elements.PetriNodeType.PLACE) {
                    vertex['tokens'] = node.petriTokens;
                }
            }
            output.vertices.push(vertex);
        }

        for (i = 0; i < this.links.length; i++) {
            var link = this.links[i];
            if(link instanceof elements.SelfLink) {
                let linkObject = {
                    'from': this.nodes.indexOf(link.node),
                    'to': this.nodes.indexOf(link.node),
                    'bend': {
                        'anchorAngle': link.anchorAngle
                    },
                    'label': link.text
                };
                if (this.templateParams.edge_colors) {
                    linkObject.color = link.colorObject.colorCode;
                }
                if (this.templateParams.highlight_edges) {
                    linkObject.highlighted = link.isHighlighted;
                }

                output.edges.push(linkObject);
            } else if(link instanceof elements.StartLink) {
                let linkObject = {
                    'from': -1,
                    'to': this.nodes.indexOf(link.node),
                    'bend': {
                        'deltaX': link.deltaX,
                        'deltaY': link.deltaY
                    }
                };
                if (this.templateParams.edge_colors) {
                    linkObject.color = link.colorObject.colorCode;
                }
                if (this.templateParams.highlight_edges) {
                    linkObject.highlighted = link.isHighlighted;
                }

                output.edges.push(linkObject);
            } else if(link instanceof elements.Link) {
                let linkObject = {
                    'from': this.nodes.indexOf(link.nodeA),
                    'to': this.nodes.indexOf(link.nodeB),
                    'bend': {
                        'lineAngleAdjust': link.lineAngleAdjust,
                        'parallelPart': link.parallelPart,
                        'perpendicularPart': link.perpendicularPart
                    },
                    'label': link.text
                };
                if (this.templateParams.edge_colors) {
                    linkObject.color = link.colorObject.colorCode;
                }
                if (this.templateParams.highlight_edges) {
                    linkObject.highlighted = link.isHighlighted;
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

        // use Segoe UI as that is the default Moodle font
        // (at least on Windows)
        c.font = this.fontSize() + 'px "Segoe UI"';

        // If draw mode is active and the user hovers over an empty area, draw a shadow node to indicate that the user
        // can create a node here
        if (this.uiMode === elements.ModeType.DRAW && this.mousePosition && !this.currentLink &&
            !this.getMouseOverObject(this.mousePosition.x, this.mousePosition.y, true) && this.allowEdits(Edit.ADD)) {

            // Create the shadow node and draw it
            let shadowNode = new elements.Node(this, this.mousePosition.x, this.mousePosition.y);
            if (this.isType(Type.PETRI) && this.petriNodeType === elements.PetriNodeType.TRANSITION) {
                shadowNode.petriNodeType = elements.PetriNodeType.TRANSITION;
            }
            shadowNode.draw(c, true, elements.DrawOption.HOVER);
        }

        // Draw all selections of the nodes, and links
        this.drawNodes(c, elements.DrawOption.SELECTION);
        this.drawLinks(c, elements.DrawOption.SELECTION);

        // Draw all highlights of the nodes and the nodes themselves, and links
        this.drawNodes(c, elements.DrawOption.OBJECT);
        this.drawLinks(c, elements.DrawOption.OBJECT);

        // Draw all nodes and links themselves
        //this.drawNodesAndLinks(c, elements.DrawOption.OBJECT);

        // Draw the current link
        if (this.currentLink) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = util.Color.BLACK;
            this.currentLink.draw(c, elements.DrawOption.OBJECT);
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
        if (!Object.values(elements.DrawOption).includes(drawOption)) {
            return;
        }

        // Draw the nodes with the draw option
        for (let i = 0; i < this.nodes.length; i++) {
            let drawNodeShadow = this.uiMode === elements.ModeType.DRAW && this.mousePosition &&
                this.getMouseOverNode(this.mousePosition.x, this.mousePosition.y, true) === this.nodes[i] &&
                this.allowEdits(Edit.ADD);
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

            if (drawNodeShadow && this.allowEdits(Edit.ADD)) {
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
            !(this.isType(Type.PETRI) && originalObject instanceof elements.Node &&
                originalObject.petriNodeType === elements.PetriNodeType.PLACE) ||
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
            originalObject.petriNodeType === elements.PetriNodeType.PLACE)) {
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
