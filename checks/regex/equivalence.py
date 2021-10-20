from gambatools.notebook import parse_simple_regexp, generate_language, parse_word_list, compare_languages, regexp_accepts_word

def language_equivalence_words(student_answer, word_list, length):
    word_list = " ".join(word_list)
    try:
        A = parse_simple_regexp(student_answer)
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

