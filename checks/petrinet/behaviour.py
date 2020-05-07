import networkx as nx
from pm4py.objects.petri.networkx_graph import create_networkx_directed_graph, create_networkx_undirected_graph


def bounded(student_answer, sample_answer, preload_answer):
    return {'correct': True}


def infinite(student_answer, sample_answer, preload_answer):
    return {'correct': True}


def deadlock_free(student_answer, sample_answer, preload_answer):
    return {'correct': True}


def live(student_answer, sample_answer, preload_answer):
    return {'correct': True}
