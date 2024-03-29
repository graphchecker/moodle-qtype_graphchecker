// This file is part of GraphChecker - https://github.com/graphchecker
//
// GraphChecker is based on CodeRunner by Richard Lobb et al.
// See https://coderunner.org.nz/
//
// GraphChecker is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// GraphChecker is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with GraphChecker.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Implementation of the UI plugin to select checks.
 *
 * @package   qtype_graphchecker
 * @copyright TU Eindhoven, The Netherlands
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'qtype_graphchecker/userinterfacewrapper'], function($, ui) {

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
        const self = this;
        $checkContainers.each(function() {
            let $checkContainer = $(this);
            if ($checkContainer.hasClass('test-container')) {
                checks.push(self.checkContainerToJson($checkContainer));
            } else {
                checks.push(self.gradeContainerToJson($checkContainer));
            }
        });

        this.$textArea.val(JSON.stringify(checks));
    };

    ChecksUi.prototype.checkContainerToJson = function($container) {
        let check = {
            'type': 'check',
            'module': $container.attr('data-module'),
            'method': $container.attr('data-method')
        };

        let $argRows = $container.children('.args-container').children();
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

        const feedback = $container.attr('data-feedback');
        if (feedback !== undefined) {
            check['feedback'] = JSON.parse(feedback);
        }

        return check;
    };

    ChecksUi.prototype.gradeContainerToJson = function($container) {
        let grade = {
            'type': 'grade'
        };
        grade['points'] = $container.find('.points-field').val();
        grade['continue'] = $container.find('.continue-field').val() !== 'do not award points for the checks below';
        return grade;
    };

    ChecksUi.prototype.getElement = function() {
        return this.$checksPanel;
    };

    ChecksUi.prototype.reload = function() {
        this.$checksPanel = $('<div/>')
            .addClass('tests-ui');

        let modulesJson = this.$textArea.attr('data-available-checks');
        this.modules = JSON.parse(modulesJson);
        this.modules['custom'] = {
            'name': 'Custom',
            'checks': {
                'custom': {
                    'name': 'Custom check',
                    'description': 'If the checks above are not sufficient for ' +
                        'your needs, you can provide Python code to implement ' +
                        'your own custom check.',
                    'params': [
                        {
                            'param': 'code',
                            'name': 'Code',
                            'type': 'code'
                        }
                    ]
                }
            }
        };
        this.pythonExplanation = this.$textArea.attr('data-python-explanation');

        this.$activeChecksList = $('<div/>')
            .addClass('active-tests-list')
            .appendTo(this.$checksPanel);
        this.$backdrop = $('<div/>')
            .addClass('backdrop')
            .css('display', 'none')
            .on('click', this.hideDialogs.bind(this))
            .appendTo(this.$checksPanel);

        let activeChecks = [];
        let activeChecksJson = this.$textArea.val();
        if (activeChecksJson !== '') {
            activeChecks = JSON.parse(activeChecksJson);
        }

        for (let i = 0; i < activeChecks.length; i++) {
            let check = activeChecks[i];
            if (check['type'] === 'grade') {
                this.createPartialGradeContainer(check)
                    .appendTo(this.$activeChecksList);
            } else {
                // check['type'] === 'check'
                // but note that in earlier versions of the check UI, the type
                // was not explicitly stored, so check['type'] can also be
                // undefined, and then we end up in this case, too
                this.createActiveCheckContainer(check)
                    .appendTo(this.$activeChecksList);
            }
        }

        this.$addCheckButton = $('<button/>')
            .addClass('btn btn-primary')
            .append($('<i/>').addClass('icon fa ' + 'fa-plus'))
            .append('Add check')
            .on('click', this.showAddCheckDialog.bind(this))
            .appendTo(this.$checksPanel);

        this.$checksPanel.append(' ');

        this.$addPartialGradeButton = $('<button/>')
            .addClass('btn')
            .append($('<i/>').addClass('icon fa ' + 'fa-plus'))
            .append('Add partial grade')
            .on('click', this.addPartialGrade.bind(this))
            .appendTo(this.$checksPanel);
    };

    ChecksUi.prototype.createAvailableChecksList = function() {

        let $result = $('<div/>')
            .addClass('available-tests-list');

        for (let moduleName in this.modules) {
            if (this.modules.hasOwnProperty(moduleName)) {
                let module = this.modules[moduleName];
                let $moduleContainer = this.createModuleContainer(moduleName, module);
                let checks = module['checks'];
                let moduleHasChecks = false;
                for (let checkName in checks) {
                    if (checks.hasOwnProperty(checkName) &&
                            !checks[checkName]['deprecated']) {
                        moduleHasChecks = true;
                        this.createAvailableCheckContainer(moduleName, checkName, checks[checkName])
                            .appendTo($moduleContainer);
                    }
                }
                if (moduleHasChecks) {
                    $moduleContainer.appendTo($result);
                }
            }
        }

        return $result;
    };

    ChecksUi.prototype.showAddCheckDialog = function() {
        this.$backdrop.css('display', 'block')
            .addClass('visible');
        $('body').addClass('unscrollable');

        let $checksList = this.createAvailableChecksList();

        this.createDialog('Add check', $checksList)
            .appendTo(this.$backdrop);

        return false;
    };

    ChecksUi.prototype.hideDialogs = function() {
        this.$backdrop.removeClass('visible');
        $('body').removeClass('unscrollable');

        // hide the element only after the CSS transition has finished
        setTimeout(function() {
            this.$backdrop.css('display', 'none');
            this.$backdrop.empty();
        }.bind(this), 500);
    };

    ChecksUi.prototype.createActiveCheckContainer = function(check) {
        let module = check['module'];
        let method = check['method'];

        let $container = $('<div/>')
            .addClass('test-container')
            .attr('data-module', module)
            .attr('data-method', method);

        if (check.hasOwnProperty('feedback')) {
            $container.attr('data-feedback', JSON.stringify(check['feedback']));
        }

        let $header = $('<div/>')
            .addClass('test-header')
            .appendTo($container);

        let $buttonGroup = $('<div/>')
            .addClass('button-group')
            .appendTo($header);

        this.createButton('fa-angle-up')
            .attr('title', 'Move this check up in the list')
            .on('click', this.moveCheckUp.bind(this))
            .appendTo($buttonGroup);
        this.createButton('fa-angle-down')
            .attr('title', 'Move this check down in the list')
            .on('click', this.moveCheckDown.bind(this))
            .appendTo($buttonGroup);

        let name = module + '.' + method;
        let moduleInfo = this.modules[module];
        let checkInfo;
        if (moduleInfo) {
            checkInfo = moduleInfo['checks'][method];
            if (checkInfo) {
                name = checkInfo['name'];
            }
        }
        $('<span/>')
            .html(name)
            .addClass('test-name')
            .appendTo($header);

        let $rightButtonGroup = $('<div/>')
            .addClass('button-group float-right')
            .appendTo($header);

        if (checkInfo) {
            if (checkInfo['feedback']) {
                this.createButton('fa-comments')
                    .attr('title', 'Edit feedback settings')
                    .on('click', this.showFeedbackDialog.bind(this))
                    .appendTo($rightButtonGroup);
            }
        }

        this.createButton('fa-trash')
            .attr('title', 'Remove this check from the list')
            .on('click', this.removeCheck.bind(this))
            .appendTo($rightButtonGroup);

        if (checkInfo) {
            if (checkInfo['params']) {
                this.createArgsContainer(checkInfo, check)
                    .appendTo($container);
            }
            if (checkInfo['deprecated']) {
                $('<div/>')
                    .html('This check is deprecated. It will still work, but ' +
                        'is not available in the Add check list anymore.')
                    .addClass('invalid-feedback')
                    .css('display', 'block')
                    .appendTo($container);
            }
        } else {
            $('<div/>')
                .html('Unavailable check')
                .addClass('invalid-feedback')
                .css('display', 'block')
                .appendTo($container);
        }

        return $container;
    };

    ChecksUi.prototype.createPartialGradeContainer = function(grade) {
        let $container = $('<div/>')
            .addClass('grade-container');

        let $header = $('<div/>')
            .addClass('test-header')
            .appendTo($container);

        let $buttonGroup = $('<div/>')
            .addClass('button-group')
            .appendTo($header);

        this.createButton('fa-angle-up')
            .attr('title', 'Move this partial grade up in the list')
            .on('click', this.moveCheckUp.bind(this))
            .appendTo($buttonGroup);
        this.createButton('fa-angle-down')
            .attr('title', 'Move this partial grade down in the list')
            .on('click', this.moveCheckDown.bind(this))
            .appendTo($buttonGroup);

        $('<span/>')
            .html('Partial grade')
            .addClass('test-name')
            .appendTo($header);

        this.createHelpButton(
            "This allows you to award partial grades if only some of the checks " +
            "pass." +
            "<ul><li><b>If all checks above this block passed</b>, then " +
            "the set number of points will be awarded." +
            "<li><b>If at least one check above this block failed</b>, no points will be awarded, " +
            "and you can decide if " +
            "the checks below this block should still be checked (in which " +
            "case points can still be awarded for them) or the checking " +
            "process should be stopped.</ul>"
        )
            .appendTo($header);

        let $rightButtonGroup = $('<div/>')
            .addClass('button-group float-right')
            .appendTo($header);

        this.createButton('fa-trash')
            .attr('title', 'Remove this partial grade from the list')
            .on('click', this.removeCheck.bind(this))
            .appendTo($rightButtonGroup);

        let $argsContainer = $('<div/>')
            .addClass('args-container')
            .appendTo($container);

        let $gradeRow = $('<div/>')
            .addClass('argument-row')
            .appendTo($argsContainer);
        $('<span/>')
            .addClass('argument-name')
            .text('Award')
            .appendTo($gradeRow);
        let $pointsField = $('<input/>')
            .addClass('argument-value')
            .addClass('points-field')
            .attr('type', 'number')
            .attr('min', 0)
            .attr('max', 100)
            .appendTo($gradeRow);
        $('<span/>')
            .text(' % of the points')
            .appendTo($gradeRow);

        if (grade) {
            $pointsField.val(grade['points']);
        } else {
            $pointsField.val(0);
        }

        let $continueRow = $('<div/>')
            .addClass('argument-row')
            .appendTo($argsContainer);
        $('<span/>')
            .addClass('argument-name')
            .text('If a check fails ')
            .appendTo($continueRow);
        let $continueSelect = $('<select/>')
            .addClass('argument-value')
            .addClass('continue-field')
            .appendTo($continueRow);
        $('<option/>')
            .text('still award points for the checks below')
            .appendTo($continueSelect);
        $('<option/>')
            .text('do not award points for the checks below')
            .appendTo($continueSelect);

        if (grade && !grade['continue']) {
            $continueSelect.val('do not award points for the checks below');
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

            let type = param['type'];

            if (type === 'integer') {
                let $field = $('<input/>')
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

            } else if (type === 'string') {
                $('<input/>')
                    .addClass('argument-value')
                    .val(value)
                    .appendTo($argumentRow);

            } else if (type === 'string_list' ||
                    type === 'string_multiline') {
                $('<textarea/>')
                    .addClass('argument-value')
                    .val(value)
                    .appendTo($argumentRow);

            } else if (type === 'choice') {
                if (!param.hasOwnProperty('options')) {
                    $('<span/>')
                        .html('No options provided for choice parameter')
                        .appendTo($argumentRow);
                } else {
                    let $field = $('<select/>')
                        .addClass('argument-value')
                        .appendTo($argumentRow);
                    for (let option of param['options']) {
                        $('<option/>')
                            .text(option)
                            .appendTo($field);
                    }
                    $field.val(value);
                }

            } else if (type === 'code') {
                $('<textarea/>')
                    .addClass('argument-value')
                    .val(value)
                    .hide()
                    .appendTo($argumentRow);

                let $buttonGroup = $('<div/>')
                    .addClass('button-group')
                    .appendTo($argumentRow);
                this.createButton('fa-pencil')
                    .attr('title', 'Edit the code to be used for the custom check')
                    .on('click', this.showEditCodeDialog.bind(this))
                    .appendTo($buttonGroup);

            } else if (type === 'graph') {
                $('<textarea/>')
                    .addClass('argument-value')
                    .val(value)
                    .hide()
                    .appendTo($argumentRow);

                let $buttonGroup = $('<div/>')
                    .addClass('button-group')
                    .appendTo($argumentRow);
                this.createButton('fa-pencil')
                    .attr('title', 'Edit the graph to be used for this check')
                    .on('click', this.showEditGraphDialog.bind(this))
                    .appendTo($buttonGroup);

            } else {
                $('<span/>')
                    .html('Unknown parameter type "' + type + '"')
                    .appendTo($argumentRow);
            }
        }

        return $container;
    };

    /**
     * Creates a module header.
     * @param module The name of the module.
     */
    ChecksUi.prototype.createModuleContainer = function(module) {
        let $container = $('<details/>')
            .addClass('module-container');

        let $header = $('<summary/>')
            .addClass('module-header')
            .appendTo($container);

        $('<span/>')
            .html(this.modules[module]['name'])
            .addClass('module-name')
            .appendTo($header);

        return $container;
    };

    ChecksUi.prototype.moveCheckUp = function(e) {
        let $checkContainer = $(e.target).closest('.test-container, .grade-container');
        let $previous = $checkContainer.prev();
        if ($previous) {
            $previous.before($checkContainer);
        }
        return false;
    };

    ChecksUi.prototype.moveCheckDown = function(e) {
        let $checkContainer = $(e.target).closest('.test-container, .grade-container');
        let $next = $checkContainer.next();
        if ($next) {
            $next.after($checkContainer);
        }
        return false;
    };

    ChecksUi.prototype.removeCheck = function(e) {
        let $checkContainer = $(e.target).closest('.test-container, .grade-container');
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

        this.hideDialogs();

        return false;
    };

    ChecksUi.prototype.addPartialGrade = function() {
        this.createPartialGradeContainer()
            .appendTo($('.active-tests-list'))
            .hide()
            .slideDown();

        return false;
    };

    ChecksUi.prototype.showFeedbackDialog = function(e) {
        this.$backdrop.css('display', 'block')
            .addClass('visible');
        $('body').addClass('unscrollable');

        const $checkContainer = $(e.target).closest('.test-container');
        const module = $checkContainer.attr('data-module');
        const method = $checkContainer.attr('data-method');
        const checkInfo = this.modules[module]['checks'][method];
        const checkFeedback = checkInfo['feedback'];

        let feedback = null;
        try {
            feedback = JSON.parse($checkContainer.attr('data-feedback'));
        } catch (e) {}

        const $body = $('<div/>');
        $('<p/>')
            .html('Use this form to customize which feedback GraphChecker ' +
                'provides to the student for check <b>' + checkInfo['name'] + '</b>. ' +
                'Leaving a field empty will show the default feedback shown in gray.')
            .appendTo($body);

        for (let feedbackKey in checkFeedback) {
            const $field = $('<input/>')
                .addClass('feedback-input')
                .attr('feedback-key', feedbackKey);

            const $defaultFeedback = $('<p/>')
                .addClass('default-feedback')
                .text(checkFeedback[feedbackKey]);

            $('<p/>')
                .html('Feedback if <b>' + feedbackKey + '</b>:')
                .append($('<br/>'))
                .append($field)
                .append($defaultFeedback)
                .appendTo($body);

            if (feedback && feedback.hasOwnProperty(feedbackKey)) {
                $field.val(feedback[feedbackKey]);
            }
        }

        const $dialog = this.createDialog('Edit feedback settings', $body, 'OK')
            .addClass('feedback-dialog')
            .appendTo(this.$backdrop);

        $dialog.find('.btn.btn-primary').on('click', function() {
            let feedback = {};
            $dialog.find('.feedback-input').each(function() {
                const key = $(this).attr('feedback-key');
                const value = $(this).val();
                if (value) {
                    feedback[key] = value;
                }
            });
            $checkContainer.attr('data-feedback', JSON.stringify(feedback));
            this.hideDialogs();
            return false;
        }.bind(this));

        return false;
    };

    ChecksUi.prototype.showEditCodeDialog = function(e) {
        this.$backdrop.css('display', 'block')
            .addClass('visible');
        $('body').addClass('unscrollable');

        let $argumentRow = $(e.target).closest('.argument-row');
        let $codeField = $argumentRow.find('.argument-value');

        let $body = $('<div/>');

        let helpText = '<p>In the text field below, enter the Python code implementing your custom check.</p>';
        helpText += '<ul>';
        helpText += '<li>You can access the student\'s answer using the variable <code>student_answer</code>.';
        if (this.pythonExplanation) {
            helpText += ' ' + this.pythonExplanation;
        }
        helpText += '</li>';
        helpText += '<li>Grade the answer and place the result into a variable <code>result</code> as follows:' +
            '<pre>result = {\n    \'correct\': &lt;True|False&gt;,\n    \'feedback\': &lt;some feedback string&gt;\n}</pre></li>';
        helpText += '</ul>';
        $('<div/>')
            .html(helpText)
            .appendTo($body);

        let $newField = $('<textarea/>')
            .attr('id', 'code-editor-field')
            .val($codeField.val())
            .appendTo($body);

        let $dialog = this.createDialog('Edit custom check code', $body, 'OK')
            .appendTo(this.$backdrop);

        $dialog.find('.btn.btn-primary').on('click', function() {
            $codeField.val($newField.val());
            this.hideDialogs();
            return false;
        }.bind(this));

        return false;
    };

    ChecksUi.prototype.showEditGraphDialog = function(e) {
        this.$backdrop.css('display', 'block')
            .addClass('visible');
        $('body').addClass('unscrollable');

        let $argumentRow = $(e.target).closest('.argument-row');
        let $graphField = $argumentRow.find('.argument-value');

        let $body = $('<div/>');

        let $newField = $('<textarea/>')
            .attr('id', 'graph-editor-field')
            .val($graphField.val())
            .appendTo($body);

        let $copyFromFeedbackButton = $('<button/>')
            .addClass('btn')
            .text('Copy from feedback answer')
            .appendTo($body);

        $copyFromFeedbackButton.on('click', function() {
            $('#id_answer').data('current-ui-wrapper').stop();
            $newField.data('current-ui-wrapper').stop();
            $newField.val($('#id_answer').val());
            $('#id_answer').data('current-ui-wrapper').restart();
            $newField.data('current-ui-wrapper').restart();
            return false;
        });

        let $copyToFeedbackButton = $('<button/>')
            .addClass('btn')
            .text('Copy to feedback answer')
            .appendTo($body);

        $copyToFeedbackButton.on('click', function() {
            $('#id_answer').data('current-ui-wrapper').stop();
            $newField.data('current-ui-wrapper').stop();
            $('#id_answer').val($newField.val());
            $('#id_answer').data('current-ui-wrapper').restart();
            $newField.data('current-ui-wrapper').restart();
            return false;
        });

        let $dialog = this.createDialog('Edit graph', $body, 'OK')
            .appendTo(this.$backdrop);

        let $answerField = $('textarea#id_answer');
        if ($answerField.length === 0) {
            $answerField = $('textarea#graph-ui-textarea');  // for the tester
        }
        let params = $answerField.attr('data-params');
        $newField.attr('data-params', params);

        let uiWrapper = new ui.InterfaceWrapper('graph', 'graph-editor-field');
        $dialog.find('.btn.btn-primary').on('click', function() {
            uiWrapper.stop();
            $graphField.val($newField.val());
            this.hideDialogs();
            return false;
        }.bind(this));

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

        this.createButton('fa-plus')
            .attr('title', 'Add this check to the list')
            .on('click', this.addCheck.bind(this))
            .appendTo($buttonGroup);

        let check = this.modules[module]['checks'][method];

        $('<span/>')
            .html(check['name'])
            .addClass('test-name')
            .appendTo($header);

        let used = this.hasCheck(module, method);
        if (used) {
            $('<span/>')
                .html('✓')
                .addClass('test-used-check')
                .appendTo($header);
        }

        if (check['description']) {
            //let $helpButton = this.createHelpButton(check['description'])
            //    .appendTo($header);
            $('<div/>')
                .html(check['description'])
                .addClass('test-description')
                .appendTo($header);
        }

        return $container;
    };

    ChecksUi.prototype.hasCheck = function(module, method) {
        let $containers = this.$checksPanel.find('.test-container');
        let used = false;
        let self = this;
        $containers.each(function() {
            let json = self.checkContainerToJson($(this));
            if (json['module'] === module && json['method'] === method) {
                used = true;
            }
        });
        return used;
    };

    ChecksUi.prototype.createDialog = function(title, content, buttonText) {
        const self = this;
        const $header = $('<div/>')
            .addClass('dialog-header')
            .append($('<div/>')
                .append($('<i/>').addClass('fa fa-times'))
                .addClass('btn btn-light close-button')
                .on('click', function() {
                    self.hideDialogs();
                }))
            .append(title);

        const $dialog = $('<div/>')
            .addClass('dialog')
            .append($header)
            .append($('<div/>')
                .addClass('dialog-body')
                .append(content))
            .on('click', function(e) {
                e.stopPropagation();  // avoid bubbling to the backdrop
            });

        if (buttonText) {
            $('<button/>')
                .addClass('btn btn-primary')
                .text(buttonText)
                .appendTo($dialog);
        }

        return $dialog;
    };

    ChecksUi.prototype.createButton = function(iconClass) {
        return $('<button/>')
            .addClass('button')
            .attr('type', 'button')
            .append($('<i/>').addClass('icon fa ' + iconClass));
    };

    ChecksUi.prototype.createHelpButton = function(description) {
        return $('<a/>')
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
