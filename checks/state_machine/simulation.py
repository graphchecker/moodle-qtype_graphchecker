from collections import defaultdict

def variable_after_simulation(student_answer, variable, value, inputs):

	variables = defaultdict(bool)
	state = student_answer['initial']

	for line in inputs:

		# set variables
		_set_variables(variables, line)

		# do transitions while we can
		# if we visit a state twice, that's a fail
		visited_states = set()

		while True:

			# if we've visited this state before, that's a fail
			if state in visited_states:
				return {'correct': False,
						'feedback': 'infinite loop',
						'state': _get_state_name(student_answer, state),
						'inputs': _get_inputs(variables)}

			visited_states.add(state)

			# find out which transition(s) are enabled
			enabled = _get_enabled_transitions(student_answer, variables, state)

			# if 0 enabled: okay, we're done
			if len(enabled) == 0:
				break
			# if >= 1 enabled: answer is incorrect
			if len(enabled) > 1:
				return {'correct': False,
						'feedback': '>= 1 enabled transition',
						'state': _get_state_name(student_answer, state),
						'inputs': _get_inputs(variables)}

			# else, take the transition
			transition = enabled[0]
			state = transition['to']

	# check variable
	if student_answer['states'][state][variable] == value:
		return {'correct': True,
				'feedback': 'correct'}
	else:
		return {'correct': False,
				'feedback': 'incorrect answer',
				'actual': student_answer['states'][state][variable]}

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

def _get_state_name(student_answer, state_id):
	state = student_answer['states'][state_id]
	return ' / '.join([k + '=' + str(v) for k, v in state.items()])

def _get_inputs(variables):
	return ' ∧ '.join([k if v else '!' + k for k, v in variables.items()])

