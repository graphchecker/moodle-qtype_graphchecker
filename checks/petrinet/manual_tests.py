import basic
from preprocess import preprocess

example_graph = {"_version": 1,
                 "vertices":
                     [{"label": "p0", "position": [10, 60], "petri_type": "place", "color": "blue"},
                      {"label": "p1", "position": [10, 10], "petri_type": "place", "color": "red"},
                      {"label": "p2", "position": [200, 35], "petri_type": "place", "color": "red"},
                      {"label": "t0", "position": [100, 35], "petri_type": "transition", "color": "red"}, ],
                 "edges":
                     [{"from": 0, "to": 3, "bend": {"parallelPart": 0.5, "perpendicularPart": 50}, "label": "e0"},
                      {"from": 1, "to": 3, "bend": {"parallelPart": 0.5, "perpendicularPart": 50}, "label": "e1"},
                      {"from": 3, "to": 2, "bend": {"anchorAngle": 0.0}, "label": "e2"}]
                 }


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


test()
some_tests()
