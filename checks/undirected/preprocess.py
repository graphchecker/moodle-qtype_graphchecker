import igraph

def preprocess(graph):
    g = igraph.Graph(directed=False)
    if not graph:
        return g
    count = 0
    for vertex in graph['vertices']:
        label = "v" + str(count) + "_" + vertex['label']
        print(label)
        v = g.add_vertex(name = label, x = vertex['position'][0], y = vertex['position'][1])
        count += 1
    for edge in graph['edges']:
        g.add_edge(edge['from'], edge['to'], label=edge['label'])
    return g