from pm4py.objects.petri.petrinet import PetriNet


def has_keys(graph):
    """
    Checks if graph, a json object, contains all keys needed to be turned in to a petri net.
    Raises an exception if there is an issue with the json object which makes it unusable.
    :return: True if there are no issues.
    """
    # Check general graph
    if 'vertices' not in graph:
        raise Exception("'vertices' not found in graph")
    if 'edges' not in graph:
        raise Exception("'edges' not found in graph")

    # Check vertices
    for v in graph['vertices']:
        if 'label' not in v:
            raise Exception("There is a node without a 'label'")
        if 'position' not in v:
            raise Exception("There is a node without a 'position'")
        if 'petri_type' not in v:
            raise Exception("There is a node without a 'petri_type'")
        if v['petri_type'] == 'place':
            if 'tokens' not in v:
                raise Exception("There is a place without a number of tokens")

    # Check edges
    for e in graph['edges']:
        if 'from' not in e:
            raise Exception("There is an edge without a 'from'")
        if 'to' not in e:
            raise Exception("There is an edge without a 'to")
        if 'bend' not in e:
            raise Exception("There is an edge without a 'bend'")
        if 'label' not in e:
            raise Exception("There is an edge without a 'label'")
        if 'parallelPart' not in e['bend']:
            raise Exception("There is an edge without a 'bend.parallelPart'")
        if 'perpendicularPart' not in e['bend']:
            raise Exception("There is an edge without a 'bend.perpendicularPart'")

    # No issues
    return True


def unique_labels(graph):
    """
    Checks if graph, a json object that needs to have the correct keys as check in has_keys,
    contains any duplicate labels on its vertices.
    If there are any duplicate labels, an exception is thrown.
    :return: True if there are no issues.
    """
    seen_labels = []
    for v in graph['vertices']:
        if v['label'] in seen_labels:
            raise Exception("Label '" + v['label'] + "' is not unique")
        seen_labels.append(v['label'])

    return True


def no_empty_label(graph):
    """
    Checks if graph, a json object that needs to have the correct keys as check in has_keys,
    contains a vertex with an empty label.
    If there is a vertex with an empty label, an exception is thrown.
    :return:  True if there are no issues.
    """
    for v in graph['vertices']:
        if v['label'] == '':
            raise Exception("A node has an empty label")

    return True


def preprocess(graph):
    """
    Takes in graph, a json object representing a petrinet.
    Checks if graph conforms to the standard, if it doesn't an exception is thrown.
    If it does, creates a pm4py PetriNet object out of the petri net encoded in the graph object.
    :return: A PetriNet object.
    """
    # Check if the given json has all the keys we need
    if not has_keys(graph):
        return None

    # Check if the labels of all nodes are unique
    if not unique_labels(graph):
        return None

    # Check if all nodes (place/transition) have a non empty label
    if not no_empty_label(graph):
        return None

    # Create PetriNet object
    net = PetriNet("converted_graph")

    # Store an ordered list of the vertices to make it easier to connect them through arcs
    ordered_vertices = []

    # Add all vertices (places and transitions) to net
    for vertex in graph['vertices']:
        label = vertex['label']
        if vertex['petri_type'] == "place":
            new_place = PetriNet.Place(label)
            new_place.properties['position'] = vertex['position']
            new_place.properties['tokens'] = vertex['tokens']

            net.places.add(new_place)
            ordered_vertices.append(new_place)
        elif vertex['petri_type'] == "transition":
            new_transition = PetriNet.Transition(label, label)
            new_transition.properties['position'] = vertex['position']

            net.transitions.add(new_transition)
            ordered_vertices.append(new_transition)

    # Add all edges (arcs) to net
    for edge in graph['edges']:
        source = ordered_vertices[edge['from']]
        target = ordered_vertices[edge['to']]

        # TODO: Change this if you want to get the edge weight another way.
        edge_weight = 1
        if edge['label'] != '':
            try:
                num = int(edge['label'])
                edge_weight = num
            except:
                raise Exception("There is an edge with a label that is not a number.")

        # Create arc object of weight 1
        arc = PetriNet.Arc(source, target, edge_weight)
        # Add extra properties
        arc.properties['name'] = edge['label']
        arc.properties['bend'] = edge['bend']

        # Add the arc to the net and the source and target objects
        net.arcs.add(arc)
        source.out_arcs.add(arc)
        target.in_arcs.add(arc)

    return net
