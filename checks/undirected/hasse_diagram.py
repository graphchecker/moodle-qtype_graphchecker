# Tests for undirected graphs using igraph.

import igraph
import utilities

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

def matchesDiagram(student_answer, graph_answer):
    if not student_answer.isomorphic(graph_answer):
        return {'correct': False,
                'feedback': 'Error: graph does not match expected graph.'}
    for e in student_answer.es:
        eSource = student_answer.vs[e.source]
        eTarget = student_answer.vs[e.target]
        fSource = graph_answer.vs.find(name=eSource['name']) 
        fTarget = graph_answer.vs.find(name=eTarget['name'])
        #if no edge is present in f between these verties
        if (graph_answer.get_eid(fSource, fTarget, directed=False, error=False) < 0):
            return {'correct': False,
                'feedback': 'Error: graph does not match expected graph. Missing edge.'}
        #if not same orientation
        if ((eSource['y'] < eTarget['y']) != (fSource['y'] < fTarget['y'])):
            return {'correct': False, 'feedback': 'Edges do not match expected edges or vertical ordering incorrect.'}
    return {'correct': True}