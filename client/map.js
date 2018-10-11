

/*==============================================================================

    The map object deals primarily with the display of the game world in a 2D
    grid of text. It also handles mouse and touch input for movement and
    targeting.
    
    It is not a prototype, and should not be instanced.

==============================================================================*/

//-- Imports -------------------------------------
import client from './client.js';
import driver from './driver.js';

//------------------------------------------------
client.drivers.gameplay.drivers.map = Object.extend(driver, {
    displayWidth: displaySize,
    displayHeight: displaySize,
    setup(configuration){
        /**
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.drivers.gameplay.setup It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.
            
            It should not be called more than once.
            
            It does not return anything.
         **/
    },
    handleClick(x, y, options){
        x -= displaySize;
        if(x < 0){ return false;}
        var centerX = Math.floor(displaySize/2);
        var centerY = Math.floor(displaySize/2);
        //var coordX = Math.floor(x);
        //var coordY = Math.floor(y);
        var direction;
        if(Math.max(Math.abs(centerX-x), Math.abs(centerY-y)) <= 1){
            direction = COMMAND_WAIT;
        } else{
            direction = directionTo(centerX, centerY, x, y);
        }
        client.command(direction, {key: null});
        return true;
    },
    display(displayOptions){
        /*
            This function displays a representation of the game map made from
            data supplied by the memory system.
            
            It returns true or false, based on the return value of
            driver.display, which is the prototype from which this object is
            derived. See driver.js for more info. At this time, the return value
            will always be false.
        */
        // TODO: Fill out documentation of actual code.
        // TODO: Consider refactoring. 'Do everything' function, long lines.
        if(!displayOptions){ displayOptions = {};}
        var gameplay = client.drivers.gameplay;
        var level = displayOptions.level || gameplay.memory.getDisplayLevel();
        var x;
        var y;
        var currentTime;
        if(displayOptions.x !== undefined){ x = displayOptions.x;}
        else { x = gameplay.memory.character.x;}
        if(displayOptions.y !== undefined){ y = displayOptions.y;}
        else { y = gameplay.memory.character.y;}
        if(displayOptions.currentTime !== undefined){
            currentTime = displayOptions.currentTime;
        } else{ currentTime = gameplay.memory.currentTime;}
        for(var posY = 0; posY < this.displayHeight; posY++){
            var offsetY = y - Math.floor(this.displayHeight/2) + posY;
            for(var posX = 0; posX < this.displayWidth; posX++){
                var offsetX = x - Math.floor(this.displayWidth/2) + posX;
                this.drawLocation(posX, posY, offsetX, offsetY, level, currentTime);
            }
        }
        var result = driver.display.apply(this, arguments);
        return result;
    },
    drawText(x, y, character, color, background) {
        x += displaySize;
        client.skin.drawCharacter(x, y, character, color, background);
    },
    drawGraphic(x, y, graphic, background){
        x += displaySize;
        client.skin.drawGraphic(x, y, graphic, background);
    },
    drawLocation(mapX, mapY, offsetX, offsetY, level, currentTime) {
        //
        let character = ' ';
        let charBackground = null;
        let charColor = null;
        let drawGraphic = null;
        // Get Tile at location. If it doesn't exist (beyond map data), draw black.
        const indexedTile = level.getTile(offsetX, offsetY);
        if(!indexedTile){
            this.drawText(mapX, mapY, character, charColor, charBackground);
            return;
        }
        // Get tileModel. Draw error text if it doesn't exist.
        const tileModel = level.tileTypes[indexedTile.id];
        if(tileModel){
            character      = tileModel.character  || character     ;
            charColor      = tileModel.color      || charColor     ;
            charBackground = tileModel.background || charBackground;
            drawGraphic    = tileModel.graphic    || drawGraphic   ;
            //console.log(tileModel.id, tileModel)
        } else{
            character = 'x';
            charColor = '#f00';
            this.drawText(mapX, mapY, character, charColor, charBackground);
            return;
        }
        // Handling drawing tiles from older memories (not in view)
        if(indexedTile.timeStamp < currentTime){
            charColor = '#00F';
            charBackground = '#000';
            if(drawGraphic){
                this.drawGraphic(mapX, mapY, drawGraphic+'-memory', charBackground);
            } else{
                this.drawText(mapX, mapY, character, charColor, charBackground);
            }
            return;
        }
        // Get letter, foreground color, and background color from contents.
        let contentChar    = null;
        let contentColor   = null;
        let contentBack    = null;
        let contentGraphic = null;
        let cL = indexedTile.contents? indexedTile.contents.length : 0;
        for(let tI = 0; tI < cL; tI++){
            let indexedC = indexedTile.contents[tI];
            if(!contentChar   ){ contentChar    = indexedC.character ;}
            if(!contentBack   ){ contentBack    = indexedC.background;}
            if(!contentGraphic){ contentGraphic = indexedC.graphic   ;}
            if(!contentColor  ){ contentColor   = indexedC.color     ;
                if(!contentColor && contentChar){
                                 contentColor   = '#fff'             ;
                }
            }
            if(contentBack && contentGraphic){
                break;
            }
        }
        if(contentChar   ){ character      = contentChar   ;
                            drawGraphic    = null          ;}
        if(contentColor  ){ charColor      = contentColor  ;}
        if(contentBack   ){ charBackground = contentBack   ;}
        if(contentGraphic){ drawGraphic    = contentGraphic;}
        // Draw full tile.
        if(drawGraphic){
            this.drawGraphic(mapX, mapY, drawGraphic, charBackground);
        } else{
            this.drawText(mapX, mapY, character, charColor, charBackground);
        }
    }
});
