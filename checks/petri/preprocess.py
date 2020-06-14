from pm4py.objects.petri.petrinet import PetriNet, Marking
from pm4py.objects.petri import utils


def has_keys(graph):
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
            pass
            # TODO: uncomment this once token functionality is there
            # if 'tokens' not in v:
            #     raise Exception("There is a place without a number of tokens")

    for e in graph['edges']:
        if 'from' not in e:
            raise Exception("There is an edge without a 'from'")
        if 'to' not in e:
            raise Exception("There is an edge without a 'to")
        if 'bend' not in e:
            raise Exception("There is an edge without a 'bend'")
        if 'label' not in e:
            raise Exception("There is an edge without a 'label'")
        if 'parralelPart' not in e['bend']:
            raise Exception("There is an edge without a 'bend.parralelPart'")
        if 'perpendicularPart' not in e['bend']:
            raise Exception("There is an edge without a 'bend.perpendicularPart'")

    return True


def unique_labels(graph):
    seen_labels = []
    for v in graph['vertices']:
        if v['label'] in seen_labels:
            raise Exception("Label '" + v['label'] + "' is not unique")
        seen_labels.append(v['label'])

    return True


def no_empty_label(graph):
    for v in graph['vertices']:
        if v['label'] == '':
            raise Exception("A node has an empty label")

    return True


def preprocess(graph):
    # Check if the given json has all the keys we need
    if not has_keys(graph):
        return None

    # Check if the labels of all nodes are unique
    # TODO: uncomment this once tokens are not stored in label anymore
    # if not unique_labels(graph):
    #     return None

    # Check if all nodes (place/transition) have a non empty label
    if not no_empty_label(graph):
        return None

    # TODO: input validation
    # TODO: raise new exception when input is not valid.

    vertices = graph['vertices']
    edges = graph['edges']

    net = PetriNet("converted_graph")

    ordered_vertices = []

    for vertex in vertices:
        label = vertex['label']
        if vertex['petri_type'] == "place":
            new_place = PetriNet.Place(label)
            new_place.properties['position'] = vertex['position']

            # TODO: uncomment this and remove temporary work around when 'tokens' field works
            # new_place.properties['tokens'] = vertex['tokens']
            # TEMPORARY: let the label of a place represent the number of tokens in there
            try:
                new_place.properties['tokens'] = int(vertex['label'])
            except ValueError:
                new_place.properties['tokens'] = 0

            net.places.add(new_place)
            ordered_vertices.append(new_place)
        elif vertex['petri_type'] == "transition":
            new_transition = PetriNet.Transition(label, label)
            # TODO: do we want this?
            if label == "":
                new_transition.label = None
            new_transition.properties['position'] = vertex['position']

            net.transitions.add(new_transition)
            ordered_vertices.append(new_transition)

    for edge in edges:
        source = ordered_vertices[edge['from']]
        target = ordered_vertices[edge['to']]

        arc = PetriNet.Arc(source, target, 1)
        arc.properties['name'] = edge['label']
        arc.properties['bend'] = edge['bend']

        net.arcs.add(arc)
        source.out_arcs.add(arc)
        target.in_arcs.add(arc)

    return net
