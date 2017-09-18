

/*===========================================================================
    Constants
  ===========================================================================*/

    // Misc. Configuration:
var debug = false;
var VERSION = 'Beta.2';
var displaySize = 21;
var DEFAULT_MAP_SIZE = 48;
var HIGHLIGHT = 'highlight';
var TILE_SIZE = 16;
var FINAL_DEPTH = 7;
var INTRO_TITLE = 'You descend into darkness';
var INTRO_BODY = 'While running from humans in the forest, you stumble on a secret passage into an abandoned dwarven city. The once magnificent halls and chambers are now littered with trash and debris. It smells of decay. You think you hear the sound of another goblin up ahead, but you think you also saw something hideous crawling in the darkness.';
    // Directions:
var WAIT      = 0;
var NORTH     = 1;
var SOUTH     = 2;
var EAST      = 4;
var WEST      = 8;
var NORTHEAST = 5;
var NORTHWEST = 9;
var SOUTHEAST = 6;
var SOUTHWEST = 10;
var UP        = 16;
var DOWN      = 32;
    // Action Commands:
var COMMAND_CANCEL      = 64;
var COMMAND_USE         = 65;
var COMMAND_NEWGAME     = 66;
var COMMAND_GET         = 67;
var COMMAND_DROP        = 68;
var COMMAND_LOOK        = 69;
var COMMAND_EQUIP       = 70;
var COMMAND_UNEQUIP     = 71;
var COMMAND_STAIRS      = 72;
var COMMAND_FIRE        = 73;
var COMMAND_THROW       = 74;
var COMMAND_MOVE        = 75;
var COMMAND_WAIT        = 76;
var COMMAND_HELP        = 77;
var COMMAND_CLOSE       = 78;
var COMMAND_PAGEDOWN    = 79;
var COMMAND_PAGEUP      = 80;
var COMMAND_ENTER       = 81;
var COMMAND_NONE        = 82;
var COMMAND_CAMP        = 83;
var COMMAND_ATTACK      = 84;
    // Commands from server.
var COMMAND_SENSE   = 100;
var COMMAND_TURN    = 101;
var COMMAND_GAMEOVER= 102;
var COMMAND_WIN     = 103;
    // Targeting system:
var TARGET_SELF = 1; // Allow the self to be targetted. Will skip selection if this is the only flag set.
var TARGET_FRIEND = 2; // Allow targeting of friendly actors.
var TARGET_ENEMY = 4; // Allow enemies to be targetted.
var TARGET_OTHER = TARGET_ENEMY|TARGET_FRIEND; // Allow any other actor to be targeted.
var TARGET_ANYONE = TARGET_OTHER|TARGET_SELF; // Allow any actor to be targeted.
var TARGET_ALL = 8; // All viable targets will be effected, not just one (no selection).
var TARGET_FURNITURE = 16; // Allow to target furniture.
var TARGET_RANGE = 32; // Allow targets in range, not just those in view.
var TARGET_DIRECTION = 64; // The player will be prompted to select a direction.
var RANGE_VIEW = -1; // Targeting will use the actors view range.
    // Containable object types:
var TYPE_CONTAINABLE = 1;
var TYPE_ITEM = 2;
var TYPE_ACTOR = 3;
var TYPE_TRAP = 4;
    // Actor Factions (bit flags):
var FACTION_GOBLIN = 1;
var FACTION_PLAYER = FACTION_GOBLIN;
var FACTION_ENEMY = 2;
    // Companion AI modes:
var MODE_FOLLOW = 1;
var MODE_ATTACK = 2;
var MODE_RETREAT = 3;
var MODE_SCAVENGE = 4;


/*===========================================================================
    Default Object Extentions
  ===========================================================================*/

if(Object.instantiate){
    console.log('Cannot attach method "instantiate" to Object.');
} else{
    Object.instantiate = function (aPrototype){
        if(aPrototype.constructor){
            // Create arguments, minus prototype, to pass to constructor.
            var cleanArguments = [];
            for(var argI = 1; argI < arguments.length; argI++){
                cleanArguments.push(arguments[argI]);
            }
            // Call constructor, return new object.
            return aPrototype.constructor.apply(
                Object.create(aPrototype),
                cleanArguments
            );
        }
        return Object.create(aPrototype);
    };
}
/*
if(Object.instantiate){
    console.log('Cannot attach method "instantiate" to Object.');
} else{
    Object.instantiate = function (aPrototype){
        if(!aPrototype){ return null;}
        if(aPrototype._new){
            // Create arguments, minus prototype, to pass to _new.
            var cleanArguments = [];
            for(var argI = 1; argI < arguments.length; argI++){
                cleanArguments.push(arguments[argI]);
            }
            // Call _new, return new object.
            var newObject = Object.create(aPrototype);
            aPrototype._new.apply(
                newObject,
                cleanArguments
            );
            return newObject;
        }
        return Object.create(aPrototype);
    };
}*/
if(Object.extend){
    console.log('Cannot attach method "extend" to Object.');
} else{
    Object.extend = function (aPrototype, extention){
        var valueConfiguration = {};
        for(var key in extention){
            if(!extention.hasOwnProperty(key)){ continue;}
            var keyValue = extention[key];
            if(keyValue && keyValue.value){
                valueConfiguration[key] = keyValue;
                continue;
            }
            valueConfiguration[key] = {
                value: extention[key],
                configurable: true,
                enumerable: true,
                writable: true
            }
        }
        return Object.create(aPrototype, valueConfiguration);
    };
};


/*===========================================================================
    Useful functions.
  ===========================================================================*/

var alphabet = 'abcdefghijklmnopqrstuvwxyz';
var characterIndex = function (character){
    // Converts a letter to it's position in the alphabet. Returns a number.
    character = character.toLowerCase();
    return alphabet.indexOf(character);
};

/*=== Common tasks when dealing with arrays. ================================*/

var pick = function (){
    return arrayPick(arguments);
};
var arrayPick = function (sourceArray){
    // Returns a randomly chosen element from the source array.
    var randomIndex = Math.floor(Math.random()*sourceArray.length);
    var randomElement = sourceArray[randomIndex];
    if(!randomElement){
        console.log("Problem: "+randomIndex+'/'+sourceArray.length);
    }
    return randomElement;
};
var arrayRemove = function (sourceArray, element){
    // Removes element from sourceArray, if present. Returns undefined.
    var elementIndex = sourceArray.indexOf(element);
    if(elementIndex != -1){
        sourceArray.splice(elementIndex, 1);
    }
}

/*=== Math. =================================================================*/

var randomInterval = function (min, max){
    // Returns a randomly select integer between min and max, inclusive.
    if(!min){ min = 0;}
    if(!max){ max = min; min = 0;}
    var range = max-min;
    return min + Math.floor(Math.random()*(range+1));
};
var gaussRandom = function (mean, standardDeviation){
    /**
     *  Generates random integers with a gaussian (normal) distribution about
     *      the specified mean, with the specified standard deviation.
     *  Returns an integer.
     **/
    var leg1;
    var leg2;
    do{
        leg1 = Math.random();
        leg2 = Math.random();
    } while(!(leg1 && leg2));
    var normal = Math.cos(2*Math.PI*leg2) * Math.sqrt(-(2*Math.log(leg1)));
    var gaussian = mean + normal*standardDeviation;
    return Math.round(gaussian);
};
var distance = function (startX, startY, endX, endY){
    var deltaX = Math.abs(endX-startX);
    var deltaY = Math.abs(endY-startY);
    return Math.max(deltaX, deltaY);
};
var getStepCoords = function (startX, startY, direction){
    if(direction & NORTH){ startY++;}
    if(direction & SOUTH){ startY--;}
    if(direction & EAST ){ startX++;}
    if(direction & WEST ){ startX--;}
    return {x: startX, y: startY};
};
var directionTo = function (startX, startY, endX, endY){
    var deltaX = endX-startX;
    var deltaY = endY-startY;
    if(!deltaX && !deltaY){
        return 0;
    }
    var direction = 0;
    var angle = Math.atan2(deltaY, deltaX); // Reversed, don't know why.
    angle /= Math.PI;
    angle /= 2; // Convert to Tau.
    angle += 1/16;
    if(angle < 0){
        angle += 1;
    } else if(angle > 1){
        angle -= 1;
    }
    if     (angle >=   0 && angle < 1/8){ direction = EAST     ;}
    else if(angle >= 1/8 && angle < 2/8){ direction = NORTHEAST;}
    else if(angle >= 2/8 && angle < 3/8){ direction = NORTH    ;}
    else if(angle >= 3/8 && angle < 4/8){ direction = NORTHWEST;}
    else if(angle >= 4/8 && angle < 5/8){ direction = WEST     ;}
    else if(angle >= 5/8 && angle < 6/8){ direction = SOUTHWEST;}
    else if(angle >= 6/8 && angle < 7/8){ direction = SOUTH    ;}
    else if(angle >= 7/8 && angle < 8/8){ direction = SOUTHEAST;}
    return direction;
};