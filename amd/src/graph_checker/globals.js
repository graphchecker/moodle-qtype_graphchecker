/**
 * Implementation for the global variables used in the GraphChecker UI
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(function() {

    function Globals() {
        // TODO: Make variables constant, see issue #172
        // Pixel margin used when snapping. If one node is within this distance, either horizontally or vertically, from another
        // node which is not selected, it will be snapped, either horizontally or vertically w.r.t the other node
        this.SNAP_TO_PADDING = 6;

        // Pixels offset for a duplicate link
        this.DUPLICATE_LINK_OFFSET = 16;

        // Denotes the extra pixels added to make selecting nodes/edges easier
        this.HIT_TARGET_PADDING = 6;

        // The default node radius in pixels. The input template parameter noderadius can override this
        this.DEFAULT_NODE_RADIUS = 26;

        // Denotes the padding space (horizontally) between the text and the node border in pixels, when the text is inside the
        // node
        this.TEXT_NODE_HORIZONTAL_PADDING = 4;

        // Denotes the padding space (vertically) between the text and the node border in pixels, when the text is outside the
        // node
        this.TEXT_NODE_VERTICAL_PADDING = 12;

        // The default font size in pixels. The input template parameter fontsize can override this
        this.DEFAULT_FONT_SIZE = 20;

        // The range (inclusive) for entering the number of tokens for petri nets
        this.NUMBER_TOKENS_INPUT_RANGE = {
            min: 0,
            max: 100,
        }; //TODO: assure that these values are met when saving (double check). //if > 100, set to 100. If <0 or a char, set to 0

        // The length of the initial FSM node's incoming link in pixels
        this.INITIAL_FSM_NODE_LINK_LENGTH = 25;

        // The maximum number of undo-redo commands the user can issue
        this.MAX_UNDO_REDO = 100;
    }

    return new Globals();
});
