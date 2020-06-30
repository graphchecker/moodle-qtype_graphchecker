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

edge_count = _make_integer_checker('ecount', 'Edge count')
vertex_count = _make_integer_checker('vcount', 'Vertex count')

def connected(student_answer, sample_answer, preload_answer):
    if (student_answer.is_connected(False)):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': ('Graph is not connected')}

def sumEdgeWeights(student_answer, sample_answer, preload_answer, expected):
    weight = 0
    for e in student_answer.es:
        edgeweight = int(e['label'])
        weight = weight + edgeweight
    if weight == expected:
        return {'correct': True}
    else:
        return {'correct': False, 'feedback': 'The sum of edge weights did not match the required sum of edge weights.'}

def layout(student_answer, sample_answer, preload_answer):
    if not student_answer.isomorphic(sample_answer):
        return {'correct': False,
                'feedback': 'Your graph was not isomorphic to the given answer'}

    #check x-order and y-order layout is the same
    xListStudent = sorted(student_answer.vs, key=lambda v: v["x"], reverse=False)
    yListStudent = sorted(student_answer.vs, key=lambda v: v["y"], reverse=False)
    
    xListSample = sorted(sample_answer.vs, key=lambda v: v["x"], reverse=False)
    yListSample = sorted(sample_answer.vs, key=lambda v: v["y"], reverse=False)
    
    for ((stud1, stud2), (samp1, samp2)) in zip((zip(xListStudent,xListStudent[1:])), zip(yListStudent,yListStudent[1:])):
        if not (stud1["x"] < stud2["x"]) == (samp1["x"] < samp2["x"]):
            return {'correct': False,
                'feedback': 'The general layout of your graph did not match the sample answer.'}
    return {'correct': True}