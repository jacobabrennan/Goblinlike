

/*===========================================================================
    Constants
  ===========================================================================*/

//-- Scaffolding, Remove -------------------------
const fakeNetwork = {};

//-- Misc. Configuration: ------------------------
const debug = false;
const VERSION = '1.1.6';
const displaySize = 21;
const DEFAULT_MAP_SIZE = 48;
const HIGHLIGHT = 'highlight';
const COLOR_INSTRUCTION = '#00f';
let TILE_SIZE = 8;
let FONT_SIZE = 8;
if('WebkitAppearance' in document.documentElement.style){
    // Work around Chrome's font blurring.
    TILE_SIZE = 24;
    FONT_SIZE = 24;
}
const FINAL_DEPTH = 7;
const INTRO_TITLE = 'You descend into darkness';
const INTRO_BODY = 'While running from humans in the forest, you stumble on a secret passage into an abandoned dwarven city. The once magnificent halls and chambers are now littered with trash and debris. It smells of decay. You think you hear the sound of another goblin up ahead, but you think you also saw something hideous crawling in the darkness.';
const GOBLIN_SCORE = 100;
const URL_SCORE_REPORT = 'http://jacobabrennan.com:7231/scores';

//-- Directions: ---------------------------------
const WAIT      = 0;
const NORTH     = 1;
const SOUTH     = 2;
const EAST      = 4;
const WEST      = 8;
const NORTHEAST = 5;
const NORTHWEST = 9;
const SOUTHEAST = 6;
const SOUTHWEST = 10;
const UP        = 16;
const DOWN      = 32;

//-- Action Commands: ----------------------------
const COMMAND_CANCEL      = 64;
const COMMAND_USE         = 65;
const COMMAND_NEWGAME     = 66;
const COMMAND_GET         = 67;
const COMMAND_DROP        = 68;
const COMMAND_LOOK        = 69;
const COMMAND_EQUIP       = 70;
const COMMAND_UNEQUIP     = 71;
const COMMAND_STAIRS      = 72;
const COMMAND_FIRE        = 73;
const COMMAND_THROW       = 74;
const COMMAND_MOVE        = 75;
const COMMAND_WAIT        = 76;
const COMMAND_HELP        = 77;
const COMMAND_CLOSE       = 78;
const COMMAND_PAGEDOWN    = 79;
const COMMAND_PAGEUP      = 80;
const COMMAND_ENTER       = 81;
const COMMAND_NONE        = 82;
const COMMAND_CAMP        = 83;
const COMMAND_ATTACK      = 84;

//-- Commands from server. -----------------------
const COMMAND_SENSE   = 100;
const COMMAND_TURN    = 101;
const COMMAND_GAMEOVER= 102;
const COMMAND_WIN     = 103;

//-- Targeting system: ---------------------------
const TARGET_SELF = 1; // Allow the self to be targetted. Will skip selection if this is the only flag set.
const TARGET_FRIEND = 2; // Allow targeting of friendly actors.
const TARGET_ENEMY = 4; // Allow enemies to be targetted.
const TARGET_OTHER = TARGET_ENEMY|TARGET_FRIEND; // Allow any other actor to be targeted.
const TARGET_ANYONE = TARGET_OTHER|TARGET_SELF; // Allow any actor to be targeted.
const TARGET_ALL = 8; // All viable targets will be effected, not just one (no selection).
const TARGET_FURNITURE = 16; // Allow to target furniture.
const TARGET_RANGE = 32; // Allow targets in range, not just those in view.
const TARGET_DIRECTION = 64; // The player will be prompted to select a direction.
const RANGE_VIEW = -1; // Targeting will use the actors view range.

//-- Containable object types: -------------------
const TYPE_CONTAINABLE = 1;
const TYPE_ITEM = 2;
const TYPE_ACTOR = 3;
const TYPE_TRAP = 4;

//-- Actor Factions (bit flags): -----------------
const FACTION_GOBLIN = 1;
const FACTION_PLAYER = FACTION_GOBLIN;
const FACTION_ENEMY = 2;

//-- Genders: ------------------------------------
const GENDER_MALE = 'm';
const GENDER_FEMALE = 'f';
const GENDER_NONBINARY = 'nb';

//-- Equipment placements: -----------------------
const EQUIP_MAINHAND = 'main';
const EQUIP_OFFHAND = 'off';
const EQUIP_BODY = 'body';
const EQUIP_HEAD = 'head';
const EQUIP_NECK = 'neck';
const EQUIP_FINGER = 'finger';

//-- Damage Types (bit flags) --------------------
const DAMAGE_PHYSICAL = 1;
const DAMAGE_FIRE =  2;
const DAMAGE_ACID =  4;
const DAMAGE_MAGIC =  8;
const DAMAGE_0000000000010000 = 16;
const DAMAGE_0000000000100000 = 32;
const DAMAGE_0000000000000000 =  0;

//-- Path Finding ----------------------------------
const P_DIJKSTRA_NOT_FOUND = 0;
const P_DIJKSTRA_FINISHED  = 1;
const P_DIJKSTRA_ADD_PATH  = 2;
const P_INCLUDE_INTERIOR   = 1;
const P_INCLUDE_FINISHED   = 2;


/*===========================================================================
    Default Object Extentions
  ===========================================================================*/

if(Object.instantiate){
    console.log('Cannot attach method "instantiate" to Object.');
} else{
    Object.instantiate = function (aPrototype){
        if(aPrototype.initializer){
            // Create arguments, minus prototype, to pass to initializer.
            const cleanArguments = [];
            for(let argI = 1; argI < arguments.length; argI++){
                cleanArguments.push(arguments[argI]);
            }
            // Call initializer, return new object.
            return aPrototype.initializer.apply(
                Object.create(aPrototype),
                cleanArguments
            );
        }
        return Object.create(aPrototype);
    };
}
if(Object.extend){
    console.log('Cannot attach method "extend" to Object.');
} else{
    Object.extend = function (aPrototype, extention){
        const valueConfiguration = {};
        for(let key in extention){
            if(!extention.hasOwnProperty(key)){ continue;}
            const keyValue = extention[key];
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

const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const characterIndex = function (character){
    // Converts a letter to it's position in the alphabet. Returns a number.
    character = character.toLowerCase();
    return alphabet.indexOf(character);
};

/*=== Common tasks when dealing with arrays. ================================*/

const pick = function (){
    return arrayPick(arguments);
};
const arrayPick = function (sourceArray){
    // Returns a randomly chosen element from the source array.
    const randomIndex = Math.floor(Math.random()*sourceArray.length);
    const randomElement = sourceArray[randomIndex];
    if(!randomElement){
        console.log("Problem: "+randomIndex+'/'+sourceArray.length);
    }
    return randomElement;
};
const arrayRemove = function (sourceArray, element){
    // Removes element from sourceArray, if present. Returns undefined.
    const elementIndex = sourceArray.indexOf(element);
    if(elementIndex != -1){
        sourceArray.splice(elementIndex, 1);
    }
}

/*=== Math. =================================================================*/

const randomInterval = function (min, max){
    // Returns a randomly select integer between min and max, inclusive.
    if(!min){ min = 0;}
    if(!max){ max = min; min = 0;}
    const range = max-min;
    return min + Math.floor(Math.random()*(range+1));
};
const gaussRandom = function (mean, standardDeviation){
    /**
     *  Generates random integers with a gaussian (normal) distribution about
     *      the specified mean, with the specified standard deviation.
     *  Returns an integer.
     **/
    let leg1;
    let leg2;
    do{
        leg1 = Math.random();
        leg2 = Math.random();
    } while(!(leg1 && leg2));
    let normal = Math.cos(2*Math.PI*leg2) * Math.sqrt(-(2*Math.log(leg1)));
    let gaussian = mean + normal*standardDeviation;
    return Math.round(gaussian);
};
const distance = function (startX, startY, endX, endY){
    const deltaX = Math.abs(endX-startX);
    const deltaY = Math.abs(endY-startY);
    return Math.max(deltaX, deltaY);
};
const getStepCoords = function (startX, startY, direction){
    if(direction & NORTH){ startY++;}
    if(direction & SOUTH){ startY--;}
    if(direction & EAST ){ startX++;}
    if(direction & WEST ){ startX--;}
    return {x: startX, y: startY};
};
const directionTo = function (startX, startY, endX, endY){
    let deltaX = endX-startX;
    let deltaY = endY-startY;
    if(!deltaX && !deltaY){
        return 0;
    }
    let direction = 0;
    let angle = Math.atan2(deltaY, deltaX); // Reversed, don't know why.
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