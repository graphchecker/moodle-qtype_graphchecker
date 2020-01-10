# Tests using igraph.

import igraph

# helper method
def to_igraph(graph):
    with open('tmpfile.edges', 'w') as tmpfile:
        for edge in graph['edges']:
            tmpfile.write(str(edge[0]) + ' ' + str(edge[1]) + '\n')
    return igraph.Graph.Read_Edgelist('tmpfile.edges', False)

def clique_number(student_answer, sample_answer, preload_answer,
        expected):
    g = to_igraph(student_answer)
    clique_number = g.clique_number()
    if clique_number == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Clique number was {0}, expected {1}'.format(clique_number, expected)}

def diameter(student_answer, sample_answer, preload_answer,
        expected):
    g = to_igraph(student_answer)
    diameter = g.diameter()
    if diameter == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Diameter was {0}, expected {1}'.format(diameter, expected)}

def girth(student_answer, sample_answer, preload_answer,
        expected):
    g = to_igraph(student_answer)
    girth = g.girth()
    if girth == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Girth was {0}, expected {1}'.format(girth, expected)}

def independence_number(student_answer, sample_answer, preload_answer,
        expected):
    g = to_igraph(student_answer)
    independence_number = g.independence_number()
    if girth == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Independence number was {0}, expected {1}'.format(independence_number, expected)}

def isomorphism(student_answer, sample_answer, preload_answer):
    g1 = to_igraph(student_answer)
    g2 = to_igraph(sample_answer)
    if g1.isomorphic(g2):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Your graph was not isomorphic to the given answer'}

def radius(student_answer, sample_answer, preload_answer,
        expected):
    g = to_igraph(student_answer)
    radius = g.radius()
    if radius == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Radius was {0}, expected {1}'.format(radius, expected)}

