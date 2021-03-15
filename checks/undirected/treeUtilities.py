def children(v, down):
    split = splitParentChildren(v, down)
    (par, chil) = split
    if len(chil) == 0:
        return (None, None)
    elif len(chil) == 1:
        if chil[0]['x'] < v['x']:
            return (chil[0], None)
        else:
            return (None, chil[0])
    else:
        if chil[0]['x'] < chil[1]['x']:
            return (chil[0], chil[1])
        else:
            return (chil[1], chil[0])

def findRoot(student_answer, down):
    root = None
    for v in student_answer.vs:
        split = splitParentChildren(v, down)
        if split == None:
            return None
        (par, chil) = split
        if len(par) == 0 and root == None:
            root = v
        elif len(par) == 0 and not root == None:
            return None
    return root

def splitParentChildren(v, down):
    parents = []
    children = []
    
    for w in v.neighbors():
        if (w['y'] < v['y'] and down) or (w['y'] > v['y'] and not down):
            parents.append(w)
        elif (w['y'] > v['y'] and down) or (w['y'] < v['y'] and not down):
            children.append(w)
        else:
            return None
    return (parents, children)
