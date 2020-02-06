// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more util.details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Implementation of the html_ui user interface plugin. For overall details
 * of the UI plugin architecture, see userinterfacewrapper.js.
 *
 * @package    qtype
 * @subpackage coderunner
 * @copyright  Richard Lobb, 2018, The University of Canterbury
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery'], function($) {

    function TestsUi(textareaId, width, height, templateParams) {
        this.$textArea = $('#' + textareaId);
        this.templateParams = templateParams;
        this.fail = false;
        this.error = '';
        this.reload();
    }

    TestsUi.prototype.failed = function() {
        return this.fail;
    };

    TestsUi.prototype.failMessage = function() {
        return this.error;
    };

    // Copy the serialised version of the HTML UI area to the TextArea.
    TestsUi.prototype.sync = function() {
        let tests = [];

        let $testContainers = this.$activeTestsList.children();
        $testContainers.each(function() {
            let $testContainer = $(this);
            let test = {
                'module': $testContainer.attr('data-module'),
                'method': $testContainer.attr('data-method')
            };

            let $argRows =
                    $testContainer.children('.args-container').children();
            if ($argRows) {
                let args = {};
                $argRows.each(function() {
                    let $argRow = $(this);
                    let name = $argRow.attr('data-param-name');
                    let value = $argRow.children('.argument-value').val();
                    args[name] = value;
                });
                test['arguments'] = args;
            }
            tests.push(test);
        });

        this.$textArea.val(JSON.stringify(tests));
    };

    TestsUi.prototype.getElement = function() {
        return this.$testsPanel;
    };

    TestsUi.prototype.reload = function() {
        this.$testsPanel = $('<div/>')
            .addClass('tests-ui');

        this.$activeTestsList = $('<div/>')
            .addClass('active-tests-list')
            .appendTo(this.$testsPanel);
        this.$backdrop = $('<div/>')
            .addClass('backdrop')
            .css('display', 'none')
            .on('click', this.hideAddTestDialog.bind(this))
            .appendTo(this.$testsPanel);
        this.$availableTestsList = $('<div/>')
            .addClass('available-tests-list');
        this.$dialog = this.createDialog('Add test', this.$availableTestsList)
            .appendTo(this.$backdrop);

        let activeTestsJson = this.$textArea.val();
        let activeTests = JSON.parse(activeTestsJson);

        let modulesJson = this.$textArea.attr('data-available-tests');
        this.modules = JSON.parse(modulesJson);

        for (let i = 0; i < activeTests.length; i++) {
            let test = activeTests[i];
            this.createActiveTestContainer(test)
                .appendTo(this.$activeTestsList);
        }

        for (let moduleName in this.modules) {
            if (this.modules.hasOwnProperty(moduleName)) {
                let module = this.modules[moduleName];
                let $moduleContainer = this
                    .createModuleContainer(moduleName, module)
                    .appendTo(this.$availableTestsList);
                let checks = module['checks'];
                for (let checkName in checks) {
                    if (checks.hasOwnProperty(checkName)) {
                        this.createAvailableTestContainer(moduleName, checkName, checks[checkName])
                            .appendTo(this.$availableTestsList);
                    }
                }
            }
        }

        this.$addTestButton = $('<button/>')
            .addClass('btn btn-primary')
            .append($('<i/>').addClass('icon fa ' + 'fa-plus'))
            .append('Add test')
            .on('click', this.showAddTestDialog.bind(this))
            .appendTo(this.$testsPanel);
    };

    TestsUi.prototype.showAddTestDialog = function(test) {
        this.$backdrop.css('display', 'block')
            .addClass('visible');
        $('body').addClass('unscrollable');
        return false;
    }

    TestsUi.prototype.hideAddTestDialog = function(test) {
        this.$backdrop.removeClass('visible');
        $('body').removeClass('unscrollable');

        // hide the element only after the CSS transition has finished
        setTimeout(function() {
            this.$backdrop.css('display', 'none');
        }.bind(this), 500);
    }

    TestsUi.prototype.createActiveTestContainer = function(test) {
        let module = test['module'];
        let method = test['method'];

        let $container = $('<div/>')
            .addClass('test-container')
            .attr('data-module', module)
            .attr('data-method', method);

        let $header = $('<div/>')
            .addClass('test-header')
            .appendTo($container);

        let $buttonGroup = $('<div/>')
            .addClass('button-group')
            .appendTo($header);

        let $upButton = this.createButton('fa-angle-up')
            .attr('title', 'Move this check up in the list')
            .on('click', this.moveCheckUp.bind(this))
            .appendTo($buttonGroup);
        let $downButton = this.createButton('fa-angle-down')
            .attr('title', 'Move this check down in the list')
            .on('click', this.moveCheckDown.bind(this))
            .appendTo($buttonGroup);

        let testInfo = this.modules[module]['checks'][method];

        let $title = $('<span/>')
            .html(testInfo['name'])
            .addClass('test-name')
            .appendTo($header);

        if (testInfo['description']) {
            let $helpButton = this.createHelpButton(testInfo['description'])
                .appendTo($header);
        }

        let $rightButtonGroup = $('<div/>')
            .addClass('button-group float-right')
            .appendTo($header);

        let $removeButton = this.createButton('fa-trash')
            .attr('title', 'Remove this check from the list')
            .on('click', this.removeCheck.bind(this))
            .appendTo($rightButtonGroup);

        if (testInfo['params']) {
            let $argsContainer = this.createArgsContainer(testInfo, test)
                .appendTo($container);
        }

        return $container;
    };

    /**
     * Creates a panel where the user can specify the arguments to be passed
     * to the test. This should only be called if the test accepts parameters.
     */
    TestsUi.prototype.createArgsContainer = function(testInfo, test) {
        let params = testInfo['params'];
        let args = test['arguments'];

        let $container = $('<div/>')
            .addClass('args-container');

        for (let i = 0; i < params.length; i++) {
            let param = params[i];

            let $argumentRow = $('<div/>')
                .addClass('argument-row')
                .attr('data-param-name', param['param'])
                .appendTo($container);

            $('<span/>')
                .addClass('argument-name')
                .text(param['name'])
                .appendTo($argumentRow);

            let value = args[param['param']];
            if (!value) {
                value = param['default'];
            }

            switch (param['type']) {
                case 'integer':
                    $field = $('<input/>')
                        .addClass('argument-value')
                        .attr('type', 'number')
                        .val(value)
                        .appendTo($argumentRow);
                    if (param.hasOwnProperty('min')) {
                        $field.attr('min', param['min']);
                    }
                    if (param.hasOwnProperty('max')) {
                        $field.attr('max', param['max']);
                    }
                    break;
                case 'choice':
                    $field = $('<select/>')
                        .addClass('argument-value')
                        .appendTo($argumentRow);
                    if (!param.hasOwnProperty('options')) {
                        console.error('No options provided for choice parameter');
                        break;
                    }
                    for (let option of param['options']) {
                        $('<option/>')
                            .text(option)
                            .appendTo($field);
                    }
                    $field.val(value);
                    break;
                default:
                    console.error('Unknown type ' + param['type']);
            }
        }

        return $container;
    }

    /**
     * Creates a module header.
     * @param module The name of the module.
     */
    TestsUi.prototype.createModuleContainer = function(module) {
        let $container = $('<div/>')
            .addClass('module-container');

        let $header = $('<div/>')
            .addClass('module-header')
            .appendTo($container);

        let $title = $('<span/>')
            .html(this.modules[module]['name'])
            .addClass('module-name')
            .appendTo($header);

        return $container;
    };

    TestsUi.prototype.moveCheckUp = function(e) {
        let $testContainer = $(e.target).closest('.test-container');
        let $previous = $testContainer.prev();
        if ($previous) {
            $previous.before($testContainer);
        }
        return false;
    };

    TestsUi.prototype.moveCheckDown = function(e) {
        let $testContainer = $(e.target).closest('.test-container');
        let $next = $testContainer.next();
        if ($next) {
            $next.after($testContainer);
        }
        return false;
    };

    TestsUi.prototype.removeCheck = function(e) {
        let $testContainer = $(e.target).closest('.test-container');
        $testContainer.slideUp();

        // remove it after the slideUp is done
        setTimeout(function() {
            $testContainer.remove();
        }.bind(this), 500);
        
        return false;
    };

    TestsUi.prototype.addCheck = function(e) {
        let $testContainer = $(e.target).closest('.test-container');

        let test = {
            'module': $testContainer.attr('data-module'),
            'method': $testContainer.attr('data-method'),
            'arguments': []
        };

        this.createActiveTestContainer(test)
            .appendTo($('.active-tests-list'))
            .hide()
            .slideDown();

        this.hideAddTestDialog();

        return false;
    };

    TestsUi.prototype.createAvailableTestContainer = function(module, method) {
        let $container = $('<div/>')
            .addClass('test-container')
            .attr('data-module', module)
            .attr('data-method', method);

        let $header = $('<div/>')
            .addClass('test-header')
            .appendTo($container);

        let $buttonGroup = $('<div/>')
            .addClass('button-group')
            .appendTo($header);

        let $addButton = this.createButton('fa-plus')
            .attr('title', 'Add this check to the list')
            .on('click', this.addCheck.bind(this))
            .appendTo($buttonGroup);

        let test = this.modules[module]['checks'][method];

        let $title = $('<span/>')
            .html(test['name'])
            .addClass('test-name')
            .appendTo($header);

        if (test['description']) {
            let $helpButton = this.createHelpButton(test['description'])
                .appendTo($header);
        }

        return $container;
    };

    TestsUi.prototype.createDialog = function(title, content) {
        return $('<div/>')
            .addClass('dialog')
            .append($('<div/>')
                .addClass('dialog-header')
                .html(title))
            .append($('<div/>')
                .addClass('dialog-body')
                .append(content))
            .on('click', function() {
                return false;  // avoid bubbling to the backdrop
            });
    };

    TestsUi.prototype.createButton = function(iconClass) {
        return $('<button/>')
            .addClass('button')
            .attr('type', 'button')
            .append($('<i/>').addClass('icon fa ' + iconClass));
    };

    TestsUi.prototype.createHelpButton = function(description) {
        return $button = $('<a/>')
            .addClass('btn btn-link p-0')
            .attr('data-container', 'body')
            .attr('data-content', '<div><p>' + description + '</p></div>')
            .attr('data-html', 'true')
            .attr('data-toggle', 'popover')
            .attr('data-trigger', 'hover')
            .append($('<i/>')
                .addClass('icon fa fa-question-circle text-info')
                .attr('title', 'Help'));
    };

    TestsUi.prototype.resize = function() {
        // not resizable
    };

    TestsUi.prototype.hasFocus = function() {
        // TODO
    };

    TestsUi.prototype.destroy = function() {
        this.sync();
        this.$testsPanel.remove();
        this.$testsPanel = null;
    };

    TestsUi.prototype.isResizable = function() {
        return false;
    };

    return {
        Constructor: TestsUi
    };
});
