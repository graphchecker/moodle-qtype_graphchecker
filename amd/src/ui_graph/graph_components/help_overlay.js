/**
 * Implementation for the help overlay of the Graph UI application
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'qtype_graphchecker/ui_graph/graphutil'], function ($, util) {

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

        const hideDialogs = function() {
            // Hide the background element only after the CSS transition has finished
            self.div.removeClass('visible');
            setTimeout(function () {
                self.div.css('display', 'none');
                $('body').removeClass('unscrollable');

                // Enable the resizing of the graph interface wrapper again
                self.graphUIWrapper.enableResize();
            }.bind(this), 500);
        };

        this.div = $('<div/>')
            .addClass('backdrop')
            .on('click', hideDialogs);

        // Create the dialog div
        const $header = $('<div/>')
            .addClass('dialog-header')
            .append($('<div/>')
                .append($('<i/>').addClass('fa fa-times'))
                .addClass('btn btn-light close-button')
                .on('click', hideDialogs))
            .append('Help');

        this.divDialog = $('<div/>')
            .addClass('dialog')
            .append($header)
            .on('click', function(e) {
                e.stopPropagation();  // avoid bubbling to the backdrop
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
     */
    HelpOverlay.prototype.setHelpText = function(graphUi, templateParams) {
        let isFSM = graphUi.isType(graphUi, util.Type.FSM);
        let isPetri = graphUi.isType(graphUi, util.Type.PETRI);

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

        let hasDrawMode = graphUi.allowEdits(graphUi, util.Edit.EDIT_VERTEX) ||
            graphUi.allowEdits(graphUi, util.Edit.EDIT_EDGE);
        let canEditVertex = graphUi.allowEdits(graphUi, util.Edit.EDIT_VERTEX);
        let canEditEdge = graphUi.allowEdits(graphUi, util.Edit.EDIT_EDGE);
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
        //let editables = editableList.map(e => e + "s").join("/");

        let labelEditableList = [];
        if (graphUi.allowEdits(graphUi, util.Edit.VERTEX_LABELS)) {
            labelEditableList.push(node);
        }
        if (graphUi.allowEdits(graphUi, util.Edit.EDGE_LABELS)) {
            labelEditableList.push(edge);
        }
        let labelEditable = labelEditableList.join("/");
        let aLabelEditable = (labelEditableList[0] === "edge" ? "an " : "a ") + labelEditable;

        let colorEditableList = [];
        if (graphUi.allowEdits(graphUi, util.Edit.VERTEX_COLORS)) {
            colorEditableList.push(node);
        }
        if (graphUi.allowEdits(graphUi, util.Edit.EDGE_COLORS)) {
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

        const addIcon = "<i class=\"fa fa-pencil\"></i>";
        const moveIcon = "<i class=\"fa fa-arrows\"></i>";

        // Create the first part of the help text
        let introductoryText = "";
        /*if (hasDrawMode) {
            introductoryText += "<p>To enter your answer as a graph, you can use Select mode (to edit existing " + editables + ") "
                + "and Draw mode (to draw new " + editables + ").</p>"
                + "<p>Toggle between the modes by clicking "
                + "<i class=\"fa fa-mouse-pointer\"></i>"
                + " and "
                + "<i class=\"fa fa-pencil\"></i>. "
                + "Additionally, while in Select mode you can temporarily use Draw mode "
                + "by pressing the Ctrl key.</p>";
        } else {*/
            introductoryText += "<p>To draw and edit your answer, use the following functionality:</p>";
        //}

        let actionsText = "<ul class='dialog-help'>";
        if (canEditVertex) {
            if (isPetri) {
                actionsText += "<li><b>Create new place:</b> &nbsp;"
                    + "Go to Add mode (" + addIcon + "), "
                    + "click the "
                    + "<i class=\"fa fa-circle-o\"></i>"
                    + " button, and then on an empty space.</li>";
                actionsText += "<li><b>Create new transition:</b> &nbsp;"
                    + "Go to Add mode (" + addIcon + "), "
                    + "click the "
                    + "<i class=\"fa fa-square-o\"></i>"
                    + " button, and then on an empty space.</li>";
            } else {
                actionsText += "<li><b>Create new " + node + ":</b> &nbsp;"
                    + "Go to Add mode (" + addIcon + ") and "
                    + "click on an empty space.</li>";
            }
        }
        if (canEditEdge) {
            actionsText += "<li><b>Create new " + edge + ":</b> &nbsp;"
                + "Go to Add mode (" + addIcon + "), "
                + "click on " + aNode + " and drag to another " + node + ".</li>"
                + "<li><b>Create self-loop:</b> &nbsp;"
                + "Go to Add mode (" + addIcon + "), "
                + "click on " + aNode + " and drag to the same " + node + ".</li>";
        }

        actionsText += "<li><b>Select " + node + "/" + edge + ":</b> &nbsp;"
            + "Click the " + node + "/" + edge + ". "
            + "Hold Shift to add/subtract from the selection instead of replacing it.";
        actionsText += "<li><b>Move " + node + ":</b> &nbsp;"
            + "Go to Move mode (" + moveIcon + "), select the " + node + ", and drag it. "
            + "(You can do the same with " + anEdge + " to change its curvature.)";
        actionsText += "<li><b>Select several " + node + "s/" + edge + "s at once:</b> &nbsp;"
            + "Go to Move mode (" + moveIcon + ") and draw a rectangle by dragging from an empty space. "
            + "Everything inside the rectangle will be selected.";

        if (isFSM && graphUi.allowEdits(graphUi, util.Edit.FSM_FLAGS)) {
            actionsText += "<li><b>Mark state as initial/final:</b> &nbsp;"
                + "Select the state and click the initial/final checkboxes in the toolbar.</li>";
        }

        if (isPetri && graphUi.allowEdits(graphUi, util.Edit.PETRI_MARKING)) {
            actionsText += "<li><b>Edit marking:</b> &nbsp;"
                + "Select the place and edit its number of tokens using the field "
                + "in the toolbar.</li>";
        }

        if (labelEditable) {
            actionsText += "<li><b>Edit " + labelEditable + " label:</b> &nbsp;"
                + "Select " + aLabelEditable + " and edit the label text field "
                + "in the toolbar."
                /*+ "You can add a one-character subscript by adding an underscore followed "
                + "by the subscript (i.e., <i>a_1</i>). You can type Greek letters using a backslash followed by "
                + "the letter name (i.e., <i>\\alpha</i>).</li>"*/;
        }

        if (colorEditable) {
            actionsText += "<li><b>Edit " + colorEditable + " color:</b> &nbsp;"
                + "Select " + aColorEditable + " and pick a color from the color dropdown in the toolbar.</li>";
        }

        if (highlightable) {
            actionsText += "<li><b>Highlight " + highlightable + ":</b> &nbsp;"
                + "Select " + aHighlightable + " and select the highlight checkbox in the toolbar.</li>";
        }

        if (hasDrawMode) {
            actionsText += "<li><b>Delete " + editable + ":</b> &nbsp;"
                + "Select " + anEditable + " and click "
                + "<i class=\"fa fa-trash\"></i>, or press the 'Delete' (Windows/Linux) or 'Fn-Delete' (Mac) key.</li>";
        }
        actionsText += "</ul>";

        let undoText = "<br><p>You can undo and redo any changes you made with the "
            + "<i class=\"fa fa-undo\"></i>"
            + " and "
            + "<i class=\"fa fa-repeat\"></i>"
            + " buttons. If any " + node + " or " + edge + " has a gray shadow, "
            + " it is locked, meaning it cannot be edited.</p>";

        // Sets the HTML help text (i.e. the concatenation of multiple texts) to the dialog object
        let text = introductoryText + actionsText + undoText;
        this.divDialog.append(text);
    };

    return {
        HelpOverlay: HelpOverlay
    };

});
