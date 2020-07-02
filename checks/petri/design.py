import math


def no_forbidden_words(student_answer, words):
    for place in student_answer.places:
        if place.name in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not allowed.'.format(place.name)}

    for transition in student_answer.transitions:
        if transition.name in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not allowed.'.format(transition.name)}

    return {'correct': True}


def only_mandatory_words(student_answer, words):
    for place in student_answer.places:
        if place.name not in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not in the list of allowed labels.'.format(place.name)}

    for transition in student_answer.transitions:
        if transition.name not in words:
            return {'correct': False,
                    'feedback': 'Label {0} was used but is not in the list of allowed labels.'.format(transition.name)}

    return {'correct': True}


def no_duplicate_label(student_answer):
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


def left_to_right(student_answer):
    for arc in student_answer.arcs:
        a_pos = arc.source.properties['position'][0]
        b_pos = arc.target.properties['position'][0]
        if a_pos >= b_pos:
            return {'correct': False,
                    'feedback': 'The arc between {0} and {1} is not left to right. '
                                'This is not allowed.'.format(arc.source.name, arc.target.name)}

    return {'correct': True}


def top_to_bottom(student_answer):
    for arc in student_answer.arcs:
        a_pos = arc.source.properties['position'][1]
        b_pos = arc.target.properties['position'][1]
        if a_pos >= b_pos:
            return {'correct': False,
                    'feedback': 'The arc between {0} and {1} is not top to bottom. '
                                'This is not allowed.'.format(arc.source.name, arc.target.name)}

    return {'correct': True}


def det(a, b, c, d, e, f, g, h, i):
    return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g


def circle_from_three_points(x1, y1, x2, y2, x3, y3):
    a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1)
    bx = -det(x1 * x1 + y1 * y1, y1, 1, x2 * x2 + y2 * y2, y2, 1, x3 * x3 + y3 * y3, y3, 1)
    by = det(x1 * x1 + y1 * y1, x1, 1, x2 * x2 + y2 * y2, x2, 1, x3 * x3 + y3 * y3, x3, 1)
    c = -det(x1 * x1 + y1 * y1, x1, y1, x2 * x2 + y2 * y2, x2, y2, x3 * x3 + y3 * y3, x3, y3)
    return {
        'x': -bx / (2 * a),
        'y': -by / (2 * a),
        'radius': math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * abs(a))
    }


def get_anchor_point(node_a, node_b, bend):
    parallel_part = bend['parallelPart']
    perpendicular_part = bend['perpendicularPart']
    ax = node_a.properties['position'][0]
    ay = node_a.properties['position'][1]
    bx = node_b.properties['position'][0]
    by = node_b.properties['position'][1]

    dx = bx - ax
    dy = by - ay
    scale = math.sqrt(dx * dx + dy * dy)
    return [
        ax + dx * parallel_part - dy * perpendicular_part / scale,
        ay + dy * parallel_part + dx * perpendicular_part / scale
    ]


def get_arc_geometry_object(arc):
    start_x = arc.source.properties['position'][0]
    start_y = arc.source.properties['position'][1]
    end_x = arc.target.properties['position'][0]
    end_y = arc.target.properties['position'][1]

    if arc.properties['bend']['perpendicularPart'] == 0:
        return {
            'has_circle': False,
            'start_x': start_x,
            'start_y': start_y,
            'end_x': end_x,
            'end_y': end_y,
        }

    # TODO: change: it looks like I guessed correctly :D
    node_radius = 30

    anchor = get_anchor_point(arc.source, arc.target, arc.properties['bend'])
    circle = circle_from_three_points(start_x, start_y, end_x, end_y, anchor[0], anchor[1])
    is_reversed = (arc.properties['bend']['perpendicularPart'] > 0)
    reverse_scale = 1 if is_reversed else -1
    r_ratio = reverse_scale * node_radius / circle['radius']
    start_angle = math.atan2(start_y - circle['y'], start_x - circle['x']) - r_ratio
    if start_angle < 0:
        start_angle += math.pi * 2
    end_angle = math.atan2(end_y - circle['y'], end_x - circle['x']) + r_ratio
    if end_angle < 0:
        end_angle += math.pi * 2
    final_start_x = circle['x'] + circle['radius'] * math.cos(start_angle)
    final_start_y = circle['y'] + circle['radius'] * math.sin(start_angle)
    final_end_x = circle['x'] + circle['radius'] * math.cos(end_angle)
    final_end_y = circle['y'] + circle['radius'] * math.sin(end_angle)
    return {
        'has_circle': True,
        'circle': circle,
        'start_x': final_start_x,
        'start_y': final_start_y,
        'end_x': final_end_x,
        'end_y': final_end_y,
        'start_angle': start_angle,
        'end_angle': end_angle,
        'reverse_scale': reverse_scale,
        'is_reversed': is_reversed,
    }


def line_line_intersect(geom_a, geom_b):
    # Contains utility functions from
    # https://kite.com/python/answers/how-to-check-if-two-line-segments-intersect-in-python
    def on_segment(p, q, r):
        if r[0] <= max(p[0], q[0]) and r[0] >= min(p[0], q[0]) \
                and r[1] <= max(p[1], q[1]) and r[1] >= min(p[1], q[1]):
            return True
        return False

    def orientation(p, q, r):
        val = ((q[1] - p[1]) * (r[0] - q[0])) - ((q[0] - p[0]) * (r[1] - q[1]))

        if val == 0:
            return 0
        return 1 if val > 0 else -1

    def intersects(seg1, seg2):
        p1, q1 = seg1
        p2, q2 = seg2

        o1 = orientation(p1, q1, p2)
        o2 = orientation(p1, q1, q2)
        o3 = orientation(p2, q2, p1)
        o4 = orientation(p2, q2, q1)

        if o1 != o2 and o3 != o4:
            return True

        if (o1 == 0 and on_segment(p1, q1, p2)) \
                or (o2 == 0 and on_segment(p1, q1, q2)) \
                or (o3 == 0 and on_segment(p2, q2, p1)) \
                or (o4 == 0 and on_segment(p2, q2, q1)):
            return True

        return False

    line1 = ((geom_a['start_x'], geom_a['start_y']), (geom_a['end_x'], geom_a['end_y']))
    line2 = ((geom_b['start_x'], geom_b['start_y']), (geom_b['end_x'], geom_b['end_y']))

    return intersects(line1, line2)


def point_on_arc(circle, point):
    angle = math.atan2(point[1] - circle['circle']['y'], point[0] - circle['circle']['x'])
    if angle < 0:
        angle += math.pi * 2
    if circle['start_angle'] <= circle['end_angle']:
        if circle['is_reversed']:
            return angle < circle['start_angle'] or angle > circle['end_angle']
        else:
            return circle['start_angle'] < angle < circle['end_angle']
    else:
        if circle['is_reversed']:
            return circle['start_angle'] > angle > circle['end_angle']
        else:
            return angle > circle['start_angle'] or angle < circle['end_angle']


def circle_circle_intersect(geom_a, geom_b):
    x0 = geom_a['circle']['x']
    y0 = geom_a['circle']['y']
    r0 = geom_a['circle']['radius']
    x1 = geom_b['circle']['x']
    y1 = geom_b['circle']['y']
    r1 = geom_b['circle']['radius']

    dist = math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2)

    if dist > r0 + r1:
        return False
    if dist < abs(r1 - r0):
        return False
    if dist == 0 and r1 == r0:
        return False

    # (x3,y3) (x4,y4) are the intersection points
    a = (r0 ** 2 - r1 ** 2 + dist ** 2) / (2 * dist)
    h = math.sqrt(r0 ** 2 - a ** 2)
    x2 = x0 + a * (x1 - x0) / dist
    y2 = y0 + a * (y1 - y0) / dist
    x3 = x2 + h * (y1 - y0) / dist
    y3 = y2 - h * (x1 - x0) / dist
    x4 = x2 - h * (y1 - y0) / dist
    y4 = y2 + h * (x1 - x0) / dist

    if (point_on_arc(geom_a, [x3, y3]) and point_on_arc(geom_b, [x3, y3])) or \
            (point_on_arc(geom_a, [x4, y4]) and point_on_arc(geom_b, [x4, y4])):
        return True

    return False


def line_circle_intersect(line_a, circle_b):
    # https://stackoverflow.com/questions/30844482/what-is-most-efficient-way-to-find-the-intersection-of-a-line-and-a-circle-in-py
    x0, y0, r0 = circle_b['circle']['x'], circle_b['circle']['y'], circle_b['circle']['radius']
    x1, y1 = line_a['start_x'], line_a['start_y']
    x2, y2 = line_a['end_x'], line_a['end_y']
    if x1 == x2:
        if abs(r0) >= abs(x1 - x0):
            p1 = [x1, y0 - math.sqrt(r0 ** 2 - (x1 - x0) ** 2)]
            p2 = [x1, y0 + math.sqrt(r0 ** 2 - (x1 - x0) ** 2)]
            inp = [p1, p2]
            # select the points lie on the line segment
            inp = [p for p in inp if p[1] >= min(y1, y2) and p[1] <= max(y1, y2)]
        else:
            inp = []
    else:
        k = (y1 - y2) / (x1 - x2)
        b0 = y1 - k * x1
        a = k ** 2 + 1
        b = 2 * k * (b0 - y0) - 2 * x0
        c = (b0 - y0) ** 2 + x0 ** 2 - r0 ** 2
        delta = b ** 2 - 4 * a * c
        if delta >= 0:
            p1x = (-b - math.sqrt(delta)) / (2 * a)
            p2x = (-b + math.sqrt(delta)) / (2 * a)
            p1y = k * x1 + b0
            p2y = k * x2 + b0
            inp = [[p1x, p1y], [p2x, p2y]]
            # select the points lie on the line segment
            inp = [p for p in inp if p[0] >= min(x1, x2) and p[0] <= max(x1, x2)]
        else:
            inp = []

    for p in inp:
        if point_on_arc(circle_b, p):
            return True

    return False


def geom_intersect(geom_a, geom_b, share_node):
    if geom_a['has_circle'] and geom_b['has_circle']:
        return circle_circle_intersect(geom_a, geom_b)

    if not geom_a['has_circle'] and not geom_b['has_circle']:
        if share_node:
            return False
        return line_line_intersect(geom_a, geom_b)

    circle = geom_a if geom_a['has_circle'] else geom_b
    line = geom_b if geom_a['has_circle'] else geom_a

    return line_circle_intersect(line, circle)


def crossing_arcs(student_answer, max_crossings):
    intersects = 0
    for arc_a in student_answer.arcs:
        for arc_b in student_answer.arcs:
            if arc_a == arc_b:
                continue

            # Arcs sharing a node should not intersect if they are lines
            share_node = arc_a.source == arc_b.target or arc_a.target == arc_b.source \
                         or arc_a.source == arc_b.source or arc_a.target == arc_b.target

            if geom_intersect(get_arc_geometry_object(arc_a), get_arc_geometry_object(arc_b), share_node):
                print(str(arc_a) + " intersects with " + str(arc_b))
                intersects += 1

    # Intersects are counted twice
    intersects = int(intersects / 2)

    print(intersects)
    if intersects > int(max_crossings):
        return {'correct': False,
                'feedback': 'There are {0} edge intersections, at most {1} allowed.'.format(
                    intersects, max_crossings)}

    return {'correct': True}


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


def horizontally_adjacent(student_answer, labels):
    return adjacent_helper(student_answer, labels, 1)


def vertically_adjacent(student_answer, labels):
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


def list_left_of(student_answer, labels_a, labels_b):
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


def list_above_of(student_answer, labels_a, labels_b):
    if labels_overlap(labels_a, labels_b):
        return {'correct': False,
                'feedback': 'Overlapping labels in group A and B.'}

    a_list = get_node_list(student_answer, labels_a)
    b_list = get_node_list(student_answer, labels_b)

    for thing in a_list:
        y = thing.properties['position'][1]
        for other in b_list:
            other_y = other.properties['position'][1]
            if y >= other_y:
                return {'correct': False,
                        'feedback': 'Node {0} should be above node {1}'.format(thing.name, other.name)}

    return {'correct': True}