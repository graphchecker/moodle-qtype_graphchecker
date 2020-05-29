# Tests for undirected graphs using igraph.

import igraph

# helper methods
def _make_integer_checker(method_name, readable_name):
    def result(student_answer, sample_answer, preload_answer,
        expected):
        actual = getattr(student_answer, method_name)()
        if actual == expected:
            return {'correct': True}
        else:
            return {'correct': False,
                    'feedback': '{0} was {1}, expected {2}'.format(
                        readable_name, actual, expected)}
    return result

clique_number = _make_integer_checker('clique_number', 'Clique number')
diameter = _make_integer_checker('diameter', 'Diameter')
edge_count = _make_integer_checker('ecount', 'Edge count')
girth = _make_integer_checker('girth', 'Girth')
independence_number = _make_integer_checker('independence_number', 'Independence number')
radius = _make_integer_checker('radius', 'Radius')
vertex_count = _make_integer_checker('vcount', 'Vertex count')

def isomorphism(student_answer, sample_answer, preload_answer):
    if student_answer.isomorphic(sample_answer):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Your graph was not isomorphic to the given answer'}

def vertex_degrees(student_answer, sample_answer, preload_answer, expected):
    for v in student_answer.vs:
        if v.degree() != expected:
            v_name = 'some vertex' if not v['name'] else 'vertex ' + v['name']
            return {'correct': False,
                    'feedback': ('All vertices should have degree {0}, ' +
                        'but {1} has degree {2}').format(
                        expected, v_name, v.degree())}
    return {'correct': True}

def vertex_degree_at_most(student_answer, sample_answer, preload_answer, max_degree):
    for v in student_answer.vs:
        if v.degree() > max_degree:
            v_name = 'Some vertex' if not v['name'] else 'Vertex ' + v['name']
            return {'correct': False,
                    'feedback': ('{0} has degree ' +
                                 '{1}, but the maximum degree should be {2}').format(
                                 v_name, v.degree(), max_degree)}
    return {'correct': True}
    
def number_vertices_of_degree(student_answer, sample_answer, preload_answer, number_of_verts, degree):
    found = 0
    for v in student_answer.vs:
        if v.degree() == degree:
            found += 1
    
    if found != number_of_verts:
        return {'correct': False,
                'feedback': ('Number of vertices with degree {0}, is ' +
                             '{1}, but should be {2}').format(
                               degree, found, number_of_verts)}
    else:
        return {'correct': True}

