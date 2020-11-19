def preprocess(graph):
    text = ""

    final_states = []
    for state in graph['vertices']:
        if (not 'label' in state) or (state['label'] == ''):
            raise Exception("Automaton contains a state without a label")
        if state['initial']:
            text += "initial " + state['label'] + "\n"
        if state['final']:
            final_states.append(state['label'])
    if len(final_states) > 0:
        text += "final " + " ".join(final_states) + "\n"

    for transition in graph['edges']:
        if transition['from'] == -1:
            continue  # ignore the initial edge
        
        if (not 'label' in transition) or (transition['label'] == ''):
            raise Exception("Automaton contains a transition without a label")
        
        p = graph['vertices'][transition['from']]['label']
        q = graph['vertices'][transition['to']]['label']
        a = transition['label']
        text += p + " " + q + " " + a + "\n"

    return text
