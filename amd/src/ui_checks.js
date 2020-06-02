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

    function ChecksUi(textareaId, width, height, templateParams) {
        this.$textArea = $('#' + textareaId);
        this.templateParams = templateParams;
        this.fail = false;
        this.error = '';
        this.reload();
    }

    ChecksUi.prototype.failed = function() {
        return this.fail;
    };

    ChecksUi.prototype.failMessage = function() {
        return this.error;
    };

    // Copy the serialised version of the HTML UI area to the TextArea.
    ChecksUi.prototype.sync = function() {
        let checks = [];

        let $checkContainers = this.$activeChecksList.children();
        $checkContainers.each(function() {
            let $checkContainer = $(this);
            let check = {
                'module': $checkContainer.attr('data-module'),
                'method': $checkContainer.attr('data-method')
            };

            let $argRows =
                    $checkContainer.children('.args-container').children();
            if ($argRows) {
                let args = {};
                $argRows.each(function() {
                    let $argRow = $(this);
                    let name = $argRow.attr('data-param-name');
                    let value = $argRow.children('.argument-value').val();
                    args[name] = value;
                });
                check['arguments'] = args;
            }
            checks.push(check);
        });

        this.$textArea.val(JSON.stringify(checks));
    };

    ChecksUi.prototype.getElement = function() {
        return this.$checksPanel;
    };

    ChecksUi.prototype.reload = function() {
        this.$checksPanel = $('<div/>')
            .addClass('tests-ui');

        this.$activeChecksList = $('<div/>')
            .addClass('active-tests-list')
            .appendTo(this.$checksPanel);
        this.$backdrop = $('<div/>')
            .addClass('backdrop')
            .css('display', 'none')
            .on('click', this.hideAddCheckDialog.bind(this))
            .appendTo(this.$checksPanel);
        this.$availableChecksList = $('<div/>')
            .addClass('available-tests-list');
        this.$dialog = this.createDialog('Add check', this.$availableChecksList)
            .appendTo(this.$backdrop);

        let activeChecksJson = this.$textArea.val();
        let activeChecks = JSON.parse(activeChecksJson);

        let modulesJson = this.$textArea.attr('data-available-checks');
        this.modules = JSON.parse(modulesJson);

        for (let i = 0; i < activeChecks.length; i++) {
            let check = activeChecks[i];
            this.createActiveCheckContainer(check)
                .appendTo(this.$activeChecksList);
        }

        for (let moduleName in this.modules) {
            if (this.modules.hasOwnProperty(moduleName)) {
                let module = this.modules[moduleName];
                let $moduleContainer = this
                    .createModuleContainer(moduleName, module)
                    .appendTo(this.$availableChecksList);
                let checks = module['checks'];
                for (let checkName in checks) {
                    if (checks.hasOwnProperty(checkName)) {
                        this.createAvailableCheckContainer(moduleName, checkName, checks[checkName])
                            .appendTo(this.$availableChecksList);
                    }
                }
            }
        }

        this.$addCheckButton = $('<button/>')
            .addClass('btn btn-primary')
            .append($('<i/>').addClass('icon fa ' + 'fa-plus'))
            .append('Add check')
            .on('click', this.showAddCheckDialog.bind(this))
            .appendTo(this.$checksPanel);
    };

    ChecksUi.prototype.showAddCheckDialog = function() {
        this.$backdrop.css('display', 'block')
            .addClass('visible');
        $('body').addClass('unscrollable');
        return false;
    }

    ChecksUi.prototype.hideAddCheckDialog = function(check) {
        this.$backdrop.removeClass('visible');
        $('body').removeClass('unscrollable');

        // hide the element only after the CSS transition has finished
        setTimeout(function() {
            this.$backdrop.css('display', 'none');
        }.bind(this), 500);
    }

    ChecksUi.prototype.createActiveCheckContainer = function(check) {
        let module = check['module'];
        let method = check['method'];

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

        let checkInfo = this.modules[module]['checks'][method];

        let $title = $('<span/>')
            .html(checkInfo['name'])
            .addClass('test-name')
            .appendTo($header);

        if (checkInfo['description']) {
            let $helpButton = this.createHelpButton(checkInfo['description'])
                .appendTo($header);
        }

        let $rightButtonGroup = $('<div/>')
            .addClass('button-group float-right')
            .appendTo($header);

        let $removeButton = this.createButton('fa-trash')
            .attr('title', 'Remove this check from the list')
            .on('click', this.removeCheck.bind(this))
            .appendTo($rightButtonGroup);

        if (checkInfo['params']) {
            let $argsContainer = this.createArgsContainer(checkInfo, check)
                .appendTo($container);
        }

        return $container;
    };

    /**
     * Creates a panel where the user can specify the arguments to be passed
     * to the check. This should be called only if the check accepts parameters.
     */
    ChecksUi.prototype.createArgsContainer = function(checkInfo, check) {
        let params = checkInfo['params'];
        let args = check['arguments'];

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
                case 'string':
                    $field = $('<input/>')
                        .addClass('argument-value')
                        .val(value)
                        .appendTo($argumentRow);
                    break;
                case 'string_list':
                case 'string_multiline':
                case 'graph':
                    $field = $('<textarea/>')
                        .addClass('argument-value')
                        .val(value)
                        .appendTo($argumentRow);
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
    ChecksUi.prototype.createModuleContainer = function(module) {
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

    ChecksUi.prototype.moveCheckUp = function(e) {
        let $checkContainer = $(e.target).closest('.test-container');
        let $previous = $checkContainer.prev();
        if ($previous) {
            $previous.before($checkContainer);
        }
        return false;
    };

    ChecksUi.prototype.moveCheckDown = function(e) {
        let $checkContainer = $(e.target).closest('.test-container');
        let $next = $checkContainer.next();
        if ($next) {
            $next.after($checkContainer);
        }
        return false;
    };

    ChecksUi.prototype.removeCheck = function(e) {
        let $checkContainer = $(e.target).closest('.test-container');
        $checkContainer.slideUp();

        // remove it after the slideUp is done
        setTimeout(function() {
            $checkContainer.remove();
        }.bind(this), 500);

        return false;
    };

    ChecksUi.prototype.addCheck = function(e) {
        let $checkContainer = $(e.target).closest('.test-container');

        let test = {
            'module': $checkContainer.attr('data-module'),
            'method': $checkContainer.attr('data-method'),
            'arguments': []
        };

        this.createActiveCheckContainer(test)
            .appendTo($('.active-tests-list'))
            .hide()
            .slideDown();

        this.hideAddCheckDialog();

        return false;
    };

    ChecksUi.prototype.createAvailableCheckContainer = function(module, method) {
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

        let check = this.modules[module]['checks'][method];

        let $title = $('<span/>')
            .html(check['name'])
            .addClass('test-name')
            .appendTo($header);

        if (check['description']) {
            let $helpButton = this.createHelpButton(check['description'])
                .appendTo($header);
        }

        return $container;
    };

    ChecksUi.prototype.createDialog = function(title, content) {
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

    ChecksUi.prototype.createButton = function(iconClass) {
        return $('<button/>')
            .addClass('button')
            .attr('type', 'button')
            .append($('<i/>').addClass('icon fa ' + iconClass));
    };

    ChecksUi.prototype.createHelpButton = function(description) {
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

    ChecksUi.prototype.resize = function() {
        // not resizable
    };

    ChecksUi.prototype.hasFocus = function() {
        // TODO
    };

    ChecksUi.prototype.destroy = function() {
        this.sync();
        this.$checksPanel.remove();
        this.$checksPanel = null;
    };

    ChecksUi.prototype.isResizable = function() {
        return false;
    };

    return {
        Constructor: ChecksUi
    };
});
