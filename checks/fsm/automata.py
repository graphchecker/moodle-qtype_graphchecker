# Tests for DFAs.

from automata.automata_checker import check_dfa_for_given_language, check_nfa_for_given_language


def _to_automaton(graph):
    initial_states = set([])
    final_states = set([])
    states = set([])
    transitions = []
    for vertex in graph['vertices']:
        state = vertex['label']
        states.add(state)
        if vertex['accepting']:
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


def dfa_for_given_language(student_answer, sample_answer, preload_answer, language):
    states, transitions, initial_states, final_states = _to_automaton(student_answer)
    return check_dfa_for_given_language(states, transitions, initial_states, final_states, language)


def nfa_for_given_language(student_answer, sample_answer, preload_answer, language):
    states, transitions, initial_states, final_states = _to_automaton(student_answer)
    return check_nfa_for_given_language(states, transitions, initial_states, final_states, language)
