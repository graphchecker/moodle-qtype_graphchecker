from pm4py.objects.petri.petrinet import PetriNet, Marking
from pm4py.objects.petri import utils


def preprocess(graph):
    # TODO: input validation
    # TODO: raise new exception when input is not valid.
    # TODO: all places unique name

    version = graph["_version"]
    print("version = " + str(version))

    vertices = graph['vertices']
    edges = graph['edges']

    net = PetriNet("converted_graph")

    ordered_vertices = []

    for vertex in vertices:
        label = vertex['label']
        if vertex['petri_type'] == "place":
            new_place = PetriNet.Place(label)
            new_place.properties['position'] = vertex['position']

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
