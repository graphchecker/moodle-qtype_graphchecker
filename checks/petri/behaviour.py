from pm4py.objects.petri.check_soundness import *

"""
This file implements all 'behaviour' checks for graphs of type petri.
These checks correspond to the 'Behavioral properties' checks in the requirements document.
The 'behaviour.json' file describes every available check and which function is linked to that check.
It also describes the types of the parameters for those functions.
"""


def bounded(student_answer):
    """
    Checks if the given student_answer petri-net is bounded. It is bounded if there are no
    loops that generate tokens.
    """
    has_loops = check_loops_generating_tokens(student_answer)
    if has_loops:
        return {'correct': False,
                'feedback': 'The petri net is not bounded.'}

    return {'correct': True}


def infinite(student_answer):
    """
    Checks if the given student_answer petri-net is infinite. It is infinite if it is
    not bounded.
    """
    has_loops = check_loops_generating_tokens(student_answer)
    if has_loops:
        return {'correct': True}

    return {'correct': False,
            'feedback': 'The petri net is not infinite.'}


def deadlock_free(student_answer):
    """
    This check does not work. The pm4py functionality does not work.
    """
    # TODO: does not seem to work. Simple example of 2 places and 1 transition fails.
    is_workflow = check_wfnet(student_answer)

    # These are used by them, do we want that?
    is_source_sink = check_source_sink_place_conditions(student_answer)
    relaxed_soundness = check_relaxed_soundness_of_wfnet(student_answer)
    is_stable = check_stability_wfnet(student_answer)

    if not is_workflow or not is_source_sink or not relaxed_soundness or not is_stable:
        return {'correct': False,
                'feedback': 'The petri net is not a valid workflow net. The deadlock free check only works'
                            'for workflow nets.'}

    non_blocking = check_non_blocking(student_answer)
    if non_blocking:
        return {'correct': True}

    return {'correct': False,
            'feedback': 'The petri net is not deadlock free.'}


def live(student_answer):
    """
    This check does not work. The pm4py functionality does not work.
    """
    is_workflow = check_wfnet(student_answer)
    if not is_workflow:
        return {'correct': False,
                'feedback': 'The petri net is not a workflow net. The live check only works'
                            'for workflow nets.'}

    # TODO: is checked together with other properties
    return {'correct': False,
            'feedback': 'Not implemented yet.'}
