import importlib
import json
import os
import traceback

root_dir = os.path.join(os.getcwd(), '..')

def run(graph_type, graph, checks):
	preprocess = importlib.import_module(graph_type + '.preprocess')

	types_file = os.path.join(root_dir, 'checks', 'types.json')
	with open(types_file) as types:
		types = json.load(types)
	if 'python_modules' in types[graph_type]:
		for module in types[graph_type]['python_modules']:
			globals()[module] = importlib.import_module(module)

	graph = preprocess.preprocess(json.loads(graph))

	empty_graph = {'_version': 1, 'vertices': [], 'edges': []}
	empty_graph = preprocess.preprocess(empty_graph)

	check_data = available_checks(graph_type)

	checks = json.loads(checks)
	results = []
	for check in checks:
		try:
			check_module = importlib.import_module(graph_type + '.' + check['module'])
			check_method = getattr(check_module, check['method'])
			argument = convert_arguments(check['arguments'], check_data[check['module']]['checks'][check['method']])
			result = check_method(graph, empty_graph, empty_graph, **argument)
			results.append(result)
		except:
			stacktrace = traceback.format_exc()
			results.append({'error': stacktrace})

	return results

def convert_arguments(args, check):
	converted = {}
	for a in args:
		converted[a] = convert_argument(a, args[a], check)
	return converted

def convert_argument(name, value, check):
	param_type = next(p for p in check['params'] if p['param'] == name)['type']
	if param_type == 'integer':
		return int(value)
	elif param_type == 'string_list':
		return value.split('\n')
	else:
		return value

def available_checks(graph_type):

	# see get_available_checks() in classes/check.php

	modules = {}

	directory = os.path.join(root_dir, 'checks', graph_type)
	for file in os.listdir(directory):
		if file.endswith('.json'):
			checks = json.load(open(os.path.join(root_dir, 'checks', graph_type, file)))
			modules[file[:-5]] = checks

	return modules
