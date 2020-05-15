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

        this.HANDLE_SIZE = 10;

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

        this.canvas.on('dblclick', function(e) {
            return parent.dblclick(e);
        });

        this.canvas.on('keydown', function(e) {
            return parent.keydown(e);
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
     * A GraphToolbar is a wrapper for a Graph's toolbar HTML div
     * object.
     *
     ************************************************************************/

    function GraphToolbar(parent, divId, w, h, uiMode, helpOverlay) {
        // Constructor, given the Graph that owns this toolbar div, the canvas object of the graph,
        // the required canvasId and the height and width of the wrapper that
        // encloses the Div.

        let self = this;
        this.parent = parent;
        this.uiMode = uiMode;
        this.div = $(document.createElement('div'));
        this.div.attr({
            id:         divId,
            class:      "graphchecker_toolbar",
            tabindex:   0
        });
        this.div.css({'background-color': 'lightgrey'});

        // A list for the buttons in this toolbar
        this.buttons = [];
        jQuery(document).ready(function() {
            // Create the buttons, and add them to a list.
            // Note that all buttons should have unique titles

            // Create the help button
            let helpButton = new elements.HelpButton(self, elements.ButtonType.HELP, 0, 0, 40, 25, 'fa-question', "Help menu", helpOverlay);
            helpButton.create();
            self.buttons.push(helpButton);

            // Create the draw button
            let drawButton = new elements.ModeButton(self, elements.ButtonType.MODE, 0, 0, 40, 25, 'fa-pen', "Draw mode", elements.ModeType.DRAW)
            drawButton.create();
            self.buttons.push(drawButton);
            //TODO maybe something else: set the button to pressed or not (depending on the mode)

            // Create the edit button
            let editButton = new elements.ModeButton(self, elements.ButtonType.MODE, 0, 0, 40, 25, 'fa-mouse-pointer', "Edit mode", elements.ModeType.EDIT)
            editButton.create();
            self.buttons.push(editButton);

            // Enable one of the mode buttons at the start
            for (let i = 0; i < self.buttons.length; i++) {
                if (self.buttons[i].buttonType === elements.ButtonType.MODE && self.buttons[i].buttonModeType === self.uiMode) {
                    self.buttons[i].setSelected();
                }
            }

            // Create the event listener for the buttons
            // On a click of the button, call the onClick() method on the respective button
            $('.toolbar_button').click(function (event) {
                event.preventDefault();

                for (let i = 0; i < self.buttons.length; i++) {
                    if (event.target.id === self.buttons[i].getId()) {
                        self.buttons[i].onClick(event);
                    }
                }
            });
        });

        this.onModeButtonPressed = function(button) {
            // Activate the pressed mode
            this.parent.setUIMode(button.buttonModeType);

            // Display the other mode button(s) accordingly
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].buttonType === elements.ButtonType.MODE && this.buttons[i] !== button) {
                    this.buttons[i].setDeselected();
                }
            }
        }

        this.resize = function(w, h) {
            // Resize to given dimensions.
            this.div.css({'width': w});
            this.div.css({'height': h});
        };

        this.resize(w, h);
    }

    /***********************************************************************
     *
     * Define a class HelpArea for the help area (i.e. a help 'box')
     *
     ***********************************************************************/

    function HelpOverlay(parent, divId, dialogScale, w, h, bgValue, bgOpacity, boxColor) {
        // Constructor, of the Help overlay
        //TODO: fix helpbar staying fixed on screen when scrolling (don't use position: absolute)

        let self = this;
        this.parent = parent;
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
            }.bind(this), 500);
        });

        // Create the dialog div
        this.divDialog = $(document.createElement("div"));
        this.dialogScale = dialogScale; //The scale of the dialog w.r.t the size of the container
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

    // Sets the help text of the dialog. The text can contain newline and tab characters (i.e. \n and \t) for formatting
    HelpOverlay.prototype.insertHelpText = function(text) {
        this.divDialog.append(text);
    }

    /***********************************************************************
     *
     *  This is the ui component for a graph-drawing graphchecker question.
     *
     ***********************************************************************/

    function Graph(textareaId, width, height, templateParams) {
        // Constructor.
        var self = this;

        this.SNAP_TO_PADDING = 6;
        this.DUPLICATE_LINK_OFFSET = 16; // Pixels offset for a duplicate link
        this.HIT_TARGET_PADDING = 6;    // Pixels.
        this.DEFAULT_NODE_RADIUS = 26;  // Pixels. Template parameter noderadius can override this.
        this.DEFAULT_FONT_SIZE = 20;    // px. Template parameter fontsize can override this.
        this.TOOLBAR_HEIGHT = 40;       // px. The height of the toolbar above the graphCanvas

        this.uiMode = elements.ModeType.DRAW; // Set the UI mode type

        this.canvasId = 'graphcanvas_' + textareaId;
        this.textArea = $(document.getElementById(textareaId));
        this.readOnly = this.textArea.prop('readonly');
        this.templateParams = templateParams;
        this.graphCanvas = new GraphCanvas(this, this.canvasId, width, height);

        this.helpOverlayId = 'graphcanvas_overlay_' + textareaId;
        this.helpOverlay = new HelpOverlay(this, this.helpOverlayId, 3.0/4.0, width, height + this.TOOLBAR_HEIGHT,
            0, '0.2', 'white');

        this.toolbarId = 'toolbar_' + textareaId;
        this.toolbar = new GraphToolbar(this, this.toolbarId, width, this.TOOLBAR_HEIGHT, this.uiMode, this.helpOverlay);

        this.caretVisible = true;
        this.caretTimer = 0;  // Need global so we can kill a running timer.
        this.originalClick = null;
        this.nodes = [];
        this.links = [];
        this.selectedObject = null; // Either a elements.Link or a elements.Node.
        this.clickedObject = null; // Same as this.selectedObject, but not highlighted
        this.currentLink = null;
        this.movingObject = false;
        this.fail = false;  // Will be set true if reload fails (can't deserialise).
        this.failString = null;  // Language string key for fail error message.
        if ('helpmenutext' in templateParams) {
            this.helpOverlay.insertHelpText(templateParams.helpmenutext);
        } else {
            require(['core/str'], function(str) {
                // Get help text via AJAX.
                var helpPresent = str.get_string('graphhelp', 'qtype_graphchecker');
                $.when(helpPresent).done(function(graphhelp) {
                    self.helpOverlay.insertHelpText(graphhelp);
                });
            });
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
        return [this.getHelpOverlay(), this.getToolbar(), this.getCanvas()];
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

    Graph.prototype.setUIMode = function(modeType) {
        this.uiMode = modeType;
        this.clickedObject = null;
        this.selectedObject = null;
    }

    Graph.prototype.nodeRadius = function() {
        return this.templateParams.noderadius ? this.templateParams.noderadius : this.DEFAULT_NODE_RADIUS;
    };

    Graph.prototype.fontSize = function() {
        return this.templateParams.fontsize ? this.templateParams.fontsize : this.DEFAULT_FONT_SIZE;
    };

    Graph.prototype.isFsm = function() {
        return this.templateParams.isfsm !== undefined ? this.templateParams.isfsm : true;
    };

    Graph.prototype.isPetri = function() {
        return this.templateParams.ispetri !== undefined ? this.templateParams.ispetri : true;
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

        if(key >= 0x20 &&
                  key <= 0x7E &&
                  !e.metaKey &&
                  !e.altKey &&
                  !e.ctrlKey &&
                  this.selectedObject !== null &&
                  'text' in this.selectedObject) {

            this.selectedObject.text += String.fromCharCode(key);
            this.resetCaret();
            this.draw();

            // Don't let keys do their actions (like space scrolls down the page).
            return false;
        } else if(key === 8 || key === 0x20 || key === 9) {
            // Disable scrolling on backspace, tab and space.
            return false;
        }
    };

    Graph.prototype.mousedown = function(e) {
        var mouse = util.crossBrowserRelativeMousePos(e);

        if (this.readOnly) {
            return;
        }

        this.clickedObject = this.getMouseOverObject(mouse.x, mouse.y);
        this.movingObject = false;
        this.movingGraph = false;
        this.originalClick = mouse;

        // Check whether the click is a left mouse click
        if (e.button === 0) {
            // Depending on the mode, perform different tasks
            if (this.uiMode === elements.ModeType.DRAW) {
                if (this.clickedObject === null && this.currentLink === null) {
                    // Draw a node
                    let newNode = new elements.Node(this, mouse.x, mouse.y);
                    if (this.isPetri()) { // Consider the node a place if it is a petri net
                        newNode.petriNodeType = elements.PetriNodeType.PLACE;
                    }
                    this.nodes.push(newNode);
                    this.resetCaret();
                    this.draw();
                }
                /*
                if (e.shiftKey && clickedObject instanceof elements.Node) {
                        this.currentLink = new elements.SelfLink(this, clickedObject, mouse);
                    }
                } else if (e.shiftKey && this.isFsm()) {
                    this.currentLink = new elements.TemporaryLink(this, mouse, mouse);
                }
                */

            } else if (this.uiMode === elements.ModeType.EDIT) {
                this.selectedObject = this.clickedObject;

                if (!(this.templateParams.locknodes && this.clickedObject instanceof elements.Node)
                    && !(this.templateParams.lockedges && this.clickedObject instanceof elements.Link)){
                    this.movingObject = true;
                    if(this.clickedObject !== null && this.clickedObject.setMouseStart) {
                        this.clickedObject.setMouseStart(mouse.x, mouse.y);
                    }
                }
                this.resetCaret();
            }
        }

        this.draw();

        if(this.hasFocus()) {
            // Disable drag-and-drop only if the canvas is already focused.
            return false;
        } else {
            // Otherwise, let the browser switch the focus away from wherever it was.
            this.resetCaret();
            return true;
        }
    };

    Graph.prototype.keydown = function(e) {
        var key = util.crossBrowserKey(e), i;

        if (this.readOnly) {
            return;
        }

        if(key === 8) { // Backspace key.
            if(this.selectedObject !== null && 'text' in this.selectedObject) {
                this.selectedObject.text = this.selectedObject.text.substr(0, this.selectedObject.text.length - 1);
                this.resetCaret();
                this.draw();
            }

            // Backspace is a shortcut for the back button, but do NOT want to change pages.
            return false;
        } else if(key === 46) { // Delete key.
            if(this.selectedObject !== null) {
                for(i = 0; i < this.nodes.length; i++) {
                    if(this.nodes[i] === this.selectedObject) {
                        this.nodes.splice(i--, 1);
                    }
                }
                for(i = 0; i < this.links.length; i++) {
                    if(this.links[i] === this.selectedObject ||
                           this.links[i].node === this.selectedObject ||
                           this.links[i].nodeA === this.selectedObject ||
                           this.links[i].nodeB === this.selectedObject) {
                        this.links.splice(i--, 1);
                    }
                }
                this.selectedObject = null;
                this.draw();
            }
        } else if(key === 13) { // Enter key.
            if(this.selectedObject !== null) {
                // Deselect the object.
                this.selectedObject = null;
                this.draw();
            }
        }
    };

    Graph.prototype.dblclick = function(e) {
        var mouse = util.crossBrowserRelativeMousePos(e);

        if (this.readOnly) {
            return;
        }
        //TODO: remove function
        /*
        this.selectedObject = this.getMouseOverObject(mouse.x, mouse.y);

        if(this.selectedObject === null) {
        } else {
            if(this.selectedObject instanceof elements.Node && this.isFsm()) {
                this.selectedObject.isAcceptState = !this.selectedObject.isAcceptState;
                this.draw();
            } else if(this.selectedObject instanceof elements.Node && this.isPetri()) {
                let nodeType = this.selectedObject.petriNodeType;
                if (nodeType === elements.PetriNodeType.PLACE) {
                    this.selectedObject.petriNodeType = elements.PetriNodeType.TRANSITION;
                } else if (nodeType === elements.PetriNodeType.TRANSITION) {
                    this.selectedObject.petriNodeType = elements.PetriNodeType.PLACE;
                }
                this.draw();
            }
        }
        */
    };

    Graph.prototype.resize = function(w, h) {
        // Setting w to w+1 in order to fill the resizable area's width with the canvases completely
        w = w+1;
        //TODO: generalize: the bottom part of the draggable area is approximately 14 pixels. This ensures that this
        //TODO:             bottom part is not visible. However, it is not a good solution (i.e. it is a 'hack')
        this.graphCanvas.resize(w, h + 14);
        this.toolbar.resize(w, this.TOOLBAR_HEIGHT);
        this.helpOverlay.resize(w, h + this.TOOLBAR_HEIGHT);
        this.draw();
    };

    Graph.prototype.mousemove = function(e) {
        var mouse = util.crossBrowserRelativeMousePos(e),
            closestPoint;

        if (this.readOnly) {
            return;
        }

        // Depending on the mode, perform different tasks TODO: disable selection after link making
        if (this.uiMode === elements.ModeType.DRAW) {
            if (this.clickedObject instanceof elements.Node) {
                let targetNode = this.getMouseOverObject(mouse.x, mouse.y);
                if(!(targetNode instanceof elements.Node)) {
                    // If the target node is not a node (e.g. an edge) set it to null
                    targetNode = null;
                }

                // Depending on the mouse position, draw different kind of links
                if (targetNode === this.clickedObject) {
                    this.currentLink = new elements.SelfLink(this, this.clickedObject, mouse);
                } else if (targetNode !== null) {
                    this.currentLink = new elements.Link(this, this.clickedObject, targetNode);
                } else {
                    closestPoint = this.clickedObject.closestPointOnCircle(mouse.x, mouse.y);
                    this.currentLink = new elements.TemporaryLink(this, closestPoint, mouse);
                }
            }
        } else if (this.uiMode === elements.ModeType.EDIT) {
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

        //this.movingObject = false;
        //this.movingGraph = false;
        this.clickedObject = null;

        if(this.currentLink !== null) {
            if(!(this.currentLink instanceof elements.TemporaryLink)) {
                this.addLink(this.currentLink);
                this.resetCaret();
            }
            this.currentLink = null;
            this.draw();
        }
    };

    Graph.prototype.getMouseOverObject = function(x, y) {
        var i;

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

                for(i = 0; i < input.vertices.length; i++) {
                    var inputNode = input.vertices[i];
                    var node = new elements.Node(this, inputNode['position'][0], inputNode['position'][1]);
                    node.text = inputNode['label'];
                    node.isAcceptState = inputNode['accepting'];
                    if (this.isPetri()) {
                        node.petriNodeType = inputNode['petri_type'];
                    }
                    this.nodes.push(node);
                }

                for(i = 0; i < input.edges.length; i++) {
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
                'accepting': node.isAcceptState
            };
            if (this.isPetri()) {
                vertex['petri_type'] = node.petriNodeType;
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
        clearInterval(this.caretTimer); // Stop the caret timer.
        this.graphCanvas.canvas.off();  // Stop all events.
        this.graphCanvas.canvas.remove();

        this.toolbar.div.off()
        this.toolbar.div.remove();

        this.helpOverlay.div.off()
        this.helpOverlay.div.remove();
    };

    Graph.prototype.resetCaret = function () {
        var t = this; // For embedded function to access this.

        clearInterval(this.caretTimer);
        this.caretTimer = setInterval(function() {
            t.caretVisible = !t.caretVisible;
            t.draw();
        }, 500);
        this.caretVisible = true;
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

        c.restore();
        this.save();
    };

    Graph.prototype.drawText = function(originalText, x, y, angleOrNull, theObject) {
        var c = this.getCanvas().getContext('2d'),
            text = util.convertLatexShortcuts(originalText),
            width,
            dy;

        c.font = this.fontSize() + 'px Arial';
        width = c.measureText(text).width;

        // Center the text.
        x -= width / 2;

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

        // Draw text and caret (round the coordinates so the caret falls on a pixel).
        if('advancedFillText' in c) {
            c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
        } else {
            x = Math.round(x);
            y = Math.round(y);
            dy = Math.round(this.fontSize() / 3); // Don't understand this.
            c.fillText(text, x, y + dy);
            if(theObject == this.selectedObject && this.caretVisible && this.hasFocus() && document.hasFocus()) {
                x += width;
                dy = Math.round(this.fontSize() / 2);
                c.beginPath();
                c.moveTo(x, y - dy);
                c.lineTo(x, y + dy);
                c.stroke();
            }
        }
    };

    return {
        Constructor: Graph
    };
});
