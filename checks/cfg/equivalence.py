from automata.notebook import parse_simple_cfg, cfg_accepts_word, parse_word_list

def cfg_accepts(student_answer, word_list):
    try:
        A = parse_simple_cfg(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if not cfg_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was rejected',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

def cfg_rejects(student_answer, word_list):
    try:
        A = parse_simple_cfg(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if cfg_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was accepted',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

