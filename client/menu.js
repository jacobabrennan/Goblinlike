

/*==============================================================================

    The following defines and implements a menuing system under one object. This
    menu serves as a focus point for the command of the game by the player, and
    communication to the player from the game.
    
    It is not a prototype, and should not be instanced.

==============================================================================*/

client.drivers.gameplay.drivers.menu = (function (){ // Create a namespace.
//===== Menu Namespace =======================================================//
var menu = Object.create(driver, {
    displayWidth: {value: displaySize},
    displayHeight: {value: displaySize},
    defaultMenu: {value: undefined, writable: true},
    showDefault: {value: function (){
        if(this.focus == statusMenu || this.focus == commandsMenu){ return;}
        else{
            var defaultMenu = this.defaultMenu || commandsMenu;
            this.focus(defaultMenu);
            defaultMenu.display();
        }
    }, writable: true},
    setup: {value: function (configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
        **/
        // Configure sub-drivers.
        commandsMenu.setup(configuration);
        statusMenu.setup(configuration);
        optionsMenu.setup(configuration);
        infoMenu.setup(configuration);
        directionSelectMenu.setup(configuration);
        descriptionMenu.setup(configuration);
    }},
    focused: {value: function (){
        this.showDefault();
    }},/*
    display: {value: function (){
        / **
            This function displays the menu, and any focused submenus.
            It returns
                false to signal that parent drivers should continue drawing, or
                true to signal that this driver has blocked further drawing.
         ** /
        if(!this.currentFocus){
            this.focus(statusMenu);
        }
        if(!(this.currentFocus && this.currentFocus.display)){ return false;}
        return true;
        //return this.currentFocus.display.apply(this.currentFocus, arguments);
    }},*/
    blank: {value: function (){
        client.skin.fillRect(0, 0, displaySize, displaySize, '#000');
        client.skin.clearCommands();
    }},
    commands: {value: function (){
        /**
            This function displays the help / commands menu to the player.
            It does not return anything.
         **/
        commandsMenu.display();
        this.focus(commandsMenu);
    }},
    help: {value: function (){
        this.commands();
    }},
    description: {value: function (title, description){
        descriptionMenu.display(title, description);
        this.focus(descriptionMenu);
    }},
    info: {value: function (messages){
        /**
            This function displays an array of messages to the player.
            It does not return anything.
         **/
        if(messages){
            infoMenu.stackMessages(messages);
        }
        this.focus(infoMenu);
        infoMenu.display();
    }},
    status: {value: function (goblinInfo){
        /**
            This function displays the player's hero's status.
            It does not return anything.
         **/
        statusMenu.display(goblinInfo);
        this.focus(statusMenu);
    }},
    options: {value: function (title, options, callback){
        /**
            This function displays a menu of options the player can select from.
            The optionsMenu has focus once this function ends.
            It does not return anything.
         **/
        optionsMenu.display({
            title: title,
            options: options,
            callback: callback,
            page: 0
        });
        this.focus(optionsMenu);
    }},
    directionSelect: {value: function(message, callback){
        /**
            This function prompts the player to input a direction.
            It does not return anything.
         **/
        directionSelectMenu.display(message, callback);
        focus(directionSelectMenu);
    }}
});
    
    
/*==============================================================================

    The following objects are sub-drivers used by the main menuing system to
    display info to the player and to prompt the player for input.
    
    They are private to the menu system namespace. All interactions with the
    menuing system must go through the main menu's methods, the sub-drivers
    cannot be accessed individually.
    
    They are not prototypes, and should not be instanced.
    
==============================================================================*/


var descriptionMenu = Object.create(driver, {
    setup: {value: function (){}, writable: true},
    display: {value: function (title, description){
        /**
            This function displays the descriptionMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        menu.blank();
        if(title){
            client.skin.drawString(1, 18, title);
        }
        if(description){
            client.skin.drawParagraph(1, 16, description);
        }
        client.skin.drawCommand(1, 1, 'Esc', 'Done', COMMAND_CANCEL);
        menu.focus(this);
        return true;
    }},
    command: {value: function (command, options){
        // TODO: Document.
        client.drivers.gameplay.drivers.map.display();
        switch(command){
            case COMMAND_PAGEDOWN:
                menu.info();
                return true;
        }
        menu.showDefault();
        return false;
    }},
});
var commandsMenu = Object.create(driver, {
    /**
        The statusMenu is used by the menuing system to display information
            about the character. It is the default display state of the
            menu. It doesn't provide any interaction, except aliases to the
            infoMenu so the player can access old messages more easily.
        It is not a prototype, and should not be instanced.
     **/
    setup: {value: function (){}},
    display: {value: function (){
        /**
            This function displays the statusMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        if(client.drivers.gameplay.dead){
            menu.focus(statusMenu);
            statusMenu.display();
            return false;
        }
        menu.blank();
        var commandLink = function (x, y, key, command, name){
            client.skin.drawCommand(x, y, key, name, command);
        }.bind(this);
        client.skin.drawString(1,19,'Arrows & NumerPad');
        client.skin.drawString(1,18,'    Move & Attack');
        commandLink(1, 16, "c", COMMAND_CLOSE, 'Close Door');
        commandLink(1, 15, "d", COMMAND_DROP, 'Drop Item');
        commandLink(1, 14, "e", COMMAND_EQUIP, 'Equip Item');
        commandLink(1, 13, "f", COMMAND_FIRE, 'Fire Weapon');
        commandLink(1, 12, "F", COMMAND_THROW, 'Throw Item');
        commandLink(1, 11, "g", COMMAND_GET, 'Get Item');
        commandLink(1, 10, "l", COMMAND_LOOK, 'Look');
        commandLink(1,  9, "L", COMMAND_LEADERSHIP, 'Leadership');
        commandLink(1,  8, "r", COMMAND_CAMP, 'Rest (Heal)');
        commandLink(1,  7, "t", COMMAND_UNEQUIP, 'Take Off Item');
        commandLink(1,  6, "s", COMMAND_STAIRS, 'Use Stairs');
        client.skin.drawString(14, 6, '>', '#000', '#fc0');
        commandLink(1,  5, "u", COMMAND_USE, 'Use Item');
        //commandLink(1,  7, "?", COMMAND_HELP, 'Help');
        commandLink(1,  3, "[", COMMAND_PAGEDOWN, 'Show Messages');
        commandLink(1,  1, "?", COMMAND_HELP, 'Status');
        menu.focus(this);
        return true;
    }},
    command: {value: function (command, options){
        // TODO: Document.
        switch(command){
            case COMMAND_PAGEDOWN:
                menu.info();
                return true;
            case COMMAND_HELP:
                menu.defaultMenu = statusMenu;
                menu.status();
                return true;
        }
        return false;
    }}
});
var infoMenu = Object.create(driver, {
    /**
        The infoMenu is used by the menuing system to display blocks of
        text to the player.
        It is not a prototype, and should not be instanced.
    **/
    messages: {value: undefined, writable: true},
    pendingIndex: {value: undefined, writable: true},
    pageIndex: {value: undefined, writable: true},
    pageLength: {value: 13, writable: true},
    setup: {value: function (){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display the info.
            It does not return anything.
         **/
        this.messageIndex = 0;
        this.messages = [];
    }},
    stackMessages: {value: function (messages){
        /**
            Used to display new messages. It also adds the messages to the old
            messages list so they can be recalled later.
            It does not return anything.
        **/
        this.pendingIndex = 0;
        while(messages.length){
            this.messages.unshift(messages.shift());
            this.pendingIndex++;
        }
        this.pageIndex = 0;
        this.display();
    }},
    advanceMessage: {value: function (direction){
        /**
         *  Used to cycle through and display old messages.
         *  It does not return anything.
         **/
        client.drivers.gameplay.drivers.map.display();
        this.pageIndex -= direction;
        var offsetLength = (this.messages.length-1)+(this.pageLength-this.pendingIndex);
        var maxPage = Math.floor((offsetLength)/this.pageLength);
        this.pageIndex = Math.max(0, Math.min(maxPage, this.pageIndex));
        this.display();
    }},
    display: {value: function (){
        /**
            This function displays the infoMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        menu.blank();
        client.skin.drawCommand(1, 1, 'Esc', 'Cancel', COMMAND_CANCEL);
        var pageStart = this.pendingIndex-this.pageLength;
        pageStart += this.pageIndex*this.pageLength;
        var pageEnd = pageStart+this.pageLength;
        pageStart = Math.max(0, pageStart);
        pageEnd = Math.min(this.messages.length, pageEnd);
        if(this.pageIndex > 0){
            client.skin.drawCommand(1, 3, ']', 'Newer Messages', COMMAND_PAGEUP);
        } else {
            client.skin.drawCommand(1, 3, ']', 'Back', COMMAND_PAGEUP);
        }
        if(pageEnd < this.messages.length){
            client.skin.drawCommand(1, 19, '[', 'Older Messages', COMMAND_PAGEDOWN);
        }
        var pageMessages = this.messages.slice(pageStart, pageEnd);
        var stackIndex = 0;
        for(var msgIndex = pageMessages.length-1; msgIndex >= 0; msgIndex--){
            var indexedMsg = pageMessages[msgIndex];
            client.skin.drawString(1, 17-stackIndex, indexedMsg);
            stackIndex++;
        }
        menu.focus(this);
        return true;
    }},
    command: {value: function (command, options){
        // TODO: Document.
        if(command >= 0 && command <= 15){
            return false;
        }
        switch(command){
            case COMMAND_PAGEDOWN:
                this.advanceMessage(-1);
                return true;
            case COMMAND_PAGEUP:
                var oldPage = this.pageIndex;
                this.advanceMessage(1);
                if(this.pageIndex === oldPage || isNaN(this.pageIndex)){
                    this.command(COMMAND_ENTER, {key: ' '});
                }
                return true;
            default:
                if(this.pendingMessages && this.pendingMessages.length){
                    var nextMessage = this.pendingMessages.shift();
                    this.stackMessage(nextMessage);
                } else{
                    menu.showDefault();
                    return false;
                }
        }
        return true;
    }},
    blurred: {value: function (){
        // TODO: Document.
        //this.pendingIndex = 0;
        this.pageIndex = 0;
        client.drivers.gameplay.drivers.map.display();
    }}
});
var statusMenu = Object.create(driver, {
    /**
        The statusMenu is used by the menuing system to display information
            about the character. It is the default display state of the
            menu. It doesn't provide any interaction, except aliases to the
            infoMenu so the player can access old messages more easily.
        It is not a prototype, and should not be instanced.
     **/
    setup: {value: function (){}},
    display: {value: function (goblinInfo){
        /**
            This function displays the statusMenu in the document.
            
            It returns true to signify that drawing should not continue;
        **/
        if(client.drivers.gameplay.dead){
            menu.blank();
            var score = ''+Math.floor(client.drivers.gameplay.memory.character.experience);
            var scoreText;
            if(score.length == 1){
                scoreText = '  Exp:'+score;
            } else if(score.length == 2){
                scoreText = ' Exp: '+score;
            } else if(score.length == 3){
                scoreText = ' Exp:'+score;
            } else{
                scoreText = 'Exp: '+score;
            }
            client.skin.drawString(6, 12, 'Game Over');
            client.skin.drawString(6, 10, scoreText);
            client.skin.drawCommand(4, 7, 'Esc', ' Continue', COMMAND_CANCEL);
            /*resetLink.addEventListener('click', function (){
                client.focus(client.drivers.title);
            });*/
            return true;
        }
        //if(!client.drivers.gameplay.memory.statusUpdate){ return true;}
        client.drivers.gameplay.memory.statusUpdate = false;
        menu.blank();
        // Get values for display from memory.
        var character = goblinInfo || client.drivers.gameplay.memory.character;
        var name = character.name;
        var hp = character.hp;
        var maxHp = character.maxHp;
        var experience = character.experience;
        var level = character.level;
        var vitality = character.vitality;
        var strength = character.strength;
        var wisdom = character.wisdom;
        var charisma = character.charisma;
        var eWeapon = character.equipment[EQUIP_MAINHAND];
        var eShield = character.equipment[EQUIP_OFFHAND ];
        var eHelmet = character.equipment[EQUIP_HEAD    ];
        var eArmor  = character.equipment[EQUIP_BODY    ];
        var line = 17;
        client.skin.drawString(1, line--, 'Name : '+name);
        client.skin.drawString(1, line--, 'Class: Goblin');
        if(goblinInfo){
            client.skin.drawString(1, line--, ('Level: '+level));
            client.skin.drawString(1, line--, ('HP   : '+hp));
        } else{
            client.skin.drawString(1, line--, ('Level: '+level+' /'+Math.floor(experience)));
        }
        line--;
        client.skin.drawString(1, line--, ('Vitality: '+((vitality < 10)? ' ' : '')+vitality));
        client.skin.drawString(1, line--, ('Strength: '+((strength < 10)? ' ' : '')+strength));
        client.skin.drawString(1, line--, ('Wisdom  : '+((wisdom   < 10)? ' ' : '')+wisdom  ));
        client.skin.drawString(1, line--, ('Charisma: '+((charisma < 10)? ' ' : '')+charisma));
        line--;
        client.skin.drawString(1,  line--, (eWeapon? ('Hand: '+eWeapon.name) : ''));
        client.skin.drawString(1,  line--, (eShield? ('Hand: '+eShield.name) : ''));
        client.skin.drawString(1,  line--, (eArmor ? ('Body: '+eArmor.name ) : ''));
        client.skin.drawString(1,  line--, (eHelmet? ('Head: '+eHelmet.name) : ''));
        if(!goblinInfo){
            client.skin.drawCommand(1, 3, "[", 'Show Messages', COMMAND_PAGEDOWN);
        }
        client.skin.drawCommand(1, 1, '?', 'Commands', COMMAND_HELP);
        return true;
    }},
    command: {value: function (command, options){
        // TODO: Document.
        if(client.drivers.gameplay.dead){
            if(command == COMMAND_ENTER || command == COMMAND_CANCEL){
                client.focus(client.drivers.title);
            }
            return true;
        }
        switch(command){
            case COMMAND_PAGEDOWN:
                infoMenu.advanceMessage(0);
                return true;
            case COMMAND_HELP:
                menu.defaultMenu = commandsMenu;
                menu.help();
                return true;
        }
        return false;
    }}
});
var optionsMenu = Object.create(driver, {
    /**
        The optionsMenu is used to prompt the player to make a selection
            from several provided options.
        It is not a prototype, and should not be instanced.
     **/
    optionsDisplayMax: {value: displaySize-8},
    actionTitle: {value: undefined, writable: true},
    actionOptions: {value: undefined, writable: true},
    optionsPage: {value: undefined, writable: true},
    actionCallback: {value: undefined, writable: true},
    setup: {value: function (){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display info.
            It does not return anything.
         **/
    }},
    display: {value: function (options){
        /**
            This function displays the optionsMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        
        // Setup defaults for unpassed options.
        menu.blank();
        if(!options){ options = {};}
        this.actionTitle    = options.title || this.actionTitle;
        this.actionOptions  = options.options || this.actionOptions;
        this.actionCallback = options.callback || this.actionCallback;
        if(options.page !== undefined){
            this.optionsPage = options.page;
        } else{
            this.optionsPage = this.optionsPage || 0;
        }
        // Add the title.
        client.skin.drawString(1, 19, this.actionTitle+':');
        /*
            If there are options, then populate the newDisplay element with
                option links, and possibly page up and page down links.
            Otherwise, add a message saying it is empty.
            Add the cancel / escape link in either case.
        */
        if(this.actionOptions && this.actionOptions.length){ // Populate.
            var pagedOffset = this.optionsPage*this.optionsDisplayMax;
            var pagedLength = this.actionOptions.length - pagedOffset;
            var displayMax = Math.min(this.optionsDisplayMax, pagedLength);
            // Add Page Up link if needed.
            if(this.optionsPage > 0){
                client.skin.drawCommand(1, 17, '[ Previous', null, COMMAND_PAGEDOWN);
            }
            // Create the options links.
            var self = this;
            var optionLinkFunction = function (_char){
                return function (){
                    self.command(COMMAND_NONE, {key: _char});
                };
            };
            for(var displayIndex = 0; displayIndex < displayMax; displayIndex++){
                var indexedOption = this.actionOptions[displayIndex+pagedOffset];
                var alphabet = 'abcdefghijklmnopqrstuvwxyz';
                var indexCharacter = alphabet.charAt(displayIndex);
                client.skin.drawCommand(
                    1, 16-displayIndex,
                    indexCharacter.toUpperCase(),
                    indexedOption,
                    optionLinkFunction(indexCharacter)
                );
            }
            // Add the Page Down Link if needed.
            var maxPage = Math.floor((this.actionOptions.length-1)/this.optionsDisplayMax);
            if(this.optionsPage < maxPage){
                client.skin.drawCommand(1, 3, '] Next', null, COMMAND_PAGEUP);
            }
        } else{ // Display the "empty" message.
            client.skin.drawString(1, 15, '(empty)');
        }
        // Add the Cancel / Escape link.
        client.skin.drawCommand(1, 1, 'Esc', 'Cancel', COMMAND_CANCEL);
        menu.focus(this);
        return true;
    }},
    command: {value: function (command, options){
        // TODO: Document.
        if(command >= 0 && command <= 15){
            return false;
        }
        switch(command){
            case COMMAND_CANCEL:
                menu.showDefault();
                return true;
            case COMMAND_PAGEDOWN:
                this.optionsPage = Math.max(0, this.optionsPage-1);
                this.display(this.actionTitle, this.actionOptions, this.actionCallback, this.optionsPage);
                return true;
            case COMMAND_PAGEUP:
                if(!this.actionOptions){ return true;}
                var maxPage = Math.floor((this.actionOptions.length-1)/this.optionsDisplayMax);
                this.optionsPage = Math.min(maxPage, this.optionsPage+1);
                this.display(this.actionTitle, this.actionOptions, this.actionCallback, this.optionsPage);
                return true;
            default:
                if(options.key){
                    var selectionIndex = Math.min(
                        this.optionsDisplayMax, characterIndex(options.key)
                    );
                    selectionIndex += this.optionsPage*this.optionsDisplayMax;
                    if(
                        selectionIndex != -1 &&
                        selectionIndex < this.actionOptions.length
                    ){
                        this.select(selectionIndex);
                        return true;
                    }
                }
        }
        return true;
    }},
    select: {value: function (selectionIndex){
        // TODO: Document.
        var indexedOption = this.actionOptions[selectionIndex];
        this.actionCallback(indexedOption, selectionIndex);
    }} 
});
var directionSelectMenu = Object.create(driver, {
    /**
        The directionSelectMenu is used by the menuing system to prompt the
            player to select a direction. This is used in targeting spells,
            etc.
        It is not a prototype, and should not be instanced.
     **/
    directionCallback: {value: undefined, writable: true},
    setup: {value: function (){}},
    display: {value: function (message, callback){
        /**
            This function displays the infoMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        if(callback){ this.directionCallback = callback;}
        menu.blank();
        client.skin.drawString(1, 16, (message || 'Input a direction:'));
        client.skin.drawCommand(1, 1, 'Esc', 'Cancel', COMMAND_CANCEL);
        menu.focus(this);
        return true;
    }},
    command: {value: function (command, options){
        // TODO: Document.
        switch(command){
            case COMMAND_CANCEL:
                menu.showDefault();
                break;
            case NORTH: case NORTHWEST: case WEST: case SOUTHWEST:
            case SOUTH: case SOUTHEAST: case EAST: case NORTHEAST:
                var callbackStorage = this.directionCallback;
                menu.showDefault();
                this.directionCallback = undefined;
                callbackStorage(command);
        }
        return true;
    }},
    blurred: {value: function (){
        // TODO: Document.
        this.directionCallback = undefined;
    }}
});
// ============================================================================
    return menu; // Return the menu; end the namespace.
})();



