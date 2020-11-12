def preprocess(graph):
    initial_states = set([])
    final_states = set([])
    states = set([])
    transitions = []

    for vertex in graph['vertices']:
        state = vertex['label']
        states.add(state)
        if vertex['final']:
            final_states.add(state)
    for edge in graph['edges']:
        if 'label' in edge:
            p = graph['vertices'][edge['from']]['label']
            q = graph['vertices'][edge['to']]['label']
            a = edge['label']
            transitions.append((p, a, q))
        else:
            state = graph['vertices'][edge['to']]['label']
            initial_states.add(state)
    return states, transitions, initial_states, final_states
