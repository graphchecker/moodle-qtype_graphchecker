import importlib
import json
import os
import traceback

root_dir = os.getcwd()

def run(graph_type, graph, checks):
	preprocess = importlib.import_module('preprocess')

	type_file = os.path.join(root_dir, graph_type, 'type.json')
	with open(type_file) as f:
		type_info = json.load(f)
	if 'python_modules' in type_info:
		for module in type_info['python_modules']:
			globals()[module] = importlib.import_module(module)

	if not graph:
		return {
			'type': 'preprocess_fail',
			'feedback': 'You submitted an empty answer'
		}

	try:
		graph = preprocess.preprocess(json.loads(graph))
	except Exception as e:
		return {
			'type': 'preprocess_fail',
			'feedback': str(e)
		}

	check_data = available_checks(graph_type)

	checks = json.loads(checks)
	results = []
	correct = True
	grade = 0  # points awarded
	totalGrade = 0  # total points seen in partial grade blocks
	for check in checks:
		if 'type' in check and check['type'] == 'grade':
			points = float(check['points']) / 100
			totalGrade += points
			if correct:
				grade += points
			elif check['continue']:
				correct = True
		else:
			try:
				check_module = importlib.import_module(check['module'])
				check_method = getattr(check_module, check['method'])
				argument = convert_arguments(check['arguments'], check_data[check['module']]['checks'][check['method']], preprocess)
				result = check_method(graph, **argument)
				result['module'] = check['module']
				result['method'] = check['method']
				if not result['correct']:
					correct = False
				results.append(result)
			except:
				stacktrace = traceback.format_exc()
				results.append({
					'module': check['module'],
					'method': check['method'],
					'error': stacktrace
					})

	# if less than 100% of the points have been awarded, and the last checks
	# were correct, award the remainder of the points
	if correct:
		grade += 1 - totalGrade

	return {
		'type': 'success',
		'results': results,
		'grade': grade
	}

def convert_arguments(args, check, preprocess):
	converted = {}
	for a in args:
		converted[a] = convert_argument(a, args[a], check, preprocess)
	return converted

def convert_argument(name, value, check, preprocess):
	param_type = next(p for p in check['params'] if p['param'] == name)['type']
	if param_type == 'integer':
		return int(value)
	elif param_type == 'string_list':
		values = value.split('\n')
		if len(values) == 1:
			values = values[0].split(',')
		return values
	elif param_type == 'graph':
		return preprocess.preprocess(json.loads(value))
	else:
		return value

def available_checks(graph_type):

	# see get_available_checks() in classes/check.php

	modules = {}

	# note: this needs to werk both for the tester, where the checks are
	# in a subdirectory graph_type/, and on the server, where everything
	# is placed in the same directory

	if os.path.exists(os.path.join(root_dir, graph_type)):
		directory = os.path.join(root_dir, graph_type)
	else:
		directory = root_dir
	for file in os.listdir(directory):
		if file.endswith('.json') and file != "types.json":
			checks = json.load(open(os.path.join(directory, file)))
			modules[file[:-5]] = checks

	return modules

