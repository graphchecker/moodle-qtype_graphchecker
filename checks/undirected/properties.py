# Tests for undirected graphs using igraph.

import igraph

# helper methods
def _make_integer_checker(method_name, readable_name):
    def result(student_answer,
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
girth = _make_integer_checker('girth', 'Girth')
independence_number = _make_integer_checker('independence_number', 'Independence number')
radius = _make_integer_checker('radius', 'Radius')

def isomorphism(student_answer, graph_answer):
    if student_answer.isomorphic(graph_answer):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'The graph is not isomorphic to the expected answer'}

