// TODO: Document.
client.skin = Object.create(driver, {
    container: {value: undefined, writable: true},
    context: {value: undefined, writable: true},
    setup: {value: function (configuration){
        /**
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.drivers.gameplay.setup It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.
            
            It should not be called more than once.
            
            It does not return anything.
        **/
        this.clearCommands();
        this.font = configuration.font || 'monospace';
        this.highlightColor = configuration.highlightColor || '#ff0';
        var ownCanvas = document.createElement('canvas');
        ownCanvas.width = (displaySize*2)*TILE_SIZE; // Two panels wide.
        ownCanvas.height = (displaySize+1)*TILE_SIZE; // One Panel High, plus status bar.
        ownCanvas.addEventListener('click', this.clickHandler);
        this.context = ownCanvas.getContext('2d');
        this.context.font = '16px '+this.font;
        this.container = document.getElementById(configuration.containerId);
        this.container.tabIndex = 1;
        this.container.focus();
        this.container.appendChild(ownCanvas);
    }},
    clickHandler: {value: function (clickEvent){
        // Extract coordinates of click from DOM mouse event.
        var correctedX = clickEvent.pageX - clickEvent.target.offsetLeft;
        var correctedY = clickEvent.pageY - clickEvent.target.offsetTop;
        // Correct Y coordinate for difference of coordinate systems.
        correctedY = ((displaySize+1)*TILE_SIZE)-correctedY;
            // +1 for status bar.
        var x = correctedX/TILE_SIZE;
        var y = correctedY/TILE_SIZE;
        //var centerX = Math.floor(mapDisplay.displayWidth/2);
        //var centerY = Math.floor(mapDisplay.displayHeight/2);
        if(!client.skin.triggerCommand(Math.floor(x), Math.floor(y))){
            client.handleClick(x, y);
        }
    }, writable: true},/*
    registerPanel: {value: function (newDriver, whichPanel){
        if(!whichPanel){
            this.panelPrimary = newDriver;
        } else{
            this.panelSecondary = newDriver;
        }
    }},
    cancelPanel: {value: function (newElement, whichPanel){
        if(!whichPanel){
            this.panelPrimary = null;
        } else{
            this.panelSecondary = null;
        }
    }},*/
    fillRect: {value: function (x, y, width, height, color){
        this.context.fillStyle = color || '#000';
        y -= 1; // Offset y coordinate by 1, as line 1 is the status bar.
        y = (displaySize) - y;
        var fillY = (y*TILE_SIZE)+2; // TODO: MAGIC NUMBERS!
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. */
        var fillHeight = height*TILE_SIZE;
        var fillWidth  =  width*TILE_SIZE;
        fillY -= fillHeight;
        this.context.fillRect(x*TILE_SIZE, fillY, fillWidth, fillHeight);
    }, writable: true},
    drawCharacter: {value: function(x, y, character, color, background, font){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        y -= 1; // Offset y coordinate by 1, as line 1 is the status bar.
        y = (displaySize) - y;
        // Display Background
        this.context.fillStyle = background || '#000';
        var fillY = ((y-1)*TILE_SIZE)+2; // TODO: MAGIC NUMBERS!
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. */
        this.context.fillRect(x*TILE_SIZE, fillY, TILE_SIZE, TILE_SIZE);
        // Display character
        if(font){ this.context.font = '16px '+font;}
        this.context.fillStyle = color || '#fff';
        this.context.fillText(character, x*TILE_SIZE, y*TILE_SIZE);
        if(font){ this.context.font = '16px '+this.font;}
    }, writable: true},
    drawString: {value: function (x, y, newText, color, background, font){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        // Reverse y (canvas origin problem):
        y -= 1; // Offset y coordinate by 1, as line 1 is the status bar.
        y = (displaySize) - y;
        // Display Background
        this.context.fillStyle = background || '#000';
        var fillY = ((y-1)*TILE_SIZE)+2; // TODO: MAGIC NUMBERS!
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. */
        var textWidth = newText.length;
        this.context.fillRect(
            x*TILE_SIZE,
            fillY,
            TILE_SIZE*textWidth,
            TILE_SIZE
        );
        // Display character
        if(font){ this.context.font = '16px '+font;}
        this.context.fillStyle = color || '#fff';
        this.context.fillText(newText, x*TILE_SIZE, y*TILE_SIZE);
        if(font){ this.context.font = '16px '+this.font;}
    }, writable: true},
    drawParagraph: {value: function (x, y, newText, color, background, font, width){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        // Display Background
        this.context.fillStyle = background || '#000';
        var maxWidth = width || (displaySize * 2)-2;
        var words = newText.split(' ');
        var runningLength = 0;
        var currentLine = 0;
        var currentString = '';
        while(words.length){
            var nextWord = words.shift();
            if(nextWord.length + 1 + runningLength > maxWidth){ // 1 for ' '.
                this.drawString(
                    x, y-currentLine, currentString, color, background, font);
                currentLine++;
                currentString = '';
                runningLength = 0;
            } else if(runningLength !== 0){
                currentString += ' ';
                runningLength += 1;
            }
            runningLength += nextWord.length;
            currentString += nextWord;
        }
        this.drawString(
            x, y-currentLine, currentString, color, background, font);
    }, writable: true},
    status: {value: function (statusText, color){
        //this.statusBar.textContent = statusText;
        this.fillRect(0, displaySize, (displaySize*2)*TILE_SIZE, TILE_SIZE);
        this.drawString(0, displaySize, statusText, color);
    }},
    drawCommand: {value: function (x, y, key, name, command){
        var keyLength = key.length;
        this.drawString(x, y, key, HIGHLIGHT);
        if(name){
            this.drawString(x+keyLength+1, y, name);
        }
        var totalLength = keyLength + (name? name.length : 0) +1; // +1 for ' '.
        for(var posX = 0; posX < totalLength; posX++){
            this.registerCommand(x+posX, y, command);
        }
    }},
    clearCommands: {value: function (){
        this.commandCoords = [];
    }},
    registerCommand: {value: function (x, y, command){
        var compoundIndex = (y*displaySize*2) + x;
        this.commandCoords[compoundIndex] = command;
    }},
    triggerCommand: {value: function (x, y){
        var compoundIndex = (y*displaySize*2) + x;
        var command = this.commandCoords[compoundIndex];
        if(command){
            if((typeof command) == 'function'){
                command();
            } else{
                client.command(command);
            }
            return true;
        }
        return false;
    }}
});