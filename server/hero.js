

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

var hero = Object.create(person, {
    // Redefined properties
    character: {value: 'g', writable: true},
    faction: {value: FACTION_GOBLIN, writable: true},
    name: {value: 'person', writable: true},
    color: {value: '#0f0', writable: true},
    // New properties
    updates: {value: undefined, writable: true},
    messages: {value: undefined, writable: true},
    inventory: {value: undefined, writable: true},
    turnActive: {value: false, writable: true},
    turnCallback: {value: undefined, writable: true},
    // Redefined Methods
    constructor: {value: function (){
        /**
            A standard constructor, used for inheritence and setup.
            The function updates several values so that the player will know
                about them immediately.
            Returns a reference to itself.
         **/
        person.constructor.apply(this, arguments);
        this.name = sWerd.name();
        this.update('id');
        this.update('name');
        this.update('viewRange');
        this.inventory = [];
        return this;
    }, writable: true},
    die: {value: function (){
        this.companions = null;
        this.inform('You have died.');
        gameManager.gameOver();
    }},
    endTurn: {value: function (){
        /**
            This function must be called whenever the person ends their turn,
                usually by performing an action from the player.
         **/
        this.turnActive = false;
        this.nextTurn += this.turnDelay;
        var callbackTemp = this.turnCallback;
        this.turnCallback = undefined;
        callbackTemp(true);
    }, writable: true},
    move: {value: function (direction){
        /**
            This function is used to move the object in a specific direction,
                one of:
                    EAST, NORTHEAST, NORTH, NORTHWEST,
                    WEST, SOUTHWEST, SOUTH, SOUTHEAST.
            It returns true if the movement is successful, and false otherwise.
         **/
        var success = person.move.apply(this, arguments);
        //this.sound('footsteps', 5, this);
        this.getViewContents().forEach(function (theContent){
            if(typeof theContent.activate == 'function'){
                theContent.activate();
            }
        }, this);
        //var currentLevel = mapManager.getLevel(this.levelId);
        //var contents = currentLevel.getRangeActors(this.x, this.y, 8);
        /*contents.forEach(function (content, index){
            if(typeof content.activate != 'function'){ return;}
            content.activate();
        }, this);*/
        return success;
    }, writable: true},
    // New Methods
    update: {value: function (which){
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
    }, writable: true},
    packageUpdates: {value: function (){
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
    }, writable: true},
    hear: {value: function (tamber, amplitude, source, message){
        if(message && source != this){
            this.inform(message);
        }
    }},
    inform: {value: function (message){
        /**
            This function sends a message to the player. These messages are
                displayed, one at a time, at the start of the player's next
                turn, and must be dismissed individually.
            It doesn't return anything.
         **/
        if(!this.messages){ this.messages = [];}
        // Display all the messages!   _(o-°)/
            //this.messages.push(message);
        var oldMessage = this.messages[0];
        if(!oldMessage){
            oldMessage = '';
        }
        oldMessage += ' \n '+message;
        this.messages[0] = oldMessage;
    }, writable: true},
    gainItem: {value: function (newItem, single){
        /**
            This function handles the movement of items into the person's
                inventory. It is a general house keeping function, perhaps
                a candidate to be refactored into some other function.
            It returns true if the item was added to inventory, false if it
                could not be added. Currently always true, but could be false
                in the future if inventory limits are implemented.
         **/
        // TODO: Implement inventory limits, perhaps in a plugin.
        // Check current inventory + equipment weight.
        if(newItem.stackCount > 1 && single){
            newItem = newItem.unstack();
        }
        var carryWeight = this.getWeight(newItem);
        var newWeight = newItem.weight;
        var itemCount = single? 1 : newItem.stackCount;
        newWeight *= itemCount;
        carryWeight += newWeight;
        if(carryWeight > this.carryCapacity()){
            if(itemCount > 1){
                var success = this.gainItem(newItem, true);
                if(success){
                    this.inform('You could not carry all of them.');
                }
                return success;
            } else{
                this.inform('You cannot carry that much weight.');
                return false;
            }
        }
        //
        newItem.unplace();
        // Handle stackable items.
        if(newItem.stackable){
            // Check ammo.
            var ammo = this.equipment[EQUIP_OFFHAND];
            if(ammo && (ammo != newItem) && (ammo.name == newItem.name)){
                ammo.stackCount += newItem.stackCount;
                newItem.dispose();
                this.update('equipment');
                return true;
            }
            // Check inventory.
            for(var index = 0; index < this.inventory.length; index++){
                var indexedItem = this.inventory[index];
                if(indexedItem.name == newItem.name){
                    indexedItem.stackCount += newItem.stackCount;
                    newItem.dispose();
                    this.update('inventory');
                    return true;
                }
            }
        }
        this.inventory.push(newItem);
        this.update('inventory');
        return true;
    }, writable: true},
    looseItem: {value: function (oldItem){
        /**
            This function handles removal of an item from inventory, but not
                the moving of that item to any other location. Dropping an item
                requires additional placement.
            It returns true if the item was removed to inventory, false if it
                could not be removed. Currently always true, but could be false
                in the future.
         **/
        // TODO: Implement inventory limits, perhaps in a plugin.
        arrayRemove(this.inventory, oldItem);
        this.update('inventory');
        return true;
    }, writable: true},
    getWeight: {value: function (){
        var totalWeight = 0;
        for(var invIndex = 0; invIndex < this.inventory.length; invIndex++){
            var indexedItem = this.inventory[invIndex];
            var itemWeight = indexedItem.weight;
            if(indexedItem.stackCount > 0){
                itemWeight *= indexedItem.stackCount;
            }
            totalWeight += itemWeight;
        }
        return totalWeight;
    }},
    
    
/*===========================================================================
 *
 *  The following are functions which couple the person to it's player,
 *      possibly over a network. These are the behaviors that a person can take
 *      under the direct control of the player.
 *      
 *===========================================================================*/

    commandWait: {value: function (options){
        /**
            This command from the player causes the person to wait (pass).
         **/
        this.endTurn();
    }, writable: true},
    commandMove: {value: function (options){
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
                var oldX = this.x;
                var oldY = this.y;
                var oldId = this.levelId;
                var obsX = obstruction.x;
                var obsY = obstruction.y;
                var obsId = obstruction.levelId;
                this.unplace();
                obstruction.place(oldX, oldY, oldId);
                this.place(obsX, obsY, obsId);
                this.endTurn();
            } else{
                this.commandAttack({id: obstruction.id});
            }
        } else{
        // Else, move and end turn.
            this.move(direction);
            this.endTurn();
        }
    }, writable: true},
    commandClose: {value: function (options){
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
                destination.toggleDoor(this.x+offsetX, this.y+offsetY, this);
                this.inform('You close the door.');
            }
        } else{
            this.inform('There is no door there.');
        }
        this.endTurn();
    }, writable: true},
    commandAttack: {value: function (options){
        /**
         *  This command from the player directs the person to attack an enemy,
         *      as specified by id.
         **/
        var enemy = mapManager.idManager.get(options.id);
        if(enemy){
            this.attack(enemy);
        } else{
            this.inform('Enemy target not found!');
        }
        this.endTurn();
    }, writable: true},
    commandGet: {value: function (options){
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
            if(this.gainItem(theItem)){
                this.inform('You obtain the '+theItem.description());
            } else{
                this.inform("You couldn't obtain the "+theItem.description());
            }
        }
        // End turn.
        this.endTurn();
    }, writable: true},
    commandDrop: {value: function (options){
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
            this.looseItem(theItem);
            theItem.place(this.x, this.y, this.levelId);
            this.update('inventory');
            this.inform('You have dropped the '+theItem.description());
        }
        // End turn.
        this.endTurn();
    }, writable: true},
    commandUse: {value: function (options){
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
    }, writable: true},
    commandStairs: {value: function (options){
        /**
            This command from the player directs the person to drop the specified
                item from inventory.
        **/
        var stairs = mapManager.getTile(this.x, this.y, this.levelId);
        if(typeof stairs.climb == 'function'){
            stairs.climb(this);
        }
        // End turn.
        this.endTurn();
    }, writable: true}
});


//==============================================================================

(function (base){
    base.constructor = (function (parentFunction){
        return function (){
            this.companions = [];
            parentFunction.apply(this, arguments);
            return this;
        };
    })(base.constructor);
    base.setLevel = (function (parentFunction){
        return function (){
            var result = parentFunction.apply(this, arguments);
            this.companions.forEach(function (theCompanion){
                theCompanion.setLevel(this.level);
            }, this);
            return result;
        };
    })(base.setLevel);
})(hero);
var companion = Object.create(person, {
    character: {value: 'g', writable: true},
    faction: {value: FACTION_GOBLIN, writable: true},
    color: {value: '#5c3', writable: true},
    constructor: {value: function (){
        person.constructor.apply(this, arguments);
        this.color = 'rgb('+randomInterval(64,204)+','+randomInterval(102,255)+','+randomInterval(0,64)+')';
        this.name = sWerd.name()+' (g)';
        var theHero = gameManager.currentGame.hero;
        if(theHero){ this.setLevel(theHero.level);}
        
        this.equip(Object.instantiate(itemLibrary.getItem('short bow')));
        this.equip(Object.instantiate(itemLibrary.getItem('arrow')));
        
        return this;
    }},
    adjustExperience: {value: function (amount){
        /**
        **/
        gameManager.currentGame.hero.adjustExperience(amount);
        return;
    }, writable: true},
    activate: {value: function (){
        /**
         *  This function actives the enemy, basically "waking it up". It is
         *  usually called when the player comes into view, makes loud noises
         *  nearby, or otherwise alerts the enemy to their presense. It can
         *  also be triggered by other non-player driven events, or even as
         *  soon as the level is generated for some particularly vigilant
         *  enemies.
         *
         *  It registers the enemy with the time manager.
         *
         *  It does not return a value.
         **/
        if(this.active){ return;}
        gameManager.registerActor(this);
        if(gameManager.currentGame.hero.companions.indexOf(this) == -1){
            gameManager.currentGame.hero.companions.push(this);
        }
        this.active = true;
    }},
    hurt: {value: function (){
        this.activate();
        return person.hurt.apply(this, arguments);
    }, writable: true},
    dispose: {value: function (){
        if(gameManager.currentGame){
            var companionI = gameManager.currentGame.hero.companions.indexOf(this);
            if(companionI != -1){
                gameManager.currentGame.hero.companions.splice(companionI, 1);
            }
        }
        return person.dispose.apply(this, arguments);
    }, writable: true},
    behavior: {value: function (){
        var result = this.pursueHero();
        if(!result){
            this.pursueEnemy();
        }
        return;
    }, writable: true},
    pursueHero: {value: function (){
        var target = gameManager.currentGame.hero;
        var pursueRange = Math.min(3, target.companions.length);
        if(!target || (
            (target.levelId == this.levelId) &&
            distance(this.x, this.y, target.x, target.y) <= pursueRange
        )){
            return false;
        }
        var pathArray = findPath(this, target, 1);
        if(!pathArray){
            return false;
        }
        if(pathArray[0].x == this.x && pathArray[0].y == this.y && pathArray[0].levelId == this.levelId){
            pathArray.shift();
        }
        var nextCoord = pathArray.shift();
        if(!nextCoord){
            return false;
        }
        if(nextCoord.levelId != this.levelId){
            this.place(nextCoord.x, nextCoord.y, nextCoord.levelId);
            return true;
        }
        var direction = directionTo(this.x,this.y,nextCoord.x,nextCoord.y);
        // Check for Door.
        var destination = mapManager.getTile(
            nextCoord.x, nextCoord.y, this.levelId
        );
        if(destination.dense && destination.toggleDoor){
            destination.toggleDoor(nextCoord.x, nextCoord.y, this);
            return true;
        }
        // Else, move.
        return this.move(direction);
    }, writable: true},
    pursueEnemy: {value: function (){
        // Find a target, and the path to that target. If no target, deactivate.
        var target;
        var path;
        var targetData = findTarget(this, this.faction);
        if(targetData && this.checkView(targetData.target)){
            target = targetData.target;
            path = targetData.path;
        } else{
            return false;
        }
        // Determine if target is in range of equipped weapon. Attack.
        var range = distance(this.x, this.y, target.x, target.y);
        var weapon = this.equipment? this.equipment[EQUIP_MAINHAND] : undefined;
        if(weapon && weapon.shoot && weapon.range){
            if(weapon.range >= range){
                var success = weapon.shoot(
                    this,
                    directionTo(this.x, this.y, target.x, target.y),
                    target
                );
                if(success || success === 0){
                    return true;
                }
            }
        // Else, attack with your hands.
        }
        if(range <= 1){
            this.attack(target);
            return true;
        }
        // If a skill was not used, move toward the target.
        var pathArray = path;
        var nextCoord = pathArray.shift();
        if(!nextCoord){
            return false;
        }
        var direction = directionTo(this.x, this.y, nextCoord.x, nextCoord.y);
        return this.move(direction);
    }, writable: true}
});