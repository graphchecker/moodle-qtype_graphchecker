import igraph

def preprocess(graph):
    print(graph)
    g = igraph.Graph(directed=True)
    if not graph:
        return g
    for vertex in graph['vertices']:
        g.add_vertex(name=vertex['label'])
    for edge in graph['edges']:
        g.add_edge(edge['from'], edge['to'], label=edge['label'])
    return g

