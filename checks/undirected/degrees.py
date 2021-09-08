from utilities import filter_orig_name

def vertex_degree_at_most(student_answer, max_degree):
    for v in student_answer.vs:
        if v.degree() > max_degree:
            v_name = filter_orig_name(v)
            if not v_name:
                v_name = '-no label-'
            return {'correct': False,
                    'feedback': 'max degree too high',
                    'vertexLabel': v_name,
                    'vertexDegree': v.degree(),
                    'maxDegree': max_degree
                    }
    return {'correct': True}

def number_vertices_of_degree(student_answer, number_of_verts, degree):
    found = 0
    for v in student_answer.vs:
        if v.degree() == degree:
            found += 1

    if found != number_of_verts:
        return {'correct': False,
                'feedback': 'vertex of degree count wrong',
                'degree': degree,
                'vertexCount': found,
                'expectedVertexCount': number_of_verts
               }
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
                'feedback': 'vertex count wrong',
                'vertexCount': len(student_answer.vs),
                'expectedVertexCount': lengthSeq}
    student_degs = []
    for v in student_answer.vs:
        student_degs.append(v.degree())

    sequence.sort()
    student_degs.sort()
    for deg, stu_deg in zip(sequence, student_degs):
        if int(deg) != stu_deg:
            return {'correct': False,
                    'feedback': 'degree sequence wrong',
                    'expectedDegree': deg,
                    'foundDegree': stu_deg}

    return {'correct': True}

