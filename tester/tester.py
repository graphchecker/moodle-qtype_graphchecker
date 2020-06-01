#!/usr/bin/python3

# Tester for GraphChecker checks

import cherrypy
import importlib
import json
import os
import sys
import traceback

sys.path.append(os.path.join(os.getcwd(), '../checks'))
import checkrunner

root_dir = os.path.join(os.getcwd(), '..')

if len(sys.argv) != 2:
	print('Usage: python3 tester.py <graph_type>')
	print('    where <graph_type> can be any of the defined graph types (subdirectories of the checks directory)')
	sys.exit(1)

graph_type = sys.argv[1]
sys.path.append(os.path.join(os.getcwd(), '../checks', graph_type))

class GCTester:

	@cherrypy.expose
	def index(self):
		return open('tester.html')

	@cherrypy.expose
	@cherrypy.tools.json_out()
	def test(self, graph, checks):
		return checkrunner.run(graph_type, graph, checks)

	@cherrypy.expose
	@cherrypy.tools.json_out()
	def input_params(self):

		# see get_ui_params() in question.php

		types_file = os.path.join(root_dir, 'checks', 'types.json')
		with open(types_file) as types:
			types = json.load(types)
		return types[graph_type]['ui_params']

	@cherrypy.expose
	@cherrypy.tools.json_out()
	def available_checks(self):

		# see get_available_checks() in classes/check.php

		modules = {}

		directory = os.path.join(root_dir, 'checks', graph_type)
		for file in os.listdir(directory):
			if file.endswith('.json'):
				checks = json.load(open(os.path.join(root_dir, 'checks', graph_type, file)))
				modules[file[:-5]] = checks

		return modules


conf = {
	'/': {
		'tools.staticdir.root': os.getcwd()
	},
	'/css/style-moodle.css': {
		'tools.staticfile.on': True,
		'tools.staticfile.filename': os.path.join(os.getcwd(), '../styles.css')
	},
	'/js': {
		'tools.staticdir.on': True,
		'tools.staticdir.dir': './js'
	},
	'/js/core': {
		'tools.staticdir.on': True,
		'tools.staticdir.dir': './js/core'
	},
	'/js/qtype_graphchecker': {
		'tools.staticdir.on': True,
		'tools.staticdir.dir': '../amd/src'
	}
}

webapp = GCTester()
cherrypy.quickstart(GCTester(), '/', conf)
