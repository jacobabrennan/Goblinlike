

/*==============================================================================

    The map object deals primarily with the display of the game world in a 2D
    grid of text. It also handles mouse and touch input for movement and
    targeting.
    
    It is not a prototype, and should not be instanced.

==============================================================================*/

client.drivers.gameplay.drivers.map = Object.create(driver, {
    displayWidth: {value: displaySize},
    displayHeight: {value: displaySize},
    displayPane: {value: undefined, writable: true},
    setup: {value: function (configuration){
        /**
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.drivers.gameplay.setup It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.
            
            It should not be called more than once.
            
            It does not return anything.
         **/
        this.displayPane = document.createElement('pre');
        this.displayPane.setAttribute('id', 'map_data');
        this.displayPane.setAttribute('class', 'pane');
        // Create Canvas.
        var newCanvas = document.createElement('canvas');
        newCanvas.width = displaySize * 16;
        newCanvas.height = displaySize * 16;
        this.displayPane.appendChild(newCanvas);
        newCanvas.addEventListener('click', this.clickHandler);
        // Create Context.
        this.context = newCanvas.getContext('2d');
        this.context.font = '16px press_start_kregular';
    }},
    clickHandler: {value: function (clickEvent){
        var TILE_SIZE = 16;
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
        var level = displayOptions.level;
        var x = displayOptions.x;
        var y = displayOptions.y;
        var currentTime = displayOptions.currentTime;
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
                        var contentChar = undefined;
                        var contentColor = undefined;
                        var contentBack = undefined;
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
                        /*
                        var firstContent = (indexedTile.contents && indexedTile.contents.length)? indexedTile.contents[0] : undefined;
                        if(firstContent){
                            character = firstContent.character || character;
                            charColor = firstContent.color || (firstContent.character? '#fff' : charColor);
                            charBackground = firstContent.background || charBackground;
                        }*/
                    }
                }
                this.drawText(posX, posY, character, charColor, charBackground);
            }
        }
        var result = driver.display.apply(this, arguments);
        return result;
    }},
    drawText: {value: function (x, y, character, color, background){
        var TILE_SIZE = 16;
        // Reverse y (canvas origin problem):
        y = (displaySize) - y;
        // Display Background
        this.context.fillStyle = background || '#000';
        var fillY = (y-1)*TILE_SIZE;
        this.context.fillRect(x*TILE_SIZE, fillY, TILE_SIZE, TILE_SIZE);
        // Display character
        this.context.fillStyle = color || '#fff';
        this.context.fillText(character, x*TILE_SIZE, y*TILE_SIZE);
        
    }, writable: true}
});
/*client.drivers.gameplay.drivers.mapLegacy = Object.create(driver, {
    displayWidth: {value: displaySize},
    displayHeight: {value: displaySize},
    displayPane: {value: undefined, writable: true},
    tileGrid: {value: undefined, writable: true},
    setup: {value: function (configuration){
        / *
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.drivers.gameplay.setup It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.
            
            It should not be called more than once.
            
            It does not return anything.
        * /
        this.displayPane = document.createElement('pre');
        this.displayPane.setAttribute('id', 'map_data');
        this.displayPane.setAttribute('class', 'pane');
        // Create function to handle clicks on the map.
        var clickFunction = function (){
            var mapDisplay = client.drivers.gameplay.drivers.map;
            var x = this.gameX;
            var y = this.gameY;
            var centerX = Math.floor(mapDisplay.displayWidth/2);
            var centerY = Math.floor(mapDisplay.displayHeight/2);
            var direction = directionTo(centerX, centerY, x, y);
            client.command(direction);
        };
        // Create tile displays as html elements.
        this.tileGrid = [];
        this.tileGrid.length = this.displayWidth * this.displayHeight;
        for(var posY = 0; posY < this.displayHeight; posY++){
            for(var posX = 0; posX < this.displayWidth; posX++){
                var compoundIndex = posY*this.displayWidth + posX;
                var newCharacter = document.createElement('span');
                newCharacter.setAttribute('class','mapTile');
                newCharacter.gameX = posX;
                newCharacter.gameY = posY;
                newCharacter.addEventListener('click', clickFunction);
                newCharacter.textContent = ' ';
                this.tileGrid[compoundIndex] = newCharacter;
            }
        }
        / * Add tiles to grid container. Reverse Y axis to achieve expected
         * cartesian coordinates with origin in the lower left hand corner.
         * /
        for(var posY2 = this.displayHeight-1; posY2 >= 0; posY2--){
            for(var posX2 = 0; posX2 < this.displayWidth; posX2++){
                var compoundIndex2 = posY2*this.displayWidth + posX2;
                var indexedCharacter = this.tileGrid[compoundIndex2];
                this.displayPane.appendChild(indexedCharacter);
            }
            if(posY2 !== 0){
                this.displayPane.appendChild(document.createElement('br'));
            }
        }
    }},
    display: {value: function (displayOptions){
        / **
            This function displays a representation of the game map made from
            data supplied by the memory system.
            
            It returns true or false, based on the return value of
            driver.display, which is the prototype from which this object is
            derived. See driver.js for more info. At this time, the return value
            will always be false.
        ** /
        // TODO: Fill out documentation of actual code.
        // TODO: Consider refactoring. 'Do everything' function, long lines.
        var level = displayOptions.level;
        var x = displayOptions.x;
        var y = displayOptions.y;
        var currentTime = displayOptions.currentTime;
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
                        var firstContent = (indexedTile.contents && indexedTile.contents.length)? indexedTile.contents[0] : undefined;
                        if(firstContent){
                            character = firstContent.character || character;
                            charColor = firstContent.color || (firstContent.character? 'inherit' : charColor);
                            charBackground = firstContent.background || charBackground;
                        }
                    }
                }
                var compoundIndex = posY*this.displayWidth + posX;
                var tileElement = this.tileGrid[compoundIndex];
                tileElement.style.background = charBackground;
                tileElement.style.color = charColor;
                tileElement.textContent = character;
            }
        }
        var result = driver.display.apply(this, arguments);
        return result;
    }}
});*/