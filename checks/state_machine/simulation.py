from collections import defaultdict

def variable_after_simulation(student_answer, variable, value, inputs):

	variables = defaultdict(bool)
	state = student_answer['initial']

	for line in inputs:
		# set variables
		_set_variables(variables, line)

		# find out which transition(s) are enabled
		enabled = _get_enabled_transitions(student_answer, variables, state)

		# if 0 or >= 1 enabled: answer is incorrect
		if len(enabled) == 0:
			return {'correct': False,
					'feedback': 'State machine ended up with no enabled transitions'}
		if len(enabled) > 1:
			return {'correct': False,
					'feedback': 'State machine ended up with more than one enabled transition'}

		# else, take the transition
		transition = enabled[0]
		state = transition['to']

	# check variable
	if student_answer['states'][state][variable] == value:
		return {'correct': True}
	else:
		return {'correct': False,
				'feedback': 'State machine gave incorrect outcome'}

def _set_variables(variables, line):
	line = line.split('&&')
	for line_part in line:
		line_part = line_part.strip()
		value = True
		if line_part.startswith('!'):
			line_part = line_part[1:]
			value = False
		variables[line_part] = value

def _get_enabled_transitions(machine, variables, state):
	enabled = []

	for transition in machine['transitions']:
		if _is_transition_enabled(transition, variables, state):
			enabled.append(transition)

	return enabled

def _is_transition_enabled(transition, variables, state):
	if not transition['from'] == state:
		return False
	for variable, value in transition['enabled_if'].items():
		if variables[variable] != value:
			return False
	
	return True

