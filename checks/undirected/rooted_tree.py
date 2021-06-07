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
                    'feedback': 'Not a binary tree: two adjacent nodes are at the same height and have no clear relationship.'}
        (par, chil) = split
        if len(par) > 1:
            return {'correct': False,
                    'feedback': 'Not a binary tree: node {0} has two parents.'.format(filter_orig_name(v))}
        elif len(par) == 0:
            root += 1
        if len(chil) > 2:
            return {'correct': False,
                    'feedback': 'Not a binary tree: node {0} has more than two children.'.format(filter_orig_name(v))}
    if root > 1:
        return {'correct': False,
                'feedback': ('Not a binary tree: there is more than one root in the drawing.')}
    return {'correct': True }

#BROKEN
def binarySearchTree(student_answer, downwards):
    bTree = binaryTree(student_answer, downwards)
    if not bTree['correct']:
        return bTree

    labels = []
    for v in student_answer.vs:
        try:
            label = filter_orig_name(v)
            labels.append(label)
        except:
            return {'correct': False,
                    'feedback': "The label {0} is not numerical.".format(filter_orig_name(v))}
                    
    labels.sort()
    iOrder = inOrderTraversal(student_answer, labels, downwards)
    if not iOrder['correct']:
        return {'correct': False, 'feedback': "The elements do not form a sorted order on an in-order traversal"}
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
                            'feedback': 'There is a problem with the layout that makes distinguishing the tree impossible.'}
                (par, chil) = split
                if len(par) > 1:
                    return {'correct': False,
                            'feedback': 'There is a problem with the layout that makes distinguishing the tree impossible.'}
                elif len(par) == 1:
                    dep += 1
                    v = par[0]
                elif dep == depth:
                    return {'correct': True}
                else:
                    return {'correct': False,
                            'feedback': 'Vertex {0} should have depth {1} but has depth {2}'.format(label, depth, dep)}
    return {'correct': False,
            'feedback': 'Vertex with label {0} could not be found.'.format(label)}

#helper
class IncorrectLabelsException(Exception):
    """Raised when the input labels don't match"""
    pass
    
#helper
def traverse(node, labels, downwards):
    (left,right) = children(node, downwards)
    if (not left == None):
        labels = traverse(left, labels, downwards)
    if (filter_orig_name(node) == labels[0]):
        labels.pop(0)
    else:
        raise IncorrectLabelsException("Labels do not match at node: {0} and label: {1}".format(filter_orig_name(node),labels[0]))
    if (not right == None):
        labels = traverse(right, labels, downwards)
    return labels

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
                'feedback': 'There is a problem with the layout that makes distinguishing the heap impossible.'}

    try:
        labels = traverse(root, labels, downwards)
        if (len(labels) > 0):
            return {'correct': False, 'feedback': "Expected {0} additional labels to be found.".format(len(labels))}
    except IncorrectLabelsException as e:
        return {'correct': False, 'feedback': str(e)}
        
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
                return {'correct': False, 'feedback': "Element {0} was not in a leaf".format(v_orig)}
            labels.remove(v_orig)
    if (len(labels) != 0):
       return {'correct': False, 'feedback': "Not all required elements are in a leaf"}
    else:
        return {'correct': True}