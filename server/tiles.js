var tile = Object.create(mappable, {
    /**
     *  Tiles are the basic unit of map layout. Tiles determine the layout of
     *      the map, and how other mappables move about and interact with the
     *      game map in the most basic ways. They also determine line of sight.
     *  This is a prototype, and must be instanced before use.
     **/
    id: {value: undefined, writable: true},
        /*  TODO: ID needs to be renamed or refactored, as it confuses matters
            as other objects derived from the same ancestor also have ids with
            different implementations. */
    character: {value: '.', writable: true},
    dense: {value: true, writable: true},
    opaque: {value: true, writable: true},
    enter: {value: function (content){
        /**
         *  This function determines whether content is allowed to enter the
         *      tile. It handles density checks. It is also a hook for further
         *      derived tiles, such as tiles that let actors enter, but not
         *      items.
         *  Density of contained objects is handled elsewhere.
         *  It returns true if the content is allowed to enter, and false if it
         *      is not.
         **/
        // Fail if tile is dense.
        if(this.dense){ // TODO: Bug - too much recursion.
            if(!content.incorporeal){
                return false;
            }
        }
        // Movement is allowed, return true.
        return true;
    }, writable: true},
    entered: {value: function (content){
        /**
         *  Entered is a hook for further derived tiles. It is called whenever
         *      a movable enters a tile, after movement is finished. It is not
         *      called after placement, or after containables like items are
         *      placed. It can be used to create, for examples, traps that
         *      spring when the user steps on them.
         *  It does not return anything.
         **/
    }, writable: true}
});

var genericTileTypes = {
    '!': Object.create(tile, { // Testing Marker
        id: {value: 'test'},
        character: {value: 'x'},
        dense: {value: false},
        opaque: {value: false},
        color: {value: '#400'},
        background: {value: '#200'}
        //background: {value: '#111'}
    }),
    '%': Object.create(tile, { // Undefined
        id: {value: 'undefined'},
        character: {value: '%'},
        color: {value: '#08F'},
        background: {value: '#111'}
    }),
    '#': Object.create(tile, { // Wall
        id: {value: 'wall'},
        character: {value: '#'},
        background: {value: '#111'}
    }),
    '.': Object.create(tile, { // Floor
        id: {value: 'floor'},
        character: {value: '.'},
        dense: {value: false},
        opaque: {value: false},
        color: {value: '#444'},
        background: {value: '#111'}
        //background: {value: '#111'}
    }),
    ' ': Object.create(tile, { // Hall
        id: {value: 'floor2'},
        character: {value: '.'},
        dense: {value: false},
        opaque: {value: false},
        color: {value: '#222'},
        background: {value: '#000'}
        //background: {value: '#111'}
    }),
    '+': Object.create(tile, { // Door
        id: {value: 'door'},
        character: {value: '+'},
        dense: {value: true},
        color: {value: '#fc0'},
        background: {value: '#111'},
        toggleDoor: {value: function (x, y, theActor, force){
            var levelId;
            if(theActor.levelId){
                levelId = theActor.levelId;
            } else{
                levelId = theActor;
            }
            var currentLevel = mapManager.getLevel(levelId);
            if(currentLevel){
                if(!force){
                    currentLevel.placeTile(x, y, genericTileTypes["'"]);
                } else{
                    theActor.sound(
                        'crash', 10, theActor, 'A door bursts open!');
                    currentLevel.placeTile(x, y, genericTileTypes['"']);
                }
            }
            return true;
        }, writable: true}
    }),
    "'": Object.create(tile, { // Door (Open)
        id: {value: 'doorOpen'},
        character: {value: "'"},
        dense: {value: false},
        opaque: {value: false},
        color: {value: '#fc0'},
        background: {value: '#111'},
        toggleDoor: {value: function (x, y, theActor){
            var levelId;
            if(theActor.levelId){
                levelId = theActor.levelId;
                var testActor = mapManager.getTileContents(
                    x, y, theActor.levelId, true);
                if(testActor){   
                    if(testActor.dense){
                        return false;
                    }
                }
            } else{
                levelId = theActor;
            }
            var currentLevel = mapManager.getLevel(levelId);
            if(currentLevel){
                currentLevel.placeTile(x, y, genericTileTypes["+"]);
            }
            return true;
        }, writable: true}
    }),
    '"': Object.create(tile, { // Door (Open)
        id: {value: 'doorBroken'},
        character: {value: "'"},
        dense: {value: false},
        opaque: {value: false},
        color: {value: '#000'},
        background: {value: '#111'},
        toggleDoor: {value: function (x, y, theActor){
            return false;
        }, writable: true}
    }),
    '>': Object.create(tile, { // Stairs Down
        id: {value: 'stairs_down'},
        character: {value: '>'},
        background: {value: '#fc0'},
        color: {value: '#000'},
        dense: {value: false},
        opaque: {value: false},
        climb: {value: function (content){
            var currentLevel = mapManager.getLevel(content.levelId);
            var newLevel = mapManager.getDepth(currentLevel.depth+1, true);
            var placeX = newLevel.stairsUpCoords.x;
            var placeY = newLevel.stairsUpCoords.y;
            var placeId= newLevel.id;
            var success = content.place(placeX, placeY, placeId);
            var contents = mapManager.getTileContents(
                placeX, placeY, placeId);
            while(!success && contents && contents.length){
                var obstruction = contents.shift();
                var moved = false;
                for(var radius = 1; radius <= 10; radius++){
                for(var posX = placeX-radius; posX <= placeX+radius; posX++){
                for(var posY = placeY-radius; posY <= placeY+radius; posY++){
                    if(
                       posY != placeY-radius && posY != placeY+radius &&
                       posX != placeX-radius && posX != placeX+radius
                    ){ continue;}
                    moved = obstruction.place(posX, posY, placeId);
                    if(moved){ break;}}
                    if(moved){ break;}}
                    if(moved){ break;}
                }
                success = content.place(placeX, placeY, placeId);
            }
            if(!success){
                content.inform('Someone is in the way.');
                return;
            }
        // TODO: Refactor this part. There must be a better way to inform the
        //  player they have moved to a new level.
            if(content.intelligence && content.intelligence.sense){
                content.update('levelId');
                var viewData = {
                    level: newLevel.packageSetup()
                };
                content.intelligence.sense(viewData);
            }
        // --
        }, writable: true}/*,
        enter: {value: function (entrant){
            if(entrant.type != TYPE_ACTOR){
                return false;
            }
            return tile.enter.apply(this, arguments);
        }, writable: true}*/
    }),
    '<': Object.create(tile, { // Stairs Up
        id: {value: 'stairs_up'},
        character: {value: '<'},
        background: {value: '#fc0'},
        color: {value: '#000'},
        dense: {value: false},
        opaque: {value: false},
        climb: {value: function (content){
            var currentLevel = mapManager.getLevel(content.levelId);
            var newLevel = mapManager.getDepth(currentLevel.depth-1);
            if(!newLevel){
                if(content.inform){ content.inform('The way is blocked.');}
                return;
            }
            var placeX = newLevel.stairsDownCoords.x;
            var placeY = newLevel.stairsDownCoords.y;
            var placeId= newLevel.id;
            var success = content.place(placeX, placeY, placeId);
            var contents = mapManager.getTileContents(
                placeX, placeY, placeId);
            while(!success && contents && contents.length){
                var obstruction = contents.shift();
                var moved = false;
                for(var radius = 1; radius <= 10; radius++){
                for(var posX = placeX-radius; posX <= placeX+radius; posX++){
                for(var posY = placeY-radius; posY <= placeY+radius; posY++){
                    if(
                       posY != placeY-radius && posY != placeY+radius &&
                       posX != placeX-radius && posX != placeX+radius
                    ){ continue;}
                    moved = obstruction.place(posX, posY, placeId);
                    if(moved){ break;}}
                    if(moved){ break;}}
                    if(moved){ break;}
                }
                success = content.place(placeX, placeY, placeId);
            }
            if(!success){
                content.inform('Someone is in the way.');
                return;
            }
        // TODO: Refactor this part. There must be a better way to inform the
        //  player they have moved to a new level.
            if(content.intelligence && content.intelligence.sense){
                content.update('levelId');
                var viewData = {level: newLevel.packageSetup()};
                content.intelligence.sense(viewData);
            }
        // --
        }, writable: true}/*,
        enter: {value: function (entrant){
            if(entrant.type != TYPE_ACTOR){
                return false;
            }
            return tile.enter.apply(this, arguments);
        }, writable: true}*/
    })
};