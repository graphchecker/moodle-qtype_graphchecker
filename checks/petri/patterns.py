"""
This file implements all 'patterns' checks for graphs of type petri.
These checks correspond to the 'Patterns' checks in the requirements document.
The 'patterns.json' file describes every available check and which function is linked to that check.
It also describes the types of the parameters for those functions.
"""


def has_sub_graph(student_answer, sample_answer, preload_answer, sub_graph):
    """
    Checks if the student_answer PetriNet contains the exact sub graph in the sub_graph PetriNet.
    The student_answer needs to contain all nodes that are in the sub_graph, edges between nodes
    that are in sub_graph need to be present in the student_answer and the student_answer cannot
    have any edges between nodes that are also in the sub_graph if those edges are not in the sub_graph.
    The marking of all places in the sub_graph also needs to be equal to the marking of those places
    in the student_answer.
    """
    # Maps labels to objects in the student graph
    node_map = {}
    for p in student_answer.places:
        node_map[p.name] = p
    for t in student_answer.transitions:
        node_map[t.name] = t

    # Check if all places match the arcs
    for p in sub_graph.places:
        if p.name not in node_map:
            return {'correct': False,
                    'feedback': 'Place {0} is in sub graph but not in answer'.format(p.name)}

        # Check markings
        if p.properties['tokens'] != node_map[p.name].properties['tokens']:
            return {'correct': False,
                    'feedback': 'Place {0} has {1} tokens while '
                                'it should have {2} tokens.'.format(p.name, node_map[p.name].properties['tokens'],
                                                                    p.properties['tokens'])}

        # Check if all outgoing arcs are present in the student_answer
        for a in p.out_arcs:
            # List of all outgoing targets from this place in student_answer
            targets = [a.target for a in node_map[p.name].out_arcs]
            # Check if the target of this arc also is the target of an outgoing arc in student_answer
            if node_map[a.target.name] not in targets:
                return {'correct': False,
                        'feedback': 'Place {0} does not have an outgoing arc to transition {1}.'
                                    ' The sub graph does have this transition.'.format(p.name, a.target.name)}
        # Do same check for ingoing arcs
        for a in p.in_arcs:
            sources = [a.source for a in node_map[p.name].in_arcs]
            if node_map[a.source.name] not in sources:
                return {'correct': False,
                        'feedback': 'Place {0} does not have an in coming arc from transition {1}.'
                                    ' The sub graph does have this transition.'.format(p.name, a.source.name)}

    # Check if all transitions match the arcs
    for t in sub_graph.transitions:
        if t.name not in node_map:
            return {'correct': False,
                    'feedback': 'Transition {0} is in sub graph but not in answer'.format(t.name)}

        for a in t.out_arcs:
            targets = [a.target for a in node_map[t.name].out_arcs]
            if node_map[a.target.name] not in targets:
                return {'correct': False,
                        'feedback': 'Transition {0} does not have an outgoing arc to place {1}.'
                                    ' The sub graph does have this transition.'.format(t.name, a.target.name)}
        for a in t.in_arcs:
            sources = [a.source for a in node_map[t.name].in_arcs]
            if node_map[a.source.name] not in sources:
                return {'correct': False,
                        'feedback': 'Transition {0} does not have an in coming arc from place {1}.'
                                    ' The sub graph does have this transition.'.format(t.name, a.source.name)}

    # Check if student graph contains arcs that should not be there
    sub_graph_labels = [p.name for p in sub_graph.places.union(sub_graph.transitions)]
    for arc in student_answer.arcs:
        # Ignore arcs that are not within the nodes in sub_graph
        if arc.source.name not in sub_graph_labels or arc.target.name not in sub_graph_labels:
            continue

        # See if this arc also exists in sub_graph
        found = False
        for other_arc in sub_graph.arcs:
            if other_arc.source.name == arc.source.name and other_arc.target.name == arc.target.name:
                found = True
        if not found:
            return {'correct': False,
                    'feedback': 'Student answer contains arc {0} that is not present in the given sub '
                                'graph'.format(arc)}

    return {'correct': True}
