from automata.notebook import parse_tm

def state_count(student_answer, max_states):
    try:
        A = parse_tm(student_answer)
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

