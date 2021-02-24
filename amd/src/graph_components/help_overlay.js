/**
 * Implementation for the help overlay of the Graph UI application
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery'], function ($) {

    /**
     * Function: HelpOverlay
     * Constructor for the HelpOverlay (i.e. a help 'box') object
     *
     * Parameters:
     *    parent - The parent of this object in the HTML DOM
     *    divId - The id value for this HTML div object
     *    graphUIWrapper - The parent of this object in the HTML DOM
     */
    function HelpOverlay(parent, divId, graphUIWrapper) {
        let self = this;
        this.parent = parent;
        this.graphUIWrapper = graphUIWrapper;
        // Create the background div
        this.div = $(document.createElement("div"));
        this.div.attr({
            id: divId + '_background',
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
            id: divId + 'dialog',
            class: 'dialog',
            tabindex: 0
        });
        $(this.divDialog).on('click', function () {
            return false;  // avoid bubbling to the backdrop
        });
        this.div.append(this.divDialog);
    }

    /**
     * Function: insertHelpText
     * Sets the (HTML) help text of the help dialog
     *
     * Parameters:
     *    text - The text to be set
     */
    HelpOverlay.prototype.insertHelpText = function (text) {
        this.divDialog.append(text);
    };

    return {
        HelpOverlay: HelpOverlay
    };

});