

//== Tiles =====================================================================

//-- Dependencies --------------------------------
import {Mappable} from './mappables.js';
import mapManager from './map_manager.js';

//-- Implementaton -------------------------------
class Tile extends Mappable {
    /**
     *  Tiles are the basic unit of map layout. Tiles determine the layout of
     *      the map, and how other Mappables move about and interact with the
     *      game map in the most basic ways. They also determine line of sight.
     *  This is a prototype, and must be instanced before use.
     **/
    enter(content){
        /**
         *  This function determines whether content is allowed to enter the
         *      genericTile. It handles density checks. It is also a hook for further
         *      derived tiles, such as tiles that let actors enter, but not
         *      items.
         *  Density of contained objects is handled elsewhere.
         *  It returns true if the content is allowed to enter, and false if it
         *      is not.
         **/
        // Fail if tile is dense.
        if(this.dense){
            return false;
            }
        // Movement is allowed, return true.
        return true;
    }
    entered(content){
        /**
         *  Entered is a hook for further derived tiles. It is called whenever
         *      a Movable enters a tile, after movement is finished. It is not
         *      called after placement, or after containables like items are
         *      placed. It can be used to create, for examples, traps that
         *      spring when the user steps on them.
         *  It does not return anything.
         **/
    }
}
Tile.prototype.id = undefined;
    /*  TODO: ID needs to be renamed or refactored, as it confuses matters
        as other objects derived from the same ancestor also have ids with
        different implementations. */
Tile.prototype.character = '.';
Tile.prototype.dense = true;
Tile.prototype.opaque = true;

let genericTile = new Tile();
var genericTileTypes = {
    '!': Object.extend(genericTile, { // Testing Marker
        id: 'test',
        character: 'x',
        dense: false,
        opaque: false,
        color: '#400',
        background: '#200'
        //background: '#111'
    }),
    '%': Object.extend(genericTile, { // Undefined
        id: 'undefined',
        character: '%',
        color: '#08F',
        background: '#111'
    }),
    '#': Object.extend(genericTile, { // Wall
        id: 'wall',
        character: '#',
        background: '#111'
    }),
    '.': Object.extend(genericTile, { // Floor
        id: 'floor',
        character: '.',
        dense: false,
        opaque: false,
        color: '#444',
        background: '#111'
        //background: '#111'
    }),
    ' ': Object.extend(genericTile, { // Hall
        id: 'hall',
        character: '.',
        dense: false,
        opaque: false,
        color: '#222',
        background: '#000'
        //background: '#111'
    }),
    '+': Object.extend(genericTile, { // Door
        id: 'door',
        character: '+',
        dense: true,
        color: '#fc0',
        background: '#111',
        toggleDoor(x, y, theActor, force){
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
        }
    }),
    "'": Object.extend(genericTile, { // Door (Open)
        id: 'doorOpen',
        character: "'",
        dense: false,
        opaque: false,
        color: '#fc0',
        background: '#111',
        toggleDoor(x, y, theActor){
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
        }
    }),
    '"': Object.extend(genericTile, { // Door (Open)
        id: 'doorBroken',
        character: "'",
        dense: false,
        opaque: false,
        color: '#000',
        background: '#111',
        toggleDoor(x, y, theActor){
            return false;
        }
    }),
    '>': Object.extend(genericTile, { // Stairs Down
        id: 'stairs_down',
        character: '>',
        background: '#fc0',
        color: '#000',
        dense: false,
        opaque: false,
        climb(content){
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
        }/*,
        enter(entrant){
            if(entrant.type != TYPE_ACTOR){
                return false;
            }
            return Tile.prototype.enter.apply(this, arguments);
        }*/
    }),
    '<': Object.extend(genericTile, { // Stairs Up
        id: 'stairs_up',
        character: '<',
        background: '#fc0',
        color: '#000',
        dense: false,
        opaque: false,
        climb(content){
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
        }/*,
        enter(entrant){
            if(entrant.type != TYPE_ACTOR){
                return false;
            }
            return Tile.prototype.enter.apply(this, arguments);
        }*/
    })
};

export {Tile, genericTileTypes};
