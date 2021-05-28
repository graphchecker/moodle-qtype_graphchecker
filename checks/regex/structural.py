# Tests for DFAs.

from automata.notebook import parse_dfa, parse_nfa

def length(student_answer, max_length):
    l = len(student_answer)
    if l <= max_length:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': "Your regex is too long (at most " +
                        str(max_length) + " characters allowed)"}

