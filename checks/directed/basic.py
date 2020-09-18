# Tests for directed graphs using igraph.

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

diameter = _make_integer_checker('diameter', 'Diameter')
edge_count = _make_integer_checker('ecount', 'Edge count')
girth = _make_integer_checker('girth', 'Girth')
radius = _make_integer_checker('radius', 'Radius')
vertex_count = _make_integer_checker('vcount', 'Vertex count')

def isomorphism(student_answer, expected):
    if (student_answer.isomorphic(expected)):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'The graph is not isomorphic to the expected answer'}

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
            if (eSource == fSource and eTarget == fTarget):
                if e['highlighted'] != f['highlighted']:
                    return {'correct': False, 'feedback': 'Highlighted edges do not match'}
                break;
        
    return {'correct': True}

def vertex_degrees(student_answer, degree_type, expected):
    if degree_type == "indegree":
        mode = igraph.IN
    elif degree_type == "outdegree":
        mode = igraph.OUT
    else:
        mode = igraph.ALL

    for v in student_answer.vs:
        if v.degree(mode=mode) != expected:
            v_name = 'some vertex' if not v['name'] else 'vertex ' + v['name']
            return {'correct': False,
                    'feedback': ('All vertices should have {0} {1}, ' +
                        'but {2} has {0} {3}').format(
                        degree_type, expected, v_name, v.degree(mode=mode))}
    return {'correct': True}

