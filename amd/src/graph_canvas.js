/**
 * Implementation for the wrapper of the graph's canvas object.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/graphutil'], function ($, util) {
    /**
     * A GraphCanvas is a wrapper for a Graph's HTML canvas object.
     *
     * @param parent    The parent of this object
     * @param canvasId  The id value used for the canvas
     * @param w         The width of the canvas
     * @param h         The height of the canvas
     * @constructor
     */
    function GraphCanvas(parent, canvasId, w, h) {
        // Constructor, given the Graph that owns this canvas, the
        // required canvasId and the height and width of the wrapper that
        // encloses the Canvas.

        this.parent = parent;
        this.canvas = $(document.createElement("canvas"));
        this.canvas.attr({
            id: canvasId,
            class: "graphchecker_graphcanvas",
            tabindex: 1 // So canvas can get focus.
        });
        this.canvas.css({'background-color': util.Color.WHITE});

        this.canvas.on('mousedown', function (e) {
            return parent.mousedown(e);
        });

        this.canvas.on('mouseup', function (e) {
            return parent.mouseup(e);
        });

        // Added so that the mouseup event is executed when the mouse leaves the graph UI canvas
        this.canvas.on('mouseenter', function (e) {
            return parent.mouseenter(e);
        });

        // Added so that the mouseup event is executed when the mouse leaves the graph UI canvas
        this.canvas.on('mouseleave', function (e) {
            return parent.mouseleave(e);
        });

        this.canvas.on('keydown', function (e) {
            return parent.keydown(e);
        });

        this.canvas.on('keyup', function (e) {
            return parent.keyup(e);
        });

        this.canvas.on('mousemove', function (e) {
            return parent.mousemove(e);
        });

        this.canvas.on('keypress', function (e) {
            return parent.keypress(e);
        });

        this.resize = function (w, h) {
            // Resize to given dimensions.
            this.canvas.attr("width", w);
            this.canvas.attr("height", h);
        };

        this.resize(w, h);
    }

    return {
        GraphCanvas: GraphCanvas
    };

});