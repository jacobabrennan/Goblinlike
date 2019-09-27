

/*==============================================================================

    The following defines and implements a menuing system under one object. This
    menu serves as a focus point for the command of the game by the player, and
    communication to the player from the game.
    
    It is not a prototype, and should not be instanced.

==============================================================================*/

//-- Imports -------------------------------------
import client from './client.js';
import driver from './driver.js';
// To Do: Refactor the following:
import mapManager from '../server/map_manager.js'


//-- Module Constants ----------------------------
const alphabet = 'abcdefghijklmnopqrstuvwxyz';

//------------------------------------------------
const menu = Object.extend(driver, {
    displayWidth: displaySize,
    displayHeight: displaySize,
    defaultMenu: undefined,
    showDefault(){
        if(this.defaultShowing){ return;}
        if(this.focus == statusMenu || this.focus == commandsMenu){ return;}
        else{
            var defaultMenu = this.defaultMenu || commandsMenu;
            this.focus(defaultMenu);
            defaultMenu.display();
        }
    },
    setup(configuration){
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
    },
    focused(){
        this.showDefault();
    },
    /*
    display(){
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
    },*/
    blank(){
        this.lastDraw = client.drivers.gameplay.memory.currentTime;
        client.skin.fillRect(0, 0, displaySize, displaySize, '#000');
        client.skin.clearCommands();
    },
    commands(){
        /**
            This function displays the help / commands menu to the player.
            It does not return anything.
         **/
        commandsMenu.display();
        this.focus(commandsMenu);
    },
    help(){
        helpMenu.display();
        this.focus(helpMenu);
    },
    description(title, description){
        descriptionMenu.display(title, description);
        this.focus(descriptionMenu);
    },
    info(messages){
        /**
            This function displays an array of messages to the player.
            It does not return anything.
         **/
        if(messages){
            infoMenu.stackMessages(messages);
        }
        this.focus(infoMenu);
        infoMenu.display();
    },
    status(goblinInfo){
        /**
            This function displays the player's hero's status.
            It does not return anything.
         **/
        statusMenu.display(goblinInfo);
        this.focus(statusMenu);
    },
    options(title, options, details, callback){
        /**
            This function displays a menu of options the player can select from.
            The optionsMenu has focus once this function ends.
            It does not return anything.
         **/
        optionsMenu.display({
            title: title,
            options: options,
            details: details,
            callback: callback,
            page: 0
        });
        this.focus(optionsMenu);
    },
    directionSelect: function(message, callback){
        /**
            This function prompts the player to input a direction.
            It does not return anything.
         **/
        directionSelectMenu.display(message, callback);
        focus(directionSelectMenu);
    }
});
client.drivers.gameplay.drivers.menu = menu;
    
    
/*==============================================================================

    The following objects are sub-drivers used by the main menuing system to
    display info to the player and to prompt the player for input.
    
    They are private to the menu system namespace. All interactions with the
    menuing system must go through the main menu's methods, the sub-drivers
    cannot be accessed individually.
    
    They are not prototypes, and should not be instanced.
    
==============================================================================*/

const descriptionMenu = Object.extend(driver, {
    setup(){},
    display(title, description){
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
        client.skin.drawCommand(1, 1, 'Space', 'Done', COMMAND_CANCEL);
        menu.focus(this);
        return true;
    },
    command(command, options){
        // TODO: Document.
        client.drivers.gameplay.drivers.map.display();
        switch(command){
            case COMMAND_PAGEDOWN:
                menu.info();
                return true;
        }
        menu.showDefault();
        return false;
    }
});
const commandsMenu = Object.extend(driver, {
    /**
        The statusMenu is used by the menuing system to display information
            about the character. It is the default display state of the
            menu. It doesn't provide any interaction, except aliases to the
            infoMenu so the player can access old messages more easily.
        It is not a prototype, and should not be instanced.
     **/
    setup(){},
    display(){
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
        client.skin.drawString(1,19,'Arrows or NumberPad', COLOR_INSTRUCTION);
        client.skin.drawString(1,18,'to Move and Attack', COLOR_INSTRUCTION);
        var line = 16;
        commandLink(1, line--, "?", COMMAND_HELP, 'Help');
        //commandLink(1, line--, "A", COMMAND_ATTACK, 'Attack');
        commandLink(1, line--, "C", COMMAND_CLOSE, 'Close Door');
        commandLink(1, line--, "D", COMMAND_DROP, 'Drop Item');
        commandLink(1, line--, "E", COMMAND_EQUIP, 'Equip Item');
        commandLink(1, line--, "W", COMMAND_UNEQUIP, 'Unequip Item');
        commandLink(1, line--, "F", COMMAND_FIRE, 'Fire Bow/Wand');
        commandLink(1, line--, "G", COMMAND_GET, 'Get Item');
        commandLink(1, line--, "R", COMMAND_CAMP, 'Rest (Heal)');
        commandLink(1, line--, "S", COMMAND_STAIRS, 'Use Stairs');
        client.skin.drawString(14, line+1, '>', '#000', '#fc0');
        commandLink(1, line--, "T", COMMAND_THROW, 'Throw Item');
        commandLink(1, line--, "V", COMMAND_USE, 'Use Item');
        commandLink(1, line--, "X", COMMAND_LOOK, 'Examine');
        commandLink(1, 3, "[", COMMAND_PAGEDOWN, 'Show Messages');
        commandLink(1, 1, "Space", COMMAND_CANCEL, 'View Status');
        menu.focus(this);
        return true;
    },
    command(command, options){
        // TODO: Document.
        switch(command){
            case COMMAND_PAGEDOWN:
                menu.info();
                return true;
            case COMMAND_CANCEL:
                menu.defaultMenu = statusMenu;
                menu.status();
                return true;
        }
        return false;
    }
});
const infoMenu = Object.extend(driver, {
    /**
        The infoMenu is used by the menuing system to display blocks of
        text to the player.
        It is not a prototype, and should not be instanced.
    **/
    messages: undefined,
    pendingIndex: undefined,
    pageIndex: undefined,
    pageLength: 13,
    setup(){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display the info.
            It does not return anything.
         **/
        this.messageIndex = 0;
        this.messages = [];
    },
    stackMessages(messages){
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
    },
    advanceMessage(direction){
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
    },
    display(){
        /**
            This function displays the infoMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        menu.blank();
        client.skin.drawCommand(1, 1, 'Space', 'Cancel', COMMAND_CANCEL);
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
    },
    command(command, options){
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
    },
    blurred(){
        // TODO: Document.
        //this.pendingIndex = 0;
        this.pageIndex = 0;
        client.drivers.gameplay.drivers.map.display();
    }
});
const statusMenu = Object.extend(driver, {
    /**
        The statusMenu is used by the menuing system to display information
            about the character. It is the default display state of the
            menu. It doesn't provide any interaction, except aliases to the
            infoMenu so the player can access old messages more easily.
        It is not a prototype, and should not be instanced.
     **/
    setup(){},
    display(goblinInfo){
        /**
            This function displays the statusMenu in the document.
            
            It returns true to signify that drawing should not continue;
        **/
        if(client.drivers.gameplay.won){
            var storage = client.drivers.gameplay.won;
            menu.blank();
            client.focus(client.drivers.ending);
            client.drivers.ending.winData = storage;
            client.display();
            return true;
        }
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
            client.skin.drawCommand(4, 7, 'Space', ' Continue', COMMAND_CANCEL);
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
        client.skin.drawString(1, line--, 'Name : '+name+' ('+character.gender+')');
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
        client.skin.drawString(1, line--, ('Courage : '+((charisma < 10)? ' ' : '')+charisma));
        line--;
        client.skin.drawString(1,  line--, (eWeapon? ('Hand: '+eWeapon.name) : ''));
        client.skin.drawString(1,  line--, (eShield? ('Hand: '+eShield.name) : ''));
        client.skin.drawString(1,  line--, (eArmor ? ('Body: '+eArmor.name ) : ''));
        client.skin.drawString(1,  line--, (eHelmet? ('Head: '+eHelmet.name) : ''));
        if(!goblinInfo){
            client.skin.drawCommand(1, 3, "[", 'Show Messages', COMMAND_PAGEDOWN);
        }
        client.skin.drawCommand(1, 1, 'Space', 'View Commands', COMMAND_HELP);
        return true;
    },
    command(command, options){
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
            case COMMAND_CANCEL:
                menu.defaultMenu = commandsMenu;
                menu.showDefault();
                return true;
        }
        return false;
    }
});
const optionsMenu = Object.extend(driver, {
    /**
        The optionsMenu is used to prompt the player to make a selection
            from several provided options.
        It is not a prototype, and should not be instanced.
     **/
    optionsDisplayMax: displaySize-8,
    actionTitle: undefined,
    actionOptions: undefined,
    optionsPage: undefined,
    actionCallback: undefined,
    setup(){
        /**
            This function is called by menu.setup as soon as the page loads.
            It configures the client to be able to display info.
            It does not return anything.
         **/
    },
    display(options){
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
        this.actionDetails  = options.details;
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
            client.skin.drawString(1, 18, 'Select One', COLOR_INSTRUCTION);
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
                var indexCharacter = alphabet.charAt(displayIndex);
                var selectFunction = optionLinkFunction(indexCharacter);
                client.skin.drawCommand(
                    1, 16-displayIndex,
                    indexCharacter.toUpperCase(),
                    indexedOption,
                    selectFunction
                );
                if(this.actionDetails){
                    let indexedDetail = this.actionDetails[displayIndex];
                    if(!indexedDetail || indexedDetail.id === undefined){ continue;}
                    var identifiedDetail = mapManager.idManager.get(indexedDetail.id);
                    if(!identifiedDetail){ continue;}
                    var ix = identifiedDetail.x - client.drivers.gameplay.memory.character.x;
                    var iy = identifiedDetail.y - client.drivers.gameplay.memory.character.y;
                    var ds = displaySize;
                    client.skin.drawCommand(
                        (ds+((ds-1)/2))+ix, ((ds-1)/2)+iy, // TODO: MAGIC NUMBERS!
                        indexCharacter.toUpperCase(),
                        null,
                        selectFunction
                    );
                }
            }
            // Add the Page Down Link if needed.
            var maxPage = Math.floor((this.actionOptions.length-1)/this.optionsDisplayMax);
            if(this.optionsPage < maxPage){
                client.skin.drawCommand(1, 3, '] Next', null, COMMAND_PAGEUP);
            }
        } else{ // Display the "empty" message.
            client.skin.drawString(1, 15, '(empty)');
        }
        // Add the Cancel / Spape link.
        client.skin.drawCommand(1, 1, 'Space', 'Cancel', COMMAND_CANCEL);
        menu.focus(this);
        return true;
    },
    command(command, options){
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
                    let keyChar = options.key.toLowerCase();
                    const characterIndex = alphabet.indexOf(keyChar);
                    var selectionIndex = Math.min(
                        this.optionsDisplayMax,
                        characterIndex,
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
    },
    select(selectionIndex){
        // TODO: Document.
        var indexedOption = this.actionOptions[selectionIndex];
        this.actionCallback(indexedOption, selectionIndex);
    } 
});
const directionSelectMenu = Object.extend(driver, {
    /**
        The directionSelectMenu is used by the menuing system to prompt the
            player to select a direction. This is used in targeting spells,
            etc.
        It is not a prototype, and should not be instanced.
     **/
    directionCallback: undefined,
    setup(){},
    display(message, callback){
        /**
            This function displays the infoMenu in the document.
            It returns true to signify that drawing should not continue;
         **/
        menu.blank();
        if(callback){ this.directionCallback = callback;}
        client.skin.drawString(1, 16, (message || 'Which direction?'));
        client.skin.drawParagraph(1, 14, 'Use the numberpad, arrows, or click the map to select a direction.', COLOR_INSTRUCTION, null, null, 18);
        client.skin.drawCommand(1, 1, 'Space', 'Cancel', COMMAND_CANCEL);
        menu.focus(this);
        return true;
    },
    command(command, options){
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
    },
    blurred(){
        // TODO: Document.
        this.directionCallback = undefined;
    }
});
const helpMenu = Object.extend(driver, {
    setup(){},
    display(which){
        menu.blank();
        client.skin.clearCommands();
        client.skin.fillRect(0, 0, displaySize*2, displaySize, '#000');
        switch(which){
            default:
                var drawTopic = function (x, y, key, title, id){
                    client.skin.drawCommand(x, y, key, title, function (){
                        helpMenu.display(id);
                    });
                };
                client.skin.drawString(1, 18, 'Help topics:');
                
                client.skin.drawString(1, 15, 'The Basics');
                drawTopic(2, 13, 'A', 'Moving', 'moving');
                drawTopic(2, 12, 'B', 'Combat', 'combat');
                
                client.skin.drawString(1, 10, 'Items & Equipment')
                drawTopic(2,  8, 'C', 'Get Item', 'item_get');
                drawTopic(2,  7, 'D', 'Equip Item', 'item_equip');
                drawTopic(2,  6, 'E', 'Use Item', 'item_use');
                drawTopic(2,  5, 'F', 'Identify item', 'item_id');
                
                client.skin.drawString(20, 15, 'Strategy');
                drawTopic(21, 13, 'G', 'Survive Level One', 'start');
                drawTopic(21, 12, 'H', 'Dealing with Death', 'death');
                drawTopic(21, 11, 'I', 'Winning', 'win');
                break;
            case 'moving':
                var aboutText = 'Goblin-Like uses text instead of graphics. An example map on the right shows a typical room. You play as the green "g", a goblin.';
                var lines = client.skin.drawParagraph(1, 18, aboutText, undefined, undefined, undefined, 28);
                aboutText = "Move your goblin around the map using the arrow keys, the number pad, or by clicking the map. Movement takes place one step at a time. Every step you take makes the enemies move, too.";
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                aboutText = 'Use (S) or (>) to move up or down stairs (stairs are the ">" near the goblin).';
                client.skin.drawParagraph(1,18-(lines), aboutText);
                var mapText = "########";
                mapText    += "#.....b+";
                mapText    += "#.\\....#";
                mapText    += "#¡.....#";
                mapText    += "#...g..#";
                mapText    += "#..>...#";
                mapText    += "#......#";
                mapText    += "#####+##";
                var mapWidth = 8;
                for(var charI = 0; charI < mapText.length; charI++){
                    var indexChar = mapText.charAt(charI);
                    var xPos = charI % mapWidth;
                    var yPos = Math.floor(charI/mapWidth);
                    var charBack = '#111';
                    var charColor = '#fff';
                    switch(indexChar){
                        case '.': charColor = '#444', charBack = '#111'; break;
                        case 'b': charColor = '#888'; break;
                        case 'g': charColor = '#0f0'; break;
                        case '+': charColor = '#fc0'; charBack = '#111'; break;
                        case '#': charBack = '#111'; break;
                        case '>': charColor = '#000'; charBack = '#fc0'; break;
                        case '\\': case '¡': charColor = "#963"; break;
                    }
                    client.skin.drawCharacter(
                        30+xPos, 13+yPos, indexChar, charColor, charBack);
                }
                break;
            case 'combat':
                var aboutText = 'The goblin world is filled with things trying to kill you. The top of the game shows your current health and maximum health. If your current health reaches zero, the game is over. Use the rest(R) command to restore your health.';
                var lines = client.skin.drawParagraph(1, 18, aboutText);
                aboutText = 'Enemies follow you and will attack if they get close. To attack, move your goblin in the direction of the enemy. You will attack with your equipped weapon each time you bump into an enemy.';
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                aboutText = 'You can also attack by throwing items, reading magic scrolls, or firing wands.';
                client.skin.drawParagraph(1,18-(lines), aboutText);
                break;
            case 'item_get':
                var aboutText = 'Each level of the dungeon is filled with random items. The map to the right shows various items around a goblin. All items are the same brown color.';
                var lines = client.skin.drawParagraph(1, 18, aboutText, undefined, undefined, undefined, 28);
                aboutText = 'The get(G) command displays a list of items that are close enough for you to pick up. Select the item you want from the list, and it will be added to your inventory.';
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                aboutText = 'The amount of weight you can carry is limited, so you\'ll need to drop(D) items often.';
                client.skin.drawParagraph(1,18-(lines), aboutText);
                var mapText = "########";
                mapText    += "#....].+";
                mapText    += "#.\\....#";
                mapText    += "#¡.....#";
                mapText    += "#...g..#";
                mapText    += "#......#";
                mapText    += "#.....$#";
                mapText    += "###+####";
                var mapWidth = 8;
                for(var charI = 0; charI < mapText.length; charI++){
                    var indexChar = mapText.charAt(charI);
                    var xPos = charI % mapWidth;
                    var yPos = Math.floor(charI/mapWidth);
                    var charBack = '#111';
                    var charColor = '#fff';
                    switch(indexChar){
                        case '.': charColor = '#444', charBack = '#111'; break;
                        case 'b': charColor = '#888'; break;
                        case 'g': charColor = '#0f0'; break;
                        case '+': charColor = '#fc0'; charBack = '#111'; break;
                        case '#': charBack = '#111'; break;
                        case '>': charColor = '#000'; charBack = '#fc0'; break;
                        case '\\': case '¡': case ']': case '$': charColor = "#963"; break;
                    }
                    client.skin.drawCharacter(
                        30+xPos, 13+yPos, indexChar, charColor, charBack);
                }
                break;
            case 'item_equip':
                var aboutText = 'Weapons and armor must be equipped before you can use them. Use the equip(E) command to display a list of items you can equip.';
                var lines = client.skin.drawParagraph(1, 18, aboutText);
                aboutText = 'Use the unequip(W) command to unequip an item. You should drop(D) weapons and armor you don\'t need.';
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                aboutText = "Your companion goblins also need weapons and armor - and a lot of arrows. If no enemies are nearby and they feel safe (they are close to you) they'll seek out nearby items automatically. Not every goblin can equip every item.";
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                break;
            case 'item_use':
                var aboutText = "The use(V) command lets you use the varied items you'll find. Potions can be quaffed - or thrown(T) - and have many effects. Wands can be fired at enemies. Magic scrolls can be read.";
                var lines = client.skin.drawParagraph(1, 18, aboutText);
                aboutText = "Knowing what items to keep and what items to drop(D) is key to survival. When all hope is lost, run away and throw(T) everything at the enemy.";
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                break;
            case 'item_id':
                var aboutText = "Many items in the dungeon are unknown to the goblins, and will appear with random names. The real name of the item will appear once you've leveled up enough. Goblins with higher wisdom stats can identify items at lower levels.";
                var lines = client.skin.drawParagraph(1, 18, aboutText);
                aboutText = 'Each time you play the game the item names will be shuffled. A healing potion might be a "Red Pot" one game, and a "Fizzy Pot" the next, so be careful what you drink!';
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                break;
            case 'death':
                var aboutText = "In the world of goblins, life is short and death is permanent. Expect to die most times you play, this is normal.";
                var lines = client.skin.drawParagraph(1, 18, aboutText);
                aboutText = "If you want to survive you'll need to be careful, walk slowly, fight one enemy at a time, and always be prepared for what's on the other side of the door. Each map is random, and sometimes all the enemies attack together.";
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                aboutText = "Sometimes the only way to survive is to abandon your companions and run away. Sometimes you need to stay and fight. Learning the difference is the most important skill in the game.";
                lines += client.skin.drawParagraph(1,18-(lines), aboutText);
                break;
            case 'start':
                var aboutText = "Level One is small, so go explore until you find a green goblin or an enemy.";
                var lines = client.skin.drawParagraph(1, 18, aboutText);
                aboutText = "Enemies on level one are either rats, ants, or cave beetles. Ants and rats can be killed easily if there's only one - cave beetles are tougher. Equip(E) or throw(T) rocks if you have to. Run away and rest(R) when your health is low. You can close(C) doors to trap an enemy."
                lines += client.skin.drawParagraph(1, 18-lines, aboutText);
                aboutText = "Each level has a goblin that will join you. The level one goblin has arrows and will shoot the enemies for you. Once you've found them, go to the downward stairs and explore the next level.";
                lines += client.skin.drawParagraph(1, 18-lines, aboutText);
                break;
            case 'win':
                var aboutText = "You won't win the first several times you play, and that's OK. The game is about making hard choices and surviving as long as possible.";
                var lines = client.skin.drawParagraph(1, 18, aboutText);
                aboutText = "Over time you're going to get better. Better at dancing around enemies, better at managing your items, and better at leading your goblin team."
                lines += client.skin.drawParagraph(1, 18-lines, aboutText);
                aboutText = "Pretty soon you'll find yourself at the bottom of the dungeon, facing down the final enemy. When you do, let us know what happens!";
                lines += client.skin.drawParagraph(1, 18-lines, aboutText);
                break;
        }
        client.skin.drawCommand(1,  1, 'Space', 'Back to Game', COMMAND_ENTER);
        menu.focus(this);
        return true;
    },
    command(command, options){
        // TODO: Document.
        if(command == COMMAND_CANCEL){
            client.drivers.gameplay.drivers.map.display();
            menu.showDefault();
            return true;
        }
        switch(options.key){
            case 'a': this.display('moving'); break;
            case 'b': this.display('combat'); break;
            case 'c': this.display('item_get'); break;
            case 'd': this.display('item_equip'); break;
            case 'e': this.display('item_use'); break;
            case 'f': this.display('item_id'); break;
            case 'g': this.display('start'); break;
            case 'h': this.display('death'); break;
            case 'i': this.display('win'); break;
            case 'space':
                client.drivers.gameplay.drivers.map.display();
                menu.showDefault();
        }
        return true;
    }
});
/*var helpMenu = Object.extend(driver, {
    setup(){},
    display(title, description){
        menu.blank();
        client.skin.clearCommands();
        client.skin.fillRect(0, 0, displaySize*2, displaySize, '#000');
        var aboutText = "This is a Roguelike, a genre of games that are known for using letters as graphics. The example map on the right shows:";
        client.skin.drawParagraph(1, 17, aboutText, undefined, undefined, undefined, 27);
        client.skin.drawString(4, 11, "The player, a goblin.");
        client.skin.drawCharacter(2, 11, 'g', '#0f0');
        client.skin.drawString(4, 10, "Walls around a room.");
        client.skin.drawCharacter(2, 10, '#', '#fff', '#111');
        client.skin.drawString(4,  9, "The floor of the room.");
        client.skin.drawCharacter(2,  9, '.', '#444', '#111');
        client.skin.drawString(4,  8, "An enemy Giant Beetle.");
        client.skin.drawCharacter(2,  8, 'b', '#888');
        client.skin.drawString(4,  7, "Stairs to a deeper level.");
        client.skin.drawCharacter(2,  7, '>', '#000', '#fc0');
        client.skin.drawString(4,  6, "Doors to other rooms and halls.");
        client.skin.drawCharacter(2,  6, '+', '#fc0', '#111');
        client.skin.drawString(6,  5, "A Potion and a stack of Arrows.");
        client.skin.drawCharacter(2,  5, '¡ \\', '#963');
        var mapText = "#########";
        mapText    += "#.......#";
        mapText    += "#......b+";
        mapText    += "#.\\.....#";
        mapText    += "#¡......#";
        mapText    += "#...g...#";
        mapText    += "#..>....#";
        mapText    += "#.......#";
        mapText    += "######+##";
        var mapWidth = 9;
        for(var charI = 0; charI < mapText.length; charI++){
            var indexChar = mapText.charAt(charI);
            var xPos = charI % mapWidth;
            var yPos = Math.floor(charI/mapWidth);
            var charBack = '#111';
            var charColor = '#fff';
            switch(indexChar){
                case '.': charColor = '#444', charBack = '#111'; break;
                case 'b': charColor = '#888'; break;
                case 'g': charColor = '#0f0'; break;
                case '+': charColor = '#fc0'; charBack = '#111'; break;
                case '#': charBack = '#111'; break;
                case '>': charColor = '#000'; charBack = '#fc0'; break;
                case '\\': case '¡': charColor = "#963"; break;
            }
            client.skin.drawCharacter(
                30+xPos, 9+yPos, indexChar, charColor, charBack);
        }
        client.skin.drawCommand(1,  1, 'Space', 'Back to Game', COMMAND_ENTER);
        menu.focus(this);
        return true;
    },
    command(command, options){
        // TODO: Document.
        client.drivers.gameplay.drivers.map.display();
        menu.showDefault();
        return false;
    }
});*/
