#!/usr/bin/python3

# Script to run a set of unit tests

import json
import os
from pathlib import Path
import sys
import traceback
import urllib.parse
import urllib.request

if len(sys.argv) < 2:
	print('Usage: python3 run_unit_tests.py <testfile>+')
	print('    where <testfile> is a unit test to execute')
	sys.exit(1)

def run_test(name, test_spec):
	print(name)
	if len(test_spec) != 3:
		print('\033[1m\033[91mfail ' + name + '\033[0m')
		print('    test file invalid')
		return
	[answer, test, expected] = test_spec
	params = {
			"graph": answer,
			"checks": '[' + test + ']'
			}
	url = "http://localhost:8080/test?{}".format(urllib.parse.urlencode(params))
	result = urllib.request.urlopen(url).read()
	result = json.loads(result)
	if result['type'] == 'preprocess_fail':
		print('\033[1m\033[91mfail ' + name + '\033[0m')
		print('    preprocess fail: ' + result['feedback'])
		return

	if 'error' in result['results'][0]:
		print('\033[1m\033[91mfail ' + name + '\033[0m')
		print('    check threw an error:\n' + result['results'][0]['error'])
		return

	if not 'correct' in result['results'][0]:
		print('\033[1m\033[91mfail ' + name + '\033[0m')
		print('    check did not return "correct" attribute: ' + json.dumps(result['results'][0]))
		return

	if result['results'][0]['correct'] and expected == 'fail':
		print('\033[1m\033[91mfail ' + name + '\033[0m')
		print('    expected fail, test passed')
		return

	if not result['results'][0]['correct'] and expected == 'pass':
		print('\033[1m\033[91mfail ' + name + '\033[0m')
		print('    expected pass, test failed')
		return

	print('\033[1m\033[92mpass\033[0m ' + name + '\033[0m')

for i in range(1, len(sys.argv)):
	testfile_name = sys.argv[i]
	try:
		with open(testfile_name) as testfile:
			lines = [line.strip() for line in testfile if line.strip() != '']
		run_test(testfile_name, lines)
	except (IsADirectoryError, PermissionError):
		for path in Path(testfile_name).rglob('*.txt'):
			with open(path) as testfile:
				lines = [line.strip() for line in testfile if line.strip() != '']
			run_test(str(path), lines)
