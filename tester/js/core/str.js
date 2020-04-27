// stub for Moodle's get_string function

define(function() {
	function get_string(key, component, param, lang) {
		return "$" + key + "$";
	}
	return {
		'get_string': get_string
	};
});

