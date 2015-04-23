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
            return false;
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
        character: {value: '×'},
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
        toggleDoor: {value: function (x, y, actor){
            var currentLevel = mapManager.getLevel(actor.levelId);
            if(currentLevel){
                currentLevel.placeTile(x, y, genericTileTypes["'"]);
            }
        }, writable: true}
    }),
    "'": Object.create(tile, { // Door (Open)
        id: {value: 'doorOpen'},
        character: {value: "'"},
        dense: {value: false},
        opaque: {value: false},
        color: {value: '#fc0'},
        background: {value: '#111'},
        toggleDoor: {value: function (x, y, actor){
            var currentLevel = mapManager.getLevel(actor.levelId);
            if(currentLevel){
                currentLevel.placeTile(x, y, genericTileTypes["+"]);
            }
        }, writable: true}
    }),
    '>': Object.create(tile, { // Stairs Down
        id: {value: 'stairs_down'},
        character: {value: '>'},
        dense: {value: false},
        opaque: {value: false},
        climb: {value: function (content){
            var currentLevel = mapManager.getLevel(content.levelId);
            var newLevel = mapManager.getDepth(currentLevel.depth+1, true);
            content.place(newLevel.stairsUpCoords.x,newLevel.stairsUpCoords.y,newLevel.id);
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
        }, writable: true}
    }),
    '<': Object.create(tile, { // Stairs Up
        id: {value: 'stairs_up'},
        character: {value: '<'},
        dense: {value: false},
        opaque: {value: false},
        climb: {value: function (content){
            var currentLevel = mapManager.getLevel(content.levelId);
            var newLevel = mapManager.getDepth(currentLevel.depth-1);
            if(!newLevel){
                if(content.inform){
                    content.inform('The way is blocked.');
                }
                return;
            }
            content.place(newLevel.stairsDownCoords.x,newLevel.stairsDownCoords.y,newLevel.id);
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
        }, writable: true}
    })
};