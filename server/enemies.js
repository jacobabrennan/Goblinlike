hero.faction = FACTION_GOBLIN;
var enemyLibrary = (function (){ // Open new namespace for enemy library.
//==============================================================================
var library = {
    enemies: {},
    enemyWeights: [],
    registerEnemy: function (newPrototype){
        var prototypeName = newPrototype.name;
        if(!prototypeName || this.enemies[prototypeName]){
            console.log('Problem: Non-unique name for enemy prototype '+prototypeName);
        }
        var enemyWeight = newPrototype.rewardExperience;
        if(enemyWeight){
            var weightClass = this.enemyWeights[enemyWeight];
            if(!weightClass){
                weightClass = [];
                this.enemyWeights[enemyWeight] = weightClass;
            }
            weightClass.push(prototypeName);
        }
        this.enemies[prototypeName] = newPrototype;
    },
    getEnemy: function (enemyName){
        var enemyPrototype = this.enemies[enemyName];
        return enemyPrototype;
    },
    getEnemyByWeight: function (weight){
        weight = Math.round(weight);
        var weightClass;
        var enemyPrototype;
        while(!weightClass && weight > 0){
            weightClass = this.enemyWeights[weight];
            if(!weightClass){
                weight--;
                continue;
            }
            prototypeName = arrayPick(weightClass);
            enemyPrototype = this.getEnemy(prototypeName);
            if(enemyPrototype){
                break;
            }
        }
        return enemyPrototype;
    }
};

var enemy = Object.create(actor, {
    // Redefined properties:
    character: {value: 'š', writable: true},
    viewRange: {value: 7, writable: true},
    turnDelay: {value: 1, writable: true},
    // Newly defined Properties:
    rewardExperience: {value: undefined, writable: true},
    faction: {value: FACTION_ENEMY, writable: true},
    behavior: {value: undefined, writable: true},
    active: {value: false, writable: true},
    skills: {value: ["attack"], writable: true},
    vigilance: {value: 3, writable: true},
    forgetful: {value: 2, writable: true},
    // Redefined methods:
    takeTurn: {value: function (callback){
        /**
            This function causes the actor to perform their turn taking
            behavior, such as moving about the map, attacking, or alerting the
            player, possibly over the network, to issue a command.
            
            The game will halt until callback is called. All behavior associated
            with this object taking a turn must take place between the initial
            call to takeTurn, and the call to callback.
            
            It does not return anything.
         **/
        if(typeof this.behavior == 'function'){
            this.behavior();
        }
        this.nextTurn += this.turnDelay;
        callback(this.active);
    }, writable: true},
    die: {value: function (){
        var rewardExperience = this.rewardExperience;
        var result = actor.die.apply(this, arguments);
        var thePlayer = gameManager.currentGame.hero;
        if(thePlayer){
            thePlayer.adjustExperience(rewardExperience);
        }
        return result;
    }, writable: true},
    hear: {value: function (tamber, amplitude, source, message){
        if(this.active){ return;}
        if(
            source &&
            distance(this.x, this.y, source.x, source.y) > this.vigilance
        ){ return;}
        if(source && source.faction && !(source.faction & this.faction)){
            this.activate();
        }
    }, writable: true},
    hurt: {value: (function (parentFunction){
        return function (){
            this.activate();
            return parentFunction.apply(this, arguments);
        };
    })(actor.hurt), writable: true},
    // Newly defined Methods:
    activate: {value: function (){
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
        gameManager.registerActor(this);
        this.active = true;
    }, writable: true},
    deactivate: {value: function (){
        /**
            This function deactives the enemy, basically putting it "to sleep". It is
            usually called when the player goes out of view for a period of time.
          
            It cancels the enemy from the time manager.
          
            It does not return a value.
         **/
        if(!this.active){ return;}
        gameManager.cancelActor(this);
        this.active = false;
    }, writable: true}
});
var behaviorNormal = function (){
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
    // Find a target, and the path to that target. If no target, deactivate.
    var target;
    var path;
    var targetData = findTarget(this, this.faction);
    var forgotten = (Math.random() < 1/this.forgetful);
    if(targetData && (!forgotten || this.checkView(targetData.target))){
        target = targetData.target;
        path = targetData.path;
    } else{
        this.deactivate();
        return;
    }
    // Determine if target is in view and in range of any skills. Use a skill.
    if(this.getViewContents().indexOf(target) != -1){
        var range = distance(this.x, this.y, target.x, target.y);
        for(var skillI = 0; skillI < this.skills.length; skillI++){
            var skillSkipChance = Math.random() < 1/2;
            if(skillI == this.skills.length-1 || skillSkipChance){
                var skillName = this.skills[skillI];
                var indexedSkill = skillLibrary.getSkill(skillName);
                if(!indexedSkill){ continue;}
                if(range > indexedSkill.range){ continue;}
                indexedSkill.use(this, target);
                return;
            }
        }
    }
    // If a skill was not used, move toward the target.
    var pathArray = path;
    var nextCoord = pathArray.shift();
    if(!nextCoord){
        return;
    }
    var direction = directionTo(this.x,this.y,nextCoord.x,nextCoord.y);
    this.move(direction);
};

var snakePrototype = (function (){
    var snakeBody = Object.create(enemy, {
        headId: {value: undefined, writable: true},
        constructor: {value: function (options){
            enemy.constructor.apply(this, arguments);
            var head = options.head;
            this.headId = head.id;
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
        }, writable: true},
        activate: {value: function (){}},
        hurt: {value: function (){
            var head = mapManager.idManager.get(this.headId);
            return head.hurt.apply(head, arguments);
        }, writable: true}
    });
    return Object.create(enemy, {
        bodyCharacter: {value: 'o', writable: true},
        bodyColor: {value: undefined, writable: true},
        bodyBackground: {value: undefined, writable: true},
        bodyLength: {value: 4, writable: true},
        placements: {value: undefined, writable: true},
        constructor: {value: function (options){
            enemy.constructor.apply(this, arguments);
            this.body = [];
            this.placements = [];
            for(var bodyI = 0; bodyI < this.bodyLength; bodyI++){
                var segment = snakeBody.constructor.call(
                    Object.create(snakeBody),
                    {head: this}
                );
                this.body[bodyI] = segment;
            }
            return this;
        }, writable: true},
        move: {value: function (direction){
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
        }, writable: true},
        dispose: {value: function (){
            for(var bodyI = 0; bodyI < this.body.length; bodyI++){
                var bodySegment = this.body[bodyI];
                bodySegment.dispose();
            }
            enemy.dispose.apply(this, arguments);
        }, writable: true},
        behavior: {value: behaviorNormal, writable: true}
    });
})();


library.registerEnemy(Object.create(enemy, {
    // Id:
    name: {value: 'Test Ghost', writable: true},
    // Display:
    color: {value: "blue", writable: true},
    // Stats:
    rewardExperience: {value: 10, writable: true},
    vigilance: {value: 0},
    baseHp: {value: 5},
    baseMp: {value: 1},
    // Behavior:
    behavior: {value: function (){
        this.move(arrayPick([NORTH,SOUTH,EAST,WEST,NORTHWEST,NORTHEAST,SOUTHWEST,SOUTHEAST]));
    }, writable: true}
}));
library.registerEnemy(Object.create(enemy, {
    // Id:
    name: {value: 'Red Beetle', writable: true},
    // Display:
    color: {value: "#f00", writable: true},
    character: {value: "B", writable: true},
    // Stats:
    rewardExperience: {value: 10, writable: true},
    turnDelay: {value: 1.7},
    baseHp: {value: 1},
    baseMp: {value: 0},
    // Behavior:
    skills: {value: ["breath fire", "attack"], writable: true},
    behavior: {value: behaviorNormal, writable: true}
}));
library.registerEnemy(Object.create(snakePrototype, {
    // Id:
    name: {value: 'Worm', writable: true},
    // Display:
    character: {value: 'w', writable: true},
    color: {value: '#a53', writable: true},
    bodyCharacter: {value: 'o', writable: true},
    bodyColor: {value: '#a53', writable: true},
    bodyBackground: {value: undefined, writable: true},
    // Stats:
    rewardExperience: {value: 20, writable: true},
    turnDelay: {value: 2.5, writable: true},
    baseHp: {value: 10},
    baseMp: {value: 0},
    // Behavior:
    bodyLength: {value: 7, writable: true}
}));
var spiderPrototype = (function (){
    return Object.create(enemy, {
        name: {value: 'Tarantula', writable: true},
        character: {value: 'T', writable: true},
        color: {value: '#963', writable: true},
        behavior: {value: behaviorNormal, writable: true}
    });
})();
library.registerEnemy(Object.create(spiderPrototype, {
    // Id:
    name: {value: 'Tarantula', writable: true},
    // Display:
    color: {value: '#963', writable: true},
    // Stats:
    rewardExperience: {value: 30, writable: true},
    turnDelay: {value: 7/8, writable: true},
    baseHp: {value: 4},
    baseMp: {value: 0}
    // Behavior:
}));

//==============================================================================
    return library; // Return library, close namespace.
})();
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
b - Bat, Bear
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



1 (Training Enemies):
    rat, Ant1, ruttle, bat, snake, giant centipede
2 (Can kill you if you are not careful):
    Ant2, skull, eyeball, scorpion, skeleton, skuzzy
3 (Approach with Caution):
    centipede2, worm, mold, spider1, imp, mummy, ghost, bombshell, antLion
4 (Avoid. Requires a plan):
    spider2, wight, firewall, wraith, blob
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