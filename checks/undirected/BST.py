# Tests for undirected graphs using igraph.

import igraph

def filter_orig_name(v):
    return v['name'].split("_")[1]

def BST_layout(student_answer, sample_answer, preload_answer):
    for v in student_answer.vs:
        #throw an error if the label is not numerical
        if not (filter_orig_name(v).isnumeric()):
            return {'correct': False,
                    'feedback': ('Labels are not numeric, cannot be a BST')}

        valueV = int(filter_orig_name(v))
        #drawing is locally drawn fine (assuming it is a valid BST) if:
        # - there is at most one node above the current node
        # - for each child:
        # -    the child if right of the current node == the child is a bigger or equal value

        parents = 0
        for w in v.neighbors():
            if not filter_orig_name(w).isnumeric():
                return {'correct': False,
                        'feedback': ('Labels are not numeric, cannot be a BST')}
            valueW = int(filter_orig_name(w))
            if (v['y'] > w['y']):
                parents += 1
            #only checking children is sufficient for the layout
            elif v['x'] == w['x']:
                return {'correct': False,
                        'feedback': ("Layout mistake: Vertex " + filter_orig_name(v) + ' has a child that cannot be distinguished as a left or right child.')}
            else:
                vIsLeft    = v['x'] < w['x']
                equal      = valueV == valueW
                vIsSmaller = valueV < valueW
                if (not equal and vIsLeft != vIsSmaller):
                    direction = 'left'
                    size      = ' > '
                    if (vIsLeft):
                        direction = 'right'
                        size      = ' < '

                    return {'correct': False,
                            'feedback': ("Layout mistake: Vertex " + filter_orig_name(w) + ' is a ' + direction + ' child of vertex ' + filter_orig_name(v) + ', but ' + filter_orig_name(w) + size + filter_orig_name(v) + ".")}
        #more than 1 parent is a no-go
        if (parents > 1):
            return {'correct': False,
                    'feedback':  ('Node ' + str(v['name']) + ' has more than one parent in this layout')}
    return {'correct': True}