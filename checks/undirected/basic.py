# Tests for undirected graphs using igraph.

import igraph

#helper
def filter_orig_name(v):
    return v['name'].split("_")[1]

# helper methods
def _make_integer_checker(method_name, readable_name):
    def result(student_answer, expected):
        actual = getattr(student_answer, method_name)()
        if actual == expected:
            return {'correct': True}
        else:
            return {'correct': False,
                    'feedback': '{0} was {1}, expected {2}'.format(
                        readable_name, actual, expected)}
    return result

def edge_count(student_answer, expected, highlighted):
    if highlighted == "only highlighted edges":
        onlyHighlighted = True
    else:
        onlyHighlighted = False
    count = 0
    for e in student_answer.es:
        if (not onlyHighlighted or e['highlighted']):
            count = count + 1
    if count == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Number of edges does not match expected number'}

def vertex_count(student_answer, expected, highlighted):
    if highlighted == "only highlighted vertices":
        onlyHighlighted = True
    else:
        onlyHighlighted = False
    count = 0
    for v in student_answer.vs:
        if (not onlyHighlighted or v['highlighted']):
            count = count + 1
    if count == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Number of vertices does not match expected number'}

def no_cycles(student_answer, highlighted):
    if highlighted == "only highlighted edges":
        onlyHighlighted = True
    else:
        onlyHighlighted = False

    tree_copy = student_answer.copy()
    if onlyHighlighted:
        tree_copy.es.select(highlighted=False).delete()
        span_tree = tree_copy.spanning_tree()
    else:
        span_tree = student_answer.spanning_tree()
    edgespan  = getattr(span_tree, "ecount")()
    edgegraph = getattr(tree_copy, "ecount")()
    if edgespan == edgegraph:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Your answer contains a cycle'}

def mst(student_answer):
    try:
        weights = [int(e['label']) for e in student_answer.es]
    except:
        return {'correct': False,
                'feedback': 'Not all edge labels are integer.'}
    span_tree = student_answer.spanning_tree(weights)
    weight = 0
    for e in span_tree.es:
        try:
            edgeweight = int(e['label'])
        except:
            return {'correct': False,
                    'feedback': 'The edge label {0} is not integer.'.format(e['label'])}
        weight = weight + edgeweight

    highlightSelect = "only highlighted edges"
    firstCheck = sumEdgeWeights(student_answer, weight, highlightSelect)
    if not firstCheck['correct']:
        return firstCheck
    secondCheck = no_cycles(student_answer, highlightSelect)
    if not secondCheck['correct']:
        return secondCheck
    thirdCheck = edge_count(student_answer, len(span_tree.es), highlightSelect)
    return thirdCheck

def connected(student_answer):
    if (student_answer.is_connected(False)):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Graph is not connected'}

def same_highlights(student_answer, expected):
    if not student_answer.isomorphic(expected):
        return {'correct': False,
                'feedback': 'Error: graph does not match expected graph.'}
    #inefficient
    for v in student_answer.vs:
        vName = filter_orig_name(v)
        for w in expected.vs:
            wName = filter_orig_name(w)
            if vName == wName:
                if v['highlighted'] != w['highlighted']:
                    return {'correct': False, 'feedback': 'Highlighted vertices do not match'}
                break;
    for e in student_answer.es:
        eSource = filter_orig_name(student_answer.vs[e.source])
        eTarget = filter_orig_name(student_answer.vs[e.target])
        for f in expected.es:
            fSource = filter_orig_name(expected.vs[f.source])
            fTarget = filter_orig_name(expected.vs[f.target])
            if (eSource == fSource and eTarget == fTarget) or (eSource == fTarget and eTarget == fSource):
                if e['highlighted'] != f['highlighted']:
                    return {'correct': False, 'feedback': 'Highlighted edges do not match'}
                break;
        
    return {'correct': True}

def sumEdgeWeights(student_answer, expected, highlighted):
    if highlighted == "only highlighted edges":
        onlyHighlighted = True
    else:
        onlyHighlighted = False
        
    weight = 0
    for e in student_answer.es:
        try:
            edgeweight = int(e['label'])
        except:
            return {'correct': False,
                    'feedback': 'The edge label {0} is not integer.'.format(e['label'])}
        if (not onlyHighlighted or e['highlighted']):
            weight = weight + edgeweight
    if weight == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'The sum of edge weights {0} did not match the required sum of edge weights {1}.'.format(weight,expected)}
