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
        this.font = configuration.font || 'monospace';
        this.highlightColor = configuration.highlightColor || '#ff0';
        var ownCanvas = document.createElement('canvas');
        ownCanvas.width = (displaySize*2)*TILE_SIZE; // Two panels wide.
        ownCanvas.height = (displaySize+1)*TILE_SIZE; // One Panel High, plus status bar.
        this.context = ownCanvas.getContext('2d');
        this.context.font = '16px '+this.font;
        this.container = document.getElementById(configuration.containerId);
        this.container.tabIndex = 1;
        this.container.focus();
        this.container.appendChild(ownCanvas);
    }},/*
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
    status: {value: function (statusText){
        //this.statusBar.textContent = statusText;
        this.drawString(0, displaySize, statusText);
    }},
    drawCommand: {value: function (x, y, key, command){
        var keyLength = key.length;
        this.drawString(x, y, key, HIGHLIGHT);
        if(command){
            this.drawString(x+keyLength+1, y, command);
        }
    }}
});