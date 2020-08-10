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

edge_count = _make_integer_checker('ecount', 'Edge count')
vertex_count = _make_integer_checker('vcount', 'Vertex count')

def connected(student_answer):
    if (student_answer.is_connected(False)):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Graph is not connected'}

def exact_same(student_answer, expected):
    if (student_answer.isomorphic(expected)):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Incorrect answer given'}

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
                'feedback': 'The sum of edge weights did not match the required sum of edge weights.'}
