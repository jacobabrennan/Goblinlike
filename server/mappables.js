

//== TODO: Document file =======================================================

//-- Dependencies --------------------------------
import mapManager from './map_manager.js';

//-- Mappables -----------------------------------
class Mappable {
    /**
     *  Mappable is a prototype from which all other objects that appear on the
     *      map are derived.
     *  It is a prototype and must be further derived and instanced before use.
     **/
    initializer() {}
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
    }
    toJSON() {
        let result = {};
        if(this.generationType){ // Applied by modelLibrary
            result.generationType = this.generationType; 
        }
        return result;
    }
    fromJSON(data) {
        if(data.generationType){
            this.generationType = data.generationType;
        }
    }
}
Mappable.prototype.character = '?';
Mappable.prototype.color = undefined;
Mappable.prototype.background = undefined;
Mappable.prototype.dense = false;

class Containable extends Mappable {
    constructor() {
        super(...arguments)
        this.x = undefined;
        this.y = undefined;
        this.levelId = undefined;
        this.id = undefined;
        this.nextContent = undefined; // Tile contents implemented as linked list.
    }
    initializer(levelId){
        super.initializer(...arguments);
        this.levelId = levelId;
        this.id = mapManager.idManager.assignId(this);
    }
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        this.unplace();
        this.levelId = undefined;
        mapManager.idManager.cancelId(this.id);
        super.dispose();
    }
    toJSON() {
        let result = super.toJSON(...arguments);
        let saveKeys = ['id', 'levelId', 'x', 'y', 'name'];
        for(let saveIndex = 0; saveIndex < saveKeys.length; saveIndex++){
            let indexedKey = saveKeys[saveIndex];
            result[indexedKey] = this[indexedKey];
        }
        return result;
    }
    fromJSON(data) {
        super.fromJSON(...arguments);
        let saveKeys = ['id', 'levelId', 'x', 'y', 'name'];
        for(let saveIndex = 0; saveIndex < saveKeys.length; saveIndex++){
            let indexedKey = saveKeys[saveIndex];
            this[indexedKey] = data[indexedKey];
        }
        console.log(this.name, this.levelId)
    }
    place(x, y, levelId){
        /**
            This function is used to place the object at specific coordinates
                on a specific level, referenced by id.
            It returns true if the placement is successful, and false otherwise.
         **/    
        /*if(levelId === undefined){
            levelId = this.levelId;
        } else{
            this.levelId = levelId
        }*/
        if(isNaN(x) || isNaN(y) || (x == this.x && y == this.y && levelId == this.levelId)){
            return false;
        }
        levelId = levelId || this.levelId;
        if(!levelId){
            return false;
        }
        var placeLevel = mapManager.getLevel(levelId);
        var success = placeLevel.placeContainable(x, y, this);
        return success;
    }
    unplace(){
        /**
            This function removes the Containable from the level. This allows
                it to be placed in the player's inventory, into a shop, a
                chest, or prepared for garbage collection, etc.
            It returns true if the Containable is no longer placed on any level
                (I see no current reason this shouldn't always be true).
         **/
        var success = true;
        if(this.x && this.y && (this.levelId !== undefined)){
            var currentLevel = mapManager.getLevel(this.levelId);
            success = currentLevel.unplaceContainable(this);
        }
        this.x = undefined;
        this.y = undefined;
        return success;
    }
    bump(obstruction){
        /**
            Called when the object attempts to be placed in the same space as
            another Containable object, but fails due to density.
            
            It does not return anything.
         **/
        obstruction.bumped(this);
    }
    bumped(bumper){
        /**
            Called when another Containable object attempts to be placed in the
            same space, but fails due to density.
            
            It does not return anything.
         **/
    }
    pack(){
        /**
            This function creates a "sensory package" of the object for use by
                a client, possibly over the network. This allows a client to
                know enough about an object to make decisions without having a
                hard reference to it.
            It returns a package representing the object, with the following
                structure:
            {
                id: uniqueId,
                name: "string",
                character: singleCharacterString,
                color: "#HEX", // optional
                background: "#Hex", // optional
                dense: boolean
            }
         **/
        var sensoryData = {
            id: this.id,
            name: this.name,
            character: this.character,
            dense: this.dense
        };
        if(this.description){
            sensoryData.name = this.description();
        }
        if(this.color){ sensoryData.color = this.color;}
        if(this.background){ sensoryData.background = this.background;}
        return sensoryData;
    }
}
// Configurable
Containable.prototype.name = 'something';
// Nonconfigurable
Containable.prototype.type = TYPE_CONTAINABLE;
Containable.prototype.viewText = 'You know nothing about this.';

class Movable extends Containable {
    move(direction){
        /**
            This function is used to move the object in a specific direction,
                one of:
                    EAST, NORTHEAST, NORTH, NORTHWEST,
                    WEST, SOUTHWEST, SOUTH, SOUTHEAST.
            It returns true if the movement is successful, and false otherwise.
         **/
        var offsetX = 0;
        var offsetY = 0;
        if(direction & NORTH){ offsetY++;} else if(direction & SOUTH){ offsetY--;}
        if(direction & EAST ){ offsetX++;} else if(direction & WEST ){ offsetX--;}
        var destinationCoords = [this.x+offsetX, this.y+offsetY];
        var success = this.place(destinationCoords[0], destinationCoords[1]);
        if(success){
            var entryTile = mapManager.getTile(this.x, this.y, this.levelId);
            entryTile.entered(this);
        }
        return success;
    }
}
// TODO: Document.
Movable.prototype.MMM = true;
Movable.prototype.dense = true;

//-- Exports -------------------------------------
export {Mappable, Containable, Movable};
