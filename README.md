# GraphChecker

GraphChecker is a question type for Moodle, which allows teachers to pose quiz questions with a graph as the answer. During quizzes, students are presented with a graph editor with which they can enter their answer. It features a user-friendly interface for teachers to edit questions. In particular, it contains a standard library of checks for various standard properties (such as ‘number of vertices’ or ‘connectedness’), which the teacher can select as requirements for the student answer without having to write any code themselves.

GraphChecker is being developed by Arthur van Goethem and Willem Sonke from EdIn, TU Eindhoven. The plugin is based on the [CodeRunner](https://github.com/trampgeek/moodle-qtype_coderunner/) question type by Richard Lobb (University of Canterbury, New Zealand) and Tim Hunt (The Open University, UK), and its graph editor written originally by Emily Price. CodeRunner lets teachers ask programming questions and automatically grades student-submitted code based on tests the teacher defines. Behind the scenes (and invisibly to the teacher) GraphChecker translates the list of checks selected by the teacher to a piece of Python code, which is sent to a Jobe server in much the same way that CodeRunner grades code. (See the CodeRunner documentation for more details.) This approach is very flexible, because checks can execute any Python code they need, including calling external libraries.

:warning: GraphChecker is still experimental software and comes with some limitations:

* It is still in development. While we have used (earlier versions of) GraphChecker successfully in several small courses, the code has not been heavily battle-tested yet and may still contain bugs. It may not be easy to install -- if you're having problems, please let us know so we can help.

* The API for checks is still subject to change in the future.

* The number of checks implemented is still limited.


## Installation

Because GraphChecker uses a sandbox to grade submissions, the installation procedure is slightly more involved than most other Moodle plugins. Please see the detailed [installation instructions](INSTALL.md).


## Developing checks

If you are interested in developing custom checks, please see the documentation about the [checks format](CHECKS.md).


## License

> GraphChecker is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
>
> GraphChecker is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

GraphChecker is based on CodeRunner by Richard Lobb et al. which is also under GPL v3 or later. See https://coderunner.org.nz/ for more information.

