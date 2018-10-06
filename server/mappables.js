

//== TODO: Document file =======================================================

//-- Dependencies --------------------------------
import mapManager from './map_manager.js';

//-- Mappables -----------------------------------
const mappable = {
    /**
     *  Mappable is a prototype from which all other objects that appear on the
     *      map are derived.
     *  It is a prototype and must be further derived and instanced before use.
     **/
    character: '?',
    color: undefined,
    background: undefined,
    dense: false,
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
    }
};
const containable = Object.extend(mappable, {
    // TODO: Document.
    levelId: undefined,
    x: undefined,
    y: undefined,
    name: 'something',
    id: undefined,
    nextContent: undefined,
        // Tile contents implemented as linked list.
    type: TYPE_CONTAINABLE,
    viewText: 'You know nothing about this.',
    initializer(levelId){
        // TODO: Document.
        this.levelId = levelId;
        if(mappable.initializer){
            mappable.initializer.call(this);
        }
        this.id = mapManager.idManager.assignId(this);
        return this;
    },
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        this.unplace();
        this.levelId = undefined;
        mapManager.idManager.cancelId(this.id);
    },
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
    },
    unplace(){
        /**
            This function removes the containable from the level. This allows
                it to be placed in the player's inventory, into a shop, a
                chest, or prepared for garbage collection, etc.
            It returns true if the containable is no longer placed on any level
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
    },
    bump(obstruction){
        /**
            Called when the object attempts to be placed in the same space as
            another containable object, but fails due to density.
            
            It does not return anything.
         **/
        obstruction.bumped(this);
    },
    bumped(bumper){
        /**
            Called when another containable object attempts to be placed in the
            same space, but fails due to density.
            
            It does not return anything.
         **/
    },
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
});
const movable = Object.extend(containable, {
    // TODO: Document.
    dense: true,
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
});

//-- Exports -------------------------------------
export {mappable, containable, movable};
