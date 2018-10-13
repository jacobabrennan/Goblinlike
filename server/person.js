

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
import Actor from './actor.js';

//-- Implementaton -------------------------------
class Person extends Actor {
    // Redefined Methods
    initializer() {
        /**
            A standard initializer, used for inheritence and setup.
            The function updates several values so that the player will know
                about them immediately.
            Returns a reference to itself.
         **/
        super.initializer(...arguments);
        this.name = sWerd.name();
        this.colorNatural = this.color;
        // Select Gender
        if(Math.random()*7 <= 1){
            this.gender = GENDER_NONBINARY;
        } else if(Math.random() < 0.5){
            this.gender = GENDER_FEMALE;
        } else{
            this.gender = GENDER_MALE;
        }
        this.update('gender');
        this.update('id');
        this.update('name');
        this.update('viewRange');
        this.inventory = [];
        return this;
    }
    toJSON() {
        let result = super.toJSON(...arguments);
        result.gender = this.gender;
        result.inventory = this.inventory.map(item => item.id);
        result.colorNatural = this.colorNatural;
        return result;
    }
    fromJSON(data) {
        super.fromJSON(...arguments);
        this.gender = data.gender;
        // TO DO
        this.colorNatural = data.colorNatural;
    }
    place() {
        var success = super.place(...arguments);
        if(success){
            this.update('y');
            this.update('x');
        }
        return success;
    }
    camp() {
        if(!this.camping){
            return false;
        }
        var full = (this.hp == this.maxHp());
        if(!full){
            return true;
        }
        this.camping = false;
        return false;
    }
    takeTurn(callback) {
        /**
            This function alerts the player, possibly over a network, that it
                is their turn. This function supercedes the parent function,
                Person.takeTurn, and should not call that function.
            The supplied callback function must be called at the end of the
                player's turn, otherwise the game will not continue.
            It does not return anything.
         **/
        // Setup turn storage.
        this.turnActive = true;
        this.turnCallback = callback;
        // If camping, skip most intelligence.
        if(this.camp()){
            if(this.intelligence && this.intelligence.camp){
                this.intelligence.camp(this);
            } else{
                this.endTurn();
            }
            return;
        }
        // Defer to intelligence controller if one exists.
        if(this.intelligence && this.intelligence.takeTurn){
            this.intelligence.takeTurn(this);
            return;
        }
        // Call behavior function, if it exists.
        if(typeof this.behavior == 'function'){
            this.behavior();
        }
        this.endTurn();
    }
    endTurn() {
        /**
            This function must be called whenever the person ends their turn,
                usually by performing an action from the player.
         **/
        this.turnActive = false;
        this.nextTurn += this.turnDelay;
        var callbackTemp = this.turnCallback;
        this.turnCallback = undefined;
        callbackTemp(true);
    }
    move(direction) {
        /**
            This function is used to move the object in a specific direction,
                one of:
                    EAST, NORTHEAST, NORTH, NORTHWEST,
                    WEST, SOUTHWEST, SOUTH, SOUTHEAST.
            It returns true if the movement is successful, and false otherwise.
         **/
        var success = super.move(...arguments);
        this.sound('footsteps', 10, this);
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
    }
    // New Methods
    update(which) {
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
    }
    packageUpdates() {
        /**
            This function creates a data package containing information about
                aspects of the person that have changed since the person's last
                turn.
            It return said package. See following comments for structure.
         **/
        var updatePackage = {};
        if(!this.updates){
            return updatePackage;
        }
        this.updates.forEach(function (changeKey){
            switch(changeKey){
                case 'inventory': 
                    updatePackage.inventory = [];
                    this.inventory.forEach(function (invItem){
                        updatePackage.inventory.push(invItem.pack());
                    }, this);
                    return;
                case 'game over':
                    updatePackage.gameOver = 'game over';
                    return;
                default:
                    if(typeof this[changeKey] == 'function'){
                        updatePackage[changeKey] = this[changeKey];
                    } else{
                        updatePackage[changeKey] = this[changeKey];
                    }
                    return;
            }
        }, this);
        return updatePackage;
    }
    hear(tamber, amplitude, source, message) {
        if(message && source != this){
            this.inform(message);
        }
    }
    inform(message) {
        /**
            This function sends a message to the player. These messages are
                displayed, one at a time, at the start of the player's next
                turn, and must be dismissed individually.
            It doesn't return anything.
         **/
        if(!this.messages){ this.messages = [];}
        // Display all the messages!   _(o-°)/
            //this.messages.push(message);
        //var oldMessage = this.messages[0];
        this.messages.push(message);
    }
    inventoryAdd(newItem) {
        // Remove from current Location.
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
        // Add to inventory.
        this.inventory.push(newItem);
        this.update('inventory');
        return true;
    }
    getItem(newItem, single) {
        // TODO: There is some sort of error here sometimes.
        /**
            This function handles the movement of items into the person's
                inventory. It is a general house keeping function, perhaps
                a candidate to be refactored into some other function.
            It returns true if the item was added to inventory, false if it
                could not be added.
         **/
        // TODO: Implement inventory limits, perhaps in a plugin.
        // Check current inventory + equipment weight.
        var oldStack;
        if(newItem.stackCount > 1 && single){
            oldStack = newItem;
            newItem = newItem.unstack();
        }
        var carryWeight = this.getWeight();
        var newWeight = newItem.getWeight();
        carryWeight += newWeight;
        if(carryWeight > this.carryCapacity()){
            if(newItem.stackCount > 1){
                var success = this.getItem(newItem, true);
                if(success){
                    this.inform('You could not carry all of them.');
                }
                return success;
            } else{
                this.inform('You cannot carry that much weight.');
                if(oldStack){ oldStack.stack(newItem);}
                return false;
            }
        }
        //
        this.inventoryAdd(newItem);
        return true;
    }
    inventoryRemove(oldItem) {
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
    }
    getWeight() {
        var totalWeight = 0;
        for(var invIndex = 0; invIndex < this.inventory.length; invIndex++){
            var indexedItem = this.inventory[invIndex];
            var itemWeight = indexedItem.getWeight();
            totalWeight += itemWeight;
        }
        return totalWeight;
    }
}
// Redefined properties
Person.prototype.character = '@';
Person.prototype.faction = FACTION_GOBLIN;
Person.prototype.name = 'person';
Person.prototype.color = '#0f0';
Person.prototype.colorNatural = undefined;
// New properties
Person.prototype.gender = undefined;
Person.prototype.updates = undefined;
Person.prototype.messages = undefined;
Person.prototype.inventory = undefined;
Person.prototype.turnActive = false;
Person.prototype.turnCallback = undefined;

//-- Export --------------------------------------
export default Person;
