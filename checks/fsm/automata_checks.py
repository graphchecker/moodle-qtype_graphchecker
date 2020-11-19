# Tests for DFAs.

from automata.notebook import parse_dfa, generate_language, parse_word_list, compare_languages

def check_dfa_language_from_words(student_answer, word_list, length):
    word_list = " ".join(word_list)
    try:
        A = parse_dfa(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}
    A_words = generate_language(A, length)
    words = parse_word_list(word_list)
    feedback = compare_languages(A_words, words)
    if len(feedback) == 0:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': " / ".join(feedback)}

def check_dfa_language_from_answer(student_answer, other, length):
    try:
        A = parse_dfa(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}
    A_words = generate_language(A, length)
    B = parse_dfa(other)
    B_words = generate_language(B, length)
    feedback = compare_languages(A_words, B_words)
    if len(feedback) == 0:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': " / ".join(feedback)}

def check_dfa_max_states(student_answer, max_states):
    try:
        A = parse_dfa(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}
    num_states = len(A.Q)
    if num_states <= max_states:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': "You used too many states (at most " +
                        str(max_states) + " allowed)"}

