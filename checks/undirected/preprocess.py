import igraph

def preprocess(graph):
    g = igraph.Graph(directed=False)
    if not graph:
        return g
    count = 0
    for vertex in graph['vertices']:
        label = "v" + str(count) + "_" + vertex['label']
        if 'highlighted' not in vertex:
            highlight = False
        else:
            highlight = vertex['highlighted']
        v = g.add_vertex(name = label, x = vertex['position'][0], y = vertex['position'][1], highlighted = highlight)
        count += 1
    for edge in graph['edges']:
        if 'highlighted' not in edge:
            highlight = False
        else:
            highlight = edge['highlighted']
        g.add_edge(edge['from'], edge['to'], label=edge['label'], highlighted = highlight)
    return g