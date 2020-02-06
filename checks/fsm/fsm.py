# Tests for FSMs.

# returns the index of the state after consuming the given string
def _simulate(fsm, initial_state, consumed_string, input_string):
    if len(input_string) == 0:
        return initial_state
    consumed_token = input_string[0]
    remaining_string = input_string[1:]
    candidates = []
    for e in fsm['edges']:
        if e[0] == initial_state and e[2] == consumed_token:
            candidates.append(e[1])
    if len(candidates) == 0:
        raise ValueError('No outgoing transition labeled "{0}" after consuming "{1}"'.format(consumed_token, consumed_string))
    elif len(candidates) > 1:
        raise ValueError('Multiple outgoing transitions labeled "{0}" after consuming "{1}"; your FSM is non-deterministic'.format(consumed_token, consumed_string))
    else:
        new_state = candidates[0]
        return _simulate(fsm, new_state, consumed_string + consumed_token, remaining_string)

def string_acceptance(student_answer, sample_answer, preload_answer,
    input_string, expected):

    try:
        final_state = _simulate(student_answer, 0, '', input_string)
    except ValueError as e:
        return {'correct': False,
                'feedback': str(e)}

    if student_answer['nodes'][final_state][1]:
        # final state is accepting
        if expected == 'accepted':
            return {'correct': True,
                    'feedback': 'Your FSM accepts input "{0}", as expected'.format(input_string)}
        else:
            return {'correct': False,
                    'feedback': 'Your FSM accepts input "{0}", but should reject it'.format(input_string)}
    else:
        # final state is rejecting
        if expected == 'accepted':
            return {'correct': False,
                    'feedback': 'Your FSM rejects input "{0}", but should accept it'.format(input_string)}
        else:
            return {'correct': True,
                    'feedback': 'Your FSM rejects input "{0}", as expected'.format(input_string)}


