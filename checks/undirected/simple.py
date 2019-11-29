# Simple tests for undirected graphs.

# tests if the graph has exactly the given number of vertices
# expected: the expected number of vertices
def vertex_count(student_answer, expected):
    count = len(student_answer['nodes'])
    if count == expected:
        return ('', 1)
    else:
        return ('Vertex count was {0}, expected {1}'.format(count, expected), 0)

# tests if the graph has exactly the given number of edges
# expected: the expected number of edges
def edge_count(student_answer, expected):
    count = len(student_answer['edges'])
    if count == expected:
        return ('', 1)
    else:
        return ('Edge count was {0}, expected {1}'.format(count, expected), 0)

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

# tests if the student's answer is a connected graph
def test_connectedness():
    if len(student_nodes) == 0:
        return ("Your graph has no connected components", 0)

    visited = [False for i in student_nodes]

    def dfs(node_id):
        if visited[node_id]:
            return 0
        visited[node_id] = True
        count = 1
        for neighbor in student_nodes[node_id]['adj']:
            count += dfs(neighbor)
        return count

    num_found_nodes = dfs(0);

    if num_found_nodes == len(student_nodes):
        return ("Correct!", 1)
    else:
        return ("Your graph has more than one connected component", 0)

