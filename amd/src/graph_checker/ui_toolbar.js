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
 * Implementation for the toolbar of the graph editor.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/graph_checker/globals', 'qtype_graphchecker/graph_checker/graphutil',
    'qtype_graphchecker/graph_checker/graphelements', 'qtype_graphchecker/graph_checker/toolbar_elements'],
    function($, globals, util, elements, toolbar_elements) {

    /***********************************************************************
     *
     * A GraphToolbar is the Graph's toolbar HTML div
     * object.
     *
     ************************************************************************/

    function GraphToolbar(parent, divId, w, uiMode, helpOverlay) {
        // TODO: rename this file, so doesnt start with ui_, since that's confusing because of the standard interface
        //  element file names from userinterfacewrapper.js
        // Constructor, given the Graph that owns this toolbar div, the canvas object of the graph,
        // the required canvasId and the height and width of the wrapper that
        // encloses the Div.

        let self = this;
        this.parent = parent;
        this.buttonSize = {     //px. The pre-set size of the buttons (width, w, and height, h)
            //TODO: set this in the style.css file instead of as a variable (a generic button class for this plugin)
            w: 35,
            h: 25,
        };
        this.uiMode = uiMode; //TODO: remove, or rename to initialUIMode
        this.helpOverlay = helpOverlay;
        this.div = $(document.createElement('div'));
        this.div.attr({
            id: divId,
            class: "graphchecker_toolbar",
            tabindex: 0
        });
        //px. A fix for the server such that all three the toolbar parts are positioned on one line
        this.constMiddleWidthFix = 2;

        // A list for the buttons in this toolbar, and a list for the (possible) checkboxes
        // TODO: make one list per toolbar part (left, middle, right), and index by string, e.g. 'token'
        // TODO: make button groups
        this.leftButtons = {};
        this.middleInput = {};
        this.rightButtons = {};

        $(document).ready(function () {
            // Create the 3 parts of the toolbar: left, middle and right
            if (self.parent.allowEdits(util.Edit.ADD_VERTEX) || self.parent.allowEdits(util.Edit.ADD_EDGE)) {
                self.toolbarLeftPart = self.createToolbarPartObject(self.div[0],
                    self.div[0].style.height, 'left');
            }
            self.toolbarMiddlePart = self.createToolbarPartObject(self.div[0],
                self.div[0].style.height, 'middle');
            self.toolbarRightPart = self.createToolbarPartObject(self.div[0],
                self.div[0].style.height, 'right');

            if (self.parent.allowEdits(util.Edit.ADD_VERTEX) || self.parent.allowEdits(util.Edit.ADD_EDGE)) {
                // Left buttons
                // Create the select button
                let selectButton = new toolbar_elements.ToggleButton(self, self.toolbarLeftPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-mouse-pointer', "Select mode", self.onModeButtonPressed,
                    util.ModeType.SELECT);
                selectButton.create();
                self.leftButtons['select'] = selectButton;

                // Create the draw button
                let drawButton = new toolbar_elements.ToggleButton(self, self.toolbarLeftPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-pencil', "Draw mode (Ctrl)", self.onModeButtonPressed,
                    util.ModeType.DRAW);
                drawButton.create();
                self.leftButtons['draw'] = drawButton;
            }

            // Right buttons
            // Create the delete button
            if (self.parent.allowEdits(util.Edit.DELETE_VERTEX) || self.parent.allowEdits(util.Edit.DELETE_EDGE)) {
                let deleteButton = new toolbar_elements.GrayOutButton(self, self.toolbarRightPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-trash', "Delete", self.parent.deleteSelectedObjects,
                    self.parent);
                deleteButton.create();
                self.rightButtons['delete'] = deleteButton;
            }

            // Create the undo button
            if (self.parent.allowsOneEdit()) {
                let undoButton = new toolbar_elements.GrayOutButton(self, self.toolbarRightPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-undo', "Undo", self.parent.undo, self.parent);
                undoButton.create();
                self.rightButtons['undo'] = undoButton;
            }

            // Create the redo button
            if (self.parent.allowsOneEdit()) {
                let redoButton = new toolbar_elements.GrayOutButton(self, self.toolbarRightPart,
                    self.buttonSize.w, self.buttonSize.h, 'fa-repeat', "Redo", self.parent.redo, self.parent);
                redoButton.create();
                self.rightButtons['redo'] = redoButton;
            }

            // Create the help button
            let helpButton = new toolbar_elements.Button(self, self.toolbarRightPart,
                self.buttonSize.w, self.buttonSize.h, 'fa-question', "Help menu", self.displayHelpOverlay, self);
            helpButton.create();
            self.rightButtons['help'] = helpButton;

            // Enable one of the mode buttons at the start, depending on the UI mode
            for (let key in self.leftButtons) {
                if (self.leftButtons[key] instanceof toolbar_elements.ToggleButton &&
                    self.leftButtons[key].buttonModeType === self.uiMode) {
                    self.leftButtons[key].setSelected();
                }
            }

            // If the graph type is 'Petri net', and the initial mode is 'Draw', show the buttons for selection
            // different types of petri nodes: places and transitions
            if (self.parent.isType(util.Type.PETRI) && self.uiMode === util.ModeType.DRAW) {
                self.addPetriNodeTypeOptions();

                // Set the place button to highlighted
                self.onClickPetriNodeTypeButton(self.middleInput['place']);
            }

            self.resize();
            self.parent.setUIMode(util.ModeType.SELECT);
        });

        this.div.on('keydown', function (e) {
            return parent.keydown(e);
        });

        this.div.on('keyup', function (e) {
            return parent.keyup(e);
        });

        this.onModeButtonPressed = function (buttonModeType) {
            // Activate the pressed mode
            self.parent.setUIMode(buttonModeType);

            // Remove the FSM options from display if the mode is switched to draw mode
            if (buttonModeType === util.ModeType.DRAW) {
                self.removeSelectionOptions();
                self.removeFSMNodeSelectionOptions();
                self.removePetriSelectionOptions();
                if (self.parent.isType(util.Type.PETRI)) {
                    self.onClickPetriNodeTypeButton(self.middleInput['place']);
                }
            }
        };

        this.resize = function () {
            // Update the width of the middle part of the toolbar
            if (this.toolbarMiddlePart !== undefined) {
                let leftWidth = 0;
                if (this.parent.allowEdits(util.Edit.ADD_VERTEX) || this.parent.allowEdits(util.Edit.ADD_EDGE)) {
                    leftWidth = $(this.toolbarLeftPart[0]).outerWidth();
                }
                let rightWidth = $(this.toolbarRightPart[0]).outerWidth();
                let middlePadding = $(this.toolbarMiddlePart[0]).innerWidth() - $(this.toolbarMiddlePart[0]).width();
                let canvasWidth = $(this.parent.graphCanvas.canvas).width();
                let middleWidth = canvasWidth - leftWidth - rightWidth - middlePadding;
                $(this.toolbarMiddlePart).width(middleWidth - this.constMiddleWidthFix);
            }
        };

        this.resize();
    }

    GraphToolbar.prototype.displayHelpOverlay = function (toolbar) {
        // Display a help overlay on the entire graph UI
        toolbar.helpOverlay.div[0].style.display = 'block';
        toolbar.helpOverlay.div.addClass('visible');
        $('body').addClass('unscrollable');

        // Disable resizing of the graphUI wrapper
        toolbar.helpOverlay.graphUIWrapper.disableResize();
    };

    GraphToolbar.prototype.createToolbarPartObject = function (parentDiv, parentHeight, side) {
        // A function to create a basic div for a part of the toolbar:
        // i.e. the left, middle, or right part of the toolbar, denoted by the variable 'side'
        let $part = $('<div/>')
            .attr({
                'id': 'toolbar_part_' + side,
                'class': 'toolbar_part',
            });
        $(parentDiv).append($part);
        return $part;
    };

    GraphToolbar.prototype.addSelectionOptions = function (selectedObjects) {
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
        let areOnlyNodesAndAllowed = areOnlyNodes && !areOnlyEdges && this.parent.allowEdits(util.Edit.VERTEX_COLORS);
        let areOnlyEdgesAndAllowed = !areOnlyNodes && areOnlyEdges && this.parent.allowEdits(util.Edit.EDGE_COLORS);
        let nodesEdgesSameColorsAndAllowed = areSameColors && this.parent.allowEdits(util.Edit.VERTEX_COLORS) &&
            this.parent.allowEdits(util.Edit.EDGE_COLORS);
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

            let colorDropdown = new toolbar_elements.Dropdown(this, this.toolbarMiddlePart,
                'Color', colors, faIcons, this.onClickColorDropdown);
            colorDropdown.create();
            this.middleInput['color'] = colorDropdown;
            this.middleInput['color'].setInitialFieldValue(selectedObjects);
        }

        let allow_vertex_labels = !(areOnlyNodes && !this.parent.allowEdits(util.Edit.VERTEX_LABELS));
        let allow_edge_labels = !(areOnlyEdges && !this.parent.allowEdits(util.Edit.EDGE_LABELS));
        if (selectedObjects.length === 1 && !(selectedObjects[0] instanceof elements.StartLink ||
            (selectedObjects[0] instanceof elements.Link && this.parent.isType(util.Type.PETRI))) &&
            allow_vertex_labels && allow_edge_labels) {
            // Create the label textfield
            let labelTextField = new toolbar_elements.TextField(this, this.toolbarMiddlePart,
                8, 'Label', selectedObjects[0], this.onInteractLabelTextField, this.onFocusInLabelTextfield,
                this.onFocusOutLabelTextfield);
            labelTextField.create();
            this.middleInput['label'] = labelTextField;

            // Fill the value of the label text field according to the selected object
            let labelInput = this.middleInput['label'].object[0].children[0].children[0];
            labelInput.value = selectedObjects[0].text;

            // Set the label's initial value
            labelTextField.labelInitial = labelInput.value;

            // Check for the validity of the label and take corresponding actions
            this.parent.checkLabelValidity(labelInput, labelInput.value);

        } else if (selectedObjects.length === 1 && selectedObjects[0] instanceof elements.Link &&
            this.parent.isType(util.Type.PETRI)
            && allow_edge_labels) {
            // Create the spinner to set the label
            let min = globals.NUMBER_TOKENS_INPUT_RANGE.min;
            let max = globals.NUMBER_TOKENS_INPUT_RANGE.max;
            let labelInputField = new toolbar_elements.NumberInputField(this, this.toolbarMiddlePart,
                45, this.buttonSize.h, min, max, 'PetriLinkLable', 'Label:', 'Edge label',
                this.onEnterPetriLinkLabelInput, this.onFocusInPetriLinkLabelInput, this.onFocusOutPetriLinkLabelInput);
            labelInputField.create();
            this.middleInput['label'] = labelInputField;

            // Set the value of the number input field, or an empty value
            let labelNumber = Number(selectedObjects[0].text);
            $(this.middleInput['label'].object)[0].childNodes[1].value = (labelNumber !== 0) ? labelNumber : '';
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
            let highlightCheckbox = new toolbar_elements.Checkbox(this, this.toolbarMiddlePart, util.CheckboxType.HIGHLIGHT,
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

    GraphToolbar.prototype.removeSelectionOptions = function () {
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

    GraphToolbar.prototype.onClickColorDropdown = function (event) {
        // Set the color of the selected objects
        for (let i = 0; i < this.toolbar.parent.selectedObjects.length; i++) {
            this.toolbar.parent.selectedObjects[i].colorObject = util.colors[this.dropDownOptions[$(event.target).index()]];
        }

        // Display the colored icon and text in the dropdownFieldElement
        this.toolbar.middleInput['color'].displayInDropdownField(event.target);

        this.toolbar.parent.onGraphChange();
    };

    GraphToolbar.prototype.onInteractLabelTextField = function (event, toolbar) {
        if (event instanceof KeyboardEvent) {
            if (event.key === 'Enter') {
                // Set the focus to be the graph canvas when the enter button is pressed
                $(toolbar.parent.graphCanvas.canvas).focus();
            } else if (event.key === 'Escape') {
                // Also set focus, and deselect the objects
                $(toolbar.parent.graphCanvas.canvas).focus();
                toolbar.parent.selectedObjects = [];
            } else if (event.key === 'Control' &&
                    (toolbar.parent.allowEdits(util.Edit.ADD_VERTEX) || toolbar.parent.allowEdits(util.Edit.ADD_EDGE))) {
                // Also set focus, and activate temporary draw mode if draw mode is not active already
                if (toolbar.parent.uiMode !== util.ModeType.DRAW) {
                    toolbar.parent.enableTemporaryDrawMode();
                }
            }
        } else if (event instanceof InputEvent) {
            // Add or remove character(s) to the label of the only selected object (i.e. node or link)
            // This function is only called when there is 1 selected object
            let selectedObject = toolbar.parent.selectedObjects[0];
            let labelValue = event.target.value;
            selectedObject.text = labelValue;

            // Check for the validity of the label and take corresponding actions
            toolbar.parent.checkLabelValidity(event.target, labelValue);
        }
        toolbar.parent.draw();
    };

    GraphToolbar.prototype.onFocusInLabelTextfield = function (textfieldObject, event) {  // eslint-disable-line no-unused-vars
        // Currently this method is empty
    };

    GraphToolbar.prototype.onFocusOutLabelTextfield = function (textfieldObject, event) {
        // If the label has changed, and is valid, between the selecting and deselecting the label (focussing),
        // then update the graph stack
        let labelValue = textfieldObject.object[0].childNodes[1].childNodes[0].value;
        let isValidLabel = this.toolbar.parent.checkStringValidity(labelValue, textfieldObject.selectedObject);

        if (isValidLabel) {
            if (event.target.value !== textfieldObject.labelInitial && isValidLabel) {
                this.toolbar.parent.onGraphChange();
            }
        } else {
            // Display a popup
            this.toolbar.parent.alertPopup('The entered label does not match the regex.');

            // Reset the label to a valid regex. This is either the value on focussing, or the empty string
            let newLabelValue = '';
            if (this.toolbar.parent.checkStringValidity(textfieldObject.labelInitial,
                this.toolbar.parent.selectedObjects[0])) {
                newLabelValue = textfieldObject.labelInitial;
            }

            // Set the new label value of the selected object, and of the input textfield
            textfieldObject.selectedObject.text = newLabelValue;
            event.target.value = newLabelValue;

            // Remove the invalid class
            $(event.target).removeClass('invalid');
        }
    };

    GraphToolbar.prototype.onEnterPetriLinkLabelInput = function (event) {
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

        } else if (event instanceof KeyboardEvent) {
            if (event.key === 'Enter') {
                // Set the focus to be the graph canvas when the enter button is pressed
                $(this.toolbar.parent.graphCanvas.canvas).focus();
            } else if (event.key === 'Escape') {
                // Also set focus, and deselect the objects
                $(this.toolbar.parent.graphCanvas.canvas).focus();
                this.toolbar.parent.selectedObjects = [];
            } else if (event.key === 'Control' &&
                    (toolbar.parent.allowEdits(util.Edit.ADD_VERTEX) || toolbar.parent.allowEdits(util.Edit.ADD_EDGE))) {
                // Also set focus, and activate temporary draw mode if draw mode is not active already
                if (this.toolbar.parent.uiMode !== util.ModeType.DRAW) {
                    this.toolbar.parent.enableTemporaryDrawMode();
                }
            }
        }

        // Draw the new label
        this.toolbar.parent.draw();
    };

    GraphToolbar.prototype.onFocusInPetriLinkLabelInput = function (inputfieldObject, event) {
        // Save the value of the label, upon selecting (focussing) it
        inputfieldObject.labelOnFocusIn = event.target.value;
    };

    GraphToolbar.prototype.onFocusOutPetriLinkLabelInput = function (inputfieldObject, event) {
        // If the label has changed, between the selecting and deselecting the label (focussing), update the graph stack
        if (event.target.value !== inputfieldObject.labelOnFocusIn) {
            this.toolbar.parent.onGraphChange();
        }
    };

    GraphToolbar.prototype.onClickHighlightCheckbox = function (event) {
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

    GraphToolbar.prototype.addFSMNodeSelectionOptions = function (selectedObjects) {
        // Clear the selection options, and re-add them below
        this.removeFSMNodeSelectionOptions();

        if (!this.parent.allowEdits(util.Edit.FSM_FLAGS)) {
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
        let fsmInitialCheckbox = new toolbar_elements.Checkbox(
            this, this.toolbarMiddlePart, util.CheckboxType.FSM_INITIAL, 'Initial',
            this.onClickFSMInitialCheckbox);
        fsmInitialCheckbox.create();

        // Set the initial checkbox value accordingly (in case it was pressed before) and save it
        fsmInitialCheckbox.setChecked(numberOfInitialVertices, numberOfVertices);
        this.middleInput['initial'] = fsmInitialCheckbox;

        // Create the FSM final checkbox
        let fsmFinalCheckbox = new toolbar_elements.Checkbox(
            this, this.toolbarMiddlePart, util.CheckboxType.FSM_FINAL, 'Final',
            this.onClickFSMFinalCheckbox);
        fsmFinalCheckbox.create();

        // Set the final checkbox value accordingly (in case it was pressed before) and save it
        fsmFinalCheckbox.setChecked(numberOfFinalVertices, numberOfVertices);
        this.middleInput['final'] = fsmFinalCheckbox;
    };

    GraphToolbar.prototype.removeFSMNodeSelectionOptions = function () {
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

    GraphToolbar.prototype.addPetriNodeTypeOptions = function () {
        // Clear the existing petri node type options, and re-add them below
        this.removePetriNodeTypeOptions();

        if (this.parent.allowEdits(util.Edit.ADD_VERTEX)) {
            // Create the transition PetriNodeType button
            let petriNodeTypeTransitionButton = new toolbar_elements.PetriNodeTypeButton(this, this.toolbarMiddlePart,
                this.buttonSize.w, this.buttonSize.h, 'fa-square-o', 'Petri net transition', util.PetriNodeType.TRANSITION,
                this.onClickPetriNodeTypeButton);
            petriNodeTypeTransitionButton.create();
            petriNodeTypeTransitionButton.setDeselected();
            this.middleInput['transition'] = petriNodeTypeTransitionButton;

            // Create the place PetriNodeType button
            let petriNodeTypePlaceButton = new toolbar_elements.PetriNodeTypeButton(this, this.toolbarMiddlePart,
                this.buttonSize.w, this.buttonSize.h, 'fa-circle-o', 'Petri net place', util.PetriNodeType.PLACE,
                this.onClickPetriNodeTypeButton);
            petriNodeTypePlaceButton.create();
            petriNodeTypePlaceButton.setSelected();
            this.middleInput['place'] = petriNodeTypePlaceButton;

            // Reset the active petri node type to be 'Place'
            this.parent.petriNodeType = util.PetriNodeType.PLACE;
        }
    };

    GraphToolbar.prototype.removePetriNodeTypeOptions = function () {
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

    GraphToolbar.prototype.addPetriSelectionOptions = function (selectedObjects) {
        // Remove any fields if present
        this.removePetriSelectionOptions();

        // Only add the petri place selection options (e.g. the token input field) when at least 1 place
        // node is selected, and when no transition nodes are selected
        // The listSelectedPlaces variable is also later used to set the token field
        let listSelectedPlaces = [];
        let areTransitionsSelected = false;
        for (let i = 0; i < selectedObjects.length; i++) {
            if (selectedObjects[i] instanceof elements.Node &&
                selectedObjects[i].petriNodeType === util.PetriNodeType.PLACE) {
                listSelectedPlaces.push(selectedObjects[i]);
            }
            if (selectedObjects[i] instanceof elements.Node &&
                selectedObjects[i].petriNodeType === util.PetriNodeType.TRANSITION) {
                areTransitionsSelected = true;
            }
        }
        if (!(listSelectedPlaces.length && !areTransitionsSelected)) {
            return;
        }

        if (selectedObjects.length && this.parent.allowEdits(util.Edit.PETRI_MARKING)) {
            let min = globals.NUMBER_TOKENS_INPUT_RANGE.min;
            let max = globals.NUMBER_TOKENS_INPUT_RANGE.max;
            let tokenInputField = new toolbar_elements.NumberInputField(this, this.toolbarMiddlePart,
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
                    (areTokenValuesEqual) ? listSelectedPlaces[0].petriTokens : '';
            }
        }
    };

    GraphToolbar.prototype.removePetriSelectionOptions = function () {
        if (this.middleInput['tokens']) {
            // Remove the input field from the DOM
            this.middleInput['tokens'].end();
            $(this.middleInput['tokens'].object).remove();
        }
        this.middleInput['tokens'] = null;
    };

    GraphToolbar.prototype.onEnterPetriTokenInput = function (event) {
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
                object.petriNodeType === util.PetriNodeType.PLACE) {
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
            } else if (event.key === 'Control' &&
                    (toolbar.parent.allowEdits(util.Edit.ADD_VERTEX) || toolbar.parent.allowEdits(util.Edit.ADD_EDGE))) {
                // Also set focus, and activate temporary draw mode if draw mode is not active already
                $(this.toolbar.parent.graphCanvas.canvas).focus();
                if (this.toolbar.parent.uiMode !== util.ModeType.DRAW) {
                    this.toolbar.parent.enableTemporaryDrawMode();
                }
            }
        } else {
            this.toolbar.parent.onGraphChange();
        }

        // Draw the number of tokens
        this.toolbar.parent.draw();
    };

    GraphToolbar.prototype.onClickFSMInitialCheckbox = function (event) {
        if (!this.toolbar.parent.isType(util.Type.FSM)) {
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

    GraphToolbar.prototype.onClickFSMFinalCheckbox = function (event) {
        if (this.toolbar.parent.isType(util.Type.FSM)) {
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

    GraphToolbar.prototype.onClickPetriNodeTypeButton = function (object) {
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

    return {
        GraphToolbar: GraphToolbar
    };

});
