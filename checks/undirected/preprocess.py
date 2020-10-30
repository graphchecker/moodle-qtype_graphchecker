import igraph

def preprocess(graph):
    g = igraph.Graph(directed=False)
    if not graph:
        return g
    count = 0
    
    sortedVertices = sorted(graph['vertices'], key = lambda vertex: vertex['label'])
    for vertex in sortedVertices:
        vertex['label'] = "v" + str(count) + "_" + vertex['label']
        count += 1
        
    # Needs to be separated as the edges only have indices.
    # So we need to add the vertices in the same order to the new graph.. :(
    for vertex in graph['vertices']:
        if 'highlighted' not in vertex:
            highlight = False
        else:
            highlight = vertex['highlighted']
        v = g.add_vertex(name = vertex['label'], x = vertex['position'][0], y = vertex['position'][1], highlighted = highlight)
    for edge in graph['edges']:
        if 'highlighted' not in edge:
            highlight = False
        else:
            highlight = edge['highlighted']
        g.add_edge(edge['from'], edge['to'], label = edge['label'], highlighted = highlight)
    return g