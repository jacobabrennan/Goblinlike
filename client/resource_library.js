

//== Resource Library ==========================================================

//-- Dependences ---------------------------------
import client from './client.js';

//------------------------------------------------
const resourcePath = 'rsc'

//------------------------------------------------
class Resource {}

//------------------------------------------------
class GraphicResource extends Resource {
    constructor(url, width, height) {
        super();
        this.url = url || null;
        this.width  = width  || TILE_SIZE;
        this.height = height || TILE_SIZE;
    }
    effect(which, image, offsetX, offsetY, width, height){
        var drawEffect = this.effects[which];
        if(!drawEffect){ return image;}
        return drawEffect.call(this, image, offsetX, offsetY, width, height);
    }
}
GraphicResource.prototype.effects = {
    draw: function (image, offsetX, offsetY, width, height){
        client.skin.scrapBoard.drawImage(
            image,
            offsetX, offsetY, width, height,
            0, 0, width, height
        );
        return client.skin.scrapBoard;
    },
    flash: function (image, offsetX, offsetY, width, height){
        var scrapBoard = client.skin.scrapBoard;
        switch(Math.floor(Math.random()*4)){
            case 0: {scrapBoard.fillStyle = "rgb(255,   0,   0)"; break;}
            case 1: {scrapBoard.fillStyle = "rgb(  0,   0,   0)"; break;}
            case 2: {scrapBoard.fillStyle = "rgb(  0,   0, 255)"; break;}
            case 3: {scrapBoard.fillStyle = "rgb(255, 255, 255)"; break;}
        }
        scrapBoard.save();
        scrapBoard.globalCompositeOperation = "copy";
        scrapBoard.fillRect(0, 0, scrapBoard.canvas.width, scrapBoard.canvas.height);
        scrapBoard.globalCompositeOperation = "destination-in";
        scrapBoard.drawImage(
            image,
            offsetX, offsetY, width, height,
            0, 0, width, height
        );
        scrapBoard.restore();
        return scrapBoard.canvas;
    },
    invert: function (image, offsetX, offsetY, width, height){
        var scrapBoard = client.skin.scrapBoard;
        scrapBoard.save();
        scrapBoard.canvas.width = width;
        scrapBoard.canvas.height = height;
        scrapBoard.clearRect(0, 0, width, height);
        scrapBoard.scale(1,-1);
        scrapBoard.translate(0,-height)
        scrapBoard.drawImage(
            image,
            offsetX, offsetY, width, height,
            0, 0, width, height
        );
        scrapBoard.restore();
        return scrapBoard.canvas;
    }
}

//------------------------------------------------
class Graphic extends GraphicResource {
    constructor(url, width, height, offsetX, offsetY) {
        super(url, width, height);
        this.offsetX = offsetX || 0;
        this.offsetY = offsetY || 0;
    }
    draw(x, y, options) {
        client.skin.context.save()
        if(!options){ options = {};}
        var direction = (options.direction !== undefined)? options.direction : SOUTH;
        var offsetX = this.offsetX || 0;
        var offsetY = this.offsetY || 0;
        var width  = this.width  || this.image.width;
        var height = this.height || this.image.height;
        var adjustX = Math.round(x);
        var adjustY = Math.round((displaySize*TILE_SIZE)-(y+height));
        var frameDelay = options.frameDelay || this.frameDelay;
        if(this.nudgeX){ adjustX += this.nudgeX;}
        if(this.nudgeY){ adjustY -= this.nudgeY;}
        if(options.z){ adjustY -= options.z;}
        if(options.center){
            adjustX -= Math.floor(width/2);
            adjustY += Math.floor(height/2);
        }
        if(this.frames){
            var frame = 0;
            if(options.frame !== undefined){
                frame = Math.min(options.frame, this.frames-1);
            } else if(options.time){
                var delay = frameDelay || ANIMATION_FRAME_DELAY;
                frame = (Math.floor(options.time/delay) % this.frames);
            }
            offsetY += height*frame;
        }
        //
        if(this.directions === 2){
            if(direction === RIGHT){
                offsetX += width;
            }
        } else if(this.directions === 16){
            offsetX =            direction%4  * width;
            offsetY = Math.floor(direction/4) * height;
        }
        //
        var drawImage = client.resourceLibrary.images[this.url];
        if(options.effects){
            for(var effectIndex = 0; effectIndex < options.effects.length; effectIndex++){
                var indexedEffect = options.effects[effectIndex];
                drawImage = this.effect(indexedEffect, drawImage, offsetX, offsetY, width, height);
                offsetX = 0;
                offsetY = 0;
            }
        }
        client.skin.context.drawImage(
            drawImage,
            offsetX, offsetY, width, height,
            adjustX, adjustY, width, height
        );
        client.skin.context.restore();
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }
}

//------------------------------------------------
class SpriteSheet extends GraphicResource {
    constructor(url, width, height, mapping, options) {
        super(url, width, height);
        options = options || {};
        mapping = mapping || {};
        //
        this.anchorX = options.anchorX || 0;
        this.anchorY = options.anchorY || 0;
        if(options.directions){ this.directions = options.directions;}
        if(options.frames    ){ this.frames     = options.frames    ;}
        if(options.frameDelay){ this.frameDelay = options.frameDelay;}
        // Fill out sprite states
        this.states = {};
        if(!mapping['default']){
            mapping['default'] = {}
        }
        let stateNames = Object.keys(mapping);
        for(let stateIndex = 0; stateIndex < stateNames.length; stateIndex++){
            let stateName = stateNames[stateIndex];
            const stateMap = mapping[stateName];
            const fullOffsetX = (stateMap.offsetX || 0) + this.anchorX;
            const fullOffsetY = (stateMap.offsetY || 0) + this.anchorY;
            const state = new Graphic({
                url: url,
                width:  (stateMap.width  || this.width ),
                height: (stateMap.height || this.height),
                offsetX: fullOffsetX,
                offsetY: fullOffsetY,
                stateMap: stateMap
            });
            state.directions = stateMap.directions || this.directions;
            state.frames     = stateMap.frames     || this.frames    ;
            state.frameDelay = stateMap.frameDelay || this.frameDelay;
            this.states[stateName] = state;
        }
    }
    draw(x, y, options) {
        if(!options){ options = {};}
        var state = options.state || 'default';
        var graphicState = this.states[state];
        if(!graphicState){ graphicState = this.states['default'];}
        if(!graphicState){ return false;}
        return graphicState.draw(x, y, options);
    }
}
/*var commonSpriteSheets = {
    autojoin: function (url, sprites){
        var commonOptions =  {directions: 16, frames: 1};
        var commonSprites = {
            
        };
        if(sprites){
            for(key in sprites){
                if(!sprites.hasOwnProperty(key)){ continue;}
                commonSprites[key] = sprites[key];
            }
        }
        return spriteSheet(url, commonSprites, commonOptions);
    }
}*/

//------------------------------------------------
var event = (function (){
    var eventResource = {
        finished: false,
        timeLimit: null,
        width: 0,
        height: 0,
        setup: function (){},
        iterate: function (){
            this.time++;
            if(this.timeLimit && this.time >= this.timeLimit){
                this.finish();
            }
            return this.finished;
        },
        _new: function (options){
            this.time = -1; // Iterate is called before draw,
            // Time when drawing first frame should be 0.
            this.options = options;
            this.setup();
            return this;
        },
        draw: function (){},
        finish: function (){
            this.finished = true;
        },
        // Helpful functions:
        center: function (movableId, offsetDirection){
            var centerMover = client.gameplay.memory.getContainable(movableId);
            if(!centerMover){ return null;}
            var centerX = centerMover.x+(centerMover.width -this.width )/2;
            var centerY = centerMover.y+(centerMover.height-this.height)/2;
            if(offsetDirection){
                switch(offsetDirection){
                    case NORTH: centerY = centerMover.y+centerMover.height; break;
                    case SOUTH: centerY = centerMover.y-       this.height; break;
                    case EAST : centerX = centerMover.x+centerMover.width ; break;
                    case WEST : centerX = centerMover.x-       this.width ; break;
                }
            }
            return {x: centerX, y: centerY};
        }
    };
    return function (options){
        var configureObject = {};
        for(var key in options){
            if(options.hasOwnProperty(key)){
                configureObject[key] = {value: options[key], writable: true};
            }
        }
        var newEvent = Object.extend(eventResource, configureObject);
        return newEvent;
    };
});

//------------------------------------------------
client.resource = function (category, identifier){
	return this.resourceLibrary.resource(category, identifier);
}

//------------------------------------------------
client.resourceLibrary = {
	resourceLoadReady: false,
	resourceLoadingIds: [],
	resource(category, identifier, fragment) {
		if(this.library[category]){
            let resource = this.library[category][identifier];
            if(fragment && fragment.states){
                resource = fragment.states[resource];
            }
            return resource;
		}
        return null;
	},
    /*
        Animations
            Variable Number of Frames
            Variable Frame Rate
            Looping or One Time
    */
	images: {},
	library: {
		graphic: {
            //'': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE, offsetX, offsetY),
            'door': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE,  0,  0),
            'doorOpen': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE, 16,  0),
            'doorBroken': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE, 16,  0),
            'wall': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE, 32,  0),
            'hall': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE, 48,  0),
            'floor': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE, 64,  0),
            'stairsDown': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE,  0, 16),
            'stairsUp': new Graphic('img/tiles.png', TILE_SIZE, TILE_SIZE, 16, 16),
            'door-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE,  0,  0),
            'doorOpen-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE, 16,  0),
            'doorBroken-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE, 16,  0),
            'wall-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE, 32,  0),
            'hall-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE, 48,  0),
            'floor-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE, 64,  0),
            'stairsDown-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE,  0, 16),
            'stairsUp-memory': new Graphic('img/tiles-memory.png', TILE_SIZE, TILE_SIZE, 16, 16),
            /*suit: new SpriteSheet('img/suit.png', null, null, {
                suit1: {offsetX:  0},
                suit2: {offsetX: 32}
            }, {frames: 4, directions: 2}),*/
		},
		event: {
            /*'animate': event({
                setup: function (){
                    var options = this.options;
                    var graphicResource = client.resourceLibrary.resource('graphic', options.graphic);
                    if(graphicResource && options.graphicState){
                        graphicResource = graphicResource.states[options.graphicState];
                    }
                    if(!graphicResource){
                        this.finish();
                        return;
                    }
                    this.frames = graphicResource.frames || 1;
                    this.frameDelay = graphicResource.frameDelay || ANIMATION_FRAME_DELAY;
                    var repeat = options.repeat || 1;
                    this.width = graphicResource.width;
                    this.height = graphicResource.height;
                    this.timeLimit = options.timeLimit || this.frames * this.frameDelay * repeat;
                },
                draw: function (){
                    var fullX;
                    var fullY;
                    if(this.options.attachId){
                        var center = this.center(this.options.attachId, this.options.offsetDirection);
                        if(!center){ this.finish(); return;}
                        fullX = center.x;
                        fullY = center.y;
                    } else{
                        fullX = this.options.x;
                        fullY = this.options.y;
                    }
                    var drawOptions = {
                        frame: Math.floor(this.time/this.frameDelay)%this.frames,
                        center: this.options.center
                    };
                    if(this.options.offsetDirection){
                        drawOptions.direction = this.options.offsetDirection;
                    }
                    client.skin.drawGraphic(
                        this.options.graphic, this.options.graphicState,
                        fullX, fullY,
                        drawOptions
                    );
                }
            })*/
		}
    },
	setup(callback) {
		this.setupGraphics(callback);
	},
	setupGraphics(callback) {
        function loadCaller(loopResource) {
            return function (){
                const rIndex = client.resourceLibrary.resourceLoadingIds.indexOf(loopResource.url);
                client.resourceLibrary.resourceLoadingIds.splice(rIndex,1);
                if(client.resourceLibrary.resourceLoadReady){
                    if(!client.resourceLibrary.resourceLoadingIds.length){
                        callback();
                    }
                }
            }
        }
        const stateNames = Object.keys(this.library.graphic)
		for(let stateIndex = 0; stateIndex < stateNames.length; stateIndex++){
			const resource = this.library.graphic[stateNames[stateIndex]];
			if(!this.images[resource.url]){
				const newImage = new Image();
				this.resourceLoadingIds.push(resource.url);
				newImage.addEventListener("load", loadCaller(resource), false);
				newImage.src = `${resourcePath}/${resource.url}`;
				this.images[resource.url] = newImage;
			}
			resource.image = this.images[resource.url];
		}
		this.resourceLoadReady = true;
		if(!this.resourceLoadingIds.length){
			callback();
		}
	}
}
