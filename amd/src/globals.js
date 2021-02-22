// Global values used in the the program

// Pixel margin used when snapping. If one node is within this distance, either horizontally or vertically, from another
// node which is not selected, it will be snapped, either horizontally or vertically w.r.t the other node
const SNAP_TO_PADDING = 6;

// Pixels offset for a duplicate link
const DUPLICATE_LINK_OFFSET = 16;

// Denotes the extra pixels added to make selecting nodes/edges easier
const HIT_TARGET_PADDING = 6;

// The default node radius in pixels. The input template parameter noderadius can override this
const DEFAULT_NODE_RADIUS = 26;

// Denotes the padding space (horizontally) between the text and the node border in pixels, when the text is inside the
// node
const TEXT_NODE_HORIZONTAL_PADDING = 4;

// Denotes the padding space (vertically) between the text and the node border in pixels, when the text is outside the
// node
const TEXT_NODE_VERTICAL_PADDING = 12;

// The default font size in pixels. The input template parameter fontsize can override this
const DEFAULT_FONT_SIZE = 20;

// The range (inclusive) for entering the number of tokens for petri nets
const NUMBER_TOKENS_INPUT_RANGE = {
    min: 0,
    max: 100,
}; //TODO: assure that these values are met when saving (double check). //if > 100, set to 100. If <0 or a char, set to 0

// The length of the initial FSM node's incoming link in pixels
const INITIAL_FSM_NODE_LINK_LENGTH = 25;

// The maximum number of undo-redo commands the user can issue
const MAX_UNDO_REDO = 100;
