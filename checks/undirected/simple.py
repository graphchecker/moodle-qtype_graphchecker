# Simple tests for undirected graphs.

def vertex_count(student_answer, expected):
    count = len(student_answer['nodes'])
    if count == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Vertex count was {0}, expected {1}'.format(count, expected)}

def edge_count(student_answer, expected):
    count = len(student_answer['edges'])
    if count == expected:
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Edge count was {0}, expected {1}'.format(count, expected)}

def connectedness(student_answer):
    if len(student_answer['nodes']) == 0:
        return {'correct': True}

    adj = node_adjacencies(student_answer)
    visited = [False for i in student_answer['nodes']]

    def dfs(node_id):
        if visited[node_id]:
            return 0
        visited[node_id] = True
        count = 1
        for neighbor in adj[node_id]:
            count += dfs(neighbor)
        return count

    num_found_nodes = dfs(0);

    if num_found_nodes == len(student_answer['nodes']):
        return {'correct': True}
    else:
        return {'correct': False,
                'feedback': 'Your graph has more than one connected component'}


# Helper methods

# returns a list that contains for each vertex a list of vertices it is
# adjacent to
def node_adjacencies(student_answer):
    adj = [[] for i in student_answer['nodes']]
    for edge in student_answer['edges']:
        adj[edge[0]].append(edge[1])
        adj[edge[1]].append(edge[0])
    return adj


## TODO the following tests still need to be refactored


# tests if the student's answer has the same vertices as the given graph
def test_vertices():
    student_node_ids = sorted([node['id'] for node in student_nodes])
    given_node_ids = sorted([node['id'] for node in given_nodes])
    if student_node_ids != given_node_ids:
        result = ("The vertices in your graph do not correspond to those in the original graph\n"
                "Expected: {1}\nGot: {0}").format(student_node_ids, given_node_ids)
        return (result, 0)
    else:
        return ("Correct!", 1)

# tests if all edges in the student's answer are also in the given graph
def test_no_added_edges():
    for e in student_edges:
        if e not in given_edges:
            result = ("You added an edge that was not in the original graph "
                    "(for example {0} -> {1})").format(e[0], e[1])
            return (result, 0)
    return ("Correct!", 1)

# tests if all vertices in the student's answer have degree d
def test_all_degrees(d):
    for node in student_nodes:
        degree = len(node['adj'])
        if not degree == d:
            result = ("Your graph has one or more nodes which do not have degree {2} "
                    "(for example vertex {0} has degree {1})").format(node['id'], degree, d)
            return (result, 0)
    return ("Correct!", 1)
