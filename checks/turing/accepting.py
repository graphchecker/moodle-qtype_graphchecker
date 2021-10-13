from gambatools.notebook import parse_tm, tm_accepts_word, parse_word_list, generate_language, compare_languages

def tm_accepts(student_answer, word_list):
    try:
        A = parse_tm(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if not tm_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was rejected',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

def tm_rejects(student_answer, word_list):
    try:
        A = parse_tm(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if tm_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was accepted',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

