

/*==============================================================================

    The map object deals primarily with the display of the game world in a 2D
    grid of text. It also handles mouse and touch input for movement and
    targeting.
    
    It is not a prototype, and should not be instanced.

==============================================================================*/

client.drivers.gameplay.drivers.map = Object.create(driver, {
    displayWidth: {value: displaySize},
    displayHeight: {value: displaySize},
    setup: {value: function (configuration){
        /**
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.drivers.gameplay.setup It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.
            
            It should not be called more than once.
            
            It does not return anything.
         **/
    }},
    clickHandler: {value: function (clickEvent){
        // Extract coordinates of click from DOM mouse event.
        var correctedX = clickEvent.pageX - clickEvent.target.offsetLeft;
        var correctedY = clickEvent.pageY - clickEvent.target.offsetTop;
        // Correct Y coordinate for difference of coordinate systems.
        correctedY = (displaySize*TILE_SIZE)-correctedY;
        var mapDisplay = client.drivers.gameplay.drivers.map;
        var x = correctedX/TILE_SIZE;
        var y = correctedY/TILE_SIZE;
        var centerX = Math.floor(mapDisplay.displayWidth/2);
        var centerY = Math.floor(mapDisplay.displayHeight/2);
        var direction;
        if(Math.max(Math.abs(centerX-x), Math.abs(centerY-y)) <= 1){
            direction = COMMAND_WAIT;
        } else{
            direction = directionTo(centerX, centerY, x, y);
        }
        client.command(direction, {key: null});
    }, writable: true},
    display: {value: function (displayOptions){
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
                var indexedTile = level.getTile(offsetX, offsetY);
                var character = ' ';
                var charBackground = null;
                var charColor = null;
                if(indexedTile){
                    var tileModel = level.tileTypes[indexedTile.id];
                    if(tileModel){
                        character = tileModel.character || character;
                        charColor = tileModel.color || charColor;
                        charBackground = tileModel.background || charBackground;
                    } else{
                        character = 'x';
                        charColor = '#f00';
                    }
                    if(indexedTile.timeStamp < currentTime){
                        charColor = '#00F';
                        charBackground = '#000';
                    } else{
                        var cL = indexedTile.contents? indexedTile.contents.length : 0;
                        var contentChar = null;
                        var contentColor = null;
                        var contentBack = null;
                        for(var tI = 0; tI < cL; tI++){
                            indexedC = indexedTile.contents[tI];
                            if(!contentChar){ contentChar = indexedC.character;}
                            if(!contentColor){
                                contentColor = indexedC.color;
                                if(!contentColor && contentChar){
                                    contentColor = '#fff';
                                }
                            }
                            if(!contentBack){ contentBack = indexedC.background;}
                            if(contentChar && contentColor && contentBack){
                                break;
                            }
                        }
                        if(contentChar){ character = contentChar;}
                        if(contentColor){ charColor = contentColor;}
                        if(contentBack){ charBackground = contentBack;}
                    }
                }
                this.drawText(posX, posY, character, charColor, charBackground);
            }
        }
        var result = driver.display.apply(this, arguments);
        return result;
    }},
    drawText: {value: function (x, y, character, color, background){
        x += displaySize;
        client.skin.drawCharacter(x, y, character, color, background);
    }, writable: true}
});
