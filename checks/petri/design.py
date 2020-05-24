def no_forbidden_words(student_answer, sample_answer, preload_answer, words):
    for place in student_answer.places:
        if place.name in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not allowed.'.format(place.name)}

    for transition in student_answer.transitions:
        if transition.name in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not allowed.'.format(transition.name)}

    return {'correct': True}


def only_mandatory_words(student_answer, sample_answer, preload_answer, words):
    for place in student_answer.places:
        if place.name not in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not in the list of allowed labels.'.format(place.name)}

    for transition in student_answer.transitions:
        if transition.name in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not in the list of allowed labels.'.format(transition.name)}

    return {'correct': True}


def no_duplicate_label(student_answer, sample_answer, preload_answer):
    used_labels = set()
    for place in student_answer.places:
        if place.name in used_labels:
            return {'correct': False,
                    'feedback': 'Label {0} was used multiple times. This is not allowed.'.format(place.name)}
        used_labels.add(place.name)

    for transition in student_answer.transitions:
        if transition.name in used_labels:
            return {'correct': False,
                    'feedback': 'Label {0} was used multiple times. This is not allowed.'.format(transition.name)}
        used_labels.add(transition.name)

    return {'correct': True}


def left_to_right(student_answer, sample_answer, preload_answer):
    for arc in student_answer.arcs:
        a_pos = arc.source.properties['position'][0]
        b_pos = arc.target.properties['position'][0]
        if a_pos >= b_pos:
            return {'correct': False,
                    'feedback': 'The arc between {0} and {1} is not left to right. '
                                'This is not allowed.'.format(arc.source.name, arc.target.name)}

    return {'correct': True}


def top_to_bottom(student_answer, sample_answer, preload_answer):
    for arc in student_answer.arcs:
        a_pos = arc.source.properties['position'][1]
        b_pos = arc.target.properties['position'][1]
        if a_pos <= b_pos:
            return {'correct': False,
                    'feedback': 'The arc between {0} and {1} is not top to bottom. '
                                'This is not allowed.'.format(arc.source.name, arc.target.name)}

    return {'correct': True}


def crossing_arcs(student_answer, sample_answer, preload_answer):
    # TODO
    pass


def adjacent_helper(net, labels, axis):
    eps = 5
    rough_coord = None
    my_axis = 'horizontally' if axis == 1 else 'vertically'
    for place in net.places:
        if place.name not in labels:
            continue
        if rough_coord is None:
            rough_coord = place.properties['position'][axis]
        else:
            if abs(place.properties['position'][axis] - rough_coord) > eps:
                return {'correct': False,
                        'feedback': 'Place {0} does not {1} align well enough.'.format(place.name, my_axis)}

    for transition in net.transitions:
        if transition.name not in labels:
            continue
        if rough_coord is None:
            rough_coord = transition.properties['position'][axis]
        else:
            if abs(transition.properties['position'][axis] - rough_coord) > eps:
                return {'correct': False,
                        'feedback': 'Transition {0} does not {1} align well enough.'.format(transition.name, my_axis)}

    return {'correct': True}


def horizontally_adjacent(student_answer, sample_answer, preload_answer, labels):
    return adjacent_helper(student_answer, labels, 1)


def vertically_adjacent(student_answer, sample_answer, preload_answer, labels):
    return adjacent_helper(student_answer, labels, 0)


def labels_overlap(labels_a, labels_b):
    for label in labels_a:
        if label in labels_b:
            return True

    return False


def get_node_list(net, label_list):
    my_list = []

    for place in net.places:
        if place.name in label_list:
            my_list.append(place)
    for transition in net.transitions:
        if transition.name in label_list:
            my_list.append(transition)

    return my_list


def list_left_of(student_answer, sample_answer, preload_answer, labels_a, labels_b):
    if labels_overlap(labels_a, labels_b):
        return {'correct': False,
                'feedback': 'Overlapping labels in group A and B.'}

    a_list = get_node_list(student_answer, labels_a)
    b_list = get_node_list(student_answer, labels_b)

    for thing in a_list:
        x = thing.properties['position'][0]
        for other in b_list:
            other_x = other.properties['position'][0]
            if x >= other_x:
                return {'correct': False,
                        'feedback': 'Node {0} should be to the left of node {1}'.format(thing.name, other.name)}

    return {'correct': True}


def list_above_of(student_answer, sample_answer, preload_answer, labels_a, labels_b):
    if labels_overlap(labels_a, labels_b):
        return {'correct': False,
                'feedback': 'Overlapping labels in group A and B.'}

    a_list = get_node_list(student_answer, labels_a)
    b_list = get_node_list(student_answer, labels_b)

    for thing in a_list:
        y = thing.properties['position'][1]
        for other in b_list:
            other_y = other.properties['position'][1]
            if y <= other_y:
                return {'correct': False,
                        'feedback': 'Node {0} should be above node {1}'.format(thing.name, other.name)}

    return {'correct': True}
