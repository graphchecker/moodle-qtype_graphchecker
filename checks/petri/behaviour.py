from pm4py.objects.petri.check_soundness import *


def bounded(student_answer):
    has_loops = check_loops_generating_tokens(student_answer)
    if has_loops:
        return {'correct': False,
                'feedback': 'The petri net is not bounded.'}

    return {'correct': True}


def infinite(student_answer):
    has_loops = check_loops_generating_tokens(student_answer)
    if has_loops:
        return {'correct': True}

    return {'correct': False,
            'feedback': 'The petri net is not infinite.'}


def deadlock_free(student_answer):
    is_workflow = check_wfnet(student_answer)
    if not is_workflow:
        return {'correct': False,
                'feedback': 'The petri net is not a workflow net. The deadlock free check only works'
                            'for workflow nets.'}

    non_blocking = check_non_blocking(student_answer)
    if non_blocking:
        return {'correct': True}

    return {'correct': False,
            'feedback': 'The petri net is not deadlock free.'}


def live(student_answer):
    is_workflow = check_wfnet(student_answer)
    if not is_workflow:
        return {'correct': False,
                'feedback': 'The petri net is not a workflow net. The live check only works'
                            'for workflow nets.'}


    # TODO: is checked together with other properties
    return {'correct': False,
            'feedback': 'Not implemented yet.'}
