from gambatools.notebook import parse_simple_regexp, generate_language, parse_word_list, compare_languages, regexp_accepts_word

def regex_accepts(student_answer, word_list):
    try:
        A = parse_simple_regexp(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if not regexp_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was rejected',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

def regex_rejects(student_answer, word_list):
    try:
        A = parse_simple_regexp(student_answer)
    except RuntimeError as e:
        return {'correct': False,
                'feedback': str(e)}

    word_list = " ".join(word_list)
    words = parse_word_list(word_list)

    for word in words:
        if regexp_accepts_word(A, word):
            return {'correct': False,
                    'feedback': 'a word was accepted',
                    'word': word}

    return {'correct': True,
            'feedback': 'correct'}

