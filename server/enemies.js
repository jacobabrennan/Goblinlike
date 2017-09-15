(function (){ // Open new namespace for enemies.
//==============================================================================

var enemy = Object.create(actor, {
    generationId: {value: undefined, writable: true},
    generationWeight: {value: undefined, writable: true},
    // Redefined properties:
    character: {value: 'š', writable: true},
    viewRange: {value: 7, writable: true},
    turnDelay: {value: 1, writable: true},
    // Newly defined Properties:
    rewardExperience: {value: undefined, writable: true},
    baseAttack: {value: 1, writable: true},
    faction: {value: FACTION_ENEMY, writable: true},
    behavior: {value: undefined, writable: true},
    active: {value: false, writable: true},
    pathInfo: {value: undefined, writable: true},
    skills: {value: ["attack"], writable: true},
    undead: {value: false, writable: true},
    opensDoors: {value: 0, writable: true},
        // Percentage chance to successfully open door.
    vigilance: {value: 3, writable: true},
        // The minimum distance from which the enemy can be activated by sound.
    forgetful: {value: 2, writable: true},
        // How many turns, on average, before the enemy deactivates.
    erratic: {value: 0, writable: true},
        // The percentage of movements that will be random.
    breedRate: {value: 0, writable: true},
        // The percentage chance that the enemy will clone itself on a turn.
    sedentary: {value: false, writable: true},
        // True if the enemy does not move.
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
        if(this.erratic && Math.random() < this.erratic){
            behaviorErratic.call(this);
        } else if(typeof this.behavior == 'function'){
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
            this.activate(source);
        }
    }, writable: true},
    move: {value: function (direction){
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
    }, writable: true},
    hurt: {value: (function (parentFunction){
        return function (amount){
            this.activate();
            return parentFunction.apply(this, arguments);
        };
    })(actor.hurt), writable: true},
    bump: {value: (function (parentFunction){
        return function (obs){
            if(obs.type == TYPE_ACTOR && !(obs.faction & this.faction)){
                var indexedSkill = modelLibrary.getModel('skill', 'attack');
                indexedSkill.use(this, obs);
                return false;
            } else{
                return parentFunction.apply(this, arguments);
            }
        };
    })(actor.bump), writable: true},
    // Newly defined Methods:
    activate: {value: function (activator){
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
    }, writable: true},
    breed: {value: function (){
        var selfType = modelLibrary.getModel('enemy', this.generationId);
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
        return true;
    }, writable: true}
});
var behaviorErratic = function (){
    var direction = pick(
        NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,SOUTHEAST,SOUTHWEST);
    this.move(direction);
};
var behaviorDirect = enemy.behavior = function (){
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
    var path = findPath(this, target);
    if(!(path && path.length)){ return false;}
    var nextStep = path.shift();
    stepDir = directionTo(this.x, this.y, nextStep.x, nextStep.y);
    if(nextStep.x == this.x && nextStep.y == this.y){
        console.log('Problem');
    }
    return this.move(stepDir);
};
var behaviorNormal = enemy.behavior = function (){
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
    path = this.targetPath? this.targetPath : null;
    if(target && (!path || !path.length)){
        this.targetPath = null;
        success = this.move(
            directionTo(this.x, this.y, target.x, target.y));
        if(!success){
            path = findPath(this, target);
            this.targetPath = path;
        }
        return;
    }
    // If there's no target or no path, do complex pathfinding. :(
    if(!target || !path){
        var targetData = findTarget(this, this.faction);
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
    if(nextStep.x == this.x && nextStep.y == this.y){
        console.log('Problem');
    }
    var direction = directionTo(this.x,this.y,nextStep.x,nextStep.y);
    this.move(direction);
};

var blobPrototype = (function (){
    var blobBody = Object.create(enemy, {
        headId: {value: undefined, writable: true},
        rewardExperience: {value: 0},
        constructor: {value: function (options){
            enemy.constructor.apply(this, arguments);
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
        }, writable: true},
        activate: {value: function (){}},
        attackNearby: {value: function (){
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
        }, writable: true},
        bump: {value: function (){
            return actor.bump.apply(this, arguments);
        }, writable: true},
        hurt: {value: function (){
            var head = mapManager.idManager.get(this.headId);
            return head.hurt.apply(head, arguments);
        }, writable: true},
        pack: {value: function (){
            // Prevent multiple copies from showing up in the look list.
            var sensoryData = enemy.pack.apply(this, arguments);
            var head = mapManager.idManager.get(this.headId);
            if(!head){ return sensoryData;}
            sensoryData.id = head.id;
            return sensoryData;
        }, writable: true},
        move: {value: function (direction){
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
        }, writable: true},
        die: {value: function (){
            if(this.dieExtension){
                this.dieExtension.apply(this, arguments);
            }
            return enemy.die.apply(this, arguments);
        }, writable: true}
    });
    return Object.create(enemy, {
        character: {value: 'B', writable: true},
        bodyCharacter: {value: 'B', writable: true},
        bodyColor: {value: undefined, writable: true},
        bodyBackground: {value: undefined, writable: true},
        bodyMass: {value: 4, writable: true},
        turnDelay: {value: 2, writable: true},
        dieExtension: {value: undefined, writable: true}, // Refactor this.
        constructor: {value: function (options){
            enemy.constructor.apply(this, arguments);
            this.body = [];
            for(var bodyI = 0; bodyI < this.bodyMass-1; bodyI++){
                // Skip one, to include head in mass. Makes hp calc easier.
                var segment = blobBody.constructor.call(
                    Object.create(blobBody),
                    {head: this}
                );
                this.body[bodyI] = segment;
            }
            return this;
        }, writable: true},
        bump: {value: function (obstruction){
            if(this.body.indexOf(obstruction) >= 0){
                mapManager.swapPlaces(this, obstruction);
            }
            return actor.bump.apply(this, arguments);
        }, writable: true},
        hurt: {value: function (){
            var result = enemy.hurt.apply(this, arguments);
            var maxBody = this.hp / (this.maxHp()/this.bodyMass);
            while(this.body.length > maxBody){
                var segment = this.body.shift();
                segment.die();
            }
            return result;
        }, writable: true},
        move: {value: function (direction){
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
        }, writable: true},
        place: {value: function (){
            var fromTheVoid = !(this.x && this.y && this.levelId);
            var success = enemy.place.apply(this, arguments);
            if(fromTheVoid){
                for(var bodyI = 0; bodyI < this.body.length; bodyI++){
                    var bodySegment = this.body[bodyI];
                    bodySegment.move();
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
        behavior: {value: function (){
            for(var bodyI = 0; bodyI < this.body.length; bodyI++){
                var bodySegment = this.body[bodyI];
                bodySegment.attackNearby();
            }
            return behaviorNormal.apply(this, arguments);
        }, writable: true}
    });
})();
var snakePrototype = (function (){
    var snakeBody = Object.create(enemy, {
        headId: {value: undefined, writable: true},
        constructor: {value: function (options){
            enemy.constructor.apply(this, arguments);
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
        }, writable: true},
        activate: {value: function (){}},
        attackNearby: {value: function (){
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
        }, writable: true},
        hurt: {value: function (){
            var head = mapManager.idManager.get(this.headId);
            return head.hurt.apply(head, arguments);
        }, writable: true},
        pack: {value: function (){
            // Prevent multiple copies from showing up in the look list.
            var sensoryData = enemy.pack.apply(this, arguments);
            var head = mapManager.idManager.get(this.headId);
            if(!head){ return sensoryData;}
            sensoryData.id = head.id;
            return sensoryData;
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
        behavior: {value: function (){
            for(var bodyI = 0; bodyI < this.body.length; bodyI++){
                var bodySegment = this.body[bodyI];
                bodySegment.attackNearby();
            }
            behaviorNormal.apply(this, arguments);
        }, writable: true}
    });
})();

//==============================================================================

modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'white rat', writable: true},
    generationWeight: {value: 5, writable: true},
    name: {value: 'White Rat', writable: true},
    // Display:
    character: {value: "r", writable: true},
    // Stats:
    rewardExperience: {value: 5, writable: true},
    vigilance: {value: 0},
    erratic: {value: 1/2},
    baseHp: {value: 1},
    // Behavior:
    breedRate: {value: 1/8, writable: true},
    skills: {value: ["attack"], writable: true},
    // Description:
    viewText: {value: 'You see a small white rodent.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'giant ant', writable: true},
    generationWeight: {value: 10, writable: true},
    name: {value: 'Giant Ant', writable: true},
    // Display:
    character: {value: "a", writable: true},
    // Stats:
    rewardExperience: {value: 10, writable: true},
    vigilance: {value: 10},
    erratic: {value: 1/8},
    baseHp: {value: 3},
    // Behavior:
    // Description:
    viewText: {value: 'You see a giant ant about the size of a wolf.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'cave beetle', writable: true},
    generationWeight: {value: 10, writable: true},
    name: {value: 'Cave Beetle', writable: true},
    // Display:
    color: {value: "#666", writable: true},
    character: {value: "b", writable: true},
    // Stats:
    rewardExperience: {value: 10, writable: true},
    turnDelay: {value: 2},
    baseAttack: {value: 2, writable: true},
    baseHp: {value: 8},
    vigilance: {value: 10, writable: true},
        // The minimum distance from which the enemy can be activated by sound.
    forgetful: {value: 0, writable: true},
    // Behavior:
    opensDoors: {value: 1/4, writable: true},
    // Description:
    viewText: {value: 'You see a large armored beetle about the size of a bear. It menaces with sharp pincers.'}
}));
modelLibrary.registerModel('enemy', Object.create(snakePrototype, {
    // Id:
    generationId: {value: 'centipede', writable: true},
    generationWeight: {value: 20, writable: true},
    name: {value: 'Centipede', writable: true},
    // Display:
    character: {value: 'c', writable: true},
    //color: {value: '', writable: true},
    bodyCharacter: {value: 'o', writable: true},
    //bodyColor: {value: '#a53', writable: true},
    bodyBackground: {value: undefined, writable: true},
    // Stats:
    rewardExperience: {value: 20, writable: true},
    //turnDelay: {value: 1/2, writable: true},
    baseHp: {value: 15, writable: true},
    erratic: {value: 1/4, writable: true},
    // Behavior:
    bodyLength: {value: 3, writable: true},
    // Description:
    viewText: {value: 'You see a long centipede, large enough to block the narrow halls of the dwarven city.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'floating eye', writable: true},
    generationWeight: {value: 18, writable: true},
    name: {value: 'Floating Eye', writable: true},
    // Display:
    character: {value: "e", writable: true},
    // Stats:
    rewardExperience: {value: 18, writable: true},
    vigilance: {value: 0},
    erratic: {value: 0},
    baseHp: {value: 10},
    // Behavior:
    sedentary: {value: true, writable: true},
    skills: {value: ["glare","attack"], writable: true},
    // Description:
    viewText: {value: 'You see a large eyeball. It bobs up and down slowly.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'ksuzzy', writable: true},
    generationWeight: {value: 18, writable: true},
    name: {value: 'Ksuzzy', writable: true},
    // Display:
    character: {value: "k", writable: true},
    color: {value: '#4cf', writable: true},
    // Stats:
    rewardExperience: {value: 18, writable: true},
    vigilance: {value: 0},
    baseHp: {value: 3},
    // Behavior:
    sedentary: {value: true, writable: true},
    behavior: {value: function (){
        behaviorErratic.call(this);
    }, writable: true},
    // Description:
    viewText: {value: "You see a small blob with many small eyes on stalks rising from it's body. It squirms slowly through a puddle of acid."}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'yellow mold', writable: true},
    generationWeight: {value: 30, writable: true},
    name: {value: 'Yellow Mold', writable: true},
    // Display:
    character: {value: "m", writable: true},
    color: {value: "#990", writable: true},
    background: {value: "#440", writable: true},
    // Stats:
    rewardExperience: {value: 10, writable: true},
    vigilance: {value: 0},
    forgetful: {Value: 1},
    sedentary: {value: 1},
    baseHp: {value: 3},
    // Behavior:
    breedRate: {value: 1/10, writable: true},
    skills: {value: ["attack"], writable: true},
    // Description:
    viewText: {value: 'You see a mass of dense yellow mold covering the walls and floor. It seems to be growing at an alarming rate.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'minor imp', writable: true},
    generationWeight: {value: 30, writable: true},
    name: {value: 'Minor Imp', writable: true},
    // Display:
    character: {value: "i", writable: true},
    color: {value: "#f00", writable: true},
    // Stats:
    rewardExperience: {value: 30, writable: true},
    baseAttack: {value: 3, writable: true},
    vigilance: {value: 10},
    erratic: {value: 1/8},
    baseHp: {value: 15},
    // Behavior:
    opensDoors: {value: 1, writable: true},
    skills: {value: ["teleport","attack"], writable: true},
    // Description:
    viewText: {value: 'You see a minor imp, one of the lowest of demons. This dwarven city must have once housed a wizard or two.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'skeletal dwarf', writable: true},
    generationWeight: {value: 40, writable: true},
    name: {value: 'Skeletal Dwarf', writable: true},
    // Display:
    character: {value: "s", writable: true},
    color: {value: "#fd9", writable: true},
    // Stats:
    baseAttack: {value: 4, writable: true},
    rewardExperience: {value: 40, writable: true},
    forgetful: {value: 15, writable: true},
    baseHp: {value: 30},
    // Behavior:
    opensDoors: {value: 1, writable: true},
    // Description:
    viewText: {value: "You see a skeletal dwarf, one of the citizens of this city raised from the dead. It's vacant eye sockets seem to be fixed directly on you."}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'zombie dwarf', writable: true},
    generationWeight: {value: 45, writable: true},
    name: {value: 'Zombie Dwarf', writable: true},
    // Display:
    character: {value: "z", writable: true},
    color: {value: "#fd9", writable: true},
    // Stats:
    rewardExperience: {value: 45, writable: true},
    baseAttack: {value: 7, writable: true},
    forgetful: {value: 15, writable: true},
    turnDelay: {value: 2, writable: true},
    baseHp: {value: 60},
    // Behavior:
    opensDoors: {value: 1, writable: true},
    // Description:
    viewText: {value: 'You see a zombie dwarf, a mighty warrior of this city raised from the dead.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'black rat', writable: true},
    generationWeight: {value: 50, writable: true},
    name: {value: 'Black Rat', writable: true},
    // Display:
    character: {value: "r", writable: true},
    color: {value: '#444', writable: true},
    // Stats:
    rewardExperience: {value: 20, writable: true},
    vigilance: {value: 0},
    erratic: {value: 1/2},
    baseAttack: {value: 2, writable: true},
    baseHp: {value: 8},
    // Behavior:
    breedRate: {value: 1/4, writable: true},
    skills: {value: ["attack"], writable: true},
    // Description:
    viewText: {value: 'You see a large black rat.'}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'red beetle', writable: true},
    generationWeight: {value: 50, writable: true},
    name: {value: 'Red Beetle', writable: true},
    // Display:
    color: {value: "#f00", writable: true},
    character: {value: "b", writable: true},
    // Stats:
    rewardExperience: {value: 50, writable: true},
    turnDelay: {value: 2},
    baseAttack: {value: 6, writable: true},
    baseIntelligence: {value: 4, writable: true},
    baseHp: {value: 50},
    vigilance: {value: 10, writable: true},
        // The minimum distance from which the enemy can be activated by sound.
    forgetful: {value: 0, writable: true},
    // Behavior:
    opensDoors: {value: 1/4, writable: true},
    skills: {value: ["breath fire", "attack"], writable: true},
    // Description:
    viewText: {value: "You see a large armored red beetle. Tendrils of smoke escape from the corners of it's crooked mouth."}
}));
modelLibrary.registerModel('enemy', Object.create(blobPrototype, {
    // Id:
    generationId: {value: 'yellow blob', writable: true},
    generationWeight: {value: 40, writable: true},
    name: {value: 'Yellow Blob', writable: true},
    // Display:
    color: {value: "#990", writable: true},
    background: {value: "#440", writable: true},
    bodyColor: {value: "#990", writable: true},
    bodyBackground: {value: "#440", writable: true},
    // Stats:
    rewardExperience: {value: 50, writable: true},
    //turnDelay: {value: 1/2, writable: true},
    baseHp: {value: 50, writable: true},
    baseAttack: {value: 4, writable: true},
    erratic: {value: 1/4, writable: true},
    forgetful: {value: 5, writable: true},
    // Behavior:
    bodyMass: {value: 9, writable: true},
    // Description:
    viewText: {value: "You see a large yellow blob. It is gelatinous and jiggles and convulses constantly."}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'imp', writable: true},
    generationWeight: {value: 55, writable: true},
    name: {value: 'Imp', writable: true},
    // Display:
    character: {value: "i", writable: true},
    color: {value: "#802", writable: true},
    // Stats:
    rewardExperience: {value: 55, writable: true},
    baseAttack: {value: 6, writable: true},
    vigilance: {value: 10},
    erratic: {value: 1/8},
    baseHp: {value: 40},
    // Behavior:
    opensDoors: {value: 1, writable: true},
    skills: {value: ["teleport","attack"], writable: true},
    // Description:
    viewText: {value: "You see an imp. These artificial creatures of magic are filled with malice."}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'blue mold', writable: true},
    generationWeight: {value: 60, writable: true},
    name: {value: 'Blue Mold', writable: true},
    // Display:
    character: {value: "m", writable: true},
    color: {value: '#4cf', writable: true},
    background: {value: "#08a", writable: true},
    // Stats:
    rewardExperience: {value: 30, writable: true},
    vigilance: {value: 0},
    forgetful: {Value: 1},
    sedentary: {value: 1},
    baseHp: {value: 10},
    // Behavior:
    breedRate: {value: 1/10, writable: true},
    skills: {value: ["attack"], writable: true},
    // Description:
    viewText: {value: "You see a mass of blue mold. Acid drips from all parts of it, and it seems to be growing at an alarming rate."}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'wraith', writable: true},
    generationWeight: {value: 65, writable: true},
    name: {value: 'Wraith', writable: true},
    // Display:
    character: {value: "W", writable: true},
    // Stats:
    rewardExperience: {value: 65, writable: true},
    vigilance: {value: 10},
    erratic: {value: 2/3, writable: true},
    turnDelay: {value: 2/3, writable: true},
    baseHp: {value: 50},
    behavior: {value: behaviorDirect, writable: true},
    // Behavior:
    skills: {value: ['attack', 'wail']},
    // Description:
    viewText: {value: 'You see a shadowy figure shifting through the air. The hairs on your neck stand on end as you think you hear a shrill voice inches away from your ear.'}
}));
modelLibrary.registerModel('enemy', Object.create(blobPrototype, {
    // Id:
    generationId: {value: 'blue blob', writable: true},
    generationWeight: {value: 80, writable: true},
    name: {value: 'Blue Blob', writable: true},
    // Display:
    color: {value: '#4cf', writable: true},
    background: {value: "#08a", writable: true},
    bodyColor: {value: "#4cf", writable: true},
    bodyBackground: {value: "#08a", writable: true},
    // Stats:
    rewardExperience: {value: 80, writable: true},
    baseHp: {value: 90, writable: true},
    baseAttack: {value: 4, writable: true},
    erratic: {value: 1/4, writable: true},
    forgetful: {value: 5, writable: true},
    // Behavior:
    bodyMass: {value: 16, writable: true},
    // Description:
    viewText: {value: "You see a large blue blob. There are bones and corroded pieces of dwarven armor floating in it's gelatinous body. It is dripping acid."}
}));
modelLibrary.registerModel('enemy', Object.create(enemy, {
    // Id:
    generationId: {value: 'bloodshot eye', writable: true},
    generationWeight: {value: 80, writable: true},
    name: {value: 'Bloodshot Eye', writable: true},
    // Display:
    character: {value: "e", writable: true},
    // Stats:
    rewardExperience: {value: 80, writable: true},
    vigilance: {value: 0},
    erratic: {value: 0},
    baseHp: {value: 20},
    // Behavior:
    sedentary: {value: true, writable: true},
    skills: {value: ["glare", "sap", "attack"], writable: true},
    // Description:
    viewText: {value: "You see a large bloodshot eyeball. It's ceaseless gaze chills you to the bone." }
}));
modelLibrary.registerModel('enemy', Object.create(snakePrototype, {
    // Id:
    generationId: {value: 'worm', writable: true},
    generationWeight: {value: 90, writable: true},
    name: {value: 'Giant Worm', writable: true},
    // Display:
    character: {value: 'w', writable: true},
    color: {value: '#963', writable: true},
    bodyCharacter: {value: 'o', writable: true},
    bodyColor: {value: '#963', writable: true},
    bodyBackground: {value: undefined, writable: true},
    // Stats:
    rewardExperience: {value: 90, writable: true},
    turnDelay: {value: 2, writable: true},
    baseHp: {value: 100, writable: true},
    //erratic: {value: 1, writable: true},
    // Behavior:
    bodyLength: {value: 7, writable: true},
    // Description:
    viewText: {value: "You see a giant worm. It's massive bulk blocks the halls completely."}
}));

//==============================================================================
    // Close namespace.
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