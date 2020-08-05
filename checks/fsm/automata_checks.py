# Tests for DFAs.

from automata.automata_checker import check_dfa_for_given_language, check_nfa_for_given_language


def dfa_for_given_language(student_answer, language):
    states, transitions, initial_states, final_states = student_answer
    return check_dfa_for_given_language(states, transitions, initial_states, final_states, language)


def nfa_for_given_language(student_answer, language):
    states, transitions, initial_states, final_states = student_answer
    return check_nfa_for_given_language(states, transitions, initial_states, final_states, language)
