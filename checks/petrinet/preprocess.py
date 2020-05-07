from pm4py.objects.petri.petrinet import PetriNet, Marking
from pm4py.objects.petri import utils


def preprocess(graph):
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

            net.places.add(new_place)
            ordered_vertices.append(new_place)
        elif vertex['petri_type'] == "transition":
            new_transition = PetriNet.Transition(label, label)

            net.transitions.add(new_transition)
            ordered_vertices.append(new_transition)

    for edge in edges:
        source = ordered_vertices[edge['from']]
        target = ordered_vertices[edge['to']]

        utils.add_arc_from_to(source, target, net)

    return net



