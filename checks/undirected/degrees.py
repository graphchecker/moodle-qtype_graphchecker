def vertex_degree_at_most(student_answer, max_degree):
    for v in student_answer.vs:
        if v.degree() > max_degree:
            v_name = 'Some vertex' if not v['name'] else 'Vertex ' + v['name']
            return {'correct': False,
                    'feedback': '{0} has degree {1}, but the maximum degree should be {2}'.format(v_name, v.degree(), max_degree)}
    return {'correct': True}

def number_vertices_of_degree(student_answer, number_of_verts, degree):
    found = 0
    for v in student_answer.vs:
        if v.degree() == degree:
            found += 1

    if found != number_of_verts:
        return {'correct': False,
                'feedback': 'Number of vertices with degree {0}, is {1}, but should be {2}'.format(degree, found, number_of_verts)}
    else:
        return {'correct': True}

def vertex_degree_sequence(student_answer, degree_sequence):
    sequence = degree_sequence.split(",")
    lengthSeq = len(sequence)
    
    #border case where no sequence is given to cover for split returning one empty element
    if (lengthSeq == 1 and sequence[0] == ''):
        lengthSeq = 0

    if (len(student_answer.vs) != lengthSeq):
        return {'correct': False,
                'feedback': 'Number of vertices {0}, does not match the expected number of vertices {1}'.format(len(student_answer.vs), lengthSeq)}
    student_degs = []
    for v in student_answer.vs:
        student_degs.append(v.degree())

    sequence.sort()
    student_degs.sort()
    for deg, stu_deg in zip(sequence, student_degs):
        if int(deg) != stu_deg:
            return {'correct': False,
                    'feedback': 'Degree sequence does not match expected degree sequence. Expected a vertex with degree {0} but found one with degree {1}.'.format(deg, stu_deg)}

    return {'correct': True}

