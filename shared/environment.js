

/*===========================================================================
    Constants
  ===========================================================================*/

//-- Scaffolding, Remove -------------------------
const fakeNetwork = {};

//-- Misc. Configuration: ------------------------
const debug = false;
const VERSION = '1.2.0';
const STORAGE_VERSION = '1.2';
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
const SAVE_STORAGE = 'gameSave';

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
const COMMAND_SAVEGAME    = 67;
const COMMAND_LOADGAME    = 68;
const COMMAND_GET         = 69;
const COMMAND_DROP        = 70;
const COMMAND_LOOK        = 71;
const COMMAND_EQUIP       = 72;
const COMMAND_UNEQUIP     = 73;
const COMMAND_STAIRS      = 74;
const COMMAND_FIRE        = 75;
const COMMAND_THROW       = 76;
const COMMAND_MOVE        = 77;
const COMMAND_WAIT        = 78;
const COMMAND_HELP        = 79;
const COMMAND_CLOSE       = 80;
const COMMAND_PAGEDOWN    = 81;
const COMMAND_PAGEUP      = 82;
const COMMAND_ENTER       = 83;
const COMMAND_NONE        = 84;
const COMMAND_CAMP        = 85;
const COMMAND_ATTACK      = 86;

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
const DAMAGE_FIRE  =  2;
const DAMAGE_ACID  =  4;
const DAMAGE_MAGIC =  8;
const DAMAGE_ICE   = 16;
const DAMAGE_0000000000100000 = 32;
const DAMAGE_0000000000000000 =  0;

//-- Creature Types --------------------------------
const CREATURE_NONE   = 0;
const CREATURE_UNDEAD = 1;


/*===========================================================================
    Default Object Extentions
    This is legacy code from before ECMA2015, and needs to be factored out.
  ===========================================================================*/

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
