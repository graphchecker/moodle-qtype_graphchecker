# The checks format

The `checks` directory contains the checks for GraphChecker. Each answer type (undirected, directed, etc.) has its own set of checks, and correspondingly, its own subdirectory containing these checks, along with some metadata about the answer type. The file `checks/types.json` contains a list of answer types that GraphChecker should show in the question editor. Hence, removing an answer type from this list allows an admin to effectively disable that answer type.

The remainder of this file specifies the contents of each answer type's subdirectory.


## Answer type metadata

The metadata for an answer type is stored in the file `type.json`. This consists of a single JSON object with the following keys:

* `name` *(string)* Human-readable name of the answer type, shown in the question editor.

* `ui_plugin` *(string)* Name of the UI plugin that should be presented to the student (and the question author) for this answer type. This can be one of the UI plugins defined in `/amd/src` (currently only `"graph"`) or `"text"` to not load an UI plugin at all and instead just show a bare text area.

* `ui_params` *(object)* JSON object with settings that are handed to the UI plugin. The settings available depend on the `ui_plugin` chosen. For example, the `"graph"` UI accepts a parameter `type`, specifying which type of graph it should edit.

* `helper_python_modules` *(array of strings)* List of names of Python modules that should be made available on the JOBE sandbox along with the test code. For example, if the answer type's directory contains `helper.py`, then setting `"helper_python_modules": ["helper.py"]` will allow checker code to do `import helper`.

* `python_modules` *(array of strings)* List of names of Python modules that should be `import`ed when running checks for this answer type. This does not send anything to the JOBE sandbox, instead it is meant for modules that have been installed in the sandbox already.


## Preprocessing

When a student submits their answer for checking, the answer is produced in a textual format (probably JSON) by the `ui_plugin`. The first step in the checking process is to convert this string into an object that the checks can easily work with. For example, the `undirected` and `directed` answer types both use the `igraph` library to implement their checks. Therefore, their first step is to convert the answer string to an `igraph.Graph` object.

To this end, each answer type should have a Python file `preprocess.py` defining a function `preprocess()`. This function receives a single parameter containing the answer string, and returns the preprocessed object that the checks can work with.


### Sanity checks

It may happen that the student answer is incorrect in such a way that it is not even possible to preprocess it. For example, the automata library used in our DFA checks requires that state names be unique. Hence, if the student answer has non-unique state names, we cannot generate a valid automaton object. In this case, the answer should be considered incorrect -- not because a check failed, but because the preprocessing procedure failed. We call this a _sanity check fail_.

To indicate a sanity check fail, simply raise an Exception from `preprocess()`. For example:

```python
    raise Exception('Automaton contains duplicate state')
```

The exception description is shown to the student as feedback.


## Checks

Checks are implemented in Python modules. Each module contains a set of checks that belong logically together. In the *Add check* dialog, each module is shown as a category.

Each module (with extension `.py`) is accompanied by a JSON file (with extension `.json`). The Python file contains the actual code implementing the checks, while the JSON file contains metadata. The metadata is contained in a separate `.json` file, rather than being encoded in the Python module itself, so that the checks can be shown properly within the question editor GUI. Then, when during a quiz an answer needs to be graded, the GraphChecker backend produces Python code which calls the Python functions in the `.py` file.

When implementing new checks, we recommend looking at existing check libraries to see how the system works.


### Python code

In the Python code, each check is simply a single Python function. This function can have any name, and needs to have a specific set of parameters (see below for the exact function signature required).

Of course, besides the check functions, it is possible to define helper functions that are not checks themselves. We suggest prefixing these helper functions with an underscore, to avoid confusing them with actual checks. If you prefer putting the helper functions in a separate Python module, make sure to include these in `"helper_python_modules"`, because otherwise they will not be available in the sandbox that runs the checks (see above).


#### Function signature

A check function receives the following arguments.

* The first argument `student_answer` is the answer as given by the student, as a graph. (See the section Graph format below for more details on how the answer is encoded.)
* The remaining arguments are keyword arguments and depend on the particular check. These arguments must be specified in the metadata (see below), and are passed as keyword arguments.

As an example, a vertex count check could look like this:

```python
def vertex_count(student_answer, expected):
    # implement check here
```

Here, the second argument `expected` would specify how many vertices the question author requires the graph to have.


#### Result object

A checker function must return an object that describes the result of the test. This object is a Python dictionary with the following keys.

* `correct` *(boolean)* `True` if the check passed; `False` if the check failed.
* `feedback` *(string, optional)* Freeform text providing feedback to the student. If this is not provided, GraphChecker will present just the text "Correct!" or "Incorrect!".

Disregarding feedback, our vertex count check could for instance look as follows:

```python
def vertex_count(student_answer, expected):
    if student_answer.vertex_count() == expected:
        return {'correct': True}
    else:
        return {'correct': False}
```

(See `undirected/basic.py` for the actual implementation of this check with feedback.)


#### Exceptions

If a checker function raises an exception, the question is not graded and instead the exception stack trace is shown verbatim to the student. This should be avoided in student-facing quizzes, so in practice checker functions must never raise an exception (except possibly for debugging purposes during development). Similarly, a checker function must never return an object that does not correspond to the specification above.


#### Other requirements

On the server, the PHP code communicates with the checker functions by JSON over stdout. Due to this, checker functions must not print anything to stdout (or stderr) because this will confuse the JSON parsing code.


### Metadata

The metadata JSON file for a checker module consists of one JSON object, with the following keys:

* `name` *(string)* The name of this library; this will be shown to question authors as the category header.
* `checks` *(object)* The checks, where the key is the name of the Python check function, and the value is an object describing the check (see below).


#### Checks

In turn, a check is described by an JSON object, which has the following three keys:

* `name` *(string)* The human-readable name of the check that will be presented to the question author (and to the student, in the feedback table).
* `description` *(string)*: A description of what the check does which is presented to the question author when they click the question mark icon. This is not shown to students.
* `params` *(array)*: A list of parameters needed for the check. The order of parameters in this array determines in what order they will be shown in the question editing interface.


#### Parameters

Again, each parameter is represented by a JSON object with the following keys:

* `param` *(string)*: The argument name of the Python method implementing the check.
* `name` *(string)*: The human-readable name that is shown in the question editor.
* `type` *(string)*: The expected type.
* Potentially more keys depending on the `type` (see below).

The following parameter types are supported:

* `integer`: Produces a spinner box where the question author can enter an integer. Extra keys `min` and `max` can be provided to set bounds for the value.
* `string`: Produces a text box where the question author can enter any string.
* `string_multiline`: Produces a large, multi-line text box where the question author can enter a longer string.
* `string_list`: Produces a multi-line text box where the question author can enter a list of strings (newline- or comma-separated, will be automatically converted to an array of strings).
* `choice`: Produces a drop-down menu of options. The available options must be given as an additional key `options`, as an array of strings.
* `graph`: Produces an editor of the answer type's `ui_plugin`, so that the question author can provide an argument of the current answer type (which will be automatically preprocessed by the answer type's `preprocess()` function).

