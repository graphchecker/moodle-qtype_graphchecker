import networkx as nx
from pm4py.objects.petri.networkx_graph import create_networkx_directed_graph, create_networkx_undirected_graph


def connected(student_answer):
    # get networkx graph
    normal_graph, _, _, table = create_networkx_undirected_graph(student_answer, None, None)
    if nx.is_connected(normal_graph):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Graph is not connected.'}


def strongly_connected(student_answer):
    # Use networkx to get scc
    normal_graph, table = create_networkx_directed_graph(student_answer)
    components = nx.algorithms.components.strongly_connected_components(normal_graph)

    # count the number of scc
    num_components = len(list(components))

    """ Note: pm4py also has a method for strongly connected components.
    Howerver, they do not count a single node as a component. We are currently not using their method.
    from pm4py.objects.petri.utils import get_strongly_connected_subnets
    pm4py_num = len(list(get_strongly_connected_subnets(student_answer)))
    """

    if num_components == 1:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Graph is not strongly connected. '
                            'It has {0} strongly connected components.'.format(num_components)}


def transition_degree_one(student_answer):
    for transition in student_answer.transitions:
        in_degree = len(transition.in_arcs)
        out_degree = len(transition.out_arcs)
        if in_degree != 1 or out_degree != 1:
            return {'correct': False,
                    'feedback': 'Transition {0} has in degree {1} and out degree {2}. '
                                'Both need to be 1.'.format(transition.name, in_degree, out_degree)}

    return {'correct': True}


def node_on_shortest_path(student_answer, label_a, label_b, label_c):
    # TODO try their implementation and see what it does
    return {'correct': False,
            'feedback': 'Not implemented yet.'}


def node_label_exists(student_answer, label):
    for place in student_answer.places:
        if place.name == label:
            return {'correct': True}
    for transition in student_answer.transitions:
        if transition.name == label:
            return {'correct': True}

    return {'correct': False,
            'feedback': 'No place or transition found with label {0}'.format(label)}


def node_empty_label(student_answer):
    for place in student_answer.places:
        if place.name == "":
            return {'correct': True}
    for transition in student_answer.transitions:
        if transition.name == "":
            return {'correct': True}

    return {'correct': False,
            'feedback': 'Net has no node with an empty label.'}


def arc_missing(student_answer, label_a, label_b):
    for arc in student_answer.arcs:
        node_a = arc.source.name
        node_b = arc.target.name
        if node_a == label_a and node_b == label_b:
            # arc between nodes with the labels
            return {'correct': False,
                    'feedback': 'There is an arc between {0} and {1}. '
                                'Expected no arc.'.format(node_a, node_b)}

    return {'correct': True}


def arc_has_label(student_answer, label_a, label_b, label_arc):
    for arc in student_answer.arcs:
        if arc.properties['name'] != label_arc:
            continue
        node_a = arc.source.name
        node_b = arc.target.name
        if node_a == label_a and node_b == label_b:
            # arc between nodes with the labels
            return {'correct': True}

    return {'correct': False,
            'feedback': 'There is no arc between nodes with labels {0} and {1}'
                        ' with arc label {2}.'.format(label_a, label_b, label_arc)}


def at_most_one_arc(student_answer, label_a, label_b):
    count = 0
    for arc in student_answer.arcs:
        if arc.source.name == label_a and arc.target.name == label_b:
            count += 1

        if count > 1:
            return {'correct': False,
                    'feedback': 'There is more than 1 arc from {0} to {1}. '
                                'Expected at most 1.'.format(label_a, label_b)}

    return {'correct': True}
