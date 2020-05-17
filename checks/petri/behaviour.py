from pm4py.objects.petri.check_soundness import *


def bounded(student_answer, sample_answer, preload_answer):
    has_loops = check_loops_generating_tokens(student_answer)
    if has_loops:
        return {'correct': False,
                'feedback': 'The petri net is not bounded.'}

    return {'correct': True}


def infinite(student_answer, sample_answer, preload_answer):
    has_loops = check_loops_generating_tokens(student_answer)
    if has_loops:
        return {'correct': True}

    return {'correct': False,
            'feedback': 'The petri net is not infinite.'}


def deadlock_free(student_answer, sample_answer, preload_answer):
    # TODO: issue: only works for workflow net
    non_blocking = check_non_blocking(student_answer)
    if non_blocking:
        return {'correct': True}

    return {'correct': False,
            'feedback': 'The petri net is not deadlock free.'}


def live(student_answer, sample_answer, preload_answer):
    # TODO: is checked together with other properties and only works for workflow nets
    return {'correct': False,
            'feedback': 'Not implemented yet.'}
