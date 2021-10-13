from gambatools.notebook import parse_pda, generate_language, parse_word_list, compare_languages, pda_accepts_word

def pda_accepts(student_answer, word_list):
    try:
        A = parse_pda(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if not pda_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was rejected',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

def pda_rejects(student_answer, word_list):
    try:
        A = parse_pda(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if pda_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was accepted',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

