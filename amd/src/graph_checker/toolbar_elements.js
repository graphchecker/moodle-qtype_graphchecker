/******************************************************************************
 *
 * A module for use by ui_graph and ui_toolbar, defining classes for
 * elements present in the toolbar
 *
 ******************************************************************************/
// This code is a modified version of Finite State Machine Designer
// (http://madebyevan.com/fsm/)
/*
 Finite State Machine Designer (http://madebyevan.com/fsm/)
 License: MIT License (see below)
 Copyright (c) 2010 Evan Wallace
 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:
 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/
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

define(['jquery'], function($) {

    /***********************************************************************
     *
     * Define a class Button as a base class from which more specific
     * buttons can be derived.
     *
     ***********************************************************************/

    function Button(toolbar, parent, w, h, iconClass, title, eventFunction, functionArg) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.width = w; //In px.
        this.height = h; //In px.
        this.icon = iconClass;
        this.title = title;
        this.eventFunction = eventFunction;
        this.functionArg = functionArg;
    }

    // The create function should be called explicitly in order to create the HTML element(s) of the button
    Button.prototype.create = function (addAsFirst) {
        // Create the button, and add an unclickable icon
        this.id = 'button_' + this.title.split(' ').join('_');

        let $button = $('<button/>')
            .attr({
                "id":       this.id,
                "class":    'toolbar_button',
                "type":     "button",
                "title":    this.title,
                "style":    "width: " + this.width + "px; height: " + this.height + "px;",
            })
            .append($('<i/>')
                .addClass('icon fa ' + this.icon).attr({
                    "style":    "pointer-events: none",
                }));

        // Add the element to the end or to the beginning of the parent
        if (!addAsFirst) {
            $(this.parent[0]).append($button);
        } else {
            this.parent[0].insertAdjacentElement('afterbegin', $button.get(0));
        }

        this.object = $button;

        // Add the event function to this button
        let self = this;
        $(this.object).click(function () {
            self.onClick(self.eventFunction, self.functionArg, this);
        });
    };

    Button.prototype.onClick = function(eventFunction, functionArg, eventObject) {
        if (eventFunction !== null) {
            if (eventObject === null) {
                eventFunction(functionArg);
            } else {
                eventFunction(functionArg, eventObject);
            }
        }
    };

    // This function should be called before the object is removed
    Button.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    /***********************************************************************
     *
     * Define a class ToggleButton, used for buttons which can be set to
     * on/enabled or off/disabled. This is based on the general Button class
     *
     ***********************************************************************/

    function ToggleButton(toolbar, parent, w, h, iconClass, title, eventFunction, functionArg) {
        Button.call(this, toolbar, parent, w, h, iconClass, title, eventFunction, functionArg);
    }

    ToggleButton.prototype = Object.create(Button.prototype);
    ToggleButton.prototype.constructor = ToggleButton;

    ToggleButton.prototype.create = function() {
        Button.prototype.create.call(this);

        // Add 'toggle' to the class
        this.object.addClass('toggle');

        // Add the not_clicked class name by default
        this.object.addClass('not_clicked');
    };

    ToggleButton.prototype.onClick = function() {
        Button.prototype.onClick(this.eventFunction, this.functionArg);
        this.setSelected();
    };

    ToggleButton.prototype.setSelected = function() {
        this.object.addClass('clicked');
        this.object.removeClass('not_clicked');
    };

    ToggleButton.prototype.setDeselected = function() {
        this.object.removeClass('clicked');
        this.object.addClass('not_clicked');
    };

    /***********************************************************************
     *
     * Define a class PetriNodeTypeButton for the buttons used to switch
     * the petri node to be placed, when in Draw mode and when the graph
     * type is Petri nets
     *
     ***********************************************************************/

    function PetriNodeTypeButton(toolbar, parent, w, h, iconClass, title, petriNodeType, eventFunction) {
        Button.call(this, toolbar, parent, w, h, iconClass, title, eventFunction);
        this.petriNodeType = petriNodeType; // Denotes which petri node type mode pressing the button activates
    }

    PetriNodeTypeButton.prototype = Object.create(Button.prototype);
    PetriNodeTypeButton.prototype.constructor = PetriNodeTypeButton;

    PetriNodeTypeButton.prototype.create = function() {
        Button.prototype.create.call(this, true);

        // Add 'toggle' to the class
        this.object.addClass('toggle');

        // Add 'petri_node_type' to the class
        this.object.addClass('petri_node_type');

        // Add the not_clicked class name by default, based on the button type
        this.object.addClass('not_clicked');
    };

    PetriNodeTypeButton.prototype.onClick = function() {
        Button.prototype.onClick(this.eventFunction, this);
        this.setSelected();
    };

    PetriNodeTypeButton.prototype.setSelected = function() {
        this.object.addClass('clicked');
        this.object.removeClass('not_clicked');
    };

    PetriNodeTypeButton.prototype.setDeselected = function() {
        this.object.removeClass('clicked');
        this.object.addClass('not_clicked');
    };

    /***********************************************************************
     *
     * Define a class GrayOutButton for buttons which can be grayed out
     * (disabled). This class is based on the general Button class
     *
     ***********************************************************************/

    function GrayOutButton(toolbar, parent, w, h, iconClass, title, eventFunction, functionArg) {
        Button.call(this, toolbar, parent, w, h, iconClass, title, eventFunction, functionArg);
    }

    GrayOutButton.prototype = Object.create(Button.prototype);
    GrayOutButton.prototype.constructor = GrayOutButton;

    GrayOutButton.prototype.create = function() {
        Button.prototype.create.call(this);

        // Set the button as disabled
        this.setDisabled();
    };

    GrayOutButton.prototype.onClick = function() {
        Button.prototype.onClick(this.eventFunction, this.functionArg);
    };

    GrayOutButton.prototype.setEnabled = function() {
        $(this.object[0]).attr('disabled', false);

        this.object.removeClass('disabled');
    };

    GrayOutButton.prototype.setDisabled = function() {
        $(this.object[0]).attr('disabled', true);

        this.object.addClass('disabled');
    };

    /***********************************************************************
     *
     * Define a class NumberInputField for the number input field
     * This can be used to set the number of tokens in a petri net's place,
     * for example
     *
     ***********************************************************************/

    function NumberInputField(toolbar, parent, w, h, minValue, maxValue, name, labelText, title, eventFunction,
                              onFocusInFunction, onFocusOutFunction) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.width = w;     // In px.
        this.height = h;    // In px.
        this.minValue = minValue;   // The minimum numeric value possible to be entered
        this.maxValue = maxValue;   // The maximum numeric value possible to be entered
        this.name = name;
        this.labelText = labelText;
        this.title = title;
        this.eventFunction = eventFunction;
        this.onFocusInFunction = onFocusInFunction;
        this.onFocusOutFunction = onFocusOutFunction;
    }

    NumberInputField.prototype.create = function() {
        // Create the number input field
        this.id = 'numberinput_' + this.title.split(' ').join('_');

        let $number_input = $('<div/>')
            .attr({
                'class':    'toolbar_field',
            }).append(this.labelText).append($('<input/>')
                .attr({
                    'id':       this.id,
                    'class':    'toolbar_numberinput',
                    'type':     'number',
                    'title':    this.title,
                    'name':     this.name,
                    'min':      this.minValue,
                    'max':      this.maxValue,
                }));
        $(this.parent[0]).append($number_input);

        // Add the event listener
        $number_input[0].addEventListener('input', (event) => this.handleInteraction(event));
        $number_input[0].addEventListener('keydown', (event) => this.handleInteraction(event));
        $number_input[0].addEventListener('focusin', (event) => this.onFocusInFunction(this, event));
        $number_input[0].addEventListener('focusout', (event) => this.onFocusOutFunction(this, event));
        this.object = $number_input;
    };

    NumberInputField.prototype.handleInteraction = function(event) {
        this.eventFunction(event, this.toolbar);
    };

    // This function should be called before the object is removed
    NumberInputField.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    /***********************************************************************
     *
     * Define a class Checkbox which can be used in the graph toolbar
     *
     ***********************************************************************/

    function Checkbox(toolbar, parent, type, text, eventFunction) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.type = type;
        this.text = text;
        this.eventFunction = eventFunction;
    }

    // The create function should be called explicitly in order to create the HTML element(s) of the checkbox
    Checkbox.prototype.create = function () {
        this.id = 'checkbox_' + this.text.split(' ').join('_');

        let $checkbox = $('<div/>')
            .addClass('toolbar_field' + ' ' + this.id)
            .append($('<label/>')
                .attr('for', this.id)
                .addClass('checkbox_label')
                .text(this.text)
            )
            .append($('<input/>')
                .attr({
                    'id':       this.id,
                    'class':    'toolbar_checkbox',
                    'type':     'checkbox',
                })
            )
            .append($('<span/>')
                .attr({
                    'class':    'toolbar_checkbox toolbar_checkbox_black',
                })
            )
            .appendTo(this.parent[0]);

        // Add the event listener
        $checkbox[0].addEventListener('change', (event) => this.handleInteraction(event));
        this.object = $checkbox;
    };

    Checkbox.prototype.handleInteraction = function(event) {
        this.eventFunction(event);
    };

    // A function to set the checked state of the checkbox
    // Here, partialNr, where 0 <= partialNr <= fullNr, conveys how many items adhere to a certain property
    Checkbox.prototype.setChecked = function(partialNr, fullNr) {
        $($(this).attr('object').get(0)).find('input').get(0).checked = partialNr;
        if (partialNr !== fullNr) {
            // If not all of the selected objects are initial, create a gray tick mark
            $($(this).attr('object').get(0)).find('span').removeClass('toolbar_checkbox_black');
            $($(this).attr('object').get(0)).find('span').addClass('toolbar_checkbox_gray');
        }
    };

    // This function should be called before the object is removed
    Checkbox.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    /***********************************************************************
     *
     * Define a class TextField which can be used in the graph toolbar
     *
     ***********************************************************************/

    function TextField(toolbar, parent, w, placeholderText, selectedObject, eventFunction, onFocusInFunction,
                       onFocusOutFunction) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.w = w;
        this.placeholderText = placeholderText;
        this.selectedObject = selectedObject; // The object to which this label belongs
        this.eventFunction = eventFunction;
        this.labelInitial = "";   // The value of the label upon creation of this object
        this.onFocusInFunction = onFocusInFunction;
        this.onFocusOutFunction = onFocusOutFunction;
    }

    // The create function should be called explicitly in order to create the HTML element(s) of the text field
    TextField.prototype.create = function () {
        this.id = 'textfield_' + this.placeholderText.split(' ').join('_');
        let $textfield = $('<div/>')
            .attr({
                'class':    'field_label',
            }).append(this.placeholderText + ':')
            .append($('<div/>')
                .attr({
                    'class':    'field_label_wrapper',
                })
                .append($('<input/>')
                    .attr({
                        'id':           this.id,
                        'class':        'toolbar_textfield',
                        'type':         'text',
                        'placeholder':  this.placeholderText,
                        'size':         this.w,
                    })));
        $(this.parent[0]).append($textfield);

        // Add the event listeners, for the regular input and for checking the CTRL and enter key, and for focus events
        $textfield[0].addEventListener('input', (event) => this.handleInteraction(event));
        $textfield[0].addEventListener('keydown', (event) => this.handleInteraction(event));
        $textfield[0].addEventListener('focusin', (event) => this.onFocusInFunction(this, event));
        $textfield[0].addEventListener('focusout', (event) => this.onFocusOutFunction(this, event));
        this.object = $textfield;
    };

    TextField.prototype.handleInteraction = function(event) {
        this.eventFunction(event, this.toolbar);
    };

    // This function should be called before the object is removed
    TextField.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    /***********************************************************************
     *
     * Define a class Dropdown which can be used in the graph toolbar as
     * a dropdown menu
     *
     ***********************************************************************/

    function Dropdown(toolbar, parent, labelText, dropDownOptionsList, fontAwesomeIcons, eventFunction) {
        this.toolbar = toolbar;
        this.parent = parent;
        this.labelText = labelText;
        this.dropDownOptions = dropDownOptionsList; // The different options of the dropdown list (type: [string])
        this.icons = fontAwesomeIcons; // The different icons corresponding to this.dropDownOptions (type: [{icon, color}])
        this.eventFunction = eventFunction;
    }

    // The create function should be called explicitly in order to create the HTML element(s) of the text field
    Dropdown.prototype.create = function () {
        // Create a custom dropdown menu, so we can display colored Font Awesome items (e.g. circles)
        let $dropdownField = $('<div/>').attr({
            'class':    'custom_dropdown_field',
        }).append($('<i/>')
            .addClass('icon fa fa-angle-down custom_dropdown_icon'));
        // Create the dropdown list. Here 20.4 is the height of the outerdiv when accounting for the borders of both
        // $dropdownField and $dropdownMenu
        let $dropdownMenu = $('<div/>').attr({
            'class':    'custom_dropdown_itemlist_wrapper hide',
            'style':    'left: ' + (-$($dropdownField).outerWidth()) + 'px;',
        }).append($('<div/>').attr({
            'class':    'custom_dropdown_itemlist',
        }));

        // Add the different options to the dropdown menu div
        for (let i = 0; i < this.dropDownOptions.length; i++) {
            let $itemDiv = $('<div/>')
                .addClass('dropdown_item')
                .append($('<i/>')
                    .addClass('icon fa ' + this.icons[i].icon + ' dropdown_item_icon')
                    .attr({
                        'style':    'pointer-events: none; color: ' + this.icons[i].color.colorCode +';',
                    }))
                .append($('<span/>')
                    .addClass('dropdown_item')
                    .attr({
                        'style':    'pointer-events: none;',
                    })
                    .text(' ' + this.dropDownOptions[i]));
            $itemDiv[0].addEventListener('click', (event) => this.handleDropdownItemClick(event, $dropdownField[0]));
            $dropdownMenu[0].firstChild.append($itemDiv[0]);
        }

        // Add an event listener for selecting
        $dropdownField[0].addEventListener('click', (event) => this.handleDropdownMenuClick(event, $dropdownField[0]));
        this.field = $dropdownField;

        // Set the location of the dropdown menu
        let outerDivWidth = $($dropdownField[0]).outerWidth();
        let outerDivHeight = $($dropdownField[0]).height();
        $($dropdownMenu).css({left: -outerDivWidth, top: outerDivHeight/2.0 - 1});

        // Append both divs to an outer wrapper div
        let $outerDiv = $('<div/>')
            .attr({
                'class':    'field_label',
            }).append(this.labelText + ':')
            .append($dropdownField).append($dropdownMenu);
        $(this.parent[0]).append($outerDiv);
        this.object = $outerDiv;
    };

    Dropdown.prototype.handleDropdownMenuClick = function(event, dropdownFieldElement) {
        // Hide/unhide the sibling element, to show or hide the dropdown items
        dropdownFieldElement.nextElementSibling.classList.toggle('hide');
    };

    // An event function to handle the case when a user clicks a dropdown item
    Dropdown.prototype.handleDropdownItemClick = function(event, dropdownFieldElement) {
        this.eventFunction(event);

        // Close the dropdown menu
        this.handleDropdownMenuClick(event, dropdownFieldElement);
    };

    Dropdown.prototype.setInitialFieldValue = function(selectedObjects) {
        let indices = [];
        if (selectedObjects.length === 0) {
            return;
        } else if (selectedObjects.length >= 1) {
            // Get the color names of the object(s)
            let objectColors = [];
            for (let i = 0; i < selectedObjects.length; i++) {
                if (!objectColors.includes(selectedObjects[i].colorObject.name)) {
                    objectColors.push(selectedObjects[i].colorObject.name);
                }
            }

            // Find the indices in the dropdown options which correspond to the selected objects' color names
            for (let i = 0; i < this.dropDownOptions.length ; i++) {
                if (objectColors.includes(this.dropDownOptions[i])) {
                    indices.push(i);
                }
            }
            if (indices.length === 0) {
                return;
            }
        }

        // Only if there is 1 found index, meaning all selected objects (either 1 or more) have the same color,
        // display that color in the dropdown field
        if (indices.length === 1) {
            // Using the index, get the corresponding item elements from the dropdown menu itself
            let itemDivWrapper = this.object[0].children[1].children[0].children[indices[0]];
            this.displayInDropdownField(itemDivWrapper);
        }
    };

    // This function displays an item in the dropdown field, based on the div wrapper element of the item
    // This wrapper div contains an icon and a span element
    Dropdown.prototype.displayInDropdownField = function(divWrapper) {
        // Remove the icon and the span from the field if they are present
        let fieldIcon = $(this.field).children('.dropdown_item_icon');
        let fieldSpan = $(this.field).children('.dropdown_item');
        if (fieldIcon.length >= 1 && fieldSpan.length >= 1) {
            fieldIcon[0].remove();
            fieldSpan[0].remove();
        }

        // Create two deep copies of the icon and the span element
        let iconClone = divWrapper.childNodes[0].cloneNode(true);
        let spanClone = divWrapper.childNodes[1].cloneNode(true);

        // Adjust the styling slightly
        $(iconClone).css({'padding-left': 5});

        // Add these copies to the field
        this.field.prepend(spanClone);
        this.field.prepend(iconClone);
    };

    // This function should be called before the object is removed
    Dropdown.prototype.end = function() {
        // Focus on the toolbar, such that the CTRL-mode switch can work
        $(this.toolbar.div).focus();
    };

    return {
        Button: Button,
        ToggleButton: ToggleButton,
        PetriNodeTypeButton: PetriNodeTypeButton,
        NumberInputField: NumberInputField,
        GrayOutButton: GrayOutButton,
        Checkbox: Checkbox,
        TextField: TextField,
        Dropdown: Dropdown,
    };

});