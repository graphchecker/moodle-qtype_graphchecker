# Tests for FSMs using igraph.

def state_count(student_answer, expected):
    states, transitions, initial_states, final_states = student_answer
    actual = len(states)
    if actual == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': '{0} was {1}, expected {2}'.format(
                    "State count", actual, expected)}

def transition_count(student_answer, expected):
    states, transitions, initial_states, final_states = student_answer
    actual = len(transitions)
    if actual == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': '{0} was {1}, expected {2}'.format(
                    "Transition count", actual, expected)}
