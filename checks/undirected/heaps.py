# Tests for undirected graphs using igraph.

import igraph
from utilities import filter_orig_name
from treeUtilities import *

def maxheap_structure(student_answer):
    if (len(student_answer.vs) == 0):
        return {'correct': True}
    layout = heap_layout(student_answer)
    if not layout['correct']:
        return layout

    return check_heap_structure(student_answer, lambda a,b : a < b, "smaller")
    
def minheap_structure(student_answer):
    if (len(student_answer.vs) == 0):
        return {'correct': True}
    layout = heap_layout(student_answer)
    if not layout['correct']:
        return layout

    return check_heap_structure(student_answer, lambda a,b : a > b, "larger")

#-----------------
#helper functions
#-----------------
def check_heap_structure(student_answer, comparator, textual):
    #for each node, check that the children are smaller or equally large as the parent
    for v in student_answer.vs:
        split = splitParentChildren(v, True)
        if (split == None):
            return {'correct': False,
                    'feedback': 'layout problem'}
        (par, chil) = split
        valueV = int(filter_orig_name(v))
        for w in chil:
            valueW = int(filter_orig_name(w))
            if comparator(valueV, valueW):
                return {'correct': False,
                        'feedback': 'child parent wrong',
                        'vertexLabel1': filter_orig_name(v),
                        'greater_smaller': textual,
                        'vertexLabel2': filter_orig_name(w)}
    return {'correct': True}
    
def heap_layout(student_answer):
    #find the root
    #throw error if there is more than one root, or if a node has multiple parents
    root = findRoot(student_answer, True)
    
    #check if a problem was encountered
    if (root == None):
        return {'correct': False,
                'feedback': 'layout problem'}
    layer = [root]
    nextLayer = []
    noMoreChildren = False
    while len(layer) > 0:
        for v in layer:
            value = splitParentChildren(v, True)
            if (value == None):
                return {'correct': False,
                        'feedback': 'There is a problem with the layout that makes distinguishing the heap impossible.'}
            (par, chil) = value
            if noMoreChildren and len(chil) > 0:
                return {'correct': False,
                        'feedback': 'level incorrect'}
            if (len(chil) > 2):
                return {'correct': False,
                        'feedback': 'too many children',
                        'vertexLabel': filter_orig_name(v),
                       }
            elif len(chil) == 1:
                if chil[0]['x'] > v['x']:
                    return {'correct': False,
                            'feedback': 'missing left child',
                            'vertexLabel': filter_orig_name(v)
                           }
                noMoreChildren = True
            elif len(chil) == 0:
                noMoreChildren = True
            else:
                left_child = chil[0]
                right_child = chil[1]
                if left_child["x"] > right_child["x"]:
                    left_child  = chil[1]
                    right_child = chil[0]
                nextLayer.append(left_child)
                nextLayer.append(right_child)
        layer = nextLayer
        nextLayer = []
    return {'correct': True}

