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
        var serialisation = {},
            name,
            empty = true;

        this.getFields().each(function() {
            var value, type;
            type = $(this).attr('type');
            name = $(this).attr('name');
            if ((type === 'checkbox' || type === 'radio') && !($(this).is(':checked'))) {
                value = '';
            } else {
                value = $(this).val();
            }
            if (serialisation.hasOwnProperty(name)) {
                serialisation[name].push(value);
            } else {
                serialisation[name] = [value];
            }
            if (value !== '') {
                empty = false;
            }
        });
        if (empty) {
            this.$textArea.val('');
        } else {
            this.$textArea.val(JSON.stringify(serialisation));
        }
    };

    TestsUi.prototype.getElement = function() {
        return this.$testsPanel;
    };

    TestsUi.prototype.getFields = function() {
        return $(this.htmlDiv).find('.coderunner-ui-element');
    };

    // Set the value of the jQuery field to the given value.
    // If the field is a radio button or a checkbox and its name matches
    // the given value, the checked attribute is set. Otherwise the field's
    // val() function is called to set the value.
    TestsUi.prototype.setField = function(field, value) {
        if (field.attr('type') === 'checkbox' || field.attr('type') === 'radio') {
            field.prop('checked', field.val() === value);
        } else {
            field.val(value);
        }
    };

    TestsUi.prototype.reload = function() {
        this.$testsPanel = $('<div/>')
            .addClass('tests-ui');

        this.$activeTestsList = $('<div/>')
            .addClass('active-tests-list')
            .appendTo(this.$testsPanel);
        this.$availableTestsList = $('<div/>')
            .addClass('available-tests-list')
            .appendTo(this.$testsPanel);

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
    };

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

        let $rightButtonGroup = $('<div/>')
            .addClass('button-group float-right')
            .appendTo($header);

        let $argsContainer = this.createArgsContainer(testInfo, test)
            .appendTo($container);

        let $removeButton = this.createButton('fa-angle-right')
            .attr('title', 'Remove this check from the list')
            .on('click', this.removeCheck.bind(this))
            .appendTo($rightButtonGroup);

        return $container;
    };

    TestsUi.prototype.createArgsContainer = function(testInfo, test) {
        let params = testInfo['params'];
        let args = test['arguments'];

        let $container = $('<div/>')
            .addClass('args-container');

        for (let i = 0; i < params.length; i++) {
            let param = params[i];

            let $argumentRow = $('<div/>')
                .addClass('argument-row')
                .attr('data-param-name', param['name'])
                .appendTo($container);

            $('<span/>')
                .addClass('argument-name')
                .text(param['name'])
                .appendTo($argumentRow);

            $field = $('<input/>')
                .addClass('argument-value')
                .val(args[param['param']])
                .appendTo($argumentRow);

            switch (param['type']) {
                case 'integer':
                    $field.attr('type', 'number');
                    break;
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
        $testContainer.remove();
        return false;
    };

    TestsUi.prototype.addCheck = function(e) {
        let $testContainer = $(e.target).closest('.test-container');

        let test = {
            'module': $testContainer.attr('data-module'),
            'method': $testContainer.attr('data-method'),
            'params': []
        };

        this.createActiveTestContainer(test)
            .appendTo($('.active-tests-list'));

        return false;
    };

    TestsUi.prototype.createAvailableTestContainer =
                            function(module, method) {
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

        let $leftButton = this.createButton('fa-angle-left')
            .attr('title', 'Add this check to the list')
            .on('click', this.addCheck.bind(this))
            .appendTo($buttonGroup);

        let test = this.modules[module]['checks'][method];

        let $title = $('<span/>')
            .html(test['name'])
            .addClass('test-name')
            .appendTo($header);

        return $container;
    };

    TestsUi.prototype.createButton = function(iconClass) {
        return $('<button/>')
            .addClass('button')
            .attr('type', 'button')
            .append($('<i/>').addClass('icon fa ' + iconClass));
    };

    TestsUi.prototype.resize = function() {
        // not resizable
    };

    TestsUi.prototype.hasFocus = function() {
        // TODO
    };

    // Destroy the HTML UI and serialise the result into the original text area.
    TestsUi.prototype.destroy = function() {
        // TODO
        /*this.sync();
        $(this.htmlDiv).remove();
        this.htmlDiv = null;*/
    };

    TestsUi.prototype.isResizable = function() {
        return false;
    };

    return {
        Constructor: TestsUi
    };
});
