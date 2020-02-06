# Tests for FSMs using igraph.

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
        if actual == int(expected):
            return {'correct': True}
        else:
            return {'correct': False,
                    'feedback': '{0} was {1}, expected {2}'.format(
                        readable_name, actual, expected)}
    return result

state_count = _make_integer_checker('vcount', 'State count')
transition_count = _make_integer_checker('ecount', 'Transition count')

