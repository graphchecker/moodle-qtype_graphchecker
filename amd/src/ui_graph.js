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
        this.canvas.css({'background-color': 'white'});

        this.canvas.on('mousedown', function(e) {
            return parent.mousedown(e);
        });

        this.canvas.on('mouseup', function(e) {
            return parent.mouseup(e);
        });

        // Added so that the mouseup event is executed when the mouse leaves the graph UI canvas
        this.canvas.on('mouseleave', function(e) {
            return parent.mouseup(e);
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
            w:  35,             //TODO: set this in the style.css file instead of as a variable (a generic button class for this plugin)
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
            self.toolbarLeftPart = self.createToolbarPartObject(self.div[0],
                self.div[0].style.height, 'left');
            self.toolbarMiddlePart = self.createToolbarPartObject(self.div[0],
                self.div[0].style.height, 'middle');
            self.toolbarRightPart = self.createToolbarPartObject(self.div[0],
                self.div[0].style.height, 'right');

            // Left buttons
            // Create the select button
            let selectButton = new elements.ModeButton(self, self.toolbarLeftPart,
                self.buttonSize.w, self.buttonSize.h, 'fa-mouse-pointer', "Select mode", elements.ModeType.SELECT,
                self.onModeButtonPressed);
            selectButton.create();
            self.leftButtons['select'] = selectButton; //TODO: change all keywords, e.g. 'select', to ENUMs

            // Create the draw button
            let drawButton = new elements.ModeButton(self, self.toolbarLeftPart,
                self.buttonSize.w, self.buttonSize.h, 'fa-pencil', "Draw mode", elements.ModeType.DRAW,
                self.onModeButtonPressed);
            drawButton.create();
            self.leftButtons['draw'] = drawButton;

            // Right buttons
            // Create the delete button
            let deleteButton = new elements.DeleteButton(self, self.toolbarRightPart,
                self.buttonSize.w, self.buttonSize.h, 'fa-trash', "Delete", self.parent.deleteSelectedObject);
            deleteButton.create();
            self.rightButtons['delete'] = deleteButton;

            // Create the help button
            let helpButton = new elements.HelpButton(self, self.toolbarRightPart,
                self.buttonSize.w, self.buttonSize.h, 'fa-question', "Help menu", null);
            helpButton.create();
            self.rightButtons['help'] = helpButton;

            // Enable one of the mode buttons at the start, depending on the UI mode
            for(let key in self.leftButtons) {
                if (self.leftButtons[key] instanceof elements.ModeButton &&
                    self.leftButtons[key].buttonModeType === self.uiMode) {
                    self.leftButtons[key].setSelected();
                }
            }

            // If the graph type is 'Petri net', and the initial mode is 'Draw', show the buttons for selection
            // different types of petri nodes: places and transitions
            if (self.parent.isPetri() && self.uiMode === elements.ModeType.DRAW) {
                self.addPetriNodeTypeOptions();

                // Set the place button to highlighted
                self.onClickPetriNodeTypeButton(self.middleInput['place']);
            }

            self.resize(w, h);
        });

        this.div.on('keydown', function(e) {
            return parent.keydown(e);
        });

        this.div.on('keyup', function(e) {
            return parent.keyup(e);
        });

        this.onModeButtonPressed = function(button) {
            // Activate the pressed mode
            self.parent.setUIMode(button.buttonModeType);

            // Display the other mode button(s) accordingly
            for(let key in self.leftButtons) {
                if (self.leftButtons[key] instanceof elements.ModeButton &&
                    self.leftButtons[key] !== button) {
                    self.leftButtons[key].setDeselected();
                }
            }

            // Remove the FSM options from display if the mode is switched to draw mode
            if (button.buttonModeType === elements.ModeType.DRAW) {
                self.removeSelectionOptions();
                self.removeFSMNodeSelectionOptions();
                self.removePetriPlaceSelectionOptions();
                if (self.parent.isPetri()) {
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
                let leftWidth = $(this.toolbarLeftPart[0]).outerWidth();
                let rightWidth = $(this.toolbarRightPart[0]).outerWidth();
                let middlePadding = $(this.toolbarMiddlePart[0]).innerWidth() - $(this.toolbarMiddlePart[0]).width();
                let canvasWidth = $(this.parent.graphCanvas.canvas).width()
                let middleWidth = canvasWidth - leftWidth - rightWidth - middlePadding;
                $(this.toolbarMiddlePart).width(middleWidth);
            }
        };

        this.resize(w, h);
    }

    GraphToolbar.prototype.displayHelpOverlay = function() {
        // Display a help overlay on the entire graph UI
        this.helpOverlay.div[0].style.display = 'block';
        this.helpOverlay.div.addClass('visible');
        $('body').addClass('unscrollable');

        // Disable resizing of the graphUI wrapper
        this.helpOverlay.graphUIWrapper.disableResize();
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

    GraphToolbar.prototype.addSelectionOptions = function(selectedObject) {
        // Clear the selection options, and re-add them below
        if (selectedObject != null) {
            this.removeSelectionOptions();

            // Create the label textfield
            let labelTextField = new elements.TextField(this, this.toolbarMiddlePart, 8, 'Label', this.onInteractTextField);
            labelTextField.create();
            this.middleInput['label'] = labelTextField;

            // Fill the value of the label text field according to the selected object
            this.middleInput['label'].object[0].childNodes[1].value = selectedObject.text;
        }
    };

    GraphToolbar.prototype.removeSelectionOptions = function() {
        if (this.middleInput['label'] != null) {
            this.middleInput['label'].end();
            $(this.middleInput['label'].object).remove();
        }
        this.middleInput['label'] = null;
    };

    GraphToolbar.prototype.onInteractTextField = function(event, toolbar) {
        // Add or remove one character to the label of the selected object (i.e. node or link)
        toolbar.parent.selectedObject.text = event.target.value;
        toolbar.parent.draw();
    };

    GraphToolbar.prototype.addFSMNodeSelectionOptions = function(vertex) {
        // Clear the selection options, and re-add them below
        this.removeFSMNodeSelectionOptions();

        // Create the FSM initial checkbox
        let fsmInitialCheckbox = new elements.Checkbox(
            this, this.toolbarMiddlePart, elements.CheckboxType.FSM_INITIAL, 'Initial',
            this.onClickFSMInitialCheckbox);
        fsmInitialCheckbox.create();

        // Set the initial checkbox value accordingly (in case it was pressed before) and save it
        $($(fsmInitialCheckbox).attr('object').get(0)).find('input').get(0).checked =
            vertex.hasStartLink(this.parent.links);
        this.middleInput['initial'] = fsmInitialCheckbox;

        // Create the FSM final checkbox
        let fsmFinalCheckbox = new elements.Checkbox(
            this, this.toolbarMiddlePart, elements.CheckboxType.FSM_FINAL, 'Final',
            this.onClickFSMFinalCheckbox);
        fsmFinalCheckbox.create();

        // Set the final checkbox value accordingly (in case it was pressed before) and save it
        $($(fsmFinalCheckbox).attr('object').get(0)).find('input').get(0).checked = vertex.isFinal;
        this.middleInput['final'] = fsmFinalCheckbox;
    };

    GraphToolbar.prototype.removeFSMNodeSelectionOptions = function() {
        // Remove the FSM initial checkboxes if they are present
        if (this.middleInput['initial'] != null) {
            this.middleInput['initial'].end();
            $(this.middleInput['initial'].object).remove();
        }
        this.middleInput['initial'] = null;

        if (this.middleInput['final'] != null) {
            this.middleInput['final'].end();
            $(this.middleInput['final'].object).remove();
        }
        this.middleInput['final'] = null;
    };

    GraphToolbar.prototype.addPetriNodeTypeOptions = function() {
        // Clear the existing petri node type options, and re-add them below
        this.removePetriNodeTypeOptions();

        // Create the place PetriNodeType button
        let petriNodeTypePlaceButton = new elements.PetriNodeTypeButton(this, this.toolbarMiddlePart,
            this.buttonSize.w, this.buttonSize.h, 'fa-circle-o', 'Petri net place', elements.PetriNodeType.PLACE,
            this.onClickPetriNodeTypeButton);
        petriNodeTypePlaceButton.create();
        this.middleInput['place'] = petriNodeTypePlaceButton;

        // Create the transition PetriNodeType button
        let petriNodeTypeTransitionButton = new elements.PetriNodeTypeButton(this, this.toolbarMiddlePart,
            this.buttonSize.w, this.buttonSize.h, 'fa-square-o', 'Petri net transition', elements.PetriNodeType.TRANSITION,
            this.onClickPetriNodeTypeButton);
        petriNodeTypeTransitionButton.create();
        this.middleInput['transition'] = petriNodeTypeTransitionButton;
    };

    GraphToolbar.prototype.removePetriNodeTypeOptions = function() {
        // Remove the PetriNodeType buttons if they are present
        if (this.middleInput['place'] != null) {
            // Using != tests for 'null' and for 'undefined'
            this.middleInput['place'].end();
            $(this.middleInput['place'].object).remove();
        }
        this.middleInput['place'] = null;

        if (this.middleInput['transition'] != null) {
            this.middleInput['transition'].end();
            $(this.middleInput['transition'].object).remove();
        }
        this.middleInput['transition'] = null;
    };

    GraphToolbar.prototype.addPetriPlaceSelectionOptions = function(selectedObject) {
        if (selectedObject != null) {
            this.removePetriPlaceSelectionOptions()

            // Create the token number input field
            let min = this.parent.NUMBER_TOKENS_INPUT_RANGE.min;
            let max = this.parent.NUMBER_TOKENS_INPUT_RANGE.max;
            let tokenInputField = new elements.NumberInputField(this, this.toolbarMiddlePart,
                45, this.buttonSize.h, min, max, 'PetriToken', 'Tokens:', 'Number of tokens (' + min + '-' + max + ')',
                this.onEnterPetriTokenInput);
            tokenInputField.create();
            this.middleInput['tokens'] = tokenInputField;

            // Set the value of the number input field depending on the selected object
            $(this.middleInput['tokens'].object)[0].childNodes[1].value = selectedObject.petriTokens;
        }
    };

    GraphToolbar.prototype.removePetriPlaceSelectionOptions = function() {
        if (this.middleInput['tokens'] != null) {
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
        let tokenValue = min;
        if (isNaN(event.target.valueAsNumber) || event.target.valueAsNumber < min) {
            tokenValue = min;
        } else if (event.target.valueAsNumber > max) {
            // Set to 100
            tokenValue = max;
        } else {
            // Set to the value
            tokenValue = event.target.valueAsNumber;
        }

        // Set the token value in the node
        this.toolbar.parent.selectedObject.petriTokens = tokenValue;

        // Draw the number of tokens
        this.toolbar.parent.draw();
        // TODO: display the token value, using this.toolbar.parent.draw() and another method
    }

    GraphToolbar.prototype.onClickFSMInitialCheckbox = function(event) {
        if (event.target.checked) {
            this.toolbar.parent.setInitialFSMVertex(this.toolbar.parent.selectedObject);
            this.toolbar.parent.draw();
        } else {
            //TODO: Possibly fix for cases where there must be an initial vertex, depending on the input parameter
            this.toolbar.parent.removeInitialFSMVertex(this.toolbar.parent.selectedObject);
            this.toolbar.parent.draw();
        }
    };

    GraphToolbar.prototype.onClickFSMFinalCheckbox = function(event) {
        if (this.toolbar.parent.selectedObject instanceof elements.Node && this.toolbar.parent.isFsm()) {
            this.toolbar.parent.selectedObject.isFinal = !this.toolbar.parent.selectedObject.isFinal;
            this.toolbar.parent.draw();
        }
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
        this.DEFAULT_FONT_SIZE = 20;    // px. Template parameter fontsize can override this.
        this.TOOLBAR_HEIGHT = 42.75;       // px. The height of the toolbar above the graphCanvas
        this.NUMBER_TOKENS_INPUT_RANGE = {  // The range (inclusive) for entering the number of tokens for petri nets
            min: 0,
            max: 100,
        }       //TODO: assure that these values are met when saving (double check). if > 100, set to 100. If <0 or a char, set to 0
        this.INITIAL_FSM_NODE_LINK_LENGTH = 25; //px. The length of the initial FSM node's incoming link

        this.canvasId = 'graphcanvas_' + textareaId;
        this.textArea = $(document.getElementById(textareaId));
        this.uiMode = this.getUIModeBeginning(); // Set the UI mode type depending on whether there is a graph or not
        this.isTempDrawModeActive = false;
        this.petriNodeType = elements.PetriNodeType.NONE;
        this.readOnly = this.textArea.prop('readonly');
        this.templateParams = templateParams;
        this.uiWrapper = uiWrapper;
        this.graphCanvas = new GraphCanvas(this, this.canvasId, width, height);

        this.helpOverlayId = 'graphcanvas_overlay_' + textareaId;
        this.helpOverlay = new HelpOverlay(this, this.helpOverlayId, this.uiWrapper);

        this.toolbarId = 'toolbar_' + textareaId;
        this.toolbar = new GraphToolbar(this, this.toolbarId, width, this.TOOLBAR_HEIGHT, this.uiMode, this.helpOverlay);

        // The div that contains the entire graph UI (i.e. the toolbar, graph, and help overlay)
        this.containerDiv = $(document.createElement('div'));
        $(this.containerDiv).addClass('graph_ui_container_div');

        this.originalClick = null;
        this.nodes = [];
        this.links = [];
        this.selectedObject = null; // Either a elements.Link or a elements.Node.
        this.previousSelectedObject = null; // Either a elements.Link or a elements.Node.
        this.clickedObject = null; // Same as this.selectedObject, but not highlighted
        this.selectionRectangle = null; // The top-left/bottom-right corners of the selection rectangle,
        // used in the form [{x: null, y: null}, {x: null, y: null}]
        this.currentLink = null;
        this.movingObject = false;
        this.fail = false;  // Will be set true if reload fails (can't deserialise).
        this.failString = null;  // Language string key for fail error message.
        if ('helpmenutext' in templateParams) {
            this.helpOverlay.insertHelpText(templateParams.helpmenutext);
        } else {
            let newHelpString = self.getHelpText();
            this.helpOverlay.insertHelpText(newHelpString);
        }
        this.reload();
        if (!this.fail) {
            this.draw();
        }
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
        return this.toolbar.div[0];
    };

    Graph.prototype.getHelpOverlay = function() {
        return this.helpOverlay.div;
    };

    Graph.prototype.getUIModeBeginning = function() {
        var content = $(this.textArea).val();
        if (content) {
            // Load up the student's previous answer if non-empty.
            var input = JSON.parse(content), i;

            if (input.vertices.length === 0) {
                // If there is no vertex (and thus no edge), return draw mode
                return elements.ModeType.DRAW;
            } else {
                return elements.ModeType.SELECT;
            }
        } else {
            // If there is no content yet, return draw mode
            return elements.ModeType.DRAW;
        }
    };

    Graph.prototype.setUIMode = function(modeType) {
        this.uiMode = modeType;
        this.clickedObject = null;
        this.selectedObject = null;

        if (this.uiMode === elements.ModeType.DRAW) {
            // Disable the delete button
            for(let key in this.toolbar.rightButtons) {
                if (this.toolbar.rightButtons[key] instanceof elements.DeleteButton) {
                    this.toolbar.rightButtons[key].setDisabled();
                }
            }

            // If the graph type is Petri net
            if (this.isPetri()) {
                this.toolbar.addPetriNodeTypeOptions();
            }
        } else if (this.uiMode === elements.ModeType.SELECT) {
            if (this.isPetri()) {
                this.toolbar.removePetriNodeTypeOptions();
            }
        }

        // Unselect a (possibly) selected item when going from select to draw mode
        this.draw();
    };

    Graph.prototype.nodeRadius = function() {
        return this.templateParams.noderadius ? this.templateParams.noderadius : this.DEFAULT_NODE_RADIUS;
    };

    Graph.prototype.fontSize = function() {
        return this.templateParams.fontsize ? this.templateParams.fontsize : this.DEFAULT_FONT_SIZE;
    };

    // A function to determine whether the graph is directed. If it is not, it is an undirected graph
    Graph.prototype.isDirected = function() {
        return this.templateParams.isdirected !== undefined ? this.templateParams.isdirected : true;
    };

    Graph.prototype.isFsm = function() {
        return this.templateParams.isfsm !== undefined ? this.templateParams.isfsm : true;
    };

    Graph.prototype.isPetri = function() {
        return this.templateParams.ispetri !== undefined ? this.templateParams.ispetri : true;
    };

    // Create the help text to be displayed. This depends on the type of the graph (FSM, Petri net, etc.)
    Graph.prototype.getHelpText = function() {
        // Create the first part of the help text
        let introductoryText =
        "<div class = 'dialog-header'>Graph Help</div>\
                    To create and modify graphs you can use two modes:\
                    'Select mode' and 'Draw mode'.\
                    <br><br>";

        // Create the help text for the select mode
        let selectModeText = "<div class = 'dialog-section'>Select mode (<i class=\"fa fa-mouse-pointer\"></i>):</div>\
                    <ul class='dialog-help'>\
                      <li><b>Select node:</b> &nbsp;Click a node. Dragging it moves the node.</li>\
                      <li><b>Select edge:</b> &nbsp;Click an edge. Dragging it changes the arc curvature.</li>\
                      <li><b>Edit node/edge label:</b> &nbsp;Select a node/edge and edit the label text field in the toolbar. You can add a one-character subscript by adding an underscore followed by the subscript (i.e., a_1). You can type Greek letters using a backslash followed by the letter name (i.e., \\alpha).</li>\
                      <li><b>Delete node/edge:</b> &nbsp;Select a node/edge and click the delete button (<i class=\"fa fa-trash\"></i>), or press the 'Delete' (Windows / Linux) or 'Fn-Delete' (Mac) key.</li>";
        if (this.isFsm()) {
            // If the current graph type is FSM, add specific help for FSMs
            selectModeText += "<li><b>Mark node as initial or final state:</b> &nbsp;Select a node to show the corresponding checkboxes.</li>";
        }
        selectModeText += "</ul><br>";

        // Create the help text for the draw mode
        let drawModeText = "<div class = 'dialog-section'>Draw mode (<i class=\"fa fa-pencil\"></i>):</div>\
                    <ul class='dialog-help'>\
                      <li><b>Create new node:</b> &nbsp;Click on an empty space.</li>\
                      <li><b>Create new edge:</b> &nbsp;Click on a node and drag to another node.</li>\
                      <li><b>Create self-loop:</b> &nbsp;Click on a node and drag to the same node.</li>\
                    </ul>";

        // Return the concatenation
        return introductoryText + selectModeText + drawModeText;
    };

    // Draw an arrow head if this is a directed graph. Otherwise do nothing.
    Graph.prototype.arrowIfReqd = function(c, x, y, angle) {
        if (this.templateParams.isdirected === undefined || this.templateParams.isdirected) {
            util.drawArrow(c, x, y, angle);
        }
    };

    // Copy the serialised version of the graph to the TextArea.
    Graph.prototype.sync = function() {
        // Nothing to do ... always sync'd.
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
        var mouse = util.crossBrowserRelativeMousePos(e);

        if (this.readOnly) {
            return;
        }

        this.clickedObject = this.getMouseOverObject(mouse.x, mouse.y);
        this.movingObject = false;
        this.movingGraph = false;

        // Check whether the click is a left mouse click
        if (e.button === 0) {
            // Depending on the mode, perform different tasks
            if (this.uiMode === elements.ModeType.DRAW) {
                if (this.clickedObject === null && this.currentLink === null) {
                    // Draw a node
                    let newNode = new elements.Node(this, mouse.x, mouse.y);
                    if (this.isPetri()) { // Consider the node a place if it is a petri net
                        newNode.petriNodeType = this.petriNodeType;
                    }
                    this.nodes.push(newNode);
                    this.draw();

                    // Set as initial node if it is the first node, and if the type is FSM
                    if (this.nodes.length === 1 && this.isFsm()) {
                        this.setInitialFSMVertex(newNode);
                    }
                }

            } else if (this.uiMode === elements.ModeType.SELECT) {
                this.selectedObject = this.clickedObject;

                // If an object is selected (apart from TemporaryLinks),
                // display the according input elements in the toolbar
                if (this.clickedObject instanceof elements.Node || this.clickedObject instanceof elements.Link ||
                    this.clickedObject instanceof elements.SelfLink) {
                    this.toolbar.addSelectionOptions(this.clickedObject);
                } else {
                    this.toolbar.removeSelectionOptions();
                }

                // If the type is FSM, display the according buttons in the toolbar, depending on the situation
                if (this.isFsm()) {
                    if (this.clickedObject instanceof elements.Node) {
                        this.toolbar.addFSMNodeSelectionOptions(this.clickedObject);
                    } else {
                        this.toolbar.removeFSMNodeSelectionOptions();
                    }
                }

                // If the type is Petri, display the according token input field in the toolbar
                if (this.isPetri()) {
                    if (this.clickedObject instanceof elements.Node &&
                        this.clickedObject.petriNodeType === elements.PetriNodeType.PLACE) {
                        this.toolbar.addPetriPlaceSelectionOptions(this.clickedObject);
                    } else {
                        this.toolbar.removePetriPlaceSelectionOptions();
                    }
                }

                if (!(this.templateParams.locknodes && this.clickedObject instanceof elements.Node)
                    && !(this.templateParams.lockedges && this.clickedObject instanceof elements.Link)) {
                    this.movingObject = true;
                    if(this.clickedObject !== null && this.clickedObject.setMouseStart) {
                        this.clickedObject.setMouseStart(mouse.x, mouse.y);
                    }
                }

                // If an object is selected, activate the delete button.
                // Else, deactivate it
                if (this.clickedObject instanceof elements.Node || this.clickedObject instanceof elements.Link ||
                    this.clickedObject instanceof elements.SelfLink ||
                    this.clickedObject instanceof elements.StartLink) {
                    for(let key in this.toolbar.rightButtons) {
                        if (this.toolbar.rightButtons[key] instanceof elements.DeleteButton) {
                            this.toolbar.rightButtons[key].setEnabled();
                        }
                    }
                } else {
                    for(let key in this.toolbar.rightButtons) {
                        if (this.toolbar.rightButtons[key] instanceof elements.DeleteButton) {
                            this.toolbar.rightButtons[key].setDisabled();
                        }
                    }
                }

                if (this.clickedObject === null) {
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
            this.deleteSelectedObject(this);
        } else if (key === 13) { // Enter key.
            if(this.selectedObject !== null) {
                // Deselect the object.
                this.selectedObject = null;
                this.draw();
            }
        }

        if (key === 17) { // Control key
            // Assign the latest selected object
            this.previousSelectedObject = this.selectedObject;

            // Set the mode to Draw if it is not set already
            if (this.uiMode !== elements.ModeType.DRAW) {
                this.setUIMode(elements.ModeType.DRAW);
                this.isTempDrawModeActive = true;

                // Style the buttons correctly
                this.toolbar.leftButtons['draw'].setSelected();
                this.toolbar.leftButtons['select'].setDeselected();

                // Remove the buttons for Select mode
                this.toolbar.removeSelectionOptions();
                if (this.isPetri()) {
                    this.toolbar.removePetriPlaceSelectionOptions();
                    this.toolbar.onClickPetriNodeTypeButton(this.toolbar.middleInput['place']);
                }
                if (this.isFsm()) {
                    this.toolbar.removeFSMNodeSelectionOptions();
                }
            }
        }
    };

    Graph.prototype.keyup = function(e) {
        var key = util.crossBrowserKey(e), i;

        if (this.readOnly) {
            return;
        }

        if (key === 17) { // Control key
            // Set the mode to SELECT if it is not set already
            if (this.uiMode !== elements.ModeType.SELECT && this.isTempDrawModeActive) {
                this.setUIMode(elements.ModeType.SELECT);
                this.selectedObject = this.previousSelectedObject;
                this.isTempDrawModeActive = false;

                // Style the buttons correctly
                this.toolbar.leftButtons['select'].setSelected();
                this.toolbar.leftButtons['draw'].setDeselected();

                // Enable the buttons for Select mode
                this.toolbar.addSelectionOptions(this.selectedObject);
                if (this.isPetri()) {
                    this.toolbar.addPetriPlaceSelectionOptions(this.selectedObject);
                }
                this.draw();
            }
        }
    };

    Graph.prototype.resize = function(w, h) {
        // Setting w to w+1 in order to fill the resizable area's width with the canvases completely
        w = w+1;
        // Setting h to h-7, in order to not make the canvas change size when the help button is pressed (which causes
        // the screen to resize). TODO: not sure why this happens, but -7 seems to fix it
        this.graphCanvas.resize(w, h-7);
        this.toolbar.resize(w, this.TOOLBAR_HEIGHT);
        this.draw();
    };

    Graph.prototype.mousemove = function(e) {
        var mouse = util.crossBrowserRelativeMousePos(e),
            closestPoint;

        if (this.readOnly) {
            return;
        }

        // Depending on the mode, perform different tasks
        if (this.uiMode === elements.ModeType.DRAW) {
            if (this.clickedObject instanceof elements.Node) {
                let targetNode = this.getMouseOverObject(mouse.x, mouse.y);
                if(!(targetNode instanceof elements.Node)) {
                    // If the target node is not a node (e.g. an edge) set it to null
                    targetNode = null;
                }

                // Depending on the mouse position, draw different kind of links
                if (targetNode === this.clickedObject && this.isDirected() && !this.isPetri()) {
                    this.currentLink = new elements.SelfLink(this, this.clickedObject, mouse);
                } else if (targetNode !== null) {
                    this.currentLink = new elements.Link(this, this.clickedObject, targetNode);
                } else {
                    closestPoint = this.clickedObject.closestPointOnNode(mouse.x, mouse.y);
                    this.currentLink = new elements.TemporaryLink(this, closestPoint, mouse);
                }
            }
        } else if (this.uiMode === elements.ModeType.SELECT) {
            if (this.clickedObject !== null) {
                if (this.movingGraph) {
                    var nodes = this.movingNodes;
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].trackMouse(mouse.x, mouse.y);
                        this.snapNode(nodes[i]);
                    }
                } else if (this.movingObject) {
                    this.clickedObject.setAnchorPoint(mouse.x, mouse.y);
                    if (this.clickedObject instanceof elements.Node) {
                        this.snapNode(this.clickedObject);
                    }
                }
            } else {
                if (this.selectionRectangle !== null) {
                    // Overwrite the other corner of the selection rectangle
                    this.selectionRectangle[1] = {x: mouse.x, y: mouse.y};
                }
            }
        }

        this.draw();

        /*
        if(this.currentLink !== null) {
            var targetNode = this.getMouseOverObject(mouse.x, mouse.y);
            if(!(targetNode instanceof elements.Node)) {
                targetNode = null;
            }

            if(this.selectedObject === null) {
                if(targetNode !== null) {
                    this.currentLink = new elements.StartLink(this, targetNode, this.originalClick);
                } else {
                    this.currentLink = new elements.TemporaryLink(this, this.originalClick, mouse);
                }
            } else {
                if(targetNode === this.selectedObject) {
                    this.currentLink = new elements.SelfLink(this, this.selectedObject, mouse);
                } else if(targetNode !== null) {
                    this.currentLink = new elements.Link(this, this.selectedObject, targetNode);
                } else {
                    closestPoint = this.selectedObject.closestPointOnCircle(mouse.x, mouse.y);
                    this.currentLink = new elements.TemporaryLink(this, closestPoint, mouse);
                }
            }
            this.draw();
        }
        if (this.movingGraph) {
            var nodes = this.movingNodes;
            for (var i = 0; i < nodes.length; i++) {
                 nodes[i].trackMouse(mouse.x, mouse.y);
                 this.snapNode(nodes[i]);
            }
            this.draw();
        } else if(this.movingObject) {
            this.selectedObject.setAnchorPoint(mouse.x, mouse.y);
            if(this.selectedObject instanceof elements.Node) {
                this.snapNode(this.selectedObject);
            }
            this.draw();
        }
        */
    };

    Graph.prototype.mouseup = function() {
        if (this.readOnly) {
            return;
        }

        if(this.currentLink !== null) {
            if(!(this.currentLink instanceof elements.TemporaryLink)) {
                // Remove the created link if the graph is of type 'Petri' and a link is made to a node of the same
                // Petri type (e.g. place->place, or transition->transition).
                // Also display a warning in the form of an alert
                let node = null;
                if (this.currentLink instanceof elements.SelfLink) {
                    node = this.currentLink.node;
                } else {
                    node = this.currentLink.nodeA;
                }
                if (this.isPetri() && node.petriNodeType === this.currentLink.nodeB.petriNodeType) {
                    let nodeType = this.currentLink.nodeA.petriNodeType;
                    this.currentLink = null;
                    this.draw();
                    window.alert('An edge between two ' + nodeType + 's of a Petri net is not permitted.');
                    return;
                } else if (!this.isDirected()) {
                    // In case of an undirected graph, only 1 edge in between two nodes is permitted
                    for (let i = 0; i < this.links.length; i++) {
                        if ((this.links[i].nodeA === this.currentLink.nodeA && this.links[i].nodeB === this.currentLink.nodeB) ||
                            (this.links[i].nodeA === this.currentLink.nodeB && this.links[i].nodeB === this.currentLink.nodeA)) {
                            this.currentLink = null;
                            this.draw();
                            window.alert('Two edges between two nodes is not permitted.');
                            return;
                        }
                    }
                } else if (this.isDirected() && !this.isFsm() && !this.isPetri()) {
                    // In case of a directed graph (non-FSM, non-Petri), only 1 edge from two arbitrary
                    // nodes v_1 to v_2 is permitted
                    for (let i = 0; i < this.links.length; i++) {
                        if (!(this.currentLink instanceof elements.SelfLink)) {
                            if (this.links[i].nodeA === this.currentLink.nodeA && this.links[i].nodeB === this.currentLink.nodeB) {
                                this.currentLink = null;
                                this.draw();
                                window.alert('Two edges from one node to another is not permitted.');
                                return;
                            }
                        } else {
                            if (this.links[i].node === this.currentLink.node) {
                                this.currentLink = null;
                                this.draw();
                                window.alert('Two self-loops for a node is not permitted.');
                                return;
                            }
                        }
                    }
                }
                this.addLink(this.currentLink);
            }
            this.currentLink = null;
        }

        // Remove the selection field, and select all elements in it
        this.selectionRectangle = null;
        //TODO: select all elements

        this.clickedObject = null;
        this.draw();
    };

    // This function returns the first encountered object on which the user has clicked
    // A margin is added such that creating links is easier
    Graph.prototype.getMouseOverObject = function(x, y) {
        let i;

        for (i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].containsPoint(x, y)) {
                return this.nodes[i];
            }
        }
        for (i = 0; i < this.links.length; i++) {
            if (this.links[i].containsPoint(x, y)) {
                return this.links[i];
            }
        }
        return null;
    };

    Graph.prototype.deleteSelectedObject = function(graphUI) {
        if(graphUI.selectedObject !== null) {
            for(let i = 0; i < graphUI.nodes.length; i++) {
                if(graphUI.nodes[i] === graphUI.selectedObject) {
                    graphUI.nodes.splice(i--, 1);
                }
            }
            for(let i = 0; i < graphUI.links.length; i++) {
                if(graphUI.links[i] === graphUI.selectedObject ||
                    graphUI.links[i].node === graphUI.selectedObject ||
                    graphUI.links[i].nodeA === graphUI.selectedObject ||
                    graphUI.links[i].nodeB === graphUI.selectedObject) {
                    graphUI.links.splice(i--, 1);
                }
            }
            graphUI.selectedObject = null;
            graphUI.previousSelectedObject = null;
            graphUI.draw();

            // Set the deleted button as disabled
            graphUI.toolbar.rightButtons['delete'].setDisabled();

            // Remove the options in the toolbar based on the selected object
            graphUI.toolbar.removeSelectionOptions();
            graphUI.toolbar.removeFSMNodeSelectionOptions();
            graphUI.toolbar.removePetriPlaceSelectionOptions();
        }
    }

    Graph.prototype.setInitialFSMVertex = function(vertex) {
        /*
        TODO: use the input parameter to decide whether there is only 1 input vertex, or whether there can be any
         number of input vertices
        // Set all vertices to not be an initial vertex
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].isInitial = false;
        }

        // Remove all initial links
        for (let i = 0; i < this.links.length; i++) {
            if (this.links[i] instanceof elements.StartLink) {
                this.links.splice(i--, 1);
            }
        }
         */

        // Set the selected vertex as the initial vertex, and draw it
        if (this.isFsm() && vertex instanceof elements.Node) {
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
    }

    Graph.prototype.snapNode = function(node) {
        for(var i = 0; i < this.nodes.length; i++) {
            if(this.nodes[i] === node){
                continue;
            }

            if(Math.abs(node.x - this.nodes[i].x) < this.SNAP_TO_PADDING) {
                node.x = this.nodes[i].x;
            }

            if(Math.abs(node.y - this.nodes[i].y) < this.SNAP_TO_PADDING) {
                node.y = this.nodes[i].y;
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
        if (maxPerpRHS !== null) {
            newLink.perpendicularPart = maxPerpRHS + this.DUPLICATE_LINK_OFFSET;
        }
        this.links.push(newLink);
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
                    if (this.isFsm()) {
                        node.isInitial = inputNode['initial'];
                        node.isFinal = inputNode['final'];
                    }
                    if (this.isPetri()) {
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
                        link.anchorAngle = inputLink['bend']['anchorAngle'];
                    } else if(inputLink['from'] === -1) {  // TODO [ws] should be removed
                        link = new elements.StartLink(this, this.nodes[inputLink['to']]);
                        link.deltaX = inputLink['bend']['deltaX'];
                        link.deltaY = inputLink['bend']['deltaY'];
                    } else {
                        link = new elements.Link(this, this.nodes[inputLink['from']], this.nodes[inputLink['to']]);
                        link.text = inputLink['label'];
                        link.parallelPart = inputLink['bend']['parallelPart'];
                        link.perpendicularPart = inputLink['bend']['perpendicularPart'];
                        link.lineAngleAdjust = inputLink['bend']['lineAngleAdjust'];
                    }
                    this.links.push(link);
                }
            } catch(e) {
                this.fail = true;
                this.failString = 'graph_ui_invalidserialisation';
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

        for(i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            let vertex = {
                'label': node.text,
                'position': [node.x, node.y],
            };
            if (this.isFsm()) {
                vertex['initial'] = node.isInitial;
                vertex['final'] = node.isFinal;
            }
            if (this.isPetri()) {
                vertex['petri_type'] = node.petriNodeType;
                if (vertex['petri_type'] === elements.PetriNodeType.PLACE) {
                    vertex['tokens'] = node.petriTokens;
                }
            }
            output.vertices.push(vertex);
        }

        for(i = 0; i < this.links.length; i++) {
            var link = this.links[i];

            if(link instanceof elements.SelfLink) {
                output.edges.push({
                    'from': this.nodes.indexOf(link.node),
                    'to': this.nodes.indexOf(link.node),
                    'label': link.text,
                    'bend': {
                        'anchorAngle': link.anchorAngle
                    }
                });
            } else if(link instanceof elements.StartLink) {  // TODO [ws] these should be removed
                output.edges.push({
                    'from': -1,
                    'to': this.nodes.indexOf(link.node),
                    'bend': {
                        'deltaX': link.deltaX,
                        'deltaY': link.deltaY
                    }
                });
            } else if(link instanceof elements.Link) {
                output.edges.push({
                    'from': this.nodes.indexOf(link.nodeA),
                    'to': this.nodes.indexOf(link.nodeB),
                    'label': link.text,
                    'bend': {
                        'lineAngleAdjust': link.lineAngleAdjust,
                        'parallelPart': link.parallelPart,
                        'perpendicularPart': link.perpendicularPart
                    }
                });
            }
        }
        this.textArea.val(JSON.stringify(output));
    };

    Graph.prototype.destroy = function () {
        this.graphCanvas.canvas.off();  // Stop all events.
        this.graphCanvas.canvas.remove();

        this.toolbar.div.off();
        this.toolbar.div.remove();

        this.helpOverlay.div.off();
        this.helpOverlay.div.remove();
    };

    Graph.prototype.draw = function () {
        var canvas = this.getCanvas(),
            c = canvas.getContext('2d'),
            i;

        c.clearRect(0, 0, this.getCanvas().width, this.getCanvas().height);
        c.save();

        for(i = 0; i < this.nodes.length; i++) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = (this.nodes[i] === this.selectedObject) ? 'blue' : 'black';
            this.nodes[i].draw(c);
        }
        for(i = 0; i < this.links.length; i++) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = (this.links[i] === this.selectedObject) ? 'blue' : 'black';
            this.links[i].draw(c);
        }
        if(this.currentLink !== null) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = 'black';
            this.currentLink.draw(c);
        }
        // Draw the selection rectangle, if it exists
        let sRect = this.selectionRectangle;
        if (sRect !== null) {
            c.beginPath();
            c.setLineDash([5, 5]); // Set the dashes to be 5px wide and 3px apart
            c.strokeStyle = 'rgba(0,0,0,0.75)';
            // Using +0.5 to make the width of the rectangle's border 1px
            c.rect(sRect[0].x + 0.5, sRect[0].y + 0.5, sRect[1].x - sRect[0].x, sRect[1].y - sRect[0].y);
            c.fillStyle = 'rgba(160,209,255,0.5)';
            c.fillRect(sRect[0].x + 0.5, sRect[0].y + 0.5, sRect[1].x - sRect[0].x, sRect[1].y - sRect[0].y);
            c.stroke();
        }

        c.restore();
        this.save();
    };

    Graph.prototype.drawText = function(originalObject, originalText, x, y, angleOrNull) {
        var c = this.getCanvas().getContext('2d'),
            text = util.convertLatexShortcuts(originalText),
            width,
            dy;

        c.font = this.fontSize() + 'px Arial';
        width = c.measureText(text).width;

        // Find position for the text
        if (originalObject instanceof elements.Node && originalObject.petriNodeType === elements.PetriNodeType.PLACE) {
            x += 30;
        } else {
            // Center the text.
            x -= width / 2;
        }

        // Position the text intelligently if given an angle.
        if(angleOrNull !== null) {
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
