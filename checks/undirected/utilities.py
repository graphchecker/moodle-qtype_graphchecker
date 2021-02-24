def filter_orig_name(v):
    return ''.join(v['name'].split("_")[1:])
    
def _make_integer_checker(method_name, readable_name):
    def result(student_answer,
        expected):
        actual = getattr(student_answer, method_name)()
        if actual == expected:
            return {'correct': True}
        else:
            return {'correct': False,
                    'feedback': '{0} was {1}, expected {2}'.format(
                        readable_name, actual, expected)}
    return result