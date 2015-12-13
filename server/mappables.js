

// TODO: Document file.

var mappable = {
    /**
     *  Mappable is a prototype from which all other objects that appear on the
     *      map are derived.
     *  It is a prototype and must be further derived and instanced before use.
     **/
    character: '?',
    color: undefined,
    background: undefined,
    dense: false,
    dispose: function (){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
    }
};
var containable = Object.create(mappable, {
    // TODO: Document.
    levelId: {value: undefined, writable: true},
    x: {value: undefined, writable: true},
    y: {value: undefined, writable: true},
    name: {value: 'something', writable: true},
    id: {value: undefined, writable: true},
    nextContent: {value: undefined, writable: true},
        // Tile contents implemented as linked list.
    type: {value: TYPE_CONTAINABLE, writable: true},
    viewText: {value: 'You know nothing about this.', writable: true},
    constructor: {value: function (levelId){
        // TODO: Document.
        this.levelId = levelId;
        if(mappable.constructor){
            mappable.constructor.call(this);
        }
        this.id = mapManager.idManager.assignId(this);
        return this;
    }, writable: true},
    dispose: {value: function (){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        this.unplace();
        this.levelId = undefined;
        mapManager.idManager.cancelId(this.id);
    }, writable: true},
    place: {value: function (x, y, levelId){
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
    }, writable: true},
    unplace: {value: function (){
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
    }, writable: true},
    bump: {value: function (obstruction){
        /**
            Called when the object attempts to be placed in the same space as
            another containable object, but fails due to density.
            
            It does not return anything.
         **/
        obstruction.bumped(this);
    }, writable: true},
    bumped: {value: function (bumper){
        /**
            Called when another containable object attempts to be placed in the
            same space, but fails due to density.
            
            It does not return anything.
         **/
    }, writable: true},
    pack: {value: function (){
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
    }, writable: true}
});
var trap = Object.create(containable, {
    /**
        Traps are objects which sit on a single tile and perform an action when
        the user triggers them by entering the tile. A trap need not be a trap
        in a traditional sense. For instance, it could be a spider web, or a
        healing spring.
     **/
    type: {value: TYPE_TRAP, writable: true},
    hidden: {value: true, writable: false},
    triggered: {value: false, writable: true},
    trigger: {value: function (actor){
        /**
            Called when an actor enters the traps containing tile.
            It does not return anything.
         **/
        if(this.triggered){ return;}
        this.triggered = true;
    }, writable: true},
    place: {value: function (x, y, levelId){
        if(isNaN(x) || isNaN(y) || (x == this.x && y == this.y && levelId == this.levelId)){
            return false;
        }
        var tileContent = mapManager.getTileContents(x, y, levelId);
        var doubleTrap = false;
        if(tileContent){
            tileContent.forEach(function (contentElement){
                if(contentElement.type === TYPE_TRAP){
                    doubleTrap = true;
                }
            });
        }
        if(doubleTrap){
            return false;
        }
        return containable.place.apply(this, arguments);
    }, writable: true},
});
var movable = Object.create(containable, {
    // TODO: Document.
    dense: {value: true, writable: true},
    move: {value: function (direction){
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
    }, writable: true}
});