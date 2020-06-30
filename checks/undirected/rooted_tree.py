# Tests for undirected graphs using igraph.

import igraph

#helper
def filter_orig_name(v):
    return v['name'].split("_")[1]

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
                    'feedback': ('Not a binary tree: two adjacent nodes are at the same height and have no clear relationship.')}
        (par, chil) = split
        if len(par) > 1:
            return {'correct': False,
                    'feedback': ('Not a binary tree: node ' + filter_orig_name(v) + ' has two parents.')}
        elif len(par) == 0:
            root += 1
        if len(chil) > 2:
            return {'correct': False,
                    'feedback': ('Not a binary tree: node ' + filter_orig_name(v) + ' has more than two children.')}
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
                    'feedback': ('Not a binary tree: two adjacent nodes are at the same height and have no clear relationship.')}
        (par, chil) = split
        if len(par) > 1:
            return {'correct': False,
                    'feedback': ('Not a binary tree: node ' + filter_orig_name(v) + ' has two parents.')}
        elif len(par) == 0:
            root += 1
        if len(chil) > 2:
            return {'correct': False,
                    'feedback': ('Not a binary tree: node ' + filter_orig_name(v) + ' has more than two children.')}
        valueV = int(filter_orig_name(v))
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
                        'feedback': ("Layout mistake: Vertex " + filter_orig_name(w) + ' is a ' + direction + ' child of vertex ' + filter_orig_name(v) + ', but ' + filter_orig_name(w) + size + filter_orig_name(v) + ".")}
    if root > 1:
        return {'correct': False,
                'feedback': ('Not a binary tree: there is more than one root in the drawing.')}
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
                            'feedback': ('There is a problem with the layout that makes distinguishing the tree impossible.')}
                (par, chil) = split
                if len(par) > 1:
                    return {'correct': False,
                            'feedback': ('There is a problem with the layout that makes distinguishing the tree impossible.')}
                elif len(par) == 1:
                    dep += 1
                    v = par[0]
                elif dep == depth:
                    return {'correct': True}
                else:
                    return {'correct': False,
                            'feedback': ('Vertex ' + label + ' should have depth ' + str(depth) + ' but has depth ' + str(dep))}
    return {'correct': False,
            'feedback': ('Vertex with label ' + label + ' could not be found.')}