

/*===========================================================================
 *
 *  TODO: Document.
 *
 *===========================================================================*/

var level = {
    id: undefined,
    width: undefined,
    height: undefined,
    tileTypes: undefined,
    tileGrid: undefined,
    tileContentsGrid: undefined,
    stairsUpCoords: undefined,
    stairsDownCoords: undefined,
    initializer: function (width, height){
        // TODO: Document.
        this.width = width;
        this.height = height;
        this.tileGrid = [];
        this.tileContentsGrid = [];
        return this;
    },
    dispose: function (){
        var disposeOrder = function (oldContent){
            oldContent.dispose();
        };
        for(var posY = 0; posY < this.height; posY++){
            for(var posX = 0; posX < this.width; posX++){
                var tileContents = this.getTileContents(posX, posY);
                tileContents.forEach(disposeOrder);
            }
        }
        this.tileTypes = undefined;
        this.tileGrid = undefined;
        this.tileContentsGrid = undefined;
        mapManager.cancelLevel(this);
        this.id = null;
    },
    getTile: function (x, y){
        /**
            This function is used to get the tile referenced by a the given coordinates.
            Tiles are shared objects, and one tile object can be referenced
                at a multitude of coordinates.
            It returns the referenced tile if it is found, and undefined if no
                tile is referenced at those coordinates or the coordinates supplied
                are outside the level's dimensions.
         **/    
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return undefined;
        }
        var compoundIndex = y*this.width + x;
        return this.tileGrid[compoundIndex];
    },
    placeTile: function (x, y, tile){
        /**
            This function is used to place a tile at specific coordinates on
                this level.
            Tiles are shared objects, and one tile object can be referenced
                at a multitude of coordinates.
            It returns true if the placement is successful, and false otherwise.
         **/    
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return false;
        }
        var compoundIndex = y*this.width + x;
        this.tileGrid[compoundIndex] = tile;
        return true;
    },
    getTileContents: function (x, y, onlyFirst){
        /**
            This function is used to obtain an array of objects contained by
                the tile referenced at the supplied coordinates. Optionally,
                it can return only the first object.
            Tile contents are implemented as a linked list, so the function
                finds the first object referenced, and then loops through the
                linked list to find all other objects in this location.
            It returns:
                An array of all containable objects at the supplied coordinates,
                    or an empty array if there are no objects.
                The first object of type containable at this location, if
                    "onlyFirst" is true, or undefined if there is no object.
                An empty array or undefined (onlyFirst) if the supplied
                    coordinates are outside the dimentions of this level.
         **/
        var contents = [];
        // Fail if coordinates supplied are outside this level's dimentions.
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return (onlyFirst? undefined : contents);
        }
        var compoundIndex = y*this.width + x;
        var firstContent = this.tileContentsGrid[compoundIndex];
        if(onlyFirst){ return firstContent;}
        while(firstContent){
            if(firstContent == firstContent.nextContent){
                break;
            }
            contents.push(firstContent);
            firstContent = firstContent.nextContent;
        }
        return contents;
    },
    placeContainable: function (x, y, content){
        /**
            This function is used to place or move containable objects on the
                map. It takes into account the density of tiles and their
                contents.
            TODO: Take into account movement flags, such as water.
            It handles movement between any two locations on any two levels.
            Tile contents are handled via linked lists, so this function
                first removes an object from it's old linked list, and
                then adds it to the new linked list, starting a new one
                if necessary.
            Contents lists are maintained with actors at the front of the list.
                Because of this, new actors are always added at the head, while
                non actors are added to the tail.
            It returns true if the placement is successful and false otherwise.
         **/
        // Fail if no tile is found at supplied coordinates.
        var containerTile = this.getTile(x, y);
        if(!containerTile){
            return false;
        }
        // Fail if the tile will not permit the content to enter (perhaps
        // because of density.
        if(!containerTile.enter(content, x, y)){
            return false;
        }
        // Check if content is a stackable item with a stack already on tile.
        var contents = this.getTileContents(x, y);
        if(content.stackable && !content.dense){
            // Projectiles are dense while flying.
            for(var stackI = 0; stackI < contents.length; stackI++){
                var indexedStack = contents[stackI];
                if(indexedStack.name == content.name){
                    indexedStack.stack(content);
                    return true;
                }
            }
        }
        // Fail if content is dense, and the tile has dense contents.
        var contents = this.getTileContents(x, y);
        if(content.dense){
            var denseFound = false;
            for(var contentIndex = 0; contentIndex < contents.length; contentIndex++){
                var indexedContent = contents[contentIndex];
                if(indexedContent.dense){
                    denseFound = indexedContent;
                    break;
                }
            }
            if(denseFound){
                content.bump(denseFound);
                //denseFound.bumped(content);
                return false;
            }
        }
        // Remove content from its old linked list, and repair said list.
        //var oldLevelId = content.levelId;
        content.unplace();
        // Change content's coordinates to reflect new placement.
        content.levelId = this.id;
        content.x = x;
        content.y = y;
        /* Add content to new linked list, adding at the head if the content
            has placement priority. Otherwise, adding at the tail. */
        contents = this.getTileContents(x, y);
        if(!contents.length){
            // There is nothing here. Place as new head.
            var compoundIndex = y*this.width + x;
            this.tileContentsGrid[compoundIndex] = content;
        } else if(content.type == TYPE_ACTOR){
            // Find head of new linked list, attach it as a tail on content.
            var firstContent = this.getTileContents(x, y, true);
            content.nextContent = firstContent;
            var compoundIndex = y*this.width + x;
            this.tileContentsGrid[compoundIndex] = content;
        } else{
            // Find tail of new linked list, and add content to it.
            if(contents.length){
                var lastContent = contents[contents.length-1];
                lastContent.nextContent = content;
            }
        }
        return true;
    },
    unplaceContainable: function (content){
        /**
            This function removes the containable from the level. This allows
                it to be placed in the player's inventory, into a shop, a
                chest, or prepared for garbage collection, etc.
            It returns true if the containable is not placed longer placed on
                this level. (I see no current reason this shouldn't always be
                true).
         **/
        // Skip if content is not on this level, or is not located on a tile.
        if(content.levelId != this.id){ return true;}
        var containerTile = this.getTile(content.x, content.y);
        if(!containerTile){ return true;}
        // Remove content from linked list, repair list.
        if(isFinite(content.x) && isFinite(content.y)){
            var oldHead = this.getTileContents(content.x, content.y, true);
            if(oldHead == content){ // This is a head.
                var oldCompoundIndex = content.y*this.width + content.x;
                this.tileContentsGrid[oldCompoundIndex] = content.nextContent;
                content.nextContent = undefined;
            } else{ // This was not the head.
                while(oldHead){
                    if(oldHead.nextContent == content){
                        oldHead.nextContent = content.nextContent;
                        content.nextContent = undefined;
                        break;
                    }
                    oldHead = oldHead.nextContent;
                }
            }
        }
        // Return a successful message.
        return true;
    },/*
    getLine: function (x1, y1, x2, y2){
        // TODO: Document.
        var line = [];
        var rise = y2 - y1;
        var run = x2 - x1;
        var directionRise = rise? Math.abs(rise)/rise : 0;
        var directionRun = run? Math.abs(run)/run : 0;
        if(!run){ // Vertical
            if(!rise){ return line;} // Stationary
            for(var index = 0; index <= Math.abs(rise); index++){
                line.push([{x: x1, y: y1+index*directionRise}]);
            }
            return line;
        }
        var slope = (y2-y1)/(x2-x1);
        if(Math.abs(slope) == 1){ // Diagonal
            for(var index = 0; index <= Math.abs(rise); index++){
                line.push([{
                    x: x1+index*directionRun,
                    y: y1+index*directionRise
                }]);
            }
        } else if(Math.abs(slope) < 1){ // X primary
            var interceptY = y1 - slope*(x1);
            for(var index = 0; index <= Math.abs(run); index++){
                var column = x1+(index*directionRun);
                var y = slope*column+interceptY;
                var yRound = Math.round(y);
                if(Math.abs(y - yRound) < 0.0001){
                    y = yRound;
                }
                var yMin = Math.floor(y);
                var yMax = Math.ceil(y);
                var coord1 = {x: column, y: yMin};
                var coord2;
                if(yMin != yMax){
                    coord2 = {x: column, y: yMax};
                    line.push([coord1, coord2]);
                } else{
                    line.push([coord1]);
                }
            }
        } else{ // Y primary
            var slope = (run)/(rise);
            var interceptX = x1 - slope*(y1);
            for(var index = 0; index <= Math.abs(rise); index++){
                var row = y1+(index*directionRise);
                var x = slope*row+interceptX;
                var xRound = Math.round(x);
                if(Math.abs(x - xRound) < 0.0001){
                    x = xRound;
                }
                var xMin = Math.floor(x);
                var xMax = Math.ceil(x);
                var coord1 = {x: xMin, y: row};
                var coord2;
                if(xMin != xMax){
                    coord2 = {x: xMax, y: row};
                    line.push([coord1, coord2]);
                } else{
                    line.push([coord1]);
                }
            }
        }
        return line;
    },*/
    /*
    getRange: Does not exits!
        There is no get range function, as it would return a grid of references
        to shared tile objects. In order to get specifics of the tiles, such as
        coordinates or contents, you'd first have to reverse engineer the x and
        y coordinates from the returned array's indexes.
     */
    getRangeContents: function (x, y, range){
        /**
            This function compiles an array of all containables within range of
            the given coordinates. The grid includes all coordinates within the
            supplied range, including the center, giving dimensions of
            (range+1+range)^2.
            
            It returns said array.
         **/
        var contents = [];
        for(var posY = y-range; posY <= y+range; posY++){
            for(var posX = x-range; posX <= x+range; posX++){
                var tileContents = this.getTileContents(posX, posY);
                for(var cI = 0; cI < tileContents.length; cI++){
                    var indexedContent = tileContents[cI];
                    contents.push(indexedContent);
                }
            }
        }
        // Return the finished contents array.
        return contents;
    },
    getRangeActors: function (x, y, range){
        /**
            This function compiles an array of all actors within range of the
            given coordinates. The grid includes all coordinates within the
            supplied range, including the center, giving dimensions of
            (range+1+range)^2.
            
            It returns said array.
         **/
        var actors = [];
        for(var posY = y-range; posY <= y+range; posY++){
            for(var posX = x-range; posX <= x+range; posX++){
                var tileContents = this.getTileContents(posX, posY);
                for(var cI = 0; cI < tileContents.length; cI++){
                    var indexedContent = tileContents[cI];
                    if(indexedContent.type == TYPE_ACTOR){
                    actors.push(indexedContent);
                    }
                }
            }
        }
        // Return the finished actors array.
        return actors;
    },
    packageSetup: function (){
        /**
            This function creates a data package to send to clients,
                potentially over a network, to alert them to certain level
                metrics needed to setup a level memory.
            Ideally, this function wouldn't be needed. A proper AI / client
                should be able to construct an accurate memory of the level as
                it is revealed, without having to know the dimensions of the
                level beforehand. This turns out to be a huge logistical hassle
                in practice, however.
            It returns a data package with the following structure:
            {
                id: 'string',
                width: integer,
                height: integer,
                tileTypes: {
                    "tile id": {
                        id: "tile_id",
                        character: "#",
                        dense: boolean,
                        opaque: boolean,
                        color: "#HEX", // optional
                        background: "#HEX" // optional
                    },
                    ... // And More tile models.
                }
            }
         **/
        // Conpile an array of tile types (tile models) used in this level.
        var tileTypesData = {};
        for(var tileKey in this.tileTypes){
            var indexedTileType = this.tileTypes[tileKey];
            var tileData = {
                id: indexedTileType.id,
                character: indexedTileType.character,
                dense: indexedTileType.dense,
                opaque: indexedTileType.opaque,
                color: indexedTileType.color,
                background: indexedTileType.background
            };
            tileTypesData[indexedTileType.id] = tileData;
        }
        // Construct and return final data package.
        var update = {
            levelId: this.id,
            width: this.width,
            height: this.height,
            tileTypes: tileTypesData
        };
        return update;
    },
    packageView: function (x, y, range){
        /**
            This function creates a "sensory data" package to transmit to
                clients, potentially over a network. This package contains
                "sensory" representations of objects - that is, only necessary
                info to identify and display the objects. This allows clients
                to behave properly with only limited knowledge of the game
                world. The package contains all tiles and containable objects
                within the supplied range of the supplied coordinates,
                including the center.
            It returns a sensory data object (package) with the following
                structure:
            {
                time: integer,
                id: 'string',
                view: {
                    width: integer,
                    height: integer,
                    tileTypes: {
                        "tile id": {
                            id: "tile_id",
                            character: "#",
                            dense: boolean,
                            opaque: boolean,
                            color: "#HEX", // optional
                            background: "#HEX" // optional
                        },
                        ... // And More tile models.
                    },
                    "tiles": [
                        {
                            id: "reference id",
                            x: integer,
                            y: integer,
                            contents: [ // optional
                                { See containable.pack for structure },
                                ... // And more contained objects.
                            ]
                        },
                        ... // And more tiles.
                    ]
                }
            }
         **/
        var viewGrid = this.getView(x, y, range);
        // Maintain a list of types of tiles seen in view.
        var tileTypesInView = {};
        // Create a view array and fill it with sensory data.
        var viewData = [];
        // Maintain min and max coordinates to determine dimentions later.
        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity;
        // Create a sensory package for each coordinate in range.
        var contentPusher = function (content, index){
            // Used in double for loop, to push content into list.
            // 'this' is the contents list.
            var contentData = content.pack();
            /*var contentData = {
                id: content.id,
                character: content.character,
                color: content.color,
                background: content.background
            }*/
            this.push(contentData);
        };
        for(var offsetY = -range; offsetY <= range; offsetY++){
            for(var offsetX = -range; offsetX <= range; offsetX++){
                viewOffsetX = offsetX + range;
                viewOffsetY = offsetY + range;
                var viewIndex = viewOffsetY*(range*2+1) + viewOffsetX;
                var indexedView = viewGrid[viewIndex];
                if(!indexedView){ continue;}
                var tileX = x+offsetX;
                var tileY = y+offsetY;
                minX = Math.min(tileX, minX);
                minY = Math.min(tileY, minY);
                maxX = Math.max(tileX, maxX);
                maxY = Math.max(tileY, maxY);
                var offsetTile = this.getTile(tileX, tileY);
                // Add a data package for each object contained in this tile.
                var contents = [];
                var offsetTileContents = this.getTileContents(tileX, tileY);
                offsetTileContents.forEach(contentPusher, contents);
                // Maintain list of unique types of tiles in view.
                if(!tileTypesInView[offsetTile.id]){
                    var tileTypeData = {
                        id: offsetTile.id,
                        character: offsetTile.character,
                        dense: offsetTile.dense,
                        opaque: offsetTile.opaque,
                        color: offsetTile.color,
                        background: offsetTile.background
                    };
                    tileTypesInView[offsetTile.id] = tileTypeData;
                }
                // Add the final tile data package to the viewData array.
                var tileData = {
                    id: offsetTile.id,
                    x: tileX,
                    y: tileY
                };
                if(contents.length){
                    tileData.contents = contents;
                }
                viewData.push(tileData);
            }
        }
        // Create and return the final sensory data package.
        var update = {
            time: gameManager.currentTime(),
            view: {
                levelId: this.id,
                width : (maxX - minX) + 1,
                height: (maxY - minY) + 1,
                tileTypes: tileTypesInView,
                tiles: viewData
            }
        };
        return update;
    }
};