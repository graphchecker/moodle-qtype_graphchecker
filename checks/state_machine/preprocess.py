import json

def preprocess(graph):
	graph = json.loads(graph)

	states = []
	initial = -1
	for i, vertex in enumerate(graph['vertices']):
		label = vertex['label']
		s = {}
		label = label.split(';')
		for label_part in label:
			label_part = label_part.strip()
			label_part_split = label_part.split('=')
			if len(label_part_split) != 2:
				raise Exception('Label of state "' + vertex['label'] + '" is invalid ' +
						'(could not parse "' + label_part + '")')
			variable, value = label_part_split
			try:
				value = int(value)
			except ValueError:
				raise Exception('Label of state "' + vertex['label'] + '" is invalid ' +
						'(value "' + value + '" of variable "' +
						variable + '" needs to be an integer)')
			s[variable] = value
		states.append(s)

		if vertex['initial']:
			initial = i

	if initial == -1:
		raise Exception('State machine does not have an initial state')

	transitions = []
	for i, edge in enumerate(graph['edges']):
		t = {}
		t['from'] = edge['from']
		t['to'] = edge['to']
		label = edge['label']
		enabled_if = {}
		label = label.split('&&')
		for label_part in label:
			label_part = label_part.strip()
			value = True
			if label_part.startswith('!'):
				label_part = label_part[1:]
				value = False
			enabled_if[label_part] = value
		t['enabled_if'] = enabled_if
		transitions.append(t)

	machine = {
			'states': states,
			'transitions': transitions,
			'initial': initial
			}

	return machine
