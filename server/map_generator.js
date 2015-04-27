

/*==============================================================================
  
    The level generator is a scaffold to create new proceedurally generated
    levels. It is private to the mapManager, and is only accessed through the
    method mapManager.generateLevel. Further, the only method of the generator
    accessed by the map manager is the generate method; everything else is
    private to the levelGenerator.
    
    The levelGenerator is a prototype. To use it, you must create a new
    instance, and call generate with the parameters for the new level:
        {
            id: 'string', // Optional. The name of this level.
            width: integer, // Optional.
            height: integer, // Optional.
            roomSideMax: integer, // Optional.
            roomSideMin: integer, // Optional.
            hallLengthMax: integer, // Optional.
            hallLengthMin: integer, // Optional.
            placeStairsUp: boolean, // Optional, true by default.
            placeStairsDown: boolean, // Optional, true by default.
        }
    It returns a new level object, ready for use.

==============================================================================*/

mapManager.generateLevel = (function (){
//== Map Generator Namespace ===================================================
var accessFunction = function (depth, options){
    /**
        This function proceedurally generates a new level with the supplied
        parameters:
            {
                id: 'string', // Optional. The name of this level.
                width: integer, // Optional.
                height: integer, // Optional.
                roomSideMax: integer, // Optional.
                roomSideMin: integer, // Optional.
                hallLengthMax: integer, // Optional.
                hallLengthMin: integer, // Optional.
            }
        It returns a new level object, ready for use.
    **/
    var prototypeOptions = {};
    if(options){
        prototypeOptions = options;
    } else{
        prototypeOptions.depth = depth;
        prototypeOptions.roomSideMax = Math.min(10, (5+depth));
        prototypeOptions.roomSideMin = Math.min(6, (2+depth));
        prototypeOptions.hallLengthMax = 20;
        prototypeOptions.hallLengthMin = 7;
        prototypeOptions.width = Math.min(64, displaySize+(depth-1)*15);
        prototypeOptions.height = Math.min(64, displaySize+(depth-1)*15);
        if(depth == 1){
            prototypeOptions.placeStairsUp = false;
        }
    }
    var generator = Object.create(protoLevel);
    var newLevel = generator.generate(prototypeOptions);
    return newLevel;
};
var protoLevel = {
    roomSideMax: 7,
    roomSideMin: 3,
    hallLengthMax: 20,
    hallLengthMin: 7,
    width: displaySize,
    height: displaySize,
    depth: undefined,
    placeStairsUp: true,
    placeStairsDown: true,
    //
    mapText: undefined,
    openings: undefined,
    openingsHash: undefined,
    rooms: undefined,
    generate: function (options){
        // Configure generation options and defaults.
        this.roomSideMax = options.roomSideMax || this.roomSideMax;
        this.roomSideMin = options.roomSideMin || this.roomSideMin;
        this.hallLengthMax = options.hallLengthMax || this.hallLengthMax;
        this.hallLengthMin = options.hallLengthMin || this.hallLengthMin;
        this.width = options.width || this.width;
        this.height = options.height || this.height;
        this.depth = options.depth || this.depth;
        if(options.placeStairsUp   !== undefined){
            this.placeStairsUp   = options.placeStairsUp;}
        if(options.placeStairsDown !== undefined){
            this.placeStairsDown = options.placeStairsDown;}
        var assignedId = options.id;
        if(assignedId === undefined){
            assignedId = 'Random Level: '+(1000+Math.floor(Math.random()*9000));
        }
        // Generate blank map block.
        this.mapText = '';
        for(var posY = 0; posY < this.width; posY++){
            for(var posX = 0; posX < this.width; posX++){
                //var compoundIndex = posY*this.width + posX;
                if(posY===0 || posX===0 || posY==this.width-1 || posX==this.height-1){
                    this.mapText += '#';
                } else{
                    this.mapText += '%';
                }
            }
        }
        // Prep open nodes lists.
        this.openings = [];
        this.openingsHash = {};
        this.rooms = [];
        // Randomly place First Room.
        var upRoom;
        var tries = 100;
        var startX;
        var startY;
        while(tries-- > 0){
            if(!options.startX || options.startX >= this.width-1){
                startX = 1+Math.floor(Math.random()*(this.width -2));
            } else{
                startX = options.startX;
            }
            if(!options.startY || options.startY >= this.height-1){
                startY = 1+Math.floor(Math.random()*(this.height-2));
            } else{
                startY = options.startY;
            }
            var roomDirection = arrayPick([NORTH,SOUTH,EAST,WEST]);
            var roomDimentions = this.placeRoom(startX, startY, roomDirection);
            if(roomDimentions){
                upRoom = roomDimentions;
                this.rooms.push(roomDimentions);
                break;
            }
        }
        // Place More Rooms and Halls
        this.halls = [];
        while(this.openings.length){
            var opening = arrayPick(this.openings);
            var rotatedCoords = this.getCoordsRotate(opening.x, opening.y, 1, 0, opening.direction);
            if(Math.random() > 1/4 && false){
                this.closeOpening(opening.x, opening.y, '#');
            } else if(Math.random() < 1/2){ // Place Hall
                var hallDimentions = this.placeHall(opening.x, opening.y, opening.direction);
                if(hallDimentions){
                    this.halls.push(hallDimentions);
                } else{
                    this.closeOpening(opening.x, opening.y, '#');
                }
            } else{ // Place Room
                var roomDimentions = this.placeRoom(rotatedCoords[0], rotatedCoords[1], opening.direction);
                if(roomDimentions){
                    this.rooms.push(roomDimentions);
                } else{
                    this.closeOpening(opening.x, opening.y, '#');
                }
            }
        }
        // Pick room to be companion (other goblin) room.
        var cRoom;
        if(this.rooms.length === 1){ cRoom = this.rooms[0];}
        else{
            crIndex = randomInterval(1, this.rooms.length-1);
            cRoom = this.rooms[crIndex];
        }
        // Place stairs, down and up.
        var stairsUpX;
        var stairsUpY;
        var stairsDownX;
        var stairsDownY;
        if(this.placeStairsUp){
            stairsUpX = startX;
            stairsUpY = startY;
            this.setTile(stairsUpX, stairsUpY, '<');
        }
        if(this.placeStairsDown){
            var downRoom;
            do{
                downRoom = arrayPick(this.rooms);
            } while(this.rooms.length > 1 && downRoom == upRoom);
            stairsDownX = randomInterval(0, downRoom.width -1) + downRoom.x;
            stairsDownY = randomInterval(0, downRoom.height-1) + downRoom.y;
            this.setTile(stairsDownX, stairsDownY, '>');
        }
        // Create copy of generic type types hash. TODO: Refactor This.
        var tileTypes = {};
        for(var key in genericTileTypes){
            tileTypes[key] = genericTileTypes[key];
        }
        // Create new level, fill it with tiles, return it.
        var newLevel = level.constructor.call(Object.create(level), this.width, this.height);
        newLevel.depth = this.depth;
        newLevel.id = assignedId;
        mapManager.registerLevel(newLevel);
        newLevel.tileTypes = tileTypes;
        newLevel.startCoords = {x: startX, y: startY};
        newLevel.stairsUpCoords = {x: stairsUpX, y: stairsUpY};
        newLevel.stairsDownCoords = {x: stairsDownX, y: stairsDownY};
        for(var posY = 0; posY < this.width; posY++){
            for(var posX = 0; posX < this.width; posX++){
                //var compoundIndex = posY*this.width + posX;
                var indexedCharacter = this.getTile(posX, posY);
                var tileType = tileTypes[indexedCharacter];
                if(!tileType){
                    tileType = tileTypes[0];
                }
                newLevel.placeTile(posX, posY, tileType);
            }
        }
        // TODO: Remove this
        var mapString = '';
        for(var I = this.height-1; I >= 0; I--){
            var S = this.mapText.substring(I*this.width, (I+1)*this.width);
            mapString += S+'\n';
        }
        //console.log(mapString);
        // Fill Level with Enemies:
        var enemyPoints = (this.width * this.height * this.depth) / 128; // TODO: MAGIC NUMBERS! Enemy Density.
        enemyPoints *= 10; // TODO: MAGIC NUMBERS! 100 to go up a level, 10 points per enemy per level.
        while(enemyPoints >= 10/* && this.rooms.length > 1*/){
            var mean = this.depth*10;
            var attemptedWeight = Math.max(5, Math.round(gaussRandom(mean, mean/3)));
            var enemyPrototype = modelLibrary.getModelByWeight('enemy', attemptedWeight);
            var actualWeight = enemyPrototype.generationWeight;
            if(!enemyPrototype){
                break;
            }
            enemyPoints -= actualWeight;
            var randomEnemy = Object.instantiate(enemyPrototype);
            var placed = false;
            while(!placed){
                /*var randomRoom = arrayPick(this.rooms);
                if(randomRoom == upRoom){
                    continue;
                }
                var xPos = randomRoom.x + randomInterval(0,randomRoom.width-1);
                var yPos = randomRoom.y + randomInterval(0,randomRoom.height-1);
                */
                var xPos = randomInterval(1, this.width-1);
                var yPos = randomInterval(1, this.height-1);
                if(
                    (xPos >= upRoom.x && xPos <= upRoom.x+upRoom.width) &&
                    (yPos >= upRoom.y && yPos <= upRoom.y+upRoom.height)
                ){ continue;}
                if(
                    (xPos >= cRoom.x && xPos <= cRoom.x+cRoom.width) &&
                    (yPos >= cRoom.y && yPos <= cRoom.y+cRoom.height)
                ){ continue;}
                var eTile = mapManager.getTile(xPos, yPos, newLevel.id);
                if(eTile.id != 'floor' && eTile.id != 'hall'){ continue;}
                placed = randomEnemy.place(xPos, yPos, newLevel.id);
            }
        }
        // Fill Level with Items:
        var itemPoints = (this.width * this.height * this.depth) / 80; // TODO: MAGIC NUMBERS! Item Density.
        while(itemPoints >= 0 && this.rooms.length > 1){
            var iMean = this.depth;
            var iAttemptedWeight = Math.max(1, Math.round(gaussRandom(iMean, iMean/3)));
            var itemPrototype = modelLibrary.getModelByWeight('item', iAttemptedWeight);
            if(!itemPrototype){
                break;
            }
            var iActualWeight = itemPrototype.generationWeight;
            itemPoints -= iActualWeight;
            var randomItem = Object.instantiate(itemPrototype);
            var iPlaced = false;
            while(!iPlaced){
                //var iRandomRoom = arrayPick(this.rooms);
                var iXPos = randomInterval(1, this.width-1);
                var iYPos = randomInterval(1, this.height-1);
                //var iXPos = iRandomRoom.x + randomInterval(0,iRandomRoom.width-1);
                //var iYPos = iRandomRoom.y + randomInterval(0,iRandomRoom.height-1);
                var iTile = mapManager.getTile(iXPos, iYPos, newLevel.id);
                if(iTile.id != 'floor' && iTile.id != 'hall'){ continue;}
                iPlaced = randomItem.place(iXPos, iYPos, newLevel.id);
            }
        }
        // TODO: Temp code, remove.
        var createC = function (index){
            var cPrototype = companion;
            var C = cPrototype.constructor.call(Object.create(cPrototype));
            var cPlaced = false;
            var tries = 100;
            while(!cPlaced && tries > 0){
                tries--;
                var crx = randomInterval(cRoom.x, cRoom.x+cRoom.width );
                var cry = randomInterval(cRoom.y, cRoom.y+cRoom.height);
                cPlaced = C.place(crx, cry, newLevel.id);
            }
            if(!cPlaced){
                while(!C.place(randomInterval(0,31),randomInterval(0,31),newLevel.id)){}
            }
        };
        var Cs = 1;
        for(var cI = 0; cI < Cs; cI++){
            createC(cI);
        }
        var tPrototype = Object.create(trap, {
            color: {value: 'black', writable:true},
            background: {value: 'white', writable:true},
            hidden: {value: false, writable: true},
            character: {value: 'x', writable: true},
            trigger: {value: function (trogger){
                if(this.triggered){
                    return;
                }
                if(trogger.faction != FACTION_GOBLIN){
                    return;
                }
                this.triggered = true;
                //this.character = 'X';
                trogger.inform("Thou hast troggered!");
            }}
        });
        var createT = function (index){
            var T = tPrototype.constructor.call(Object.create(tPrototype));
            var tries = Infinity;
            for(var tI = 0; tI < tries; tI++){
                var randX = randomInterval(0, this.width);
                var randY = randomInterval(0, this.height);
                var tileContents = mapManager.getTileContents(randX, randY, newLevel.id);
                if(tileContents.length){ continue;}
                var success = T.place(randX, randY, newLevel.id);
                if(success){
                    return;
                }
            }
        };
        var Ts = 0;
        for(var I = 0; I < Ts; I++){
            createT.call(this, I);
        }
        // --
        // Close all doors near goblins
        var closeRooms = [upRoom, cRoom];
        for(var roomIndex = 0; roomIndex < closeRooms.length; roomIndex++){
            var iRoom = closeRooms[roomIndex];
            for(var rPosY = iRoom.y-1; rPosY < iRoom.y+iRoom.height+1; rPosY++){
                for(var rPosX = iRoom.x-1; rPosX < iRoom.x+iRoom.width+1; rPosX++){
                    var rTile = mapManager.getTile(rPosX, rPosY, newLevel.id);
                    if(rTile.id == 'doorOpen'){
                        rTile.toggleDoor(rPosX, rPosY, newLevel.id);
                    }
                }
            }
        }
        return newLevel;
    },
    getCoordsRotate: function (x1, y1, x2, y2, direction){
        // Functional
        switch (direction){
            case NORTH:
                return [x1-y2, y1+x2];
            case WEST:
                return [x1-x2, y1-y2];
            case SOUTH:
                return [x1+y2, y1-x2];
            default: // Also east, by default.
                return [x1+x2, y1+y2];
        }
    },
    getDirectionRotate: function (oldDirection, rotateDirection){
        // Functional
        var oldDegrees = 0;
        //var rotateDegrees = 0;
        switch(oldDirection){
            case EAST     : oldDegrees =   0; break;
            case NORTHEAST: oldDegrees =  45; break;
            case NORTH    : oldDegrees =  90; break;
            case NORTHWEST: oldDegrees = 135; break;
            case WEST     : oldDegrees = 180; break;
            case SOUTHWEST: oldDegrees = 225; break;
            case SOUTH    : oldDegrees = 270; break;
            case SOUTHEAST: oldDegrees = 315; break;
        }
        switch(rotateDirection){
            case EAST     : rotateDegrees =   0; break;
            case NORTHEAST: rotateDegrees =  45; break;
            case NORTH    : rotateDegrees =  90; break;
            case NORTHWEST: rotateDegrees = 135; break;
            case WEST     : rotateDegrees = 180; break;
            case SOUTHWEST: rotateDegrees = 225; break;
            case SOUTH    : rotateDegrees = 270; break;
            case SOUTHEAST: rotateDegrees = 315; break;
        }
        var newDegrees = oldDegrees + rotateDegrees;
        while(newDegrees >= 360){
            newDegrees -= 360;
        }
        if(newDegrees >=   0 && newDegrees <  22){ return EAST     ;}
        if(newDegrees >=  22 && newDegrees <  67){ return NORTHEAST;}
        if(newDegrees >=  67 && newDegrees < 112){ return NORTH    ;}
        if(newDegrees >= 112 && newDegrees < 157){ return NORTHWEST;}
        if(newDegrees >= 157 && newDegrees < 202){ return WEST     ;}
        if(newDegrees >= 202 && newDegrees < 247){ return SOUTHWEST;}
        if(newDegrees >= 247 && newDegrees < 292){ return SOUTH    ;}
        if(newDegrees >= 292 && newDegrees < 337){ return SOUTHEAST;}
        if(newDegrees >= 337 && newDegrees < 360){ return EAST     ;}
        return 0;
    },
    getTile: function (x, y){
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return ' ';
        }
        var compoundIndex = y*this.width + x;
        return this.mapText.charAt(compoundIndex);
    },
    setTile: function (x, y, newValue){
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return undefined;
        }
        var compoundIndex = y*this.width + x;
        var halfFirst  = this.mapText.substring(0,compoundIndex);
        var halfSecond = this.mapText.substring(compoundIndex+1);
        this.mapText = halfFirst+newValue+halfSecond;
        return newValue;
    },
    placeRoom: function (x, y, direction){
        /**
         *  Return null if the room could not be placed, a room with the
         *      following structure if placement is successful:
         *      {
         *          x: integer,
         *          y: integer,
         *          width: integer,
         *          height: integer
         *      }
         **/
        if(!direction){
            direction = arrayPick([EAST,WEST,NORTH,SOUTH]);
        }
        var max = this.roomSideMax-1;
        var min = -(this.roomSideMax-1);
        var intervals = [];
        // Determine dimensions of room to fit within given space.
        for(var testDepth = 0; testDepth < this.roomSideMax; testDepth++){
            var testInterval = [max,min];
            var turnedCoords = this.getCoordsRotate(x, y, testDepth, 0, direction);
            var testTile = this.getTile(turnedCoords[0],turnedCoords[1]);
            if(testTile != '%'){
                break;
            }
            for(var testBreadth = 0; testBreadth <= max; testBreadth++){
                turnedCoords = this.getCoordsRotate(x, y, testDepth, testBreadth, direction);
                testTile = this.getTile(turnedCoords[0],turnedCoords[1]);
                if(testTile != '%'){
                    max = testBreadth-1;
                    testInterval[0] = testBreadth-1;
                    break;
                }
            }
            for(testBreadth = -1; testBreadth >= min; testBreadth--){
                turnedCoords = this.getCoordsRotate(
                    x, y, testDepth, testBreadth, direction);
                testTile = this.getTile(turnedCoords[0],turnedCoords[1]);
                if(testTile != '%'){
                    min = testBreadth+1;
                    testInterval[1] = testBreadth+1;
                    break;
                }
            }
            if(1+testInterval[0]-testInterval[1] < this.roomSideMin){
                break;
            }
            intervals.push(testInterval);
        }
        //
        if(intervals.length < this.roomSideMin){
            return null;
        }
        //
        var wallIndex = randomInterval(this.roomSideMin-1, intervals.length-1);
        var wallDepth = wallIndex+1;
        var wallInterval = intervals[wallIndex];
        var intervalLength = 1+wallInterval[0]-wallInterval[1];
        var wallBreadth = randomInterval(
            this.roomSideMin, Math.min(this.roomSideMax,intervalLength));
        var cornerMaxOffset = Math.min(wallBreadth-1, wallInterval[0]);
        var cornerMinOffset = Math.max(0, -1+wallBreadth+wallInterval[1]);
        var cornerBreadthOffset = randomInterval(cornerMaxOffset, cornerMinOffset);
        var backStep = this.getCoordsRotate(x, y, -1, 0, direction);
        var doorPlaced = this.placeDoor(backStep[0], backStep[1]);
        // Collect Info about room coordinates and size.
        var minX = Infinity;
        var maxX = -Infinity;
        var minY = Infinity;
        var maxY = -Infinity;
        // Place room: floor, open nodes on sides, and blocks at corners.
        for(var posDepth = -1; posDepth < wallDepth+1; posDepth++){
            for(var posBreadth = -1; posBreadth < wallBreadth+1; posBreadth++){
                var offsetX = posDepth;
                var offsetY = cornerBreadthOffset - posBreadth;
                var turnedCoords = this.getCoordsRotate(x, y, offsetX, offsetY, direction);
                // Skip the door, which was placed earlier.
                if(
                    doorPlaced &&
                    turnedCoords[0] == backStep[0]
                    && turnedCoords[1] == backStep[1]
                ){ continue;}
                // Place walls at corners.
                if(
                    posDepth == -1        && posBreadth == -1          ||
                    posDepth == wallDepth && posBreadth == -1          ||
                    posDepth == -1        && posBreadth == wallBreadth ||
                    posDepth == wallDepth && posBreadth == wallBreadth
                ){ 
                    this.setTile(turnedCoords[0], turnedCoords[1], '#' );
                // Place open nodes along the sides.
                } else if(posDepth   == -1         ){
                    var turnedDirection = this.getDirectionRotate(direction, WEST );
                    this.placeOpening(turnedCoords[0], turnedCoords[1], turnedDirection );
                } else if(posDepth   == wallDepth  ){
                    var turnedDirection = this.getDirectionRotate(direction, EAST );
                    this.placeOpening(turnedCoords[0], turnedCoords[1], turnedDirection );
                } else if(posBreadth == -1         ){
                    var turnedDirection = this.getDirectionRotate(direction, NORTH);
                    this.placeOpening(turnedCoords[0], turnedCoords[1], turnedDirection);
                } else if(posBreadth == wallBreadth){
                    var turnedDirection = this.getDirectionRotate(direction, SOUTH);
                    this.placeOpening(turnedCoords[0], turnedCoords[1], turnedDirection);
                // Place floor in center. Record dimentions.
                } else{
                    if(     turnedCoords[0] < minX){ minX = turnedCoords[0]}
                    else if(turnedCoords[0] > maxX){ maxX = turnedCoords[0]}
                    if(     turnedCoords[1] < minY){ minY = turnedCoords[1]}
                    else if(turnedCoords[1] > maxY){ maxY = turnedCoords[1]}
                    this.setTile(turnedCoords[0], turnedCoords[1], '.' );
                }
            }
        }
        // Return basic room info.
        var roomInfo = {
            x: minX,
            y: minY,
            width: (maxX-minX)+1,
            height: (maxY-minY)+1
        };
        return roomInfo;
    },
    placeHall: function (x, y, direction){
        /**
         *  Return null if the room could not be placed, a room with the
         *  following structure if placement is successful:
         *      {
         *          x: integer,
         *          y: integer,
         *          width: integer,
         *          height: integer
         *      }
         **/
        if(!direction){
            direction = arrayPick([EAST,WEST,NORTH,SOUTH]);
        }
        var max = this.hallLengthMax;
        var min = this.hallLengthMin;
        // Go forward young @!
        // Lay out tiles in middle and on sides.pla
        // If something encountered, stop.
        var currentStep = [x,y];
        var nextStep;
        var hallCount = randomInterval(min, max);
        var path = [];
        path.push(currentStep);
        while(hallCount){
            hallCount--;
            nextStep = this.getCoordsRotate(currentStep[0], currentStep[1], 1, 0, direction);
            currentStep = nextStep;
            if(!nextStep){
                hallCount = 0;
                break;
            }
            if(this.getTile(nextStep[0], nextStep[1]) == '%'){
                path.push(nextStep);
            } else if(this.getOpening(nextStep[0], nextStep[1])){
                path.push(nextStep);
                hallCount = 0;
                break;
            } else{
                hallCount = 0;
                break;
            }
        }
        if(path.length >= min+1){ // Plus 1 for innitial door, which is handled in the path.
            for(var pathI = 0; pathI < path.length; pathI++){
                var pathStep = path[pathI];
                var leftDir = this.getDirectionRotate(direction, NORTH);
                var leftWall = this.getCoordsRotate(pathStep[0], pathStep[1], 1, 0, leftDir);
                var rightDir = this.getDirectionRotate(direction, SOUTH);
                var rightWall = this.getCoordsRotate(pathStep[0], pathStep[1], 1, 0, rightDir);
                if(pathI === 0){
                    this.placeOpening(pathStep[0], pathStep[1], this.getDirectionRotate(direction, WEST), true);
                    this.closeOpening(leftWall[0], leftWall[1], '#');
                    this.closeOpening(rightWall[0], rightWall[1], '#');
                } else if(pathI == path.length-1){
                    this.placeOpening(pathStep[0], pathStep[1], direction, true);
                    this.closeOpening(leftWall[0], leftWall[1], '#');
                    this.closeOpening(rightWall[0], rightWall[1], '#');
                } else{
                    this.setTile(pathStep[0], pathStep[1], ' ');
                    this.placeOpening(leftWall[0], leftWall[1], leftDir, false, true);
                    this.placeOpening(rightWall[0], rightWall[1], rightDir, false, true);
                }
            }
        } else{ // Place Wall at innitial door location.
            var firstStep = path[0];
            this.closeOpening(firstStep[0], firstStep[1],'#');
        }
        // return roomInfo;
        return true;
    },
    getOpening: function (x, y){
        return this.openingsHash[''+x+','+y];
    },
    closeOpening: function (x, y, newValue){
        var opening = this.getOpening(x, y);
        if(!opening){
            this.setTile(x, y, newValue);
            return;
        }
        this.openings.splice(this.openings.indexOf(opening), 1);
        this.openingsHash[opening.index] = undefined;
        if(newValue){
            this.setTile(x, y, newValue);
        }
    },
    placeOpening: function (x, y, direction, forceDoor, hall){
        var oldOpening = this.getOpening(x, y);
        var newDirection = direction;
        if(oldOpening){
            newDirection |= oldOpening.direction;
        }
        var oldTile = this.getTile(x, y);
        if(!oldOpening){
            if(forceDoor && oldTile == '#'){
                var nextCoords = this.getCoordsRotate(x, y, 1, 0, direction);
                var nextTile = this.getTile(nextCoords[0], nextCoords[1]);
                if(nextTile == '.'){
                    this.placeDoor(x, y, true);
                    return;
                } else{
                    return;
                }
            }
            else if(oldTile != '%'){
                return;
            }
        }
        switch(newDirection){
            case NORTHEAST:
            case NORTHWEST:
            case SOUTHEAST:
            case SOUTHWEST:
                this.closeOpening(x, y, '#');
                return;
            case 3: // NORTH+SOUTH
            case 12: // EAST+WEST
                if(forceDoor && oldOpening.hall || hall && oldOpening.forceDoor){ // Connect Hallways
                    this.closeOpening(x, y, ' ');
                    return;
                }
                var force = forceDoor || oldOpening.forceDoor;
                if(force || Math.random()*32 > 31){ // TODO: MAGIC NUMBERS!
                    this.placeDoor(x, y, true);
                } else{
                    this.closeOpening(x, y, '#');
                }
                return;
        }
        var opening = {
            x: x,
            y: y,
            direction: newDirection,
            index: ''+x+','+y,
            forceDoor: (forceDoor? forceDoor: false),
            hall: (hall? hall : false)
        };
        this.openings.push(opening);
        this.openingsHash[opening.index] = opening;
        this.setTile(x, y, ''+newDirection);
    },
    placeDoor: function (x, y, force){
        var selfOpening = this.getOpening(x, y);
        if(!selfOpening && !force){
            return false;
        }
        //
        var tileNorth = this.getTile(x  , y+1);
        var tileSouth = this.getTile(x  , y-1);
        var tileEast  = this.getTile(x+1, y  );
        var tileWest  = this.getTile(x-1, y  );
        if(tileNorth=='+' || tileNorth=="'" ||
           tileSouth=='+' || tileSouth=="'" ||
           tileEast =='+' || tileEast =="'" ||
           tileWest =='+'||  tileWest =="'"){
            this.closeOpening(x, y, '#');
            return false;
        }
        //
        var testOpening = this.getOpening(x+1, y  );
        if(testOpening){ this.closeOpening(x+1, y  , '#');}
        testOpening = this.getOpening(x-1, y  );
        if(testOpening){ this.closeOpening(x-1, y  , '#');}
        testOpening = this.getOpening(x  , y+1);
        if(testOpening){ this.closeOpening(x  , y+1, '#');}
        testOpening = this.getOpening(x  , y-1);
        if(testOpening){ this.closeOpening(x  , y-1, '#');}
        if(Math.random() > 1/3){
            this.closeOpening(x, y, '+');
        } else{
            this.closeOpening(x, y, "'");
        }
        return true;
    }
};
//== Close generator namespace =================================================
    return accessFunction;
})();