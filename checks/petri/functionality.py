from pm4py.objects.petri import check_soundness, semantics
from pm4py.objects.petri.petrinet import Marking

"""
This file implements all 'functionality' checks for graphs of type petri.
These checks correspond to the 'Basic petri-net functionality' checks in the requirements document.
The 'functionality.json' file describes every available check and which function is linked to that check.
It also describes the types of the parameters for those functions.
"""


# Gets the initial marking encoded in the PetriNet properties dict
def get_marking(net):
    """
    Helper functions that creates a pm4py Marking object from a pm4py PetriNet
    where the marking is encoded in the properties.
    """
    marking = Marking()
    for place in net.places:
        marking[place] = place.properties['tokens']
    return marking


def number_of_tokens(student_answer, num_tokens):
    """
    Checks if there exists a place in student_answer that contains num_tokens tokens.
    """
    num_tokens = int(num_tokens)
    for place in student_answer.places:
        if place.properties['tokens'] == num_tokens:
            return {'correct': True}

    return {'correct': False,
            'feedback': 'No place with {0} tokens exists. Expected one to exist.'.format(num_tokens)}


def is_sequence_possible(net, transition_sequence):
    """
    Helper function used to run a sequence of transitions.
    Returns [a,b,c] where
    a = True if sequence of transitions is possible in net
    b = the index of the transition that is not possible if a = False
    c = label of transition if a transition was not found in the network else False
    """
    # Get marking object
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
        # Fire the transition to enter next marking
        current_marking = semantics.execute(transition, net, current_marking)
        index += 1

    # Sequence possible
    return [True, 0, False]


def possible_sequence(student_answer, transition_sequence):
    """
    Checks whether it is possible to run a sequence of transitions. transition_sequence is the
    ordered list of transition labels for which we check if it is possible.
    """
    # Use helper function to run sequence
    result = is_sequence_possible(student_answer, transition_sequence)
    # Transition missing
    if result[2] or result[2] == '':
        return {'correct': False,
                'feedback': 'Transition with label \'{0}\' in the transition sequence was not present'
                            ' in the given petri net.'.format(result[2])}
    # Sequence possible
    if result[0]:
        return {'correct': True}
    else:
        # Sequence impossible at index
        index = result[1]
        return {'correct': False,
                'feedback': 'Transition {0} was not enabled in the list {1} '
                            'at index {2}'.format(transition_sequence[index],
                                                  transition_sequence, index)}


def impossible_sequence(student_answer, transition_sequence):
    """
    Checks whether it is impossible to run a sequence of transitions. transition_sequence is the
    ordered list of transition labels for which we check if it is impossible.
    """
    # Use helper function to run sequence
    result = is_sequence_possible(student_answer, transition_sequence)
    # Transition missing
    if result[2]:
        return {'correct': False,
                'feedback': 'Transition with label {0} in the transition sequence was not present'
                            ' in the given petri net.'.format(result[2])}
    # Sequence possible
    if result[0]:
        return {'correct': False,
                'feedback': 'The transition sequence {0} was possible. Expected'
                            ' it to be impossible.'.format(transition_sequence)}
    else:
        # Sequence is impossible
        return {'correct': True}


def marking_given(student_answer, correct_graph):
    """
    Checks whether the student_answer petri net has the exact same marking as correct_graph
    for all places they share.
    If correct_graph contains a place that is not in the student_answer the check fails.
    """
    student_place_names = [p.name for p in student_answer.places]

    # Check if all tokens in the given answer exist and have the right amount of tokens.
    for their_p in correct_graph.places:
        # Correct answer has a place that student does not have, fail.
        if their_p.name not in student_place_names:
            return {'correct': False,
                    'feedback': 'The place with name {0} was not present in the given petri net.'.format(their_p.name)}
        # Get the place object in the student graph
        student_p = [p for p in student_answer.places if p.name == their_p.name][0]
        # Incorrect number of tokens
        if their_p.properties['tokens'] != student_p.properties['tokens']:
            return {'correct': False,
                    'feedback': 'The place with name {0} has {1} tokens. Expected {2} '
                                'tokens.'.format(their_p.name, student_p.properties['tokens'],
                                                 their_p.properties['tokens'])}

    # Answer matches
    return {'correct': True}


def workflow_net(student_answer):
    """
    Checks if the PetriNet in student_answer is a workflow net.
    """
    # Use pm4py to check workflow net
    if check_soundness.check_wfnet(student_answer):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'The given petri-net is not a workflow net. Expected a workflow net.'}
