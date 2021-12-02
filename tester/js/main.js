console.log('initializing modules');

requirejs.config({
	'paths': {
		'jquery': 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.0/jquery.min'
	}
});

requirejs(["jquery",
			"qtype_graphchecker/userinterfacewrapper",
			"qtype_graphchecker/ui_checks",
			"qtype_graphchecker/ui_graph/ui_graph"],
		function($, ui, ui_checks, ui_graph) {
	console.log('modules loaded!');

	let graphwrapper, checksWrapper;

	$.getJSON('/input_params',
		(inputParams) => {
			const uiPlugin = inputParams[0];
			$('#graph-ui-textarea').attr('data-params', JSON.stringify(inputParams[1]));
			if (uiPlugin !== "text") {
				graphWrapper = new ui.InterfaceWrapper(uiPlugin, 'graph-ui-textarea');
			}

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
					let results = data['results'];
					let resultList = $('<ol/>');
					for (let i = 0; i < results.length; i++) {
						let text = '';
						if (results[i]['error']) {
							text = '<b>error</b>:'
							text += '<pre>'
							text += results[i]['error']
							text += '</pre>'
						} else {
							text = '<b>' + (results[i]['correct'] ? 'pass' : 'fail') + '</b>'
							if (results[i]['feedback']) {
								text += ': ' + results[i]['feedback'];
							}
						}
						resultList.append($('<li/>').html(text));
					}
					$('#results').append(resultList);
					$('#results').append($('<p/>').html(
						'<b>Grade:</b> ' + data['grade']
					));

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

