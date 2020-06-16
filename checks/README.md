The checks format
=================

Checks are implemented in Python libaries. Each library contains of a Python file (with extension `.py`) and a JSON file (with extension `.json`). The Python file contains the actual code that implements the checks, while the JSON file contains metadata. The `.json` file is used so that the checks can be shown properly within the question editor GUI. Then, when during a quiz an answer needs to be graded, the GraphChecker backend produces Python code which calls the Python functions in the `.py` file.

When creating new checks, we recommend looking at existing check libraries to see how the system works.


Python code
-----------

In the Python code, each check is simply a single Python function. This function can have any name, and needs to have a specific set of parameters (see below for the exact function signature required).

Of course, besides the check functions, it is possible to define helper functions that are not checks themselves. We suggest prefixing these helper functions with an underscore, to avoid confusing them with actual checks.


### Function signature

A check function receives the following arguments.

* The first argument `student_answer` is the answer as given by the student, as a graph. (See the section Graph format below for more details on how the answer is encoded.)
* The second argument `sample_answer` is the sample answer specified by the question author.
* The third argument `preload_answer` is the answer that is preloaded into the student's answer field, also specified by the question author.
* The remaining arguments are keyword arguments and are dependent on the particular check. These arguments must be specified in the metadata (see below), and are passed as keyword arguments.

As an example, a vertex count check could look like this:

```python
def vertex_count(student_answer, sample_answer, preload_answer, expected):
    # implement check here
```


### Result object

A checker function must return an object that describes the result of the test. This object is a Python dictionary with the following keys.

* `correct` (boolean): `True` if the check passed; `False` if the check failed.
* `feedback` (string, optional): freeform text providing feedback to the student. If this is not provided, GraphChecker will present just the text "Correct!" or "Incorrect!".

If a checker function raises an exception, the question is not graded and instead the exception stack trace is shown verbatim to the student. This should be avoided in student-facing quizzes, so in practice checker functions must never raise an exception (except possibly for debugging purposes during development). Similarly, a checker function must never return an object that does not correspond to the specification above.


### Other requirements

On the server, the PHP code communicates with the checker functions by JSON over stdout. Due to this, checker functions must not print anything to stdout (or stderr) because this will confuse the JSON parsing code.


Metadata
--------

A metadata JSON file consists of one JSON object, with the following keys:

* `name` (string): The name of this library; this will be shown to question authors as the category header.
* `checks` (object): The checks, where the key is the name of the Python check function, and the value is an object describing the check (see below).


### Checks

In turn, a check is described by an JSON object, which has the following three keys:

* `name` (string): The human-readable name of the check that will be presented to the question author (and the student, in the feedback table).
* `description` (string): A description of what the check does which is presented to the question author when they click the question mark icon. This is not shown to students.
* `params` (array): A list of parameters needed for the check. The order of parameters in this array determines in what order they will be shown in the question editing interface.


### Parameters

Again, each parameter is represented by a JSON object with the following keys:

* `param` (string): The parameter name of the Python method implementing the check).
* `name` (string): The human-readable name that is shown in the question editor.
* `type` (string): The expected type.
* Potentially more keys depending on the `type` (see below).

The following parameter types are supported:

* `integer`: Produces a spinner box where the question author can enter an integer. Extra keys `min` and `max` can be provided to set bounds for the value.
* `string`: Produces a text box where the question author can enter any string.
* `choice`: Produces a drop-down menu of options. The available options must be given as an additional key `options`, as an array of strings.


Graph format
------------

A graph is represented by an object, which is dependent on the graph type. For undirected and directed graphs, the [igraph](https://igraph.org/python/) library is used to represent graphs. For FSMs, ... **(to be decided)**

