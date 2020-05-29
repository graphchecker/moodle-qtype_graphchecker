# Tests for directed graphs using igraph.

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

diameter = _make_integer_checker('diameter', 'Diameter')
edge_count = _make_integer_checker('ecount', 'Edge count')
girth = _make_integer_checker('girth', 'Girth')
radius = _make_integer_checker('radius', 'Radius')
vertex_count = _make_integer_checker('vcount', 'Vertex count')

def isomorphism(student_answer, sample_answer, preload_answer):
    if student_answer.isomorphic(sample_answer):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Your graph was not isomorphic to the given answer'}

def vertex_degrees(student_answer, sample_answer, preload_answer, degree_type, expected):
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

