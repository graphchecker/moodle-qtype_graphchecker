import json

def preprocess(graph):
    graph = json.loads(graph)

    text = ""

    initial_states = []
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
            initial_states.append(state['label'])
        if state['final']:
            final_states.append(state['label'])
    if len(initial_states) != 1:
        raise Exception("Turing machine needs to have exactly one initial state. Your answer has " + str(len(initial_states)) + " initial states")
    text += "initial " + initial_states[0] + "\n"
    if len(final_states) > 1:
        raise Exception("Turing machine needs to have at most one accepting state. Your answer has " + str(len(final_states)) + " accepting states")
    if len(final_states) > 0:
        text += "accept " + final_states[0] + "\n"

    text += "blank _\n"

    for transition in graph['edges']:
        if transition['from'] == -1:
            continue  # ignore the initial edge
        
        if (not 'label' in transition) or (transition['label'] == ''):
            raise Exception("Turing machine contains a transition without a label")
        
        p = graph['vertices'][transition['from']]['label']
        q = graph['vertices'][transition['to']]['label']
        a = transition['label']

        if len(a) != 4 or a[2] != ',' or a[3] not in ['L', 'R']:
            raise Exception('Invalid transition label "' + a + '" (correct syntax is "ab,L" or "ab,R" where "a" and "b" are the symbols read from and written to the tape, respectively)')
        text += p + " " + q + " " + a + "\n"

    #raise Exception(text)
    return text
