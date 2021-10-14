# Tests for undirected graphs using igraph.

import igraph
from utilities import filter_orig_name
from treeUtilities import *

def matchesDiagram(student_answer, graph_answer):
    if not student_answer.isomorphic(graph_answer):
        return {'correct': False,
            'feedback': 'mismatched graph'
            }
    for e in student_answer.es:
        eSource = student_answer.vs[e.source]
        eTarget = student_answer.vs[e.target]
        try:
            fSource = graph_answer.vs.find(name=eSource['name']) 
            fTarget = graph_answer.vs.find(name=eTarget['name'])
        except:
            return {'correct': False,
                    'feedback': 'missing labeled vertex'
                   }
        #if no edge is present in f between these vertices
        if (graph_answer.get_eid(fSource, fTarget, directed=False, error=False) < 0):
            return {'correct': False,
                    'feedback': 'missing edge'
                   }
        #if not same orientation
        if ((eSource['y'] < eTarget['y']) != (fSource['y'] < fTarget['y'])):
            return {'correct': False,
                    'feedback': 'vertical order'
                   }
    return {'correct': True}