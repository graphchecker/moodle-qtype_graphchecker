# Tests for undirected graphs using igraph.

import igraph
from utilities import filter_orig_name
from treeUtilities import *

def binaryTree(student_answer, downwards):
    if downwards == "top":
        down = True
    elif downwards == "bottom":
        down = False
    else:
        raise Exception('Unknown parameter value supplied. Contact support.')

    root = 0
    for v in student_answer.vs:
        split = splitParentChildren(v, down)
        if split == None:
            return {'correct': False,
                    'feedback': 'same height of nodes'}
        (par, chil) = split
        if len(par) > 1:
            return {'correct': False,
                    'feedback': 'too many parents',
                    'vertexLabel': filter_orig_name(v)
                    }
        elif len(par) == 0:
            root += 1
        if len(chil) > 2:
            return {'correct': False,
                    'feedback': 'too many children',
                    'vertexLabel': filter_orig_name(v)
                    }
    if root > 1:
        return {'correct': False,
                'feedback': 'too many roots'}
    return {'correct': True }

def binarySearchTree(student_answer, downwards):
    bTree = binaryTree(student_answer, downwards)
    if not bTree['correct']:
        return bTree

    labels = []
    for v in student_answer.vs:
        try:
            label = filter_orig_name(v)
            labels.append(int(label))
        except:
            return {'correct': False,
                    'feedback': 'label not numerical',
                    'vertexLabel' : filter_orig_name(v)
                   }
                    
    labels.sort()
    iOrder = inOrderTraversal(student_answer, labels, downwards)
    if not iOrder['correct']:
        return {'correct': False, 'feedback': 'not sorted order'}
    else:
        return {'correct': True}

def nodeDepth(student_answer, label, depth, downwards):
    if downwards == "top":
        down = True
    elif downwards == "bottom":
        down = False
    else:
        raise Exception('Unknown parameter value supplied. Contact support.')
        
    for v in student_answer.vs:
        if filter_orig_name(v) == label:
            vertex = v
            dep = 0
            while not v == None:
                split = splitParentChildren(v, down)
                if split == None:
                    return {'correct': False,
                            'feedback': 'layout problem'}
                (par, chil) = split
                if len(par) > 1:
                    return {'correct': False,
                            'feedback': 'layout problem'}
                elif len(par) == 1:
                    dep += 1
                    v = par[0]
                elif dep == depth:
                    return {'correct': True}
                else:
                    return {'correct': False,
                            'feedback': 'depth wrong',
                            'vertexLabel': label,
                            'depthReal': dep,
                            'depthExpected': depth
                            }
    return {'correct': False,
            'feedback': 'missing vertex',
            'vertexLabel': label
           }
           
def treeHeight(student_answer, height, downwards):
    if downwards == "top":
        down = True
    elif downwards == "bottom":
        down = False
    else:
        raise Exception('Unknown parameter value supplied. Contact support.')

    root = findRoot(student_answer, downwards)
    if (root == None):
        return {'correct': False,
                'feedback': 'layout problem'}

    heightData = computeHeight(root, downwards)
    if (not heightData['correct']):
        return heightData
    elif (heightData['height'] == height):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'height wrong',
                'heightReal': heightData['height'],
                'heightExpected': height
               }

#helper
def computeHeight(node, downwards):
    split = splitParentChildren(node, downwards)
    if split == None:
        return {'correct': False,
                'feedback': 'layout problem'}
    (parent, children) = split
    height = -1
    for child in children:
        heightData = computeHeight(child, downwards)
        if (not heightData['correct']):
            return heightData
        height = max(height, heightData['height'])
    return {'correct': True,
            'height': height+1}

def traverse(node, labels, downwards):
    exc = None
    (left,right) = children(node, downwards)
    if (not left == None):
        (labels, exc) = traverse(left, labels, downwards)
    if (len(labels) == 0):
        return (labels, {'correct':False, "feedback": "too many nodes"})
    if (filter_orig_name(node) == str(labels[0])):
        labels.pop(0)
    else:
        return (labels, {'correct':False, "feedback": "mismatched labels", "vertexLabel": filter_orig_name(node), "expectedLabel": labels[0] } )
    if (not right == None):
        (labels, exc) = traverse(right, labels, downwards)
    return (labels, exc)

def inOrderTraversal(student_answer, labels, downwards):
    if downwards == "top":
        down = True
    elif downwards == "bottom":
        down = False
    else:
        raise Exception('Unknown parameter value supplied. Contact support.')

    #find the root
    #throw error if there is more than one root, or if a node has multiple parents
    root = findRoot(student_answer, downwards)
    
    #check if a problem was encountered
    if (root == None):
        return {'correct': False,
                'feedback': 'layout problem'}

    (labels, exc) = traverse(root, labels, downwards)
    if not exc == None:
        return exc
    elif (len(labels) > 0):
        return {'correct': False,
                'feedback': 'too few nodes',
                'missingLabelsSize': len(labels)
               }
    return {'correct': True}

def inLeaf(student_answer, labels, downwards):
    if downwards == "top":
        down = True
    elif downwards == "bottom":
        down = False
    else:
        raise Exception('Unknown parameter value supplied. Contact support.')

    for v in student_answer.vs:
        v_orig = filter_orig_name(v);
        if v_orig in labels:
            split = splitParentChildren(v, down)
            if split == None:
                return None
            (par, chil) = split
            if len(chil) != 0:
                return {'correct': False,
                        'feedback': 'not in leaf',
                        'element': v_orig
                       }
            labels.remove(v_orig)
    if (len(labels) != 0):
       return {'correct': False,
               'feedback': "missing element",
               'exampleElement': labels[0]
              }
    else:
        return {'correct': True}