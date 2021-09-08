# Releasing a new version

* Check if Git is up-to-date and clean, and no editors are open
* Run the unit tests for the checks
* Bump the version number in `version.php`
    * `git add version.php`
    * `git commit -m "Bump plugin version"`
* Compile the JavaScript assets
    * empty `amd/build`
    * `grunt amd`
* Test the plugin
* Generate archive
    * `cd ..`
    * `rm qtype_graphchecker.zip` (if it exists)
    * `zip -r qtype_graphchecker.zip graphchecker/* --exclude "*graphchecker/amd/src/*" --exclude "*.min.js.map" --exclude "*graphchecker/tester/*" --exclude "*/__pycache__/*"`
* Add tag
    * `git tag <name>`
    * `git push --tags`
* Write release notes on GitHub and upload the archive

