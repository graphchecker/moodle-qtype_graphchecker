from gambatools.notebook import parse_tm
import json

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

def deterministic(student_answer):

    # note: cannot use the gambatools library for this, because its parse_tm
    # function, when faced with a non-deterministic TM, just picks one of the
    # transitions arbitrarily without flagging an error

    state_tape_combos = set()
    for line in student_answer.split('\n'):
        line = line.strip()
        if len(line) == 0:
            continue
        line = line.split()
        if line[0] in ['initial', 'accept', 'reject', 'blank',
                'input_symbols', 'tape_symbols']:
            continue
        if len(line) != 3:
            return {'correct': False, 'feedback': 'Turing machine syntax was incorrect'}
        source_state = line[0]
        transition_label = line[2]
        if len(transition_label) != 4:
            return {'correct': False, 'feedback': 'Invalid transition label "' + transition_label + '"'}
        read_from_tape = transition_label[0]
        if (source_state, read_from_tape) in state_tape_combos:
            return {'correct': False,
                    'feedback': 'TM is indeterministic',
                    'state': source_state,
                    'tape_symbol': read_from_tape}
        state_tape_combos.add((source_state, read_from_tape))

    return {'correct': True}

