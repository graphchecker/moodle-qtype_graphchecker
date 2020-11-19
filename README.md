# GraphChecker

GraphChecker is a question type for Moodle, which allows teachers to pose quiz questions with a graph as the answer. During quizzes, students are presented with a graph editor with which they can enter their answer. It features a user-friendly interface for teachers to edit questions. In particular, it contains a standard library of checks for various standard properties (such as ‘number of vertices’ or ‘connectedness’), which the teacher can select as requirements for the student answer without having to write any code themselves.

GraphChecker is being developed by Arthur van Goethem and Willem Sonke from EdIn, TU Eindhoven. The plugin is based on the [CodeRunner](https://github.com/trampgeek/moodle-qtype_coderunner/) question type by Richard Lobb and Tim Hunt, and its graph editor written originally by Emily Price. CodeRunner lets teachers ask programming questions and automatically grades student-submitted code based on tests the teacher defines. Behind the scenes (and invisibly to the teacher) GraphChecker translates the list of checks selected by the teacher to a piece of Python code, which is sent to a Jobe server in the same way that CodeRunner grades code. (See the CodeRunner documentation for more details.) This approach is very flexible, because checks can execute any Python code they need, including calling external libraries.

GraphChecker is still experimental software and comes with some limitations:

* It is still in development. While we have used (earlier versions of) GraphChecker successfully in several small courses, the code has not been heavily battle-tested yet and may still contain bugs.

* The number of checks implemented is still limited.


## Installation

_(to do: mention exactly which Moodle versions we support)_

We will assume you have a working Jobe server, used to grade submissions. If not, please follow the [Jobe documentation](https://github.com/trampgeek/jobe) to set one up. (In case your Moodle installation already has CodeRunner installed correctly, and a Jobe server to go along with it, you can use the same server also for GraphChecker.)


### Step 1: Installing GraphChecker on the Moodle server

* Clone this repository to `question/type/graphchecker` in the Moodle directory.

* Install [qbehaviour_adaptive_adapted_for_coderunner](https://github.com/trampgeek/moodle-qbehaviour_adaptive_adapted_for_coderunner) and change line 51 of `behaviour.php` to allow GraphChecker questions as well. _(to do: fix this)_

* Clone the repository _(to do: insert link)_ for `qbehaviour_deferredfeedback_graphchecker` to `question/behavior/deferredfeedback_graphchecker` in the Moodle directory.

* Go to the Site Administration page, which should show the usual plugin installation page. Follow the steps indicated to perform the database upgrade.


### Step 2: Compile the JavaScript assets

_(to do: we should offer pre-compiled ZIP files so that this step becomes unnecessary)_

GraphChecker uses several JavaScript AMD modules (in `amd/src`) that need to be minified and bundled into the directory `amd/build`. Like with many other Moodle plugins, this is handled by the build runner `grunt`.

If you don't have `grunt` yet, run `npm install -g grunt-cli` (you'll need Node.js for this) to install it. Then, run `grunt amd` to perform the compilation. You can verify that the build finished successfully by checking that `.min.js` and `.min.js.map` files have appeared in `amd/build`.


### Step 3: Configuration

Go to the plugin configuration and set the URL to the Jobe server. If you are already running CodeRunner, you can simply copy the URL from there.


### Step 4: Installing required libraries on Jobe

Our built-in checks use the graph library `igraph`, which needs to be available on the Jobe server. Be sure to install it on the Jobe server, so _not_ on the Moodle server!

Assuming your Jobe instance runs on Ubuntu, you can simply do `sudo apt install python3-igraph`. Otherwise `sudo pip3 install python-igraph` should do the trick _(to do: test this)_.


### Step 5: Testing

The installation should now be complete. To test that GraphChecker works correctly, you can perform the following procedure (which also will give you an idea of how GraphChecker's interface works):

* In any quiz, click *Edit quiz* and add a new question. When asked which question type you want to add, select GraphChecker.
* Enter ‘Two vertices’ for the question name and ‘Draw any graph with two vertices.’ for the question text. Make sure that the answer type is set to *Undirected graph*.
* In the section *Checks*, click *Add check*. In the dialog box that appears, click the plus icon next to *Vertex count*, so that the *Vertex count* check will be added to the list of checks.
* Set the expected number of vertices to 2 using the input box in the check.
* To finish the question, draw a graph with two vertices in the graph editor in the *Sample answer* section. (You can click the question mark icon in the top-right of the graph editor to receive help on how to use it.)
* Click *Save changes* and preview the question.
* If you draw a graph with two vertices and click *Check*, it should show results on a green background, saying ‘Correct!’. If you draw a graph with another number of vertices and click *Check*, it should show a red background and the text ‘Number of vertices does not match expected number’.

If you get an error instead, the Jobe server is probably not installed correctly or not reachable.


## User guide

_(to do: to be written)_


## License

GPL v3 or later.
