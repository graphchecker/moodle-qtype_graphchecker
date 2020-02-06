# Tests for directed graphs using igraph.

import igraph

# helper methods
def _to_igraph(graph):
    g = igraph.Graph(directed=True)
    for vertex in graph['nodes']:
        g.add_vertex(name=vertex[0])
    for edge in graph['edges']:
        g.add_edge(edge[0], edge[1], label=edge[2])
    return g

def _make_integer_checker(method_name, readable_name):
    def result(student_answer, sample_answer, preload_answer,
        expected):
        g = _to_igraph(student_answer)
        actual = getattr(g, method_name)()
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
    g1 = _to_igraph(student_answer)
    g2 = _to_igraph(sample_answer)
    if g1.isomorphic(g2):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Your graph was not isomorphic to the given answer'}

def vertex_degrees(student_answer, sample_answer, preload_answer, degree_type, expected):
    g = _to_igraph(student_answer)

    if degree_type == "in":
        mode = igraph.IN
        mode_name = "indegree"
    elif degree_type == "out":
        mode = igraph.OUT
        mode_name = "outdegree"
    else:
        mode = igraph.ALL
        mode_name = "total degree"

    for v in g.vs:
        if v.degree(mode=mode) != expected:
            v_name = 'some vertex' if not v['name'] else 'vertex ' + v['name']
            return {'correct': False,
                    'feedback': ('All vertices should have {0} {1}, ' +
                        'but {2} has {0} {3}').format(
                        mode_name, expected, v_name, v.degree())}
    return {'correct': True}

