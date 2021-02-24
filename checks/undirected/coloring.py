# Tests for undirected graphs using igraph.

import igraph
import utilities

def coloring(student_answer, noColors):
    colors = set()
    for v in student_answer.vs:
        colors.add(v['color'])
        for w in student_answer.neighbors(v):
            wVert = student_answer.vs[w]
            if wVert['color'] == v['color']:
                return {'correct': False, 'feedback' : 'Vertices \'{0}\' en \'{1}\' are adjacent and have the same color.'.format(filter_orig_name(v),filter_orig_name(wVert))}
    if len(colors) > noColors:
        return {'correct': False, 'feedback' : 'Too many colors used. Used {0} instead of {1} colors.'.format(len(colors),noColors)}
    return {'correct': True}