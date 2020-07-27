import igraph

def preprocess(graph):
    g = igraph.Graph(directed=False)
    if not graph:
        return g
    count = 0
    for vertex in graph['vertices']:
        label = "v" + str(count) + "_" + vertex['label']
        if 'highlighted' not in v:
            highlight = False
        else:
            highlight = v['highlighted']
        v = g.add_vertex(name = label, x = vertex['position'][0], y = vertex['position'][1], highlight = highlight)
        count += 1
    for edge in graph['edges']:
        if 'highlighted' not in e:
            highlight = False
        else:
            highlight = edge['highlighted']
        g.add_edge(edge['from'], edge['to'], label=edge['label'], highlight = highlight)
    return g
