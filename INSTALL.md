# Installing GraphChecker

At the moment, we support Moodle 3.8 and 3.9. Slightly older versions may work, but no guarantees.

We will assume you have a working Jobe server, used to grade submissions. If not, please follow the [Jobe documentation](https://github.com/trampgeek/jobe) to set one up. (In case your Moodle installation already has CodeRunner installed correctly, and a Jobe server to go along with it, you can use the same server also for GraphChecker.)


## Step 1: Installing GraphChecker on the Moodle server

* **Install two dependencies:**
    * If it was not installed yet, install [qbehaviour_adaptive_adapted_for_coderunner](https://github.com/trampgeek/moodle-qbehaviour_adaptive_adapted_for_coderunner). We need to make a small change to line 51 of `behaviour.php` to allow GraphChecker questions to run with this question behavior as well:

      ```diff
      -        return $question instanceof qtype_coderunner_question;
      +        return $question instanceof qtype_coderunner_question ||
      +                $question instanceof qtype_graphchecker_question;
      ```

    * Install [qbehaviour_deferredfeedback_graphchecker](https://github.com/graphchecker/moodle-qbehaviour_deferredfeedback_graphchecker) by downloading `qbehaviour_deferredfeedback_graphchecker.zip` [here](https://github.com/graphchecker/moodle-qbehaviour_deferredfeedback_graphchecker/releases), going to *Site administration > Plugins > Install plugins*, and uploading the ZIP archive there.

    * Similarly, install [qbehaviour_adaptive_graphchecker](https://github.com/graphchecker/moodle-qbehaviour_adaptive_graphchecker) by downloading `qbehaviour_adaptive_graphchecker.zip` [here](https://github.com/graphchecker/moodle-qbehaviour_adaptive_graphchecker/releases), going to *Site administration > Plugins > Install plugins*, and uploading the ZIP archive there.

* **Install GraphChecker itself:** You have two choices. The first option is to install the latest released version of GraphChecker (recommended). To do this, go to our [releases page](https://github.com/graphchecker/moodle-qtype_graphchecker/releases), download `qtype_graphchecker.zip` for the latest release, and again, go to *Site administration > Plugins > Install plugins* to install it. The second option is to install the unreleased development version of GraphChecker straight from this Git repository (this would be useful if you want to help develop the plugin). If you want to do this, clone this repository to `question/type/graphchecker` in the Moodle directory. Note that development versions can be unstable, so we do not recommend this second option for production servers.

* **Run database upgrade:** During the installation process, Moodle will detect that a database upgrade is necessary. This should go automatically; simply follow the wizard.


## Step 2: Configuration

After the installation, Moodle should detect that GraphChecker requires some settings to work correctly, namely the URL (and if necessary, the API key) for the Jobe server. It should show a form to fill in these settings; if not, you can manually go to the plugin configuration (*Site administration > Category: Question types > GraphChecker settings*). If you are already running CodeRunner, you can simply copy the URL from its settings.


## Step 3: Compile the JavaScript assets

_This step is necessary only if you installed GraphChecker from Git. If you chose to install a released version in step 1, the compiled JavaScript assets are already present in the archive you downloaded, so you can skip to step 4._

GraphChecker uses several JavaScript AMD modules (in `amd/src`) that need to be minified and bundled into the directory `amd/build`. Like with many other Moodle plugins, this is handled by the build runner `grunt`.

If you don't have `grunt` yet, run `npm install -g grunt-cli` (you'll need Node.js for this) to install it. Then, run `grunt amd` to perform the compilation; this process may take a while to complete. After completion, you can verify that the build finished successfully by checking that `.min.js` and `.min.js.map` files have appeared in `amd/build`.


## Step 4: Installing required libraries on Jobe

Our built-in checks use the graph library `igraph` (version 0.8.3+), which needs to be available on the Jobe server. Be sure to install it on the Jobe server, so _not_ on the Moodle server!

Assuming your Jobe instance runs on a recent version of Ubuntu, you can simply do `sudo apt install python3-igraph`. If you are running an older Ubuntu version (such as 18.04), this will install a version that is too old. In that case, you can install the latest version directly via `sudo pip3 install python-igraph`.


## Step 5: Testing

The installation should now be complete. To test that GraphChecker works correctly, you can perform the following procedure (which also will give you an idea of how GraphChecker's interface works):

* In any quiz, click *Edit quiz* and add a new question. When asked which question type you want to add, select GraphChecker.
* Enter ‘Two vertices’ for the question name and ‘Draw any graph with two vertices.’ for the question text. Make sure that the answer type is set to *Undirected graph*.
* In the section *Checks*, click *Add check*. In the dialog box that appears, click the plus icon next to *Vertex count*, so that the *Vertex count* check will be added to the list of checks.
* Set the expected number of vertices to 2 using the input box in the check.
* To finish the question, draw a graph with two vertices in the graph editor in the *Sample answer* section. (You can click the question mark icon in the top-right of the graph editor to receive help on how to use it.)
* Click *Save changes* and preview the question.
* If you draw a graph with two vertices and click *Check*, it should show results on a green background, saying ‘Correct!’. If you draw a graph with another number of vertices and click *Check*, it should show a red background and the text ‘Number of vertices does not match expected number’.

If you get an error instead, the Jobe server is probably not installed correctly or not reachable.

