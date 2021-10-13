from gambatools.notebook import parse_nfa, generate_language, parse_word_list, compare_languages, nfa_accepts_word

def fsm_accepts(student_answer, word_list):
    try:
        A = parse_nfa(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if not nfa_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was rejected',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

def fsm_rejects(student_answer, word_list):
    try:
        A = parse_nfa(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if nfa_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was accepted',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

