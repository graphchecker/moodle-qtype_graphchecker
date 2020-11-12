def preprocess(graph):
    text = ""

    for state in graph['vertices']:
        if not 'label' in state:
            raise Exception("Automaton contains a state without a label")
        if state['initial']:
            text += "initial " + state['label'] + "\n"
        if state['final']:
            text += "final " + state['label'] + "\n"

    for transition in graph['edges']:
        if transition['from'] == -1:
            continue  # ignore the initial edge
        
        if not 'label' in transition:
            raise Exception("Automaton contains a transition without a label")
        
        p = graph['vertices'][transition['from']]['label']
        q = graph['vertices'][transition['to']]['label']
        a = transition['label']
        text += p + " " + q + " " + a + "\n"

    return text
