from pm4py.objects.petri import check_soundness, utils, semantics
from pm4py.objects.petri.petrinet import PetriNet, Marking


# Gets the initial marking encoded in the PetriNet properties dict
def get_marking(net):
    marking = Marking()
    for place in net.places:
        marking[place] = place.properties['tokens']
    return marking


def number_of_tokens(student_answer, sample_answer, preload_answer, num_tokens):
    num_tokens = int(num_tokens)
    for place in student_answer.places:
        if place.properties['tokens'] == num_tokens:
            return {'correct': True}

    return {'correct': False,
            'feedback': 'No place with {0} tokens exists. Expected one to exist.'.format(num_tokens)}


# Helper function to run list of transitions
def is_sequence_possible(net, transition_sequence):
    """ Returns [a,b,c] where
    a = True if sequence of transitions is possible
    b = the index of the transition that is not possible if a = False
    c = label of transition if a transition was not found in the network else False
    """
    current_marking = get_marking(net)

    # Create a mapping from label to transition objects
    transition_dict = {}
    for transition in net.transitions:
        if transition.name in transition_sequence:
            transition_dict[transition.name] = transition

    index = 0
    for transition_label in transition_sequence:
        # Transition not found
        if transition_label not in transition_dict.keys():
            return [False, 0, transition_label]

        transition = transition_dict[transition_label]
        # Transition not enabled, sequence impossible
        if not semantics.is_enabled(transition, net, current_marking):
            return [False, index, False]
        current_marking = semantics.execute(transition, net, current_marking)
        index += 1

    # Sequence possible
    return [True, 0, False]


def possible_sequence(student_answer, sample_answer, preload_answer, transition_sequence):
    result = is_sequence_possible(student_answer, transition_sequence)
    if result[2]:
        return {'correct': False,
                'feedback': 'Transition with label {0} in the transition sequence was not present'
                            'in the given petri net.'.format(result[2])}
    if result[0]:
        return {'correct': True}
    else:
        index = result[1]
        return {'correct': False,
                'feedback': 'Transition {0} was not enabled in the list {1} '
                            'at index {2}'.format(transition_sequence[index],
                                                  transition_sequence, index)}


def impossible_sequence(student_answer, sample_answer, preload_answer, transition_sequence):
    result = is_sequence_possible(student_answer, transition_sequence)
    if result[2]:
        return {'correct': False,
                'feedback': 'Transition with label {0} in the transition sequence was not present'
                            'in the given petri net.'.format(result[2])}
    if result[0]:
        return {'correct': False,
                'feedback': 'The transition sequence {0} was possible. Expected'
                            'it to be impossible.'.format(transition_sequence)}
    else:
        return {'correct': True}


def marking_given(student_answer, sample_answer, preload_answer, correct_graph):
    student_place_names = [p.name for p in student_answer.places]

    # TODO: we could also check if the student answer has more places than the given graph and return False?
    # TODO: The code below does this, remove it if we don't want it
    correct_graph_names = [p.name for p in correct_graph.places]
    for p in student_answer.places:
        if p.name not in correct_graph_names:
            return {'correct': False,
                    'feedback': 'The place with name {0} was found but is not present in the correct graph.'.format(
                        p.name)}

    # Check if all tokens in the given answer exist and have the right amount of tokens.
    for their_p in correct_graph.places:
        if their_p.name not in student_place_names:
            return {'correct': False,
                    'feedback': 'The place with name {0} was not present in the given petri net.'.format(their_p.name)}
        student_p = [p for p in student_answer.places if p.name == their_p.name][0]
        if their_p.properties['tokens'] != student_p.properties['tokens']:
            return {'correct': False,
                    'feedback': 'The place with name {0} has {1} tokens. Expected {2} '
                                'tokens.'.format(their_p.name, student_p.properties['tokens'],
                                                 their_p.properties['tokens'])}

    return {'correct': True}


def workflow_net(student_answer, sample_answer, preload_answer):
    if check_soundness.check_wfnet(student_answer):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'The given petri-net is not a workflow net. Expected a workflow net.'}
