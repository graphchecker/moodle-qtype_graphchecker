def has_sub_graph(student_answer, sub_graph):
    # Maps labels to the object in the student graph
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

        for a in p.out_arcs:
            targets = [a.target for a in node_map[p.name].out_arcs]
            if node_map[a.target.name] not in targets:
                return {'correct': False,
                        'feedback': 'Place {0} does not have an outgoing arc to transition {1}.'
                                    ' The sub graph does have this transition.'.format(p.name, a.target.name)}
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
        if arc.source.name not in sub_graph_labels or arc.target.name not in sub_graph_labels:
            continue
        found = False
        for other_arc in sub_graph.arcs:
            if other_arc.source.name == arc.source.name and other_arc.target.name == arc.target.name:
                found = True
        if not found:
            return {'correct': False,
                    'feedback': 'Student answer contains arc {0} that is not present in the given sub '
                                'graph'.format(arc)}

    return {'correct': True}