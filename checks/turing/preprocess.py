import json

def preprocess(graph):
    graph = json.loads(graph)

    text = ""

    final_states = []
    state_labels_seen = set()
    for state in graph['vertices']:
        if (not 'label' in state) or (state['label'] == ''):
            raise Exception("Turing machine contains a state without a label")
        label = state['label']
        if label in state_labels_seen:
            raise Exception("Turing machine contains duplicate state '" + label + "'")
        state_labels_seen.add(label)
        if state['initial']:
            text += "initial " + state['label'] + "\n"
        if state['final']:
            final_states.append(state['label'])
    if len(final_states) > 0:
        text += "accept " + " ".join(final_states) + "\n"

    for transition in graph['edges']:
        if transition['from'] == -1:
            continue  # ignore the initial edge
        
        if (not 'label' in transition) or (transition['label'] == ''):
            raise Exception("Turing machine contains a transition without a label")
        
        p = graph['vertices'][transition['from']]['label']
        q = graph['vertices'][transition['to']]['label']
        a = transition['label']
        text += p + " " + q + " " + a + "\n"

    #raise Exception(text)
    return text
