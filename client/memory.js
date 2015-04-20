

/*==============================================================================
  
    The memory object stores, manages, and provides access to everything the
    player knows about the world. It records what the character has seen of the
    map, and information about enemies encountered. It provides easy and
    organized access to this data so that the player can issue informed commands
    to the remote server.
    
    The memory object is not a prototype, and should not be instanced.
  
==============================================================================*/

// TODO: Add a beastiary, as per "and information about enemies encountered".
// TODO: Complete comments for sub-objects.

client.drivers.gameplay.memory = (function (){
// =============================================================================
var memory = {
    currentTime: undefined,
    character: undefined,
    map: undefined,
    idObjects: {},
    setup: function (configuration){
        /**
            Configures the memory object. It is invoked, as soon as the page
            loads, by client.drivers.gameplay.setup.
            
            It does not return anything.
        **/
    },
    blank: function (options){
        this.currentTime = 0;
        idObjects = {};
        if(this.map){
            this.map.dispose();
        }
        this.map = Object.instantiate(mapMemory);
    },
    sense: function (sensoryData){
        /**
            Accepts information about the game world, usually at the start of
            the player's turn. This info is then stores for later access.
        
            It does not return anything.
        **/
        if(sensoryData.time){
            this.currentTime = sensoryData.time;
        }
        if(sensoryData.level){
            this.map.recordData(sensoryData.level, this.currentTime);
        }
        if(sensoryData.view){
            this.map.recordData(sensoryData.view, this.currentTime);
        }
    },
    storeIdObject: function (object, id){
        /**
            Maintains a library of all objects the player has encountered, by
            id. This allows the player to recognize when something they saw in
            one place suddenly shows up in another. This way, the map doesn't
            show enemies in old positions (out of sight) once the player has
            seen them in a new position.
            
            It does not return anything.
        **/
        this.idObjects[id] = object;
    },
    cancelIdObject: function (id){
        /**
            Removes an object, referenced by id, from memory. Because ids are
            recycled, this is neccessary to prevent the memory from identifying
            an item as a new monster, for example.
            
            It does not return anything.
        **/
        delete this.idObjects[id];
    },
    getIdObject: function (id, name){
        /**
            Returns an object previously stored in memory using storeIdObject,
            or undefined if no object is known. It will, optionally, only return
            an object that has the same name as one provided. This is helpful to
            ensure that, when an id is recycled, an object is misremembered.
        **/
        var rememberedObject = this.idObjects[id];
        if(name && rememberedObject.name != name){
            return undefined;
        }
        return rememberedObject;
    },
    recall: function (containable){
        /**
            Allows the character to remember information about enemies
            previously encountered.
            
            It returns an object containing everything known about the enemy.
        **/
        var objMemory = this.getIdObject(containable.id);
        return {name: objMemory.name};
        // TODO: Finish this with real stuffs.
    },
    getDisplayLevel: function (){
        /**
            Returns the memory representation of the current level, for display
            in the map.
        **/
        var currentLevelId = client.drivers.gameplay.memory.character.levelId;
        var currentLevelMemory = this.map.getLevel(currentLevelId);
        return currentLevelMemory;
    },
    getView: function (x, y, range){
        /**
            This function returns an array of all tile contents (but not tiles)
            within the specified range of the specified coordinates on the
            character's current level. The array contains only items that are
            within view, not those that are remembered to be there.
            
            It returns an array.
        **/
        var currentLevel = this.map.getLevel(this.character.levelId);
        if(!currentLevel){ return [];}
        return currentLevel.getView(x, y, range);
    },
    getRange: function (x, y, range){
        /**
            This function returns an array of all tile contents (but not tiles)
            within the specified range of the specified coordinates on the
            character's current level.
            
            It returns an array.
        **/
        var currentLevel = this.map.getLevel(this.character.levelId);
        if(!currentLevel){ return [];}
        return currentLevel.getRange(x, y, range);
    },
    statusUpdate: false,
    statusUpdateList: ['name', 'hp', 'maxHp', 'level', 'experience',
        'vitality', 'strength', 'wisdom', 'charisma', 'equipment'],
    updateSelf: function (updateData){
        /**
            This function parses data about updates to the player's hero object
            that have taken place between turns, and stores the new info in
            memory for access later without having to ask the server.
            
            It does not return anything.
        **/
        if(!this.character){
            this.character = Object.instantiate(characterMemory);
        }
        // Handle each aspect of the update data separately.
        /* TODO: Revisit this before release. If no special handling is needed,
        refactor into simple statement: this.character[key] = updateData[key] */
        /*if(updateData.id !== undefined){ this.character.id = updateData.id;}
        if(updateData.name !== undefined){
            this.character.name = updateData.name;}
        if(updateData.x !== undefined){ this.character.x = updateData.x;}
        if(updateData.y !== undefined){ this.character.y = updateData.y;}
        if(updateData.hp !== undefined){ this.character.hp = updateData.hp;}
        if(updateData.mp !== undefined){ this.character.mp = updateData.mp;}
        if(updateData.maxHp !== undefined){
            this.character.maxHp = updateData.maxHp;}
        if(updateData.maxMp !== undefined){
            this.character.maxMp = updateData.maxMp;}
        if(updateData.viewRange !== undefined){
            this.character.viewRange = updateData.viewRange;}
        if(updateData.inventory !== undefined){
            this.character.inventory = updateData.inventory;}
        if(updateData.levelId !== undefined){
            this.character.levelId = updateData.levelId;}
        if(updateData.equipment !== undefined){
            this.character.equipment = updateData.equipment;}
        if(updateData.experience !== undefined){
            this.character.experience = updateData.experience;}
        if(updateData.level !== undefined){
            this.character.level = updateData.level;}
        if(updateData.vitality !== undefined){
            this.character.vitality = updateData.vitality;}
        if(updateData.strength !== undefined){
            this.character.strength = updateData.strength;}
        if(updateData.wisdom !== undefined){
            this.character.wisdom = updateData.wisdom;}
        if(updateData.charisma !== undefined){
            this.character.charisma = updateData.charisma;}*/
        for(var key in updateData){
            if(updateData.hasOwnProperty(key)){
                this.character[key] = updateData[key];
                if(this.statusUpdateList.indexOf(key) != -1){
                    this.statusUpdate = true;
                }
            }
        }
    }
};
    
    
/*==============================================================================

    The following objects are used by the main memory system for internal
    storage of game data.
    
    They are private properties of the main memory system. All interactions with
    the memory system should go through the main memory's methods, the
    sub-objects should not be accessed individually.
    
    They are prototypes, and must be instanced by the memory system for use.
    
==============================================================================*/

var characterMemory = {
    // TODO: Document.
    hp: undefined,
    mp: undefined,
    maxHp: undefined,
    maxMp: undefined,
    inventory: undefined,
    constructor: function (){
        // TODO: Document.
        this.inventory = [];
        return this;
    }
};
var tileMemory = {
    // TODO: Document.
    id: undefined,
    contents: undefined,
    timeStamp: undefined,
    constructor: function (tileData, currentTime){
        // TODO: Document.
        this.id = tileData.id;
        this.contents = tileData.contents;
        this.timeStamp = currentTime;
        return this;
    }
};
var levelMemory = {
    // TODO: Document.
    width: undefined,
    height: undefined,
    tileGrid: undefined,
    tileTypes: undefined,
    constructor: function (levelData){
        // TODO: Document.
        this.width = levelData.width;
        this.height = levelData.height;
        this.tileGrid = [];
        this.tileGrid.length = this.width * this.height;
        this.tileTypes = levelData.tileTypes;
        return this;
    },
    recordView: function (viewData, currentTime){
        // TODO: Document.
        this.currentTime = currentTime;
        for(var index = 0; index < viewData.tiles.length; index++){
            var indexedTile = viewData.tiles[index];
            var compoundIndex = indexedTile.y*this.width + indexedTile.x;
            //var tileType = this.tileTypes[indexedTile.id];
            var newTileMemory = tileMemory.constructor.call(
                Object.create(tileMemory), indexedTile, currentTime
            );
            this.tileGrid[compoundIndex] = newTileMemory;
        }
    },
    getTile: function (x, y){
        // TODO: Document.
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return undefined;
        }
        var compoundIndex = y*this.width + x;
        var result = this.tileGrid[compoundIndex];
        return result;
    },
    getRange: function (x, y, range, age){
        /**
            This function returns an array of all tile contents (but not tiles)
            within the specified range of the specified coordinates. The array
            contains both items that are within view, and those that are
            remembered to be there.
            
            Items not in view that were observed more than age turns ago will
            not be included. If no age is provided, it will include all items by
            default.
            
            It returns an array.
         **/
        var rangeContents = [];
        // Loop through tiles in range, add their contents to range contents.
        for(var yPos = y-range; yPos <= y+range; yPos++){
            for(var xPos = x-range; xPos <= x+range; xPos++){
                var loopTile = this.getTile(xPos, yPos);
                if(!loopTile){ continue;}
        // Skip memories that are too old.
                if(age !== undefined){
                    if(this.currentTime - loopTile.timeStamp > age){
                        continue;
                    }
                }
                if(loopTile.contents){
        // Loop through tile contents, add each to range contents.
                    for(var cI = 0; cI < loopTile.contents.length; cI++){
                        var indexedContent = loopTile.contents[cI];
                        rangeContents.push(indexedContent);
                    }
                }
            }
        }
        // Return range contents.
        return rangeContents;
    },
    getView: function (x, y, range){
        /**
            This function returns an array of all tile contents (but not tiles)
            within the specified range of the specified coordinates. The array
            contains only items that are within view, not those that are
            remembered to be there.
            
            It returns an array.
         **/
        return this.getRange(x, y, range, 0);
    }
};
var mapMemory = {
    // TODO: Document.
    levels: undefined,
    constructor: function (){
        this.levels = {};
        return this;
    },
    getLevel: function (levelId){
        /**
            This function allows levels to be referenced by id.
            It returns the level memory, if found.
                Otherwise, it returns undefined.
         **/
        return this.levels[levelId];
    },
    recordLevel: function (levelData){
        /**
         *  This function creates a new levelMemory from data, and stores
         *      it in the list of levels, accessibly by levelId.
         *  It returns a new levelMemory object.
         **/
        var newLevel = levelMemory.constructor.call(
            Object.create(levelMemory),
            levelData
        );
        this.levels[levelData.levelId] = newLevel;
        return newLevel;
    },
    recordData: function (data){
        /**
         *  This function takes in map data from the server and records it
         *      in its appropriate level. This includes creating new level
         *      memory objects.
         *  It does not return a value.
         **/
        var levelId = data.levelId;
        var recalledLevel = this.getLevel(levelId);
        if(!recalledLevel){
            recalledLevel = this.recordLevel(data);
        }
        if(data.tiles){
            recalledLevel.recordView(
                data,
                client.drivers.gameplay.memory.currentTime
            );
        }
    },
    dispose: function (){
        // TODO: Implement. Clean up references.
    }
};
// ============================================================================
    return memory;
})();