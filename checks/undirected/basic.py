# Tests for undirected graphs using igraph.

import igraph
from utilities import filter_orig_name

def connected(student_answer):
    if (student_answer.is_connected(False)):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'disconnected'}

def edge_count(student_answer, expected, highlighted):
    if highlighted == "only highlighted edges":
        onlyHighlighted = True
    else:
        onlyHighlighted = False
    count = 0
    for e in student_answer.es:
        if (not onlyHighlighted or e['highlighted']):
            count = count + 1
    if count == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'different edge count',
                'edgeCount': count,
                'expectedEdgeCount': expected}

def equivalent(student_answer, graph_answer):
    if len(student_answer.vs) != len(graph_answer.vs):
        return {'correct': False,
                'feedback' : 'vertex count wrong',
                'vertexCount': len(student_answer.vs),
                'expectedVertexCount': len(graph_answer.vs)
                }
    if len(student_answer.es) != len(graph_answer.es):
        return {'correct': False,
                'feedback' : 'edge count wrong',
                'edgeCount': len(student_answer.es),
                'expectedEdgeCount': len(graph_answer.es)}
    vs_stud = sorted(student_answer.vs, key = lambda vertex: vertex['name'])
    vs_graph = sorted(graph_answer.vs, key = lambda vertex: vertex['name'])
    
    for i in range(0,len(vs_graph)):
        #check if the matching vertex exists
        if (vs_stud[i]['name'] != vs_graph[i]['name']):
            return {'correct': False,
                    'feedback' : 'missing vertex',
                    'vertexLabel' : filter_orig_name(vs_graph[i])}
        if (vs_stud[i].degree() != vs_graph[i].degree()):
            return {'correct': False,
                    'feedback' : 'degree wrong',
                    'vertexLabel': filter_orig_name(vs_graph[i]),
                    'vertexDegree': vs_stud[i].degree(),
                    'expectedDegree': vs_graph[i].degree()}
            
        if (vs_stud[i]['color'] != vs_graph[i]['color']):
            return {'correct': False,
                    'feedback' : 'color wrong',
                    'vertexLabel': filter_orig_name(vs_graph[i]),
                    'vertexColor': vs_stud[i]['color'],
                    'expectedColor': vs_graph[i]['color']}

        graph_neigh = sorted(vs_graph[i].neighbors(), key = lambda vertex: vertex['name'])
        stud_neigh = sorted(vs_stud[i].neighbors(), key = lambda vertex: vertex['name'])
        for j in range(0,len(graph_neigh)):
            if (graph_neigh[j]['name'] != stud_neigh[j]['name']):
                return {'correct': False,
                        'feedback': 'neighborhood wrong',
                        'vertexLabel': filter_orig_name(vs_graph[i])}
        graph_edges = sorted(vs_graph[i].all_edges(), key = lambda edge: edge['label'])
        stud_edges = sorted(vs_stud[i].all_edges(), key = lambda edge: edge['label'])
        
        for j in range(0, len(graph_edges)):
            if (graph_edges[j]['label'] != stud_edges[j]['label']):
                return {'correct': False,
                        'feedback': 'edge label wrong',
                        'edgeLabel': str(stud_edges[j]['label']),
                        'fromLabel': filter_orig_name(student_answer.vs[stud_edges[j].source]),
                        'toLabel': filter_orig_name(student_answer.vs[stud_edges[j].target])}
    return {'correct': True}

def mst(student_answer):
    try:
        weights = [int(e['label']) for e in student_answer.es]
    except:
        return {'correct': False,
                'feedback': 'not all integer labels'}
    span_tree = student_answer.spanning_tree(weights)
    weight = 0
    for e in span_tree.es:
        try:
            edgeweight = int(e['label'])
        except:
            return {'correct': False,
                    'feedback': 'not integer label',
                    'edgeLabel': str(e['label'])}
        weight = weight + edgeweight

    highlightSelect = "only highlighted edges"
    firstCheck = sumEdgeWeights(student_answer, weight, highlightSelect)
    if not firstCheck['correct']:
        return firstCheck
    secondCheck = no_cycles(student_answer, highlightSelect)
    if not secondCheck['correct']:
        return secondCheck
    thirdCheck = edge_count(student_answer, len(span_tree.es), highlightSelect)
    return thirdCheck

def no_cycles(student_answer, highlighted):
    if highlighted == "only highlighted edges":
        onlyHighlighted = True
    else:
        onlyHighlighted = False

    #trivially a graph with no edges has no cycles
    if (len(student_answer.es)==0):
        return {'correct': True}

    tree_copy = student_answer.copy()

    if onlyHighlighted:
        tree_copy.es.select(highlighted=False).delete()
        span_tree = tree_copy.spanning_tree()
    else:
        span_tree = student_answer.spanning_tree()
    edgespan  = getattr(span_tree, "ecount")()
    edgegraph = getattr(tree_copy, "ecount")()
    if edgespan == edgegraph:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'has cycle'}

def same_highlights(student_answer, expected):
    if not student_answer.isomorphic(expected):
        return {'correct': False,
                'feedback': 'not isomorphic graphs'}
    #inefficient
    for v in student_answer.vs:
        vName = filter_orig_name(v)
        for w in expected.vs:
            wName = filter_orig_name(w)
            if vName == wName:
                if v['highlighted'] != w['highlighted']:
                    return {'correct': False, 'feedback': 'highlighted vertices mismatched'}
                break;
    for e in student_answer.es:
        eSource = filter_orig_name(student_answer.vs[e.source])
        eTarget = filter_orig_name(student_answer.vs[e.target])
        for f in expected.es:
            fSource = filter_orig_name(expected.vs[f.source])
            fTarget = filter_orig_name(expected.vs[f.target])
            if (eSource == fSource and eTarget == fTarget) or (eSource == fTarget and eTarget == fSource):
                if e['highlighted'] != f['highlighted']:
                    return {'correct': False, 'feedback': 'highlighted edges mismatched'}
                break;
        
    return {'correct': True}

def sumEdgeWeights(student_answer, expected, highlighted):
    if highlighted == "only highlighted edges":
        onlyHighlighted = True
    else:
        onlyHighlighted = False
        
    weight = 0
    for e in student_answer.es:
        try:
            edgeweight = int(e['label'])
        except:
            return {'correct': False,
                    'feedback': 'not integer label',
                    'edgeLabel': str(e['label'])}
        if (not onlyHighlighted or e['highlighted']):
            weight = weight + edgeweight
    if weight == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'wrong sum',
                'expectedSum': expected,
                'weightSum': weight}

def vertex_count(student_answer, expected, highlighted):
    if highlighted == "only highlighted vertices":
        onlyHighlighted = True
    else:
        onlyHighlighted = False
    count = 0
    for v in student_answer.vs:
        if (not onlyHighlighted or v['highlighted']):
            count = count + 1
    if count == expected:
        return {'correct': True,
                'feedback': 'correct'}
    elif count < expected:
        return {'correct': False,
                'feedback': 'too few vertices',
                'actual': count}
    else:
        return {'correct': False,
                'feedback': 'too many vertices',
                'actual': count}
