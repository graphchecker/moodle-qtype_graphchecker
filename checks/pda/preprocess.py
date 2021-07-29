import json

def preprocess(graph):
    graph = json.loads(graph)

    text = ""

    final_states = []
    state_labels_seen = set()
    for state in graph['vertices']:
        if (not 'label' in state) or (state['label'] == ''):
            raise Exception("Automaton contains a state without a label")
        label = state['label']
        if label in state_labels_seen:
            raise Exception("Automaton contains duplicate state '" + label + "'")
        state_labels_seen.add(label)
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

        if len(a) != 4 or a[1] != ',':
            raise Exception('Invalid transition label "' + a + '" (correct syntax is "a,xy" where "a" is the input symbol and "x" and "y" are the symbols read from and written to the stack, respectively)')
        text += p + " " + q + " " + a + "\n"

    return text
