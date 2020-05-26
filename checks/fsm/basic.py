# Tests for FSMs using igraph.

def state_count(student_answer, sample_answer, preload_answer, expected):
	states, transitions, initial_states, final_states = student_answer
	actual = len(states)
	if actual == int(expected):
		return {'correct': True}
	else:
		return {'correct': False,
				'feedback': '{0} was {1}, expected {2}'.format(
					"State count", actual, expected)}

