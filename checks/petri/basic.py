import networkx as nx
from pm4py.objects.petri.networkx_graph import create_networkx_undirected_graph
from pm4py.objects.petri.utils import *

"""
This file implements all 'basic' checks for graphs of type petri.
These checks correspond to the 'Graph properties' checks in the requirements document.
The 'basic.json' file describes every available check and which function is linked to that check.
It also describes the types of the parameters for those functions.
"""


def connected(student_answer):
    """
    Checks if the student_answer petri net is a (weakly) connected graph.
    """
    # Turn PetriNet object into NetworkX directed graph
    normal_graph, _, _, table = create_networkx_undirected_graph(student_answer, None, None)

    if nx.is_connected(normal_graph):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Graph is not connected.'}


def strongly_connected(student_answer):
    """
    Checks if the student_answer petri net is strongly connected. (Has 1 SCC)
    """
    # Use networkx to get strongly connected components
    normal_graph, table = create_networkx_directed_graph(student_answer)
    components = nx.algorithms.components.strongly_connected_components(normal_graph)

    # count the number of strongly connected components
    num_components = len(list(components))

    """
    Note: pm4py also has a method for strongly connected components.
    Howerver, they do not count a single node as a component. We are currently not using their method.
    It can be used as follows:
    from pm4py.objects.petri.utils import get_strongly_connected_subnets
    pm4py_num = len(list(get_strongly_connected_subnets(student_answer)))
    """

    # Return answer based on number of connected components
    if num_components == 1:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Graph is not strongly connected. '
                            'It has {0} strongly connected components.'.format(num_components)}


def transition_degree_one(student_answer):
    """
    Checks if the student_answer petri net only has transitions with an in-degree and
    out-degree of 1.
    """

    for transition in student_answer.transitions:
        in_degree = len(transition.in_arcs)
        out_degree = len(transition.out_arcs)
        if in_degree != 1 or out_degree != 1:
            return {'correct': False,
                    'feedback': 'Transition {0} has in degree {1} and out degree {2}. '
                                'Both need to be 1.'.format(transition.name, in_degree, out_degree)}

    return {'correct': True}


def node_on_shortest_path(student_answer, label_a, label_b, label_c):
    """
    Checks if the node (place or transition) with label label_b is on A shortest path between
    the node with label label_a and the node with label label_c.
    The check fails if the 3 nodes with their respective labels do not exist.
    """

    # Group transitions and places together
    transitions_and_places = student_answer.places.union(student_answer.transitions)

    # Check if the given labels have a corresponding node
    names = [p.name for p in transitions_and_places]
    if label_a not in names or label_b not in names or label_c not in names:
        return {'correct': False,
                'feedback': 'The given labels ({0}, {1}, {2}) do not all correspond to nodes in the graph. '
                            'Cannot find shortest path.'.format(label_a, label_b, label_c)}

    # Get the places associated to the labels
    place_a = [p for p in transitions_and_places if p.name == label_a][0]
    place_b = [p for p in transitions_and_places if p.name == label_b][0]
    place_c = [p for p in transitions_and_places if p.name == label_c][0]

    # Create networkx graph
    graph, inv_dict = create_networkx_directed_graph(student_answer)

    # Get the numerical code of the networkx node related to a given label
    node_a = list(inv_dict.keys())[list(inv_dict.values()).index(place_a)]
    node_b = list(inv_dict.keys())[list(inv_dict.values()).index(place_b)]
    node_c = list(inv_dict.keys())[list(inv_dict.values()).index(place_c)]

    # Get all shortest paths between node with label_a and node with label_c
    all_paths = nx.algorithms.shortest_paths.all_shortest_paths(graph, node_a, node_c)

    # Check if the node with label_b is on any of the paths
    try:
        for path in all_paths:
            if node_b in path:
                return {'correct': True}
    except nx.exception.NetworkXException:
        return {'correct': False,
                'feedback': 'There is no shortest path between node {0} and node {1}.'.format(label_a, label_c)}

    return {'correct': False,
            'feedback': 'Node with label {0} is not on a shortest path between nodes'
                        ' with labels {1} and {2}'.format(label_b, label_a, label_c)}


def node_label_exists(student_answer, label):
    """
    Checks if there is a node (place or transition) with the given label.
    """
    for place in student_answer.places:
        if place.name == label:
            return {'correct': True}
    for transition in student_answer.transitions:
        if transition.name == label:
            return {'correct': True}

    return {'correct': False,
            'feedback': 'No place or transition found with label {0}'.format(label)}


# This check is currently useless because no petri-nets with empty labels get through the pre-process check.
# def node_empty_label(student_answer):
#     """
#     Checks if there exists a node (place or transition) with no label.
#     """
#     for place in student_answer.places:
#         if place.name == "":
#             return {'correct': True}
#     for transition in student_answer.transitions:
#         if transition.name == "":
#             return {'correct': True}
#
#     return {'correct': False,
#             'feedback': 'Net has no node with an empty label.'}


def arc_missing(student_answer label_a, label_b):
    """
    Checks whether there is no edge from the node with label_a to the node with label_b.
    The check fails if there is an edge from node with label_a to the node with label_b.
    """
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
    """
    Checks if there exists an arc from the node with label_a to the node with label_b that
    has label label_arc.
    The check fails if there is no arc from the node with label_a to the node with label_b.
    """
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


def at_most_one_arc(student_answer label_a, label_b):
    """
    Checks if there is at most one arc from the node with label label_a to the node
    with label label_b.
    """
    count = 0
    for arc in student_answer.arcs:
        if arc.source.name == label_a and arc.target.name == label_b:
            count += 1

        if count > 1:
            return {'correct': False,
                    'feedback': 'There is more than 1 arc from {0} to {1}. '
                                'Expected at most 1.'.format(label_a, label_b)}

    return {'correct': True}
