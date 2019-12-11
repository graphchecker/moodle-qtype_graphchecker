The checks format
=================

Checks are implemented in Python libaries. Each library contains of a `.py` file and a `.json` file. The Python file contains the code implementing the checks, the JSON file contains some metadata so that the checks can be shown properly within the GUI.

Python code
-----------

In the Python code, each check is simply a single Python function. The function receives as its first argument (`student_answer`) the answer as given by the student, as a Python object parsed from the JSON string produced by the UI. The remainder of the arguments are dependent on the particular check. These arguments must be specified in the metadata (see below), and are passed as keyword arguments.

Metadata
--------

A metadata JSON file consists of one JSON object, with one entry per check. The key of a check is its function name; the value is an object describing the check. This object has at least three keys:

* `name`: The human-readable name of the check that will be presented to the question author (and the student, in the feedback table).
* `description`: A description of what the check does (should start with "Checks if") which is presented to the question author when they click the question mark icon.
* `params`: An array of parameters needed for the check. The order of parameters in this array determines in what order they will be shown in the question editing interface. Each parameter has three keys: `param` (the parameter name of the Python method implementing the check), `name` (the human-readable name), and `type` (the expected type).

Parameter types
---------------

The following parameter types are supported:

* `integer`: produces a spinner box where the user can enter any integer
* ...

