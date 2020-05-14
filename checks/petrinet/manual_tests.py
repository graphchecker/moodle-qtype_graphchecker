import basic
import functionality
from preprocess import preprocess
from pm4py.objects.petri.utils import get_strongly_connected_subnets


def test():
    net = preprocess(example_graph)
    print(net.places)
    print(net.transitions)
    print(net.arcs)


def some_tests():
    net = preprocess(example_graph)
    res = basic.connected(net, net, net)
    print(res)
    res = basic.strongly_connected(net, net, net)
    print(res)
    res = basic.transition_degree_one(net, net, net)
    print(res)
    res = basic.node_empty_label(net, net, net)
    print(res)
    res = functionality.workflow_net(net, net, net)
    print(res)


example_graph = {"_version": 1,
                 "vertices":
                     [{"label": "p0", "position": [10, 60], "petri_type": "place", "tokens": 1, "color": "blue"},
                      {"label": "p1", "position": [10, 10], "petri_type": "place", "tokens": 1, "color": "red"},
                      {"label": "p2", "position": [200, 35], "petri_type": "place", "tokens": 1, "color": "red"},
                      {"label": "t0", "position": [100, 35], "petri_type": "transition", "color": "red"}, ],
                 "edges":
                     [{"from": 0, "to": 3, "bend": {"parallelPart": 0.5, "perpendicularPart": 50}, "label": "e0"},
                      {"from": 1, "to": 3, "bend": {"parallelPart": 0.5, "perpendicularPart": 50}, "label": "e1"},
                      {"from": 3, "to": 2, "bend": {"anchorAngle": 0.0}, "label": "e2"}]
                 }

from pm4py.visualization.petrinet import visualizer as pn_visualizer
from pm4py.objects.petri.petrinet import Marking


def strongly_test():
    net = preprocess(example_graph)
    print(net)
    initial_marking = Marking()
    final_marking = Marking()
    for place in net.places:
        if place.name != "p2":
            initial_marking[place] = 1
        else:
            final_marking[place] = 1

    parameters = {pn_visualizer.Variants.WO_DECORATION.value.Parameters.FORMAT: "svg"}
    gviz = pn_visualizer.apply(net, initial_marking, final_marking, parameters=parameters)
    pn_visualizer.save(gviz, "alpha.svg")


strongly_test()
