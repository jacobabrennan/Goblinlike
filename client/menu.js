

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
    displayPane: {value: undefined, writable: true},
    currentDisplay: {value: undefined, writable: true},
    setup: {value: function (configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
         **/
        this.displayPane = document.createElement('div');
        this.displayPane.setAttribute('id', 'menu');
        // Configure sub-drivers.
        helpMenu.setup(configuration);
        statusMenu.setup(configuration);
        optionsMenu.setup(configuration);
        infoMenu.setup(configuration);
        directionSelectMenu.setup(configuration);
    }},
    focused: {value: function (){
        this.display();
    }},
    display: {value: function (){
        /**
            This function displays the menu, and any focused submenus.
            It returns
                false to signal that parent drivers should continue drawing, or
                true to signal that this driver has blocked further drawing.
         **/
        if(!this.currentFocus){
            this.focus(statusMenu);
        }
        if(!(this.currentFocus && this.currentFocus.display)){ return false;}
        return this.currentFocus.display.apply(this.currentFocus, arguments);
    }},
    swap: {value: function (newDisplay){
        /**
            This function displays the supplied element in the menu display
                area (this.displayPane). It removes any old content that
                was currently being displayed there.
            It does not return anything.
         **/
        if(this.currentDisplay){
            this.displayPane.replaceChild(newDisplay, this.currentDisplay);
        } else{
            this.displayPane.appendChild(newDisplay);
        }
        this.currentDisplay = newDisplay;
    }},
    help: {value: function (){
        /**
            This function displays the help / commands menu to the player.
            It does not return anything.
         **/
        helpMenu.display();
        this.focus(helpMenu);
    }},
    info: {value: function (message){
        /**
            This function displays a message to the player.
            It does not return anything.
         **/
        var messages = arguments[0];
        if(messages && messages.shift){ // Test if messages is an array.
            infoMenu.pendingMessages = messages;
            infoMenu.command(0, {});
        } else{
            infoMenu.stackMessage(message);
            this.focus(infoMenu);
        }
    }},
    status: {value: function (){
        /**
            This function displays the player's hero's status.
            It does not return anything.
         **/
        //this.statusMenu.draw(); // Status is drawn in display.
        statusMenu.display();
        this.focus(statusMenu);
    }},
    options: {value: function (title, options, callback){
        /**
            This function displays a menu of options the player can select from.
            The optionsMenu has focus once this function ends.
            It does not return anything.
         **/
        optionsMenu.draw(title, options, callback, 0);
        optionsMenu.display();
        this.focus(optionsMenu);
    }},
    directionSelect: {value: function(message, callback){
        /**
            This function prompts the player to input a direction.
            It does not return anything.
         **/
        directionSelectMenu.draw(message, callback);
        directionSelectMenu.display();
        focus(directionSelectMenu);
    }}
});
    
    
/*===========================================================================

    The following objects are sub-drivers used by the main menuing system to
    display info to the player and to prompt the player for input.
    
    They are private to the menu system namespace. All interactions with the
    menuing system must go through the main menu's methods, the sub-drivers
    cannot be accessed individually.
    
    They are not prototypes, and should not be instanced.
    
  ===========================================================================*/


var helpMenu = Object.create(driver, {
    /**
        The statusMenu is used by the menuing system to display information
            about the character. It is the default display state of the
            menu. It doesn't provide any interaction, except aliases to the
            infoMenu so the player can access old messages more easily.
        It is not a prototype, and should not be instanced.
     **/
    displayElement: {value: undefined, writable: true},
    setup: {value: function (){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display the help menu.
            It does not return anything.
         **/
        this.displayElement = document.createElement('pre');
        var commandsMessage = '';
    //  commandsMessage += '123456789abcdefghij';
        commandsMessage += 'Click/Arrows: Move\n';
        commandsMessage += 'Click/Arrows: Fight\n\n';
        commandsMessage += 'Commands: \n\n';
        this.displayElement.textContent = commandsMessage;
        var commandLink = function (key, command, name){
            var linkElement = document.createElement('a');
            linkElement.textContent = key+'- '+name;
            linkElement.setAttribute('class', 'control');
            linkElement.addEventListener('click', function (){
                client.drivers.gameplay.command(command, {'key': key});
            }.bind(this));
            this.displayElement.appendChild(linkElement);
            this.displayElement.appendChild(document.createElement('br'));
        }.bind(this);
        commandLink("c", COMMAND_DROP, 'Close Door');
        commandLink("d", COMMAND_DROP, 'Drop Item');
        commandLink("e", COMMAND_EQUIP, 'Equip Item');
        commandLink("f", COMMAND_FIRE, 'Fire Weapon');
        commandLink("F", COMMAND_THROW, 'Throw Item');
        commandLink("g", COMMAND_GET, 'Get Item');
        commandLink("l", COMMAND_LOOK, 'Look');
        commandLink("t", COMMAND_UNEQUIP, 'Take Off Item');
        commandLink("u", COMMAND_USE, 'Use Item');
        commandLink("<", COMMAND_STAIRS, 'Descend Stairs');
        commandLink(">", COMMAND_STAIRS, 'Ascend Stairs');
        commandLink("?", COMMAND_HELP, 'Help');
        var escMessage = document.createElement('a');
        escMessage.setAttribute('class', 'control');
        escMessage.textContent = '\n\nESC - Cancel';
        escMessage.addEventListener('click', (function(){
            this.command(CANCEL, {key: 'Esc'});
        }).bind(this));
        this.displayElement.appendChild(escMessage);
    }},
    draw: {value: function (){
        /**
            This function redraws the statusMenu and places it in the
                document for display to the user.
            It does not return anything.
         **/
    }},
    display: {value: function (){
        /**
            This function displays the statusMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        this.draw();
        menu.swap(this.displayElement);
        menu.focus(this);
        return true;
    }},
    command: {value: function (which, options){
        // TODO: Document.
        return false;
    }}
});
var infoMenu = Object.create(driver, {
    /**
        The infoMenu is used by the menuing system to display blocks of
        text to the player.
        It is not a prototype, and should not be instanced.
     **/
    oldMessages: {value: undefined, writable: true},
    pendingMessages: {value: undefined, writable: true},
    displayElement: {value: undefined, writable: true},
    messageElement: {value: undefined, writable: true},
    messageIndex: {value: undefined, writable: true},
    setup: {value: function (){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display the info.
            It does not return anything.
         **/
        this.messageIndex = 0;
        this.oldMessages = [];
        this.displayElement = document.createElement('span');
        //
        this.previousElement = document.createElement('a');
        this.previousElement.textContent = '[ - Older Message';
        this.previousElement.setAttribute('class', 'control');
        this.previousElement.addEventListener('click', (function(){
            this.command(null, {key: '['});
        }).bind(this));
        this.displayElement.appendChild(this.previousElement);
        this.displayElement.appendChild(document.createElement('br'));
        //
        this.messageElement = document.createElement('div');
        this.messageElement.style.height = (displaySize - 6)+'em';
        this.displayElement.appendChild(this.messageElement);
        //
        this.displayElement.appendChild(document.createElement('br'));
        this.nextElement = document.createElement('a');
        this.nextElement.setAttribute('class', 'control');
        this.nextElement.textContent = '] - Newer Message';
        this.nextElement.addEventListener('click', (function(){
            this.command(null, {key: ']'});
        }).bind(this));
        this.displayElement.appendChild(this.nextElement);
    }},
    stackMessage: {value: function (message){
        /**
         *  Used to display a new message. It also adds the message to the
         *      old messages list so it can be recalled later.
         *  It does not return anything.
         **/
        this.oldMessages.unshift(message);
        this.draw(message);
        this.messageIndex = 0;
    }},
    advanceMessage: {value: function (direction){
        /**
         *  Used to cycle through and display old messages.
         *  It does not return anything.
         **/
        this.messageIndex -= direction;
        this.messageIndex = Math.max(0, Math.min(this.oldMessages.length-1, this.messageIndex));
        var indexedMessage = this.oldMessages[this.messageIndex];
        if(!indexedMessage){ return;}
        this.draw(indexedMessage);
    }},
    draw: {value: function (message){
        /**
            This function redraws the infoMenu and places it in the
                document for display to the user.
            It does not return anything.
         **/
        var displayNext = false;
        var displayPrevious = false;
        if(!this.pendingMessages || !this.pendingMessages.length){
            if(this.messageIndex > 0){ displayNext = true;}
            if(this.messageIndex < this.oldMessages.length-1){
                displayPrevious = true;
            }
        }
        if(displayNext){
            //this.nextElement.style.visibility = "visible";
            this.nextElement.textContent = '] - Newer Message';
        } else {
            //this.nextElement.style.visibility = "hidden";
            this.nextElement.textContent = '] - Status';
        }
        if(displayPrevious){ this.previousElement.style.visibility = "visible";}
        else { this.previousElement.style.visibility = "hidden";}
        //this.messageElement.textContent = message;
        var messageLines = message.split('\n');
        var oldMsgBlock = this.messageBlock;
        this.messageBlock = document.createElement('span');
        for(var msgIndex = 0; msgIndex < messageLines.length; msgIndex++){
            var indexedMsg = messageLines[msgIndex];
            var msgLineE = document.createElement('span');
            msgLineE.textContent = indexedMsg;
            this.messageBlock.appendChild(msgLineE);
            this.messageBlock.appendChild(document.createElement('br'));
        }
        if(oldMsgBlock){
            this.messageElement.replaceChild(this.messageBlock, oldMsgBlock);
        } else{
            this.messageElement.appendChild(this.messageBlock);
        }
        /*
            Display the newDisplay element in the document, removing the old
                display if necessary.
        */
        this.display();
    }},
    display: {value: function (){
        /**
            This function displays the infoMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        menu.swap(this.displayElement);
        menu.focus(this);
        return true;
    }},
    command: {value: function (which, options){
        // TODO: Document.
        if(options){
            switch(options.key){
                case '[':
                    this.advanceMessage(-1);
                    return true;
                case ']':
                    var oldPage = this.messageIndex;
                    this.advanceMessage(1);
                    if(this.messageIndex == oldPage){
                        this.command(null, {key: ' '});
                    }
                    return true;
                default:
                    if(this.pendingMessages && this.pendingMessages.length){
                        var nextMessage = this.pendingMessages.shift();
                        this.stackMessage(nextMessage);
                    } else{
                        menu.status();
                        return false;
                    }
            }
        }
        if(which >= 0 && which <= 15){
            return false;
        }
        return true;
    }},
    blurred: {value: function (){
        // TODO: Document.
        this.messageIndex = 0;
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
    displayElement: {value: undefined, writable: true},
    statusTextElement: {value: undefined, writable: true},
    helpElement: {value: undefined, writable: true},
    setup: {value: function (){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display the status.
            It does not return anything.
         **/
        this.displayElement = document.createElement('pre');
        this.helpElement = document.createElement('a');
        this.helpElement.textContent = '? - Commands / Help';
        this.helpElement.setAttribute('class', 'control');
        this.helpElement.addEventListener('click', function (){
            this.command(COMMAND_HELP, {key: '?'});
        }.bind(this));
    }},
    draw: {value: function (){
        /**
            This function redraws the statusMenu and places it in the
                document for display to the user.
            It does not return anything.
         **/
        if(client.drivers.gameplay.dead){
            var gameOverText = '\n\n\n\n\n\n\n';
            gameOverText += '     Game Over     \n\n';
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
            gameOverText += '     '+scoreText+'     \n\n\n';
            this.displayElement.textContent = gameOverText;
            var resetLink = document.createElement('a');
            this.displayElement.appendChild(resetLink);
            resetLink.setAttribute('class', 'control');
            resetLink.textContent = '   Esc- Continue   ';
            resetLink.addEventListener('click', function (){
                client.focus(client.drivers.title);
            });
            return;
        }
        // Get values for display from memory.
        var character = client.drivers.gameplay.memory.character;
        var name = character.name;
        var hp = character.hp;
        //var mp = client.drivers.gameplay.memory.character.mp;
        var maxHp = character.maxHp;
        //var maxMp = client.drivers.gameplay.memory.character.maxMp;
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
        var statusText = '';
        statusText += 'Status: \n';
        statusText += '-------------------\n\n';
        statusText += 'Name : '+name+'\n';
        statusText += 'Class: Goblin\n';
        statusText += 'Level: '+level+' /'+Math.floor(experience)+'\n';
        statusText += 'HP   : '+hp+' /'+maxHp+'\n\n';
        //statusText += 'Exp  : '+Math.floor(experience)+'\n\n';
        statusText += 'Vitality: '+((vitality < 10)? ' ' : '')+vitality+'\n';
        statusText += 'Strength: '+((strength < 10)? ' ' : '')+strength+'\n';
        statusText += 'Wisdom  : '+((wisdom   < 10)? ' ' : '')+wisdom  +'\n';
        statusText += 'Charisma: '+((charisma < 10)? ' ' : '')+charisma+'\n';
        statusText += '\n';
        // TODO: Display actual equipped items.
        statusText += eWeapon? ('Hand: '+eWeapon.name+'\n') : '\n';
        statusText += eShield? ('Hand: '+eShield.name+'\n') : '\n';
        statusText += eArmor ? ('Body: '+eArmor.name +'\n') : '\n';
        statusText += eHelmet? ('Head: '+eHelmet.name+'\n') : '\n';
        statusText += '\n';
        this.displayElement.textContent = statusText;
        this.displayElement.appendChild(this.helpElement);
    }},
    display: {value: function (){
        /**
            This function displays the statusMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        this.draw();
        menu.swap(this.displayElement);
        menu.focus(this);
        return true;
    }},
    command: {value: function (which, options){
        // TODO: Document.
        if(options && options.key){
            switch(options.key){
                case '[':
                    infoMenu.advanceMessage(0);
                    return true;
                case '?':
                    menu.help();
                    return true;
            }
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
    currentDisplay: {value: undefined, writable: true},
    setup: {value: function (){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display info.
            It does not return anything.
         **/
    }},
    draw: {value: function (title, options, callback, page){
        /**
            This function redraws the optionsMenu and places it in the
                document for display to the user.
            It does not return anything.
         **/
        // Setup defaults for unpassed options.
        this.actionTitle    = (title    !== undefined)? title    : this.actionTitle;
        this.actionOptions  = (options  !== undefined)? options  : this.actionOptions;
        this.actionCallback = (callback !== undefined)? callback : this.actionCallback;
        this.optionsPage    = (page     !== undefined)? page     : (this.optionsPage || 0);
        // Create a new display element, and begin to fill it with content.
        var newDisplay = document.createElement('span');
        // Add the title display.
        var titleElement = document.createElement('span');
        titleElement.textContent = this.actionTitle;
        newDisplay.appendChild(titleElement);
        newDisplay.appendChild(document.createElement('br'));
        /*
            If there are options, then populate the newDisplay element with
                option links, and possibly page up and page down links.
            Otherwise, add a message saying it is empty.
            Add the cancel / escape link in either case.
        */
        var optionsContainer = document.createElement('div');
        optionsContainer.style.height = (this.optionsDisplayMax+3)+'em';
        newDisplay.appendChild(optionsContainer);
        if(this.actionOptions && this.actionOptions.length){ // Populate.
            titleElement.textContent += ':';
            var pagedOffset = this.optionsPage*this.optionsDisplayMax;
            var pagedLength = this.actionOptions.length - pagedOffset;
            var displayMax = Math.min(this.optionsDisplayMax, pagedLength);
            optionsContainer.appendChild(document.createElement('br'));
            // Add Page Up link if needed.
            if(this.optionsPage > 0){
                var pageUpMessage = document.createElement('a');
                pageUpMessage.setAttribute('class', 'control');
                pageUpMessage.textContent = ' [- Page Up';
                pageUpMessage.addEventListener('click', (function(){
                    this.command(null, {key: ']'});
                }).bind(this));
                optionsContainer.appendChild(pageUpMessage);
            }
            // Create the options links.
            var self = this;
            var optionLinkFunction = function (){
                self.command(null, {key: this._characterIndex});
            };
            for(var displayIndex = 0; displayIndex < displayMax; displayIndex++){
                var indexedOption = this.actionOptions[displayIndex+pagedOffset];
                var alphabet = 'abcdefghijklmnopqrstuvwxyz';
                var indexCharacter = alphabet.charAt(displayIndex);
                var optionElement = document.createElement('a');
                optionElement._characterIndex = indexCharacter;
                optionElement.addEventListener('click', optionLinkFunction);
                var indexElement = document.createElement('span');
                indexElement.textContent = ' '+indexCharacter+'- ';
                indexElement.setAttribute('class', 'control');
                optionElement.appendChild(indexElement);
                var nameElement = document.createElement('span');
                nameElement.textContent = indexedOption;
                optionElement.appendChild(nameElement);
                optionsContainer.appendChild(document.createElement('br'));
                optionsContainer.appendChild(optionElement);
            }
            // Add the Page Down Link if needed.
            var maxPage = Math.floor((this.actionOptions.length-1)/this.optionsDisplayMax);
            if(this.optionsPage < maxPage){
                var pageDownMessage = document.createElement('a');
                pageDownMessage.textContent = ' ]- Page Down';
                pageDownMessage.setAttribute('class', 'control');
                pageDownMessage.addEventListener('click', (function(){
                    this.command(null, {key: '['});
                }).bind(this));
                optionsContainer.appendChild(document.createElement('br'));
                optionsContainer.appendChild(pageDownMessage);
            }
        } else{ // Display the "empty" message.
            optionsContainer.appendChild(document.createElement('br'));
            var emptyMessage = document.createElement('span');
            emptyMessage.textContent = '(empty)';
            optionsContainer.appendChild(emptyMessage);
        }
        // Add the Cancel / Escape link.
        newDisplay.appendChild(document.createElement('br'));
        var escMessage = document.createElement('a');
        escMessage.setAttribute('class', 'control');
        escMessage.textContent = 'ESC - Cancel';
        escMessage.addEventListener('click', (function(){
            this.command(CANCEL, {key: 'Esc'});
        }).bind(this));
        newDisplay.appendChild(escMessage);
        /*
            Display the newDisplay element in the document, removing the old
                display if necessary.
        */
        this.currentDisplay = newDisplay;
        this.display();
    }},
    display: {value: function (){
        /**
            This function displays the optionsMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        menu.swap(this.currentDisplay);
        menu.focus(this);
        return true;
    }},
    command: {value: function (which, options){
        // TODO: Document.
        if(options && options.key){
            switch(options.key){
                case 'Esc': case 'Escape':
                    menu.status();
                    return true;
                case '[':
                    this.optionsPage = Math.max(0, this.optionsPage-1);
                    this.draw(this.actionTitle, this.actionOptions, this.actionCallback, this.optionsPage);
                    return true;
                case ']':
                    if(!this.actionOptions){ return true;}
                    var maxPage = Math.floor((this.actionOptions.length-1)/this.optionsDisplayMax);
                    this.optionsPage = Math.min(maxPage, this.optionsPage+1);
                    this.draw(this.actionTitle, this.actionOptions, this.actionCallback, this.optionsPage);
                    return true;
                default:
                    var selectionIndex = Math.min(this.optionsDisplayMax, characterIndex(options.key));
                    selectionIndex += this.optionsPage*this.optionsDisplayMax;
                    if(selectionIndex != -1 && selectionIndex < this.actionOptions.length){
                        this.select(selectionIndex);
                        return true;
                    }
            }
        }
        if(which >= 0 && which <= 15){
            return false;
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
    displayElement: {value: undefined, writable: true},
    titleElement: {value: undefined, writable: true},
    setup: {value: function (){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display the direction
                prompt.
            It does not return anything.
         **/
        this.displayElement = document.createElement('span');
        //
        this.displayElement.appendChild(document.createElement('br'));
        this.displayElement.appendChild(document.createElement('br'));
        this.displayElement.appendChild(document.createElement('br'));
        this.titleElement = document.createElement('div');
        this.titleElement.textContent = 'Input a direction:';
        this.displayElement.appendChild(this.titleElement);
        //
        this.messageElement = document.createElement('div');
        this.messageElement.style.height = (displaySize - 8)+'em';
        this.displayElement.appendChild(this.messageElement);
        //
        this.displayElement.appendChild(document.createElement('br'));
        this.cancelElement = document.createElement('a');
        this.cancelElement.setAttribute('class', 'control');
        this.cancelElement.textContent = 'ESC - Cancel';
        this.cancelElement.addEventListener('click', (function(){
            this.command(CANCEL, {key: 'Escape'});
        }).bind(this));
        this.displayElement.appendChild(this.cancelElement);
    }},
    draw: {value: function (message, callback){
        /**
            This function redraws the infoMenu and places it in the
                document for display to the user.
            It does not return anything.
         **/
        this.directionCallback = callback;
        this.titleElement.textContent = message || 'Input a direction:';
        this.display();
    }},
    display: {value: function (){
        /**
            This function displays the infoMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        menu.swap(this.displayElement);
        menu.focus(this);
        return true;
    }},
    command: {value: function (which, options){
        // TODO: Document.
        switch(which){
            case CANCEL:
                menu.status();
                break;
            case NORTH: case NORTHWEST: case WEST: case SOUTHWEST:
            case SOUTH: case SOUTHEAST: case EAST: case NORTHEAST:
                var callbackStorage = this.directionCallback;
                this.directionCallback = undefined;
                callbackStorage(which);
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