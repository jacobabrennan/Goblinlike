

/*==============================================================================

    The gameplay driver is single point of contact between the game and the
    player once the game is running. It collects all input from the player, via
    keyboard, touch, and mouse, and displays the game state via a map and a
    menuing system.

    It is not a prototype, and should not be instanced.

==============================================================================*/

client.drivers.gameplay = Object.create(driver, {
    drivers: {value: {}, writable: true},
    activeTurn: {value: false, writable: true},
    dead: {value: false, writable: true},
    setup: {value: function (configuration){
        // TODO: Document.
        this.drivers.map.setup(configuration);
        this.drivers.menu.setup(configuration);
        /*
        for(var I = 0; I < 32; I++){
            var prototype = itemLibrary.getItemByWeight(randomInterval(1,10));
            var newItem = Object.instantiate(prototype);
            //while(!newItem.place(randomInterval(0,31),randomInterval(0,31), G.id)){};
            this.hero.gainItem(newItem);
        }
        this.hero.update('inventory');
        */
    }},
    focused: {value: function (options){
        client.skin.registerPanel(this.drivers.map.displayPane);
        client.skin.registerPanel(this.drivers.menu.displayPane, true);
        this.focus(this.drivers.menu);
    }},
    newGame: {value: function (gameData){
        this.dead = false;
        this.memory.sense(gameData);
    }},
    gameOver: {value: function (deathData){
        this.dead = true;
        this.takeTurn(deathData);
    }},
    command: {value: function (command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        if(this.dead){
            return true;
        }
        if(!this.activeTurn){
            console.log('No can do: '+this.activeTurn);
            return true;
        }
        if(command >= 0 && command <= 16){
            this.commandMove(command);
            return true;
        }
        switch(command){
            case COMMAND_HELP   : this.drivers.menu.help(); break;
            case COMMAND_LEADERSHIP: this.commandLeadership(); break;
            case COMMAND_WAIT   : this.commandWait(   ); break;
            case COMMAND_GET    : this.commandGet(    ); break;
            case COMMAND_EQUIP  : this.commandEquip(  ); break;
            case COMMAND_UNEQUIP: this.commandUnequip(); break;
            case COMMAND_FIRE   : this.commandFire(   ); break;
            case COMMAND_STAIRS : this.commandStairs( ); break;
            case COMMAND_THROW  : this.commandThrow(  ); break;
            case COMMAND_DROP   : this.commandDrop(   ); break;
            case COMMAND_USE    : this.commandUse(    ); break;
            case COMMAND_LOOK   : this.commandLook(   ); break;
            case COMMAND_CLOSE  : this.commandClose(  ); break;
            case COMMAND_CAMP   : this.commandCamp(   ); break;
            case COMMAND_LEAD_RUN: this.commandLead({order: COMMAND_LEAD_RUN}); break;
            case COMMAND_LEAD_ATTACK: this.commandLead({order: COMMAND_LEAD_ATTACK}); break;
        }
        return false;
    }},
    display: {value: function (options){
        // TODO: Document.
        this.drivers.map.display({
            level: this.memory.getDisplayLevel(),
            x: this.memory.character.x,
            y: this.memory.character.y,
            currentTime: this.memory.currentTime
        });
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        //this.drivers.menu.display();
        return false;
    }},
    takeTurn: {value: function (turnData){
        // TODO: Document.
        if(!this.dead){
            this.activeTurn = true;
        }
        var characterData = turnData.characterData;
        this.memory.updateSelf(characterData);
        var sensoryData = turnData.sensoryData;
        this.memory.sense(sensoryData);
        var messages = turnData.messageData;
        if(messages && messages.length){
            this.drivers.menu.info(messages);
        }
        this.display();
    }},
    target: {value: function (targetClass, range, callback){
        /**
            This function provides the interface for the user to skills, items,
                and other actions. It can select an appropriate target
                automatically, present a list of suitable targets for the
                player to select from, or prompt the player to input a
                direction. Its behavior depends on the value of targetClass,
                which contains several bit flags as defined with the TARGET_
                prefix in the environment file.
            It will result in a call to the provided callback with an array of
                selected targets (possibly of length 0).
            It does not return a value.
         **/
        var targetData = {
            target: undefined,
            targets: undefined,
            direction: undefined
        };
        var autoSelect = false;
        var candidates = [];
        // If targetClass contains only TARGET_SELF, then target self and return.
        if(targetClass == TARGET_SELF){
            autoSelect = true;
            targetData.target = this.memory.character;
            callback(targetData);
            return;
        // If targetClass contains DIRECTION, then prompt input of direction.
        } else if(targetClass & TARGET_DIRECTION){
            this.drivers.menu.directionSelect('Input a direction:', function (direction){
                targetData.direction = direction;
                callback(targetData);
            });
            return;
        } else{
        // Compile list of all targets in range or view, depending on presense of RANGE.
            if(range == RANGE_VIEW){
                range = this.memory.character.viewRange;
            }
            var posX = this.memory.character.x;
            var posY = this.memory.character.y;
            var viewObjects;
            if(targetClass & TARGET_RANGE){
                viewObjects = this.memory.getRange(posX, posY, range);
            } else{
                viewObjects = this.memory.getView(posX, posY, range);
            }
            viewObjects.forEach(function (candidate){
        // If targetClass doesn't contain SELF, then remove self from list.
                if(!(targetClass & TARGET_SELF)){
                    if(candidate.id == this.memory.character.id){
                        return;
                    }
                }
                switch(candidate.type){
                    case TYPE_ACTOR:
        // If targetClass doesn't contain ENEMY, then filter out all enemies.
                        if(
                            !(targetClass & TARGET_ENEMY) &&
                            !(candidate.faction & this.memory.character.faction)
                        ){
                            return;
                        }
        // If targetClass doesn't contain FRIEND, then filter out all enemies.
                        if(
                            !(targetClass & TARGET_FRIEND) &&
                            (candidate.faction == this.memory.character.faction)
                        ){
                            return;
                        }
                        break;
        // If targetClass doesn't contain FURNITURE, then filter out all furniture.
                    // TODO: Targeting of items and furniture.
                    case TYPE_TRAP:
                    case TYPE_ITEM:
                        return;
                        //break;
                }
                candidates.push(candidate);
            }, this);
        }
        // If targetClass contains ALL, then select all candidates.
        if(targetClass & TARGET_ALL){
            autoSelect = true;
        }
        // If targeting requires a user choice, then display targeting options.
        if(!autoSelect){
            var candidateNames = [];
            for(var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++){
                var indexedCandidate = candidates[candidateIndex];
                candidateNames[candidateIndex] = indexedCandidate.name;
            }
            this.drivers.menu.options('Select Target', candidateNames, function (targetName, targetIndex){
                targetData.target = candidates[targetIndex];
                callback(targetData);
            });
        } else{
            targetData.targets = candidates;
            callback(targetData);
        }
    }}
});


// ==== Player Commands ===================================================== //

client.drivers.gameplay.commandMove = function (direction){
    this.activeTurn = false;
    this.drivers.menu.status();
    if(direction === 0){
        client.networking.sendMessage(COMMAND_WAIT, {});
    } else{
        client.networking.sendMessage(COMMAND_MOVE, {direction: direction});
    }
};
client.drivers.gameplay.commandWait = function (direction){
    this.activeTurn = false;
    this.drivers.menu.status();
    client.networking.sendMessage(COMMAND_WAIT, {});
};
client.drivers.gameplay.commandClose = function (){
    /*
        Innitiate an CLOSE action (to close a door). Prompt for direction.
        This does not return anything.
    */
    var self = this;
    this.target(TARGET_DIRECTION, undefined, function (targetData){
        client.networking.sendMessage(COMMAND_CLOSE, {
            direction: targetData.direction
        });
    });
};
client.drivers.gameplay.commandDrop = function (){
    /*
        Innitiate a drop action. Display the hero's inventory list
            and prompt for a choice of item to drop.
    */
    // Compile array of item names for display.
    var items = this.memory.character.inventory;
    var itemNames = [];
    items.forEach(function (thing){
        if(thing.type == TYPE_ITEM){
            itemNames.push(thing.name);
        }
    }, this);
    // Create a function to call when a selection has been made.
    var self = this;
    var optionsCallback = function (selectedName, selectionIndex){
        var selectedItem = items[selectionIndex];
        if(selectedItem.name != selectedName){
            console.log('Problem: '+selectedName+' != '+selectedItem.name);
        }
        self.activeTurn = false;
        client.networking.sendMessage(COMMAND_DROP, {
            id: selectedItem.id
        });
    };
    // Display options to player.
    this.drivers.menu.options('Drop Item', itemNames, optionsCallback);
};
client.drivers.gameplay.commandEquip = function (){
    /*
        Innitiate an EQUIP action. Compile and display a list of
            items in the player's inventory that they can equip.
    */
    // Compile array of items, and array of item names for display.
    var invNames = [];
    var invEquipment = [];
    if(this.memory.character.inventory){
        this.memory.character.inventory.forEach(function (invItem){
            if(invItem.placement){
                invNames.push(invItem.name);
                invEquipment.push(invItem);
            }
        }, this);
    }
    // Create a function to call when a selection has been made.
    var self = this;
    var invCallback = function (selectedName, selectedIndex){
        var selectedItem = invEquipment[selectedIndex];
        if(selectedItem.name != selectedName){
            console.log('Problem: '+selectedName+' != '+selectedItem.name);
        }
        self.activeTurn = false;
        client.networking.sendMessage(COMMAND_EQUIP, {
            itemId: selectedItem.id
        });
    };
    // Display Options to player.
    this.drivers.menu.options('Equip which?', invNames, invCallback);
};
client.drivers.gameplay.commandUnequip = function (){
    /*
        Innitiate an UNEQUIP action. Compile and display a list of items
            currently equipped.
        This does not return anything.
    */
    // Compile lists of items and names to be passed to the options menu.
    var equipNames = [];
    var equipItems = [];
    if(this.memory.character.equipment){
        for(var placement in this.memory.character.equipment){
            if(this.memory.character.equipment.hasOwnProperty(placement)){
                var equipItem = this.memory.character.equipment[placement];
                if(!equipItem){
                    delete this.memory.character.equipment[placement];
                    continue;
                }
                equipNames.push(equipItem.name);
                equipItems.push(equipItem);
            }
        }
    }
    // Create options menu callback.
    var self = this;
    var equipCallback = function (selectedName, selectedIndex){
        // After user has selected an item:
        // Send an unequip message to the server.
        var selectedItem = equipItems[selectedIndex];
        if(selectedItem.name != selectedName){
            console.log('Problem: '+selectedName+' != '+selectedItem.name);
        }
        client.networking.sendMessage(COMMAND_UNEQUIP, {
            itemId: selectedItem.id
        });
    };
    // Send Options to player for selection.
    this.drivers.menu.options('Take off which?', equipNames, equipCallback);
};
client.drivers.gameplay.commandFire = function (){
    /*
        Innitiate an FIRE action (to fire a weapon). Prompt for direction.
        This does not return anything.
    */
    var self = this;
    this.target(TARGET_DIRECTION, undefined, function (targetData){
        client.networking.sendMessage(COMMAND_FIRE, {
            direction: targetData.direction
        });
    });
};
client.drivers.gameplay.commandGet = function (){
    /*
        Innitiate a get action. Compile and display a list of items
            within reach of the player.
    */
    // Compile array of items, and array of items names for display.
    var items = [];
    var itemNames = [];
    var containables = this.memory.getRange(
        this.memory.character.x,
        this.memory.character.y,
        1
    );
    containables.forEach(function (thing){
        if(thing.type == TYPE_ITEM){
            items.push(thing);
            itemNames.push(thing.name);
        }
    }, this);
    // Create a function to call when a selection has been made.
    var self = this;
    var optionsCallback = function (selectedName, selectionIndex){
        var selectedItem = items[selectionIndex];
        if(selectedItem.name != selectedName){
            console.log('Problem: '+selectedName+' != '+selectedItem.name);
        }
        self.activeTurn = false;client.networking.sendMessage(COMMAND_GET, {
            id: selectedItem.id
        });
    };
    // Display Options to player.
    this.drivers.menu.options('Get Item', itemNames, optionsCallback);
};
client.drivers.gameplay.commandLook = function (){
    /*
        Innitiate a LOOK action. Compile and display a list of
            things of interest (containables) in the player's view.
    */
    // Get view from memory.
    var view = this.memory.getView(
        this.memory.character.x,
        this.memory.character.y,
        this.memory.character.viewRange
    );
    // Filter out duplicate ids (composite objects, like worms).
    var uniqueIds = [];
    // Compile list of names of things in view.
    var viewNames = [];
    var viewEntities = [];
    view.forEach(function (content, viewIndex){
        var cId = content.id;
        var unique = (uniqueIds.indexOf(cId) == -1);
        if(!unique){ return;}
        uniqueIds.push(cId);
        viewNames.push(content.name);
        viewEntities.push(content);
    }, this);
    // Create callback function for when the player has made a selection.
    var self = this;
    var optionsCallback = function (selectedName, selectedIndex){
        var selectedContent = viewEntities[selectedIndex];
        var recallInfo = self.memory.recall(selectedContent);
        // TODO: Implement this.
        this.drivers.menu.info(
            'You see the '+recallInfo.name+'. (Unfinished)'
        );
    };
    // Display options to player.
    this.drivers.menu.options('Look at what?', viewNames, optionsCallback);
};
client.drivers.gameplay.commandLead = function (options){
    this.activeTurn = false;
    client.networking.sendMessage(COMMAND_LEADERSHIP, options);
};
client.drivers.gameplay.commandLeadership = function (options){
    // Compile a list of names to be passed to the options menu.
    var leadershipNames    = ['Attack!'          , 'Run!'          ];
    var leadershipCommands = [COMMAND_LEAD_ATTACK, COMMAND_LEAD_RUN];
    // Create a function to be called when player has selected an option.
    var self = this;
    var leadershipCallback = function (selectedName, selectedIndex){
        // Once the player has selected:
        self.activeTurn = false;
        var theCommand = leadershipCommands[selectedIndex];
        client.networking.sendMessage(COMMAND_LEADERSHIP, {order: theCommand});
    };
    // Send the item options to the player.
    this.drivers.menu.options(
        'Lead the Tribe',
        leadershipNames,
        leadershipCallback
    );
};
client.drivers.gameplay.commandCamp = function (){
    /*
        Innitiate a CAMP stairs action. Directs the hero to rest and heal.
        This does not return anything.
    */
    self.activeTurn = false;
    client.networking.sendMessage(COMMAND_CAMP, {});
};
client.drivers.gameplay.commandStairs = function (){
    /*
        Innitiate a climb stairs action. Directs the hero to climb stairs.
        This does not return anything.
    */
    self.activeTurn = false;
    client.networking.sendMessage(COMMAND_STAIRS, {});
};
client.drivers.gameplay.commandThrow = function (){
    /*
        Innitiate a THROW action (to throw an item). Prompt for item from
        inventory, then prompt for direction.
        
        This does not return anything.
    */
    // Compile a list of names to be passed to the options menu.
    var inventoryNames = [];
    if(this.memory.character.inventory){
        this.memory.character.inventory.forEach(function (item, index){
            inventoryNames[index] = item.name;
        }, this);
    }
    // Create a function to be called when player has selected an option.
    var self = this;
    var inventoryCallback = function (selectedName, selectedIndex){
        // Once the player has selected an item:
        // Ensure that the player has selected a valid item.
        var selectedItem = self.memory.character.inventory[selectedIndex];
        if(selectedItem.name != selectedName){
            console.log('Problem: '+selectedName+' != '+selectedItem.name);
        }
        // Create a function to be called when the player selects a direction.
        var directionCallback = function (targetData){
            var throwData = {
                itemId: selectedItem.id,
                direction: targetData.direction
            };
            self.activeTurn = false;
            // Send message to the server to throw the selected item.
            client.networking.sendMessage(COMMAND_THROW, throwData);
        };
        // Prompt player to select a direction.
        self.target(TARGET_DIRECTION, undefined, directionCallback);
    };
    // Send the item options to the player.
    this.drivers.menu.options('Throw Item', inventoryNames, inventoryCallback);
};
client.drivers.gameplay.commandUse = function (){
    /*
        Innitiate a USE action. Compile and display a list of items
            in the player's inventory.
    */
    // Compile an array of the names of items from inventory.
    var inventoryNames = [];
    if(this.memory.character.inventory){
        this.memory.character.inventory.forEach(function (item, index){
            inventoryNames[index] = item.name;
        }, this);
    }
    // Create a callback function for after player has selected and targeted.
    var targetCallback = function (targetData){
        var parsedTargetData = {
            target: undefined,
            targets: undefined,
            direction: targetData.direction
        };
        if(targetData.target){
            parsedTargetData.target = targetData.target.id;
        }
        if(targetData.targets){
            parsedTargetData.targets = [];
            parsedData.targets.forEach(function (target){
                parsedTargetData.push(target.id);
            });
        }
        self.activeTurn = false;
        client.networking.sendMessage(COMMAND_USE, {
            itemId: theItem.id,
            targetData: parsedTargetData
        });
    };
    // Create a callback function for after the player has selected.
    var self = this;
    var theItem;
    var inventoryCallback = function (selectedName, selectedIndex){
        theItem = self.memory.character.inventory[selectedIndex];
        if(theItem.name != selectedName){
            console.log('Problem: '+selectedName+' != '+theItem.name);
        }
        self.target(theItem.targetClass, theItem.targetRange, targetCallback);
    };
    // Display options to player.
    this.drivers.menu.options('Use Item', inventoryNames, inventoryCallback);
};