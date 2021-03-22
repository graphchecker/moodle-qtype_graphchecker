/**
 * Implementation for the help overlay of the Graph UI application
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'qtype_graphchecker/graph_checker/graphutil'], function ($, util) {

    /**
     * Function: HelpOverlay
     * Constructor for the HelpOverlay (i.e. a help 'box') object
     *
     * Parameters:
     *    parent - The parent of this object in the HTML DOM
     *    graphUIWrapper - The parent of this object in the HTML DOM
     */
    function HelpOverlay(parent, graphUIWrapper) {
        let self = this;
        this.parent = parent;
        this.graphUIWrapper = graphUIWrapper;
        // Create the background div
        this.div = $(document.createElement("div"));
        this.div.attr({
            class: "graphchecker_overlay",
            tabindex: 0
        });
        $(this.div).on('click', function () {
            // Hide the background element only after the CSS transition has finished
            self.div.removeClass('visible');
            setTimeout(function () {
                self.div.css('display', 'none');
                $('body').removeClass('unscrollable');

                // Enable the resizing of the graph interface wrapper again
                self.graphUIWrapper.enableResize();
            }.bind(this), 500);
        });

        // Create the dialog div
        this.divDialog = $(document.createElement("div"));
        this.divDialog.attr({
            class: 'dialog',
            tabindex: 0
        });
        $(this.divDialog).on('click', function () {
            return false;  // avoid bubbling to the backdrop
        });
        this.div.append(this.divDialog);
    }

    /**
     * Function: setHelpText
     * Creates and sets the help text, used in the help overlay, based on the graph parameters and characteristics
     *
     * Parameters:
     *    graphUi - The graphUi object
     *    templateParams - The parameters used for defining the graph
     *    isTypeFunc - A callable reference to the GraphUI.isType function
     *    allowedEditsFunc - A callable reference to the GraphUI.allowEdits function
     */
    HelpOverlay.prototype.setHelpText = function(graphUi, templateParams, isTypeFunc, allowedEditsFunc) {
        let isFSM = isTypeFunc(this.parent, graphUi, util.Type.FSM);
        let isPetri = isTypeFunc(this.parent, graphUi, util.Type.PETRI);

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

        let hasDrawMode = allowedEditsFunc(this.parent, util.Edit.ADD_VERTEX) ||
            allowedEditsFunc(this.parent, util.Edit.ADD_EDGE);
        let canEditVertex = allowedEditsFunc(this.parent, util.Edit.ADD_VERTEX);
        let canEditEdge = allowedEditsFunc(this.parent, util.Edit.ADD_EDGE);
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
        if (allowedEditsFunc(this.parent, util.Edit.VERTEX_LABELS)) {
            labelEditableList.push(node);
        }
        if (allowedEditsFunc(this.parent, util.Edit.EDGE_LABELS)) {
            labelEditableList.push(edge);
        }
        let labelEditable = labelEditableList.join("/");
        let aLabelEditable = (labelEditableList[0] === "edge" ? "an " : "a ") + labelEditable;

        let colorEditableList = [];
        if (allowedEditsFunc(this.parent, util.Edit.VERTEX_COLORS)) {
            colorEditableList.push(node);
        }
        if (allowedEditsFunc(this.parent, util.Edit.EDGE_COLORS)) {
            colorEditableList.push(edge);
        }
        let colorEditable = colorEditableList.join("/");
        let aColorEditable = (colorEditableList[0] === "edge" ? "an " : "a ") + colorEditable;

        let highlightableList = [];
        if (templateParams.highlight_vertices) {
            highlightableList.push(node);
        }
        if (templateParams.highlight_edges) {
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

        if (isFSM && allowedEditsFunc(this.parent, util.Edit.FSM_FLAGS)) {
            selectModeText += "<li><b>Mark state as initial/final:</b> &nbsp;"
                + "Select a state and click the initial/final checkboxes in the toolbar.</li>";
        }

        if (isPetri && allowedEditsFunc(this.parent, util.Edit.PETRI_MARKING)) {
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

        // Sets the HTML help text (i.e. the concatenation of multiple texts) to the dialog object
        let text = introductoryText + selectModeText + drawModeText + undoText;
        this.divDialog.append(text);
    };

    return {
        HelpOverlay: HelpOverlay
    };

});