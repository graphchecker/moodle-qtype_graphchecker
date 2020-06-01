console.log('initializing modules');

requirejs.config({
	'paths': {
		'jquery': 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.0/jquery.min'
	}
});

requirejs(["jquery",
			"qtype_graphchecker/userinterfacewrapper",
			"qtype_graphchecker/ui_checks",
			"qtype_graphchecker/ui_graph"],
		function($, ui, ui_checks, ui_graph) {
	console.log('modules loaded!');

	let graphwrapper, checksWrapper;

	$.getJSON('/input_params',
		(inputParams) => {
			$('#graph-ui-textarea').attr('data-params', JSON.stringify(inputParams));
			graphWrapper = new ui.InterfaceWrapper('graph', 'graph-ui-textarea');

			$.getJSON('/available_checks',
				(availableChecks) => {
					$('#checks-ui-textarea').attr('data-available-checks', JSON.stringify(availableChecks));
					checksWrapper = new ui.InterfaceWrapper('checks', 'checks-ui-textarea');

					$('#run-tests-button').on('click', runTests.bind(this));
				}
			);
		}
	);

	function runTests() {
		$('#results').html("Running...");

		checksWrapper.uiInstance.sync();
		$.ajax('/test', {
			'type': 'get',
			'data': {
				'graph': $('#graph-ui-textarea').val(),
				'checks': $('#checks-ui-textarea').val()
			},
			'success': (data) => {
				console.log(data);
				$('#results').html('<p>Test results (in order):</p>');
				if (data['type'] === 'success') {
					data = data['results'];
					let resultList = $('<ol/>');
					for (let i = 0; i < data.length; i++) {
						let text = '';
						if (data[i]['error']) {
							text = '<b>error</b>:'
							text += '<pre>'
							text += data[i]['error']
							text += '</pre>'
						} else {
							text = '<b>' + (data[i]['correct'] ? 'pass' : 'fail') + '</b>'
							if (data[i]['feedback']) {
								text += ': ' + data[i]['feedback'];
							}
						}
						resultList.append($('<li/>').html(text));
					}
					$('#results').append(resultList);

				} else if (data['type'] === 'preprocess_fail') {
					$('#results').append($('<div/>').html('<b>Sanity check failed</b> during preprocessing. Feedback:<pre>' + data['feedback'] + '</pre>'));

				} else {
					$('#results').append($('<div/>').text('Unknown result type ' + data['type']));
				}
			},
			'error': (xhr, message, error) => {
				$('#results').html("Request failed: " + xhr.status + ' ' + error);
			}
		});
	}
});

