

/*===========================================================================
 *
 *  This object is a prototype for creating persons directly under the player's
 *      control. These persons will have all the things PCs have which separate
 *      them from enemy mobs or NPCs.
 *  Currently, there should only be one active person per game instance. This
 *      is not currently a multiplayer project.
 *  This is a prototype, and should not be used without first creating an
 *      instance.
 *      
 *===========================================================================*/

//-- Dependencies --------------------------------
import person from './person.js';
import mapManager from './map_manager.js';
import gameManager from './game_manager.js';

//-- Implementaton -------------------------------
const hero = Object.extend(person, {
    // Redefined properties
    character: 'g',
    faction: FACTION_GOBLIN,
    name: 'person',
    color: '#0f0',
    colorNatural: '#0f0',
    // New properties
    updates: undefined,
    messages: undefined,
    inventory: undefined,
    turnActive: false,
    turnCallback: undefined,
    // Redefined Methods
    initializer(options){
        /**
            A standard initializer, used for inheritence and setup.
            The function updates several values so that the player will know
                about them immediately.
            Returns a reference to itself.
         **/
        person.initializer.apply(this, arguments);
        if(options && options.name){
            this.name = options.name;
        }
        this.update('id');
        this.update('name');
        this.update('viewRange');
        this.inventory = [];
        return this;
    },
    die(){
        this.inform('');
        this.inform('You have died.');
        this.inform('');
        this.inform('Press Space to Continue');
        gameManager.gameOver();
    },
    endTurn(){
        /**
            This function must be called whenever the person ends their turn,
                usually by performing an action from the player.
         **/
        this.turnActive = false;
        this.nextTurn += this.turnDelay;
        var callbackTemp = this.turnCallback;
        this.turnCallback = undefined;
        callbackTemp(true);
    },
    move(direction){
        /**
            This function is used to move the object in a specific direction,
                one of:
                    EAST, NORTHEAST, NORTH, NORTHWEST,
                    WEST, SOUTHWEST, SOUTH, SOUTHEAST.
            It returns true if the movement is successful, and false otherwise.
         **/
        var success = person.move.apply(this, arguments);
        /*if(Math.random() < 1/15){
            this.sound('footsteps', 15, this);
        }*/
        this.getViewContents().forEach(function (theContent){
            if(typeof theContent.activate == 'function'){
                theContent.activate();
            }
        }, this);
        var currentLevel = mapManager.getLevel(this.levelId);
        var contents = currentLevel.getRangeActors(this.x, this.y, 8);
        contents.forEach(function (content, index){
            content.hear('footsteps', 15, this);
        }, this);
        return success;
    },
    // New Methods
    update(which){
        /**
            This function is used to maintain a list of all aspects of the person
                which have changed since their last turn. Items in this list
                will be sent to the player's client, possibly over a network,
                at the start of their next turn.
            It does not return anything.
         **/
        if(!this.updates){
            this.updates = [];
        }
        if(this.updates.indexOf(which) == -1){
            this.updates.push(which);
        }
    },
    packageUpdates(){
        /**
            This function creates a data package containing information about
                aspects of the person that have changed since the person's last
                turn.
            It return said package. See following comments for structure.
         **/
        var updatePackage = person.packageUpdates.apply(this, arguments);
        if(!updatePackage){
            updatePackage = {};
        }
        if(!this.updates){
            return updatePackage;
        }
        this.updates.forEach(function (changeKey){
            if(changeKey == 'game over'){
                updatePackage.gameOver = 'game over';
                return;
            }
        }, this);
        return updatePackage;
    },
    hear(tamber, amplitude, source, message){
        if(message && source != this){
            this.inform(message);
        }
    },
    inform(message){
        /**
            This function sends a message to the player. These messages are
                displayed, one at a time, at the start of the player's next
                turn, and must be dismissed individually.
            It doesn't return anything.
         **/
        if(!this.messages){ this.messages = [];}
        // Display all the messages!   \(°-o)_
            //this.messages.push(message);
        this.messages.push(message);
        /*var oldMessage = this.messages[0];
        if(!oldMessage){
            oldMessage = '';
        }
        oldMessage += message;
        this.messages[0] = oldMessage;*/
    },
    
    
/*===========================================================================
 *
 *  The following are functions which couple the person to it's player,
 *      possibly over a network. These are the behaviors that a person can take
 *      under the direct control of the player.
 *      
 *===========================================================================*/

    commandWait(options){
        /**
            This command from the player causes the person to wait (pass).
         **/
        this.endTurn();
    },
    commandMove(options){
        /**
            This command from the player causes the person to move.
            The person will attack any hostile actor in the destination tile.
         **/
        var direction = options.direction;
        var offsetX = 0;
        var offsetY = 0;
        if(direction & NORTH){ offsetY++;} else if(direction & SOUTH){ offsetY--;}
        if(direction & EAST ){ offsetX++;} else if(direction & WEST ){ offsetX--;}
        // Check for Door.
        var destination = mapManager.getTile(
            this.x+offsetX, this.y+offsetY, this.levelId
        );
        if(destination.dense && destination.toggleDoor){
            destination.toggleDoor(this.x+offsetX, this.y+offsetY, this);
            this.endTurn();
            return;
        }
        // Check for obstructing enemy.
        var obstruction = mapManager.getTileContents(
            this.x+offsetX, this.y+offsetY, this.levelId, true
        );
        // If enemy found, attack and end turn.
        if(obstruction && obstruction.type == TYPE_ACTOR){
            if(obstruction.faction & this.faction){
                mapManager.swapPlaces(this, obstruction);
                this.endTurn();
            } else{
                this.commandAttack({id: obstruction.id});
            }
        } else{
        // Else, move and end turn.
            this.move(direction);
            this.endTurn();
        }
    },
    commandClose(options){
        /**
            This command from the player causes the person to close a door.
        **/
        var direction = options.direction;
        var offsetX = 0;
        var offsetY = 0;
        if(direction & NORTH){ offsetY++;} else if(direction & SOUTH){ offsetY--;}
        if(direction & EAST ){ offsetX++;} else if(direction & WEST ){ offsetX--;}
        // Check for Door.
        var destination = mapManager.getTile(
            this.x+offsetX, this.y+offsetY, this.levelId
        );
        if(destination.toggleDoor){
            if(destination.dense){
                this.inform('The door is already closed.');
            } else{
                if(destination.toggleDoor(this.x+offsetX,this.y+offsetY,this)){
                    this.inform('You close the door.');
                } else{
                    this.inform('The door cannot be closed.');
                }
            }
        } else{
            this.inform('There is no door there.');
        }
        this.endTurn();
    },
    commandAttack(options){
        /**
         *  This command from the player directs the person to attack an enemy,
         *      as specified by id.
         **/
        if(options.id !== undefined){
            var enemy = mapManager.idManager.get(options.id);
            if(enemy){
                this.attack(enemy);
            } else{
                this.inform('Enemy target not found!');
            }
            this.endTurn();
        } else if(options.direction !== undefined){
            var direction = options.direction || SOUTH;
            var offsetX = 0;
            var offsetY = 0;
            if(direction & NORTH){ offsetY++;} else if(direction & SOUTH){ offsetY--;}
            if(direction & EAST ){ offsetX++;} else if(direction & WEST ){ offsetX--;}
            // Check for obstructing enemy.
            var obstruction = mapManager.getTileContents(
                this.x+offsetX, this.y+offsetY, this.levelId, true
            );
            // If enemy found, attack and end turn.
            if(obstruction && obstruction.type == TYPE_ACTOR){
                if(obstruction.faction & this.faction){
                    if(!this.hostile){
                        this.inform("The goblin is your team member,");
                        this.inform("you shouldn't attack it.");
                        this.endTurn();
                    } else{
                        this.attack(obstruction);
                        this.endTurn();
                    }
                    // TODO: Implement hostility.
                } else{
                    this.attack(obstruction);
                    this.endTurn();
                }
            } else{
            // Else, inform player they attacked nothing.
                this.inform("You attack the empty air.");
                this.endTurn();
            }
        }
    },
    commandGet(options){
        /**
            This command from the player directs the person to place the
                item into its inventory. The item can be specified in multiple
                ways, including by location, description, name, and id. The
                person attempts to find the specified item.
         **/
        var theItem;
        // Attempt to find the item, by ID within range 1.
        var itemId = options.id;
        if(itemId !== undefined){
            var testItem = mapManager.idManager.get(itemId);
            if(!testItem){
                this.inform('The item is no longer there.');
            } else{
                var deltaX = Math.abs(this.x - testItem.x);
                var deltaY = Math.abs(this.y - testItem.y);
                if(testItem.levelId == this.levelId && deltaX <= 1 && deltaY <= 1){
                    theItem = testItem;
                }
            }
        }
        // TODO: Other kinds of checks.
        if(theItem){
            if(this.getItem(theItem)){
                this.inform('You obtain the '+theItem.description());
            } else{
                this.inform("You couldn't obtain the "+theItem.description());
            }
        }
        // End turn.
        this.endTurn();
    },
    commandDrop(options){
        /**
            This command from the player directs the person to drop the specified
                item from inventory.
         **/
        var theItem;
        // Attempt to find the item by ID in inventory.
        var itemId = options.id;
        if(itemId !== undefined){
            var testItem = mapManager.idManager.get(itemId);
            if(testItem && this.inventory.indexOf(testItem) != -1){
                /* This indexOf test prevents a type of cheating where the user
                   would specify the id of an item /not/ in inventory so as to
                   teleport that item to this location. */
                theItem = testItem;
            }
        }
        // TODO: Other kinds of checks, such as by inventory index.
        if(theItem){
            this.inventoryRemove(theItem);
            theItem.place(this.x, this.y, this.levelId);
            this.update('inventory');
            this.inform('You have dropped the '+theItem.description());
        }
        // End turn.
        this.endTurn();
    },
    commandCamp(options){
        /**
            This command from the player directs the hero to rest here until all
            goblins are healed and in good moral.
        **/
        this.camp(true);
        this.companions.forEach(function(aGob){
            aGob.pursueHero();
        }, this);
        // End turn.
        this.endTurn();
    },
    commandUse(options){
        /**
            This command from the player directs the person to use the specified
                item from inventory on the specified target.
            Structure of options:
            {
                itemId: uniqueId, // as per mapManager.idManager.assignId
                targetData: {
                    target: uniqueId, // as per mapManager.idManager.assignId
                    targets: [
                        uniqueId, // as per mapManager.idManager.assignId
                        ...
                    ],
                    direction: CONSTANT // Such as NORTHEAST, etc.
                }
            }
         **/
        var targetData = {
            target: undefined,
            targets: [],
            direction: options.targetData.direction
        };
        var theItem;
        // Attempt to find the item by ID in inventory.
        var itemId = options.itemId;
        if(itemId !== undefined){
            var testItem = mapManager.idManager.get(itemId);
            if(testItem && this.inventory.indexOf(testItem) != -1){
                /* This indexOf test prevents a type of cheating where the user
                   would specify the id of an item /not/ in inventory. */
                theItem = testItem;
            }
        }
        // Attempt to find single target by id in item's targetRange.
        var targetId = options.targetData.target;
        if(targetId !== undefined){
            var testTarget = mapManager.idManager.get(targetId);
            // TODO: Verify target is valid for flags in item.targetRange
            targetData.target = testTarget;
        }
        // Attempt to find all targets by id in item's targetRange.
        var targetIds = options.targetData.targets;
        if(targetIds !== undefined){
            targetIds.forEach(function (individualId){
                var testTarget2 = mapManager.idManager.get(individualId);
                // TODO: Verify target is valid for flags in item.targetRange
                targetData.targets.push(testTarget2);
            });
        }
        if(!theItem){
            this.inform('You failed to use the item properly.');
        } else{
            theItem.use(this, targetData);
        }
        // End turn.
        this.endTurn();
    },
    commandStairs(options){
        /**
            This command from the player directs the person to drop the specified
                item from inventory.
        **/
        for(var posY = -1; posY <= 1; posY++){
            for(var posX = -1; posX <= 1; posX++){
                var stairs = mapManager.getTile(this.x+posX, this.y+posY, this.levelId);
                if(typeof stairs.climb == 'function'){
                    stairs.climb(this);
                    // End turn.
                    this.endTurn();
                    return;
                }
            }
        }
    }
});

//-- Export --------------------------------------
export default hero;
