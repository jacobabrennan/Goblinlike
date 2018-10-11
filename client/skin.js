

//== TODO: Document ============================================================

//-- Imports -------------------------------------
import client from './client.js';
import driver from './driver.js';

//------------------------------------------------
client.skin = Object.extend(driver, {
    container: undefined,
    context: undefined,
    setup(configuration){
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
        this.context.imageSmoothingEnabled = false;
        this.context.font = ''+FONT_SIZE+'px '+this.font;
        this.container = document.getElementById(configuration.containerId);
        this.container.tabIndex = 1;
        this.container.focus();
        this.container.appendChild(ownCanvas);
        // Respond to resizes
        window.addEventListener("resize", function (e){
            client.skin.resize();
        }, false);
        this.resize();
    },
    clickHandler(clickEvent){
        // Determine Game-Pixel Location of click
        var displayCanvas = client.skin.context.canvas;
        var rectangle = displayCanvas.getBoundingClientRect();
        var displayScale = rectangle.width / (displaySize*2);
        var canvasX = (clickEvent.clientX-rectangle.left)/displayScale;
        var canvasY = (clickEvent.clientY-rectangle.top )/displayScale;
        // Correct Y coordinate for difference of coordinate systems.
        canvasY = (displaySize+1) - canvasY;
            // +1 for status bar.
        var x = Math.floor(canvasX);
        var y = Math.floor(canvasY);
        if(!client.skin.triggerCommand(x, y)){
            client.handleClick(x, y);
        }
    },

//-- Full Screen / Resizing ----------------------------------------------------
    viewportSize(){
        var e  = document.documentElement;
        var g  = document.getElementsByTagName('body')[0];
        var _x = window.innerWidth  || e.clientWidth  || g.clientWidth;
        var _y = window.innerHeight || e.clientHeight || g.clientHeight;
        return {width: _x, height: _y};
    },
    resize(){
        var size = this.viewportSize();
        var monitorAspectRatio = size.width / size.height;
        var gameAspectRatio = (displaySize*2) / (displaySize+1);
        var modifiedWidth;
        var modifiedHeight;
        if(monitorAspectRatio >= gameAspectRatio){
            // Center Horizontally
            modifiedHeight = size.height;
            modifiedWidth = gameAspectRatio * modifiedHeight;
            this.container.style.top = "0px";
            this.container.style.left = ""+Math.floor((size.width-modifiedWidth)/2)+"px";
        } else{
            // Center Vertically
            modifiedWidth = size.width;
            modifiedHeight = modifiedWidth / gameAspectRatio;
            this.container.style.top = ""+Math.floor((size.height-modifiedHeight)/2)+"px";
            this.container.style.left = "0px";
        }
        this.container.style.width  = modifiedWidth +"px";
        this.container.style.height = modifiedHeight+"px";
    },

//-- Draw Functions ------------------------------------------------------------
    fillRect(x, y, width, height, color){
        width = width || 1;
        height = height || 1;
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
    },
    drawCharacter(x, y, character, color, background, font){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        y -= 1; // Offset y coordinate by 1, as line 1 is the status bar.
        y = (displaySize) - y;
        // Display Background
        this.context.fillStyle = background || '#000';
        var fontScaleError = FONT_SIZE/8;
        var fillY = ((y-1)*TILE_SIZE)+fontScaleError;
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. */
        this.context.fillRect(x*TILE_SIZE, fillY, TILE_SIZE, TILE_SIZE);
        // Display character
        if(font){ this.context.font = ''+FONT_SIZE+'px '+font;}
        this.context.fillStyle = color || '#fff';
        this.context.fillText(character, x*TILE_SIZE, y*TILE_SIZE);
        if(font){ this.context.font = ''+FONT_SIZE+'px '+this.font;}
    },
    drawString(x, y, newText, color, background, font){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        // Reverse y (canvas origin problem):
        y -= 1; // Offset y coordinate by 1, as line 1 is the status bar.
        y = (displaySize) - y;
        // Display Background
        this.context.fillStyle = background || '#000';
        var fontScaleError = FONT_SIZE/8;
        var fillY = ((y-1)*TILE_SIZE)+fontScaleError;
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
        if(font){ this.context.font = ''+FONT_SIZE+'px '+font;}
        this.context.fillStyle = color || '#fff';
        this.context.fillText(newText, x*TILE_SIZE, y*TILE_SIZE);
        if(font){ this.context.font = ''+FONT_SIZE+'px '+this.font;}
    },
    drawParagraph(x, y, newText, color, background, font, width){
        // Returns the number of lines it took to display the message.
        var lines = 1;
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
                lines++;
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
        lines++;
        return lines;
    },
    status(statusText, color){
        //this.statusBar.textContent = statusText;
        this.fillRect(0, displaySize, (displaySize*2)*TILE_SIZE, TILE_SIZE);
        this.drawString(0, displaySize, statusText, color);
    },
    drawCommand(x, y, key, name, command){
        var keyLength = key.length;
        this.drawString(x, y, key, HIGHLIGHT);
        if(name){
            this.drawString(x+keyLength+1, y, name);
        }
        var totalLength = keyLength + (name? name.length : 0) +1; // +1 for ' '.
        for(var posX = 0; posX < totalLength; posX++){
            this.registerCommand(x+posX, y, command);
        }
    },
    drawGraphic(x, y, graphic, background){
        // Fix Coordinates
        y -= 1; // Offset y coordinate by 1, as line 1 is the status bar.
        // Display Background
        background = background || '#000';
        //this.fillRect(x, y);
        // Display Graphic
        const resource = client.resource('graphic', graphic);
        if(!resource){ return;}
        resource.draw(x*TILE_SIZE, y*TILE_SIZE-2);
    },

//-- Command Handling ----------------------------------------------------------
    clearCommands(){
        this.commandCoords = [];
    },
    registerCommand(x, y, command){
        var compoundIndex = (y*displaySize*2) + x;
        this.commandCoords[compoundIndex] = command;
    },
    triggerCommand(x, y){
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
    }
});
