# Tests for undirected graphs using igraph.

import igraph

#helper
def filter_orig_name(v):
    return v['name'].split("_")[1]

#helper
def splitParentChildren(v):
    parents = []
    children = []
    
    for w in v.neighbors():
        if w['y'] < v['y']:
            parents.append(w)
        elif w['y'] > v['y']:
            children.append(w)
        else:
            return None
    return (parents, children)
    
#helper - return root or None if multiple roots or unclear layout
def findRoot(student_answer):
    root = None
    for v in student_answer.vs:
        split = splitParentChildren(v)
        if split == None:
            return None
        (par, chil) = split
        if len(par) == 0 and root == None:
            #print(filter_orig_name(v))
            root = v
        elif len(par) == 0 and not root == None:
            #print("double")
            #print(filter_orig_name(v))
            return None
    return root

def BinaryTreeStructure(student_answer):
    root = 0
    for v in student_answer.vs:
        split = splitParentChildren(v)
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

def NodeDepth(student_answer, label, depth):
    for v in student_answer.vs:
        if filter_orig_name(v) == label:
            vertex = v
            dep = 0
            while not v == None:
                split = splitParentChildren(v)
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
