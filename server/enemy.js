

//== Enemies ===================================================================

//-- Dependencies --------------------------------
import actor from './actor.js';
import modelLibrary from './model_library.js';
import mapManager from './map_manager.js';
import gameManager from './game_manager.js';
import pathFinder from './path_finder.js';
// Extensions must be executed first, so redefinions can references prior methods
import './extension_stats.js';
import './extension_combat.js';
import './extension_equipment.js';


//== Basic Enemy Definition ====================================================

const enemy = Object.extend(actor, {
    generationId: undefined,
    generationWeight: undefined,
    // Redefined properties:
    character: 'š',
    viewRange: 7,
    turnDelay: 1,
    // Newly defined Properties:
    rewardExperience: undefined,
    baseAttack: 1,
    faction: FACTION_ENEMY,
    behavior: undefined,
    active: false,
    pathInfo: undefined,
    skills: ["attack"],
    undead: false,
    opensDoors: 0,
        // Percentage chance to successfully open door.
    vigilance: 3,
        // The minimum distance from which the enemy can be activated by sound.
    forgetful: 2,
        // How many turns, on average, before the enemy deactivates.
    erratic: 0,
        // The percentage of movements that will be random.
    breedRate: 0,
        // The percentage chance that the enemy will clone itself on a turn.
    breedRateDecay: 1,
        // Each time the enemy breeds, enemy.breedRate *= breedRateDecay
    breedId: undefined,
        // The kind of model to breed. Defaults to this.generationId.
    sedentary: false,
        // True if the enemy does not move.
    // Redefined methods:
    takeTurn(callback){
        /**
            This function causes the actor to perform their turn taking
            behavior, such as moving about the map, attacking, or alerting the
            player, possibly over the network, to issue a command.
            
            The game will halt until callback is called. All behavior associated
            with this object taking a turn must take place between the initial
            call to takeTurn, and the call to callback.
            
            It does not return anything.
         **/
        if(this.erratic && Math.random() < this.erratic){
            this.behaviorErratic();
        } else if(typeof this.behavior == 'function'){
            this.behavior();
        }
        this.nextTurn += this.turnDelay;
        callback(this.active);
    },
    die(){
        var rewardExperience = this.rewardExperience;
        var result = actor.die.apply(this, arguments);
        var thePlayer = gameManager.currentGame.hero;
        if(thePlayer){
            thePlayer.adjustExperience(rewardExperience);
        }
        return result;
    },
    hear(tamber, amplitude, source, message){
        if(this.active){ return;}
        if(
            source &&
            distance(this.x, this.y, source.x, source.y) > this.vigilance
        ){ return;}
        if(source && source.faction && !(source.faction & this.faction)){
            this.activate(source);
        }
    },
    move(direction){
        var success = actor.move.apply(this, arguments);
        if(!success){
            var dest = getStepCoords(this.x, this.y, direction);
            var testDoor = mapManager.getTile(dest.x, dest.y, this.levelId);
            if(
                testDoor && testDoor.toggleDoor &&
                (Math.random() < this.opensDoors)
            ){
                testDoor.toggleDoor(dest.x, dest.y, this, true);
                return true;
            }
        }
        return success;
    },
    hurt: (function (parentFunction){
        return function (amount){
            this.activate();
            return parentFunction.apply(this, arguments);
        };
    })(actor.hurt),
    bump: (function (parentFunction){
        return function (obs){
            if(obs.type == TYPE_ACTOR && !(obs.faction & this.faction)){
                var indexedSkill = modelLibrary.getModel('skill', 'attack');
                indexedSkill.use(this, obs);
                return false;
            } else{
                return parentFunction.apply(this, arguments);
            }
        };
    })(actor.bump),
    // Newly defined Methods:
    activate(activator){
        /**
         *  This function actives the enemy, basically "waking it up". It is
         *  usually called when the player comes into view, makes loud noises
         *  nearby, or otherwise alerts the enemy to their presense. It can
         *  also be triggered by other non-player driven events, or even as
         *  soon as the level is generated for some particularly vigilant
         *  enemies.
         *
         *  It registers the enemy with the time manager.
         *
         *  It does not return a value.
         **/
        if(this.active){ return;}
        if(activator && !(activator.faction & this.faction)){
            this.targetId = activator.id;
        }
        gameManager.registerActor(this);
        this.active = true;
    },
    deactivate(){
        /**
            This function deactives the enemy, basically putting it "to sleep". It is
            usually called when the player goes out of view for a period of time.
          
            It cancels the enemy from the time manager.
          
            It does not return a value.
         **/
        if(!this.active){ return;}
        gameManager.cancelActor(this);
        this.active = false;
    },
    breed(){
        var breedId = this.breedId || this.generationId;
        var selfType = modelLibrary.getModel('enemy', breedId);
        if(!selfType){ return false;}
        var oldX = this.x;
        var oldY = this.y;
        var oldL = this.levelId;
        var directions = [
            NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,SOUTHEAST,SOUTHWEST];
        var success;
        while(!success && directions.length){
            var rI = randomInterval(0, directions.length-1);
            var randomDirection = directions[rI];
            directions.splice(rI, 1);
            success = this.move(randomDirection);
        }
        if(!success){ return false;}
        var progeny = Object.instantiate(selfType);
        success = progeny.place(oldX, oldY, oldL);
        if(!success){
            progeny.dispose();
            return false;
        }
        progeny.activate();
        this.breedRate *= this.breedRateDecay;
        progeny.breedRate = Math.min(this.breedRate, progeny.breedRate);
        return true;
    }
});

//-- Enemy Behaviors -----------------------------
enemy.behaviorErratic = function (){
    var direction = pick(
        NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,SOUTHEAST,SOUTHWEST);
    this.move(direction);
};
enemy.behaviorDirect = function (){
    var target = this.getViewTarget();
    if(target){
        if(this.trySkill(target)){ return;}
    } else{
        target = gameManager.currentGame.hero;
    }
    this.move(directionTo(this.x, this.y, target.x, target.y));
};
enemy.trySkill = function (target){
    // Breed
    if(this.breedRate && Math.random() < this.breedRate){
        this.breed();
        return true;
    }
    // Determine if target is in view and in range of any skills. Use a skill.
    var range = distance(this.x, this.y, target.x, target.y);
    for(var skillI = 0; skillI < this.skills.length; skillI++){
        var skillSkipChance = Math.random() < 1/2;
        if(skillI == this.skills.length-1 || skillSkipChance){
            var skillName = this.skills[skillI];
            var indexedSkill = modelLibrary.getModel('skill', skillName);
            if(!indexedSkill){ continue;}
            if(indexedSkill.targetClass != TARGET_SELF){
                if(range > indexedSkill.range){ continue;}
            }
            if(!indexedSkill.targetClass & TARGET_RANGE){
                if(this.checkView(target)){ continue;}
            }
            if(indexedSkill.targetClass & TARGET_ALL){
                var viewContents = this.getViewContents();
                for(var cI = 0; cI < viewContents.length; cI++){
                    var indexC = viewContents[cI];
                    if(
                        indexC && indexC.type == TYPE_ACTOR &&
                       !(this.faction & indexC.faction)
                    ){ indexedSkill.use(this, indexC);}
                }
            } else{
                indexedSkill.use(this, target);
            }
            return true;
        }
    }
    return false;
};
enemy.getViewTarget = function (){
    // Find closest enemy in view.
    var testContent = this.getViewContents();
    var closeTarget;
    var closeDistance = 11;
    testContent.forEach(function (content){
        if(content.faction & this.faction){ return;}
        if(content.type != TYPE_ACTOR){ return;}
        var testDistance = distance(this.x, this.y, content.x, content.y);
        if(testDistance < closeDistance){
            closeTarget = content;
            closeDistance = testDistance;
        }
    }, this);
    // If no enemies, return null.
    return closeTarget;
};
enemy.simplePursue = function (target, simpleThreshold){
    if(this.sedentary){ return false;}
    var targetDist = distance(this.x, this.y, target.x, target.y);
    if(!simpleThreshold){ simpleThreshold = 3;}
    var stepDir;
    // If enemy is far away, just move foward. Save aStar to get close in.
    if(targetDist > simpleThreshold){
        stepDir = directionTo(this.x, this.y, target.x, target.y);
        return this.move(stepDir);
    }
    // Otherwise, use aStar to make sure you can get close in and attack.
    var path = pathFinder.findPath(this, target);
    if(!(path && path.length)){ return false;}
    var nextStep = path.shift();
    stepDir = directionTo(this.x, this.y, nextStep.x, nextStep.y);
    return this.move(stepDir);
};
enemy.behaviorNormal = enemy.behavior = function (){
    /**
        This is an enemy behavior function. It is called every time the enemy is
        given a turn, and determines what the enemy will do with that turn. The
        "Normal" behavior is to find the closest target in view, move toward it,
        and use a skill or attack it if in range. If the target is in range of
        multiple skills, then each is given a one half chance to be used, in
        order, which means that the first specified skill has double the chance
        of being used as the second skill specified.
        
        It does not return anything.
     **/
    // Check view before going on to more complex path finding.
    var success;
    var target = this.getViewTarget();
    if(target){
        if(this.trySkill(target)){ success = true;}
        if(!success && this.simplePursue(target)){ success = true;}
        if(success){
            this.targetId = null;
            this.targetPath = null;
            return;
        }
    }
    if(this.sedentary){ return;}
    // If target in storage, move toward it. Pathfind on failure.
    target = this.targetId? mapManager.idManager.get(this.targetId) : null;
    let path = this.targetPath? this.targetPath : null;
    if(target && (!path || !path.length)){
        this.targetPath = null;
        success = this.move(
            directionTo(this.x, this.y, target.x, target.y));
        if(!success){
            path = pathFinder.findPath(this, target);
            this.targetPath = path;
        }
        return;
    }
    // If there's no target or no path, do complex pathfinding. :(
    if(!target || !path){
        var targetData = pathFinder.findTarget(this, this.faction);
        var forgotten = this.forgetful? (Math.random() < 1/this.forgetful) : 0;
        if(targetData && (!forgotten || this.checkView(targetData.target))){
            target = targetData.target;
            path = targetData.path;
            this.targetId = target;
            this.targetPath = path;
        } else{
            this.deactivate();
            return;
        }
    }
    var nextStep = path.shift();
    if(!nextStep){ return;}
    while(nextStep.x == this.x && nextStep.y == this.y){
        nextStep = path.shift();
        if(!nextStep){
            this.targetPath = null;
            return;
        }
    }
    var direction = directionTo(this.x,this.y,nextStep.x,nextStep.y);
    this.move(direction);
};


//== Enemy Archetype: Blob =====================================================

//-- Body Part -----------------------------------
const blobBody = Object.extend(enemy, {
    headId: undefined,
    rewardExperience: 0,
    initializer(options){
        enemy.initializer.apply(this, arguments);
        var head = options.head;
        this.headId = head.id;
        this.name = head.name;
        this.faction = head.faction;
        this.baseAttack = head.baseAttack;
        this.dieExtension = head.dieExtension; // TODO: refactor this.
        if(head.bodyCharacter){
            this.character = head.bodyCharacter;
        }
        if(head.bodyColor){
            this.color = head.bodyColor;
        }
        if(head.bodyBackground){
            this.background = head.bodyBackground;
        }
        return this;
    },
    activate(){},
    attackNearby(){
        if(!(this.levelId && this.x && this.y)){ return;}
        var rangeContent = mapManager.getRangeContents(
            this.x, this.y, this.levelId, 1);
        var target;
        while(!target && rangeContent.length){
            var rI = randomInterval(0, rangeContent.length-1);
            var rTarget = rangeContent[rI];
            rangeContent.splice(rI,1);
            if(rTarget.faction&this.faction){ continue;}
            if(rTarget.type != TYPE_ACTOR){ continue;}
            target = rTarget;
            break;
        }
        if(target){
            this.attack(target);
        }
    },
    bump(){
        return actor.bump.apply(this, arguments);
    },
    hurt(){
        var head = mapManager.idManager.get(this.headId);
        return head.hurt.apply(head, arguments);
    },
    pack(){
        // Prevent multiple copies from showing up in the look list.
        var sensoryData = enemy.pack.apply(this, arguments);
        var head = mapManager.idManager.get(this.headId);
        if(!head){ return sensoryData;}
        sensoryData.id = head.id;
        return sensoryData;
    },
    move(direction){
        if(!(this.x && this.y && this.levelId) || (Math.random() < 1/4)){
            var dirs = [NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,
                SOUTHEAST,SOUTHWEST];
            while(dirs.length){
                var dir = dirs.shift();
                var head = mapManager.idManager.get(this.headId);
                if(!head){ return false;}
                var dCoords = getStepCoords(head.x, head.y, dir);
                this.place(dCoords.x, dCoords.y, head.levelId);
            }
            return true;
        } else{
            return enemy.move.apply(this, arguments);
        }
    },
    die(){
        if(this.dieExtension){
            this.dieExtension.apply(this, arguments);
        }
        return enemy.die.apply(this, arguments);
    }
});

//-- Archetype -----------------------------------
const blobPrototype = Object.extend(enemy, {
    character: 'B',
    bodyCharacter: 'B',
    bodyColor: undefined,
    bodyBackground: undefined,
    bodyMass: 4,
    turnDelay: 2,
    dieExtension: undefined, // Refactor this.
    initializer(options){
        enemy.initializer.apply(this, arguments);
        this.body = [];
        for(var bodyI = 0; bodyI < this.bodyMass-1; bodyI++){
            // Skip one, to include head in mass. Makes hp calc easier.
            var segment = blobBody.initializer.call(
                Object.create(blobBody),
                {head: this}
            );
            this.body[bodyI] = segment;
        }
        return this;
    },
    bump(obstruction){
        if(this.body.indexOf(obstruction) >= 0){
            mapManager.swapPlaces(this, obstruction);
        }
        return actor.bump.apply(this, arguments);
    },
    hurt(){
        var result = enemy.hurt.apply(this, arguments);
        var maxBody = this.hp / (this.maxHp()/this.bodyMass);
        while(this.body.length > maxBody){
            var segment = this.body.shift();
            segment.die();
        }
        return result;
    },
    move(direction){
        var success = enemy.move.apply(this, arguments);
        this.body.forEach(function (segment){
            var moveDirection = directionTo(
                segment.x, segment.y, this.x, this.y);
            var success = segment.move(moveDirection);
            var dirVert = moveDirection & (NORTH|SOUTH);
            var dirHor  = moveDirection & (EAST |WEST );
            if(!success){
                var primaryDir = dirVert;
                var secondaryDir = dirHor;
                if(Math.abs(this.x-segment.x) > Math.abs(this.y-segment.y)){
                    primaryDir = dirHor;
                    secondaryDir = dirVert;
                }
                success = (segment.move(primaryDir) ||
                    segment.move(secondaryDir));
            }
        }, this);
        return success;
    },
    place(){
        var fromTheVoid = !(this.x && this.y && this.levelId);
        var success = enemy.place.apply(this, arguments);
        if(fromTheVoid){
            for(var bodyI = 0; bodyI < this.body.length; bodyI++){
                var bodySegment = this.body[bodyI];
                bodySegment.move();
            }
        }
        return success;
    },
    dispose(){
        for(var bodyI = 0; bodyI < this.body.length; bodyI++){
            var bodySegment = this.body[bodyI];
            bodySegment.dispose();
        }
        enemy.dispose.apply(this, arguments);
    },
    behavior(){
        for(var bodyI = 0; bodyI < this.body.length; bodyI++){
            var bodySegment = this.body[bodyI];
            bodySegment.attackNearby();
        }
        return this.behaviorNormal(...arguments);
    }
});
    

//== Enemy Archetype: Snake ====================================================

//-- Body Part -----------------------------------
const snakeBody = Object.extend(enemy, {
    headId: undefined,
    initializer(options){
        enemy.initializer.apply(this, arguments);
        var head = options.head;
        this.headId = head.id;
        this.name = head.name;
        this.faction = head.faction;
        if(head.bodyCharacter){
            this.character = head.bodyCharacter;
        }
        if(head.bodyColor){
            this.color = head.bodyColor;
        }
        if(head.bodyBackground){
            this.background = head.bodyBackground;
        }
        return this;
    },
    activate(){},
    attackNearby(){
        if(!(this.levelId && this.x && this.y)){ return;}
        var rangeContent = mapManager.getRangeContents(
            this.x, this.y, this.levelId, 1);
        var target;
        while(!target && rangeContent.length){
            var rI = randomInterval(0, rangeContent.length-1);
            var rTarget = rangeContent[rI];
            rangeContent.splice(rI,1);
            if(rTarget.faction&this.faction){ continue;}
            if(rTarget.type != TYPE_ACTOR){ continue;}
            target = rTarget;
            break;
        }
        if(target){
            this.attack(target);
        }
    },
    hurt(){
        var head = mapManager.idManager.get(this.headId);
        return head.hurt.apply(head, arguments);
    },
    pack(){
        // Prevent multiple copies from showing up in the look list.
        var sensoryData = enemy.pack.apply(this, arguments);
        var head = mapManager.idManager.get(this.headId);
        if(!head){ return sensoryData;}
        sensoryData.id = head.id;
        return sensoryData;
    }
});

//-- Archetype -----------------------------------
const snakePrototype = Object.extend(enemy, {
    bodyCharacter: 'o',
    bodyColor: undefined,
    bodyBackground: undefined,
    bodyLength: 4,
    placements: undefined,
    initializer(options){
        enemy.initializer.apply(this, arguments);
        this.body = [];
        this.placements = [];
        for(var bodyI = 0; bodyI < this.bodyLength; bodyI++){
            var segment = snakeBody.initializer.call(
                Object.create(snakeBody),
                {head: this}
            );
            this.body[bodyI] = segment;
        }
        return this;
    },
    move(direction){
        var oldPlacement = {
            x: this.x,
            y: this.y,
            levelId: this.levelId
        };
        var success = enemy.move.apply(this, arguments);
        if(!success){
            var offsetX = 0;
            var offsetY = 0;
            if(direction & NORTH){ offsetY++;} else if(direction & SOUTH){ offsetY--;}
            if(direction & EAST ){ offsetX++;} else if(direction & WEST ){ offsetX--;}
            var destination = {
                x: this.x+offsetX,
                y: this.y+offsetY
            };
            var swapPlace;
            var swapIndex;
            for(var placeI = 0; placeI < this.placements.length; placeI++){
                var placement = this.placements[placeI];
                if(destination.x == placement.x && destination.y == placement.y){
                    swapPlace = placement;
                    swapIndex = placeI;
                    break;
                }
            }
            if(swapPlace){
                this.placements.splice(swapIndex, 1);
                var segment = this.body[swapIndex];
                segment.unplace();
                success = enemy.move.apply(this, arguments);
            }
        }
        if(success){
            this.placements.unshift(oldPlacement);
            if(this.placements.length > this.bodyLength){
                this.placements.splice(this.bodyLength);
            }
            for(var placeI2 = 0; placeI2 < this.placements.length; placeI2++){
                var placement2 = this.placements[placeI2];
                var segment2 = this.body[placeI2];
                if(placement2 && segment2){
                    segment2.place(
                        placement2.x, placement2.y, placement2.levelId
                    );
                }
            }
        }
        return success;
    },
    dispose(){
        for(var bodyI = 0; bodyI < this.body.length; bodyI++){
            var bodySegment = this.body[bodyI];
            bodySegment.dispose();
        }
        enemy.dispose.apply(this, arguments);
    },
    behavior(){
        for(var bodyI = 0; bodyI < this.body.length; bodyI++){
            var bodySegment = this.body[bodyI];
            bodySegment.attackNearby();
        }
        return this.behaviorNormal(...arguments);
    }
});


//== Exports ===================================================================

export {enemy, snakePrototype, blobPrototype};


//==============================================================================
/*
CQ Enemies:
Boar, Bug, Bird, Skull, Spine, Mummy, Vampire, Bat, ????, Ghost, Djinn, Mage,
Imp, Knight, Bowser, Firewall, BombShell, Eyeball, antlion, scorpion, snake,
drake, spider, reaper, lord knight, demon, blob, ninja, samurai, shinto, bear.

Direct Ports:
    Ruttle, Skull, Mummy, Vampire, Bat, Ghost, Imp, Eyeball, scorpion, snake
    drake, reaper, demon, ninja, samurai, shinto, bear.
Composite Enemies:
    Spine, Bowser, Firewall, blob
Map altering enemies:
    ????, BombShell, spider, Ant Lion,
    
    Ant, Centipede, frog, golem, jackal, mold,
rodent, skeleton, worm, zombie, Cube, Fly, Jelly,
Lich, Reptile, Wight, Wraith


World of Edrin:
    Wizards, Dragons
    Goblin, Humans, Demons, Immortals
    Beasts / Monsters
    Undead, Imprints
    

enemies:

Critters
Undead
Magicians
Beasts

Skeleton, Zombie, Mummy, Vampire, Lich
Spirit, Wraith, Wight, Ghost, Apparition
Demon, Imp, Devil, Djinn

wasp, worm, vespid, bees!, insect, beetle, scorpion, spider, centipede, millipede,
    ant, mantis, roach, grub, tarantula,

Moria: Ant, Bat, Centipede, dragon, eye, frog, golem, harpy, icky thing, jackal,
kobold, giant louse, mold, orc, ogre, personalbar, quasit, rodent, skeleton, tick,
worm, yeek, zombie, Ant Lion, Balrog, Cube, Dragon, Elemental, Fly, Ghost,
Hobgoblin, Jelly, Beetle, Lich, Mummy, Ooze, Person, Quasusdkfthug, Reptile,
Scorpion, Troll, Umber Hulk, Vampire, Wight, Wraith, Xorn, Yeti

a - Ant
b - Bat
C - Centipede
d - dragon
e - eye
f - frog
g - goblin, golem?
h - harpy
i - icky thing
j - jackal
k - kobold
l - giant louse
m - mold
o - orc, ogre
p - person
q - quasit
r - rodent
s - skeleton
t - tick
u -
v -
w - worm
y - yeek
z - zombie

A - Ant Lion
B - Balrog
C - Cube
D - Ancient Dragon
E - Elemental
F - Fly
G - ghost
H - Hobgoblin
I -
J - Jelly
K - Beetle
L - Lich
M - Mummy
O - Ooze
P - Giant person
Q - Quylthulg
R - Reptile
S - Scorpion
T - Troll
U - Umber Hulk
V - Vampire
W - Wraith
X - Xorn
Y - Yeti
Z -

Enemy Types:

* Standard:
    C Centipede, f frog, j jackal, k kobold, o orc / ogre, s skeleton, y yeek,
    z zombie, H Hobgoblin, M Mummy, R Reptile, S Scorpion, T Troll, Y Yeti
* Heavy           : g golem, K Beetle
* Breeders        : r rodent, l giant louse, r rodent, w worm, F Fly, O Ooze
* Trappers        : e eye, m mold, J Jelly, Q Quylthulg
Sappers         : t tick, G ghost, U Umber Hulk, W Wraith, i icky thing
Skills          : p person, E Elemental, V Vampire, P Giant person
Hunters         : C Cube, L Lich, X Xorn
Fragile Blasters: b Bat, F Fly
* Fragile Brawlers: h harpy
Bosses          : d dragon, B Balrog, D Ancient Dragon
Unknown         : a Ant, q quasit, A Ant Lion

1 (Training Enemies):
    *rat, *Ant1, *ruttle, bat, snake, giant centipede
2 (Can kill you if you are not careful):
    *Ant2, skull, *eyeball, scorpion, *skeleton, *skuzzy
3 (Approach with Caution):
    centipede2, *worm, *mold, spider1, *imp, mummy, ghost, bombshell, antLion
4 (Avoid. Requires a plan):
    spider2, wight, firewall, wraith, *blob
5 (Run. Just run):
    Vampire, Lich, spider3, demon

    frog, golem, jackal, Cube, Fly, Jelly, Reptile,

aA - giant ant
bB - bat, beetle, Blob
cC - centipede
dD - skeletal dwarf, Demon
eE - floating eye
fF - frog, Fire
gG - goblin
hH - 
iI - Imp
jJ - 
kK - ksuzzy
lL - Lich
mM - mold, Mummy
nN - 
oO - 
pP - 
qQ - 
rR - rat
sS - snake, skull, scorpion, skeleton
tT - turtle, Tarantula
uU - 
vV - Vampire
wW - worm, Wight, Wraith
xX - 
yY - 
zZ - zombie dwarf








*/