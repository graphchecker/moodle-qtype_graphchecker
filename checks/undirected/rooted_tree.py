# Tests for undirected graphs using igraph.

import igraph

#helper
def filter_orig_name(v):
    return v['name'].split("_")[1]

#helper - return root or None if multiple roots or unclear layout
def findRoot(student_answer, down):
    root = None
    for v in student_answer.vs:
        split = splitParentChildren(v, down)
        if split == None:
            return None
        (par, chil) = split
        if len(par) == 0 and root == None:
            root = v
        elif len(par) == 0 and not root == None:
            return None
    return root

#helper
def children(v, down):
    split = splitParentChildren(v, down)
    (par, chil) = split
    if len(chil) == 0:
        return (None, None)
    elif len(chil) == 1:
        if chil[0]['x'] < v['x']:
            return (chil[0], None)
        else:
            return (None, chil[0])
    else:
        if chil[0]['x'] < chil[1]['x']:
            return (chil[0], chil[1])
        else:
            return (chil[1], chil[0])

#helper
def splitParentChildren(v, down):
    parents = []
    children = []
    
    for w in v.neighbors():
        if (w['y'] < v['y'] and down) or (w['y'] > v['y'] and not down):
            parents.append(w)
        elif (w['y'] > v['y'] and down) or (w['y'] < v['y'] and not down):
            children.append(w)
        else:
            return None
    return (parents, children)

def BinaryTree(student_answer, sample_answer, preload_answer, downwards):
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

def BinarySearchTree(student_answer, sample_answer, preload_answer, downwards):
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
        try:
            valueV = int(filter_orig_name(v))
        except:
            return {'correct': False,
                    'feedback': "The label {0} is not numerical.".format(filter_orig_name(v))}
        for w in chil:
            valueW = int(filter_orig_name(w))
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
                        'feedback': 'Layout mistake: Vertex {0} is a {1} child of vertex {2} , but {3}{4}[5}.'.format(filter_orig_name(w), direction, filter_orig_name(v),filter_orig_name(w), size, filter_orig_name(v))}
    if root > 1:
        return {'correct': False,
                'feedback': 'Not a binary tree: there is more than one root in the drawing.'}
    return {'correct': True }

def NodeDepth(student_answer, sample_answer, preload_answer, label, depth, downwards):
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
    print(filter_orig_name(node) + "  " + str(len(labels)))
    (left,right) = children(node, downwards)
    print (str(left) + "  " + str(right))
    if (not left == None):
        labels = traverse(left, labels, downwards)
    if (filter_orig_name(node) == labels[0]):
        labels.pop(0)
    else:
        print(len(labels))
        raise IncorrectLabelsException("Labels do not match at node: "+filter_orig_name(node) + " and label: " + str(labels[0]))
    if (not right == None):
        labels = traverse(right, labels, downwards)
    return labels

def InOrderTraversal(student_answer, sample_answer, preload_answer, labels, downwards):
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
            return {'correct': False, 'feedback': "Expected "+str(len(labels)) + " additional labels to be found."}
    except IncorrectLabelsException as e:
        return {'correct': False, 'feedback': str(e)}
        
    return {'correct': True}