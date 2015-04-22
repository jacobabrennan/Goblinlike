(function (base){
    base.constructor = (function (parentFunction){
        return function (){
            this.companions = [];
            parentFunction.apply(this, arguments);
            return this;
        };
    })(base.constructor);
    base.die = (function (parentFunction){
        return function (){
            this.companions = null;
            return parentFunction.apply(this, arguments);
        };
    })(base.die);
    base.setLevel = (function (parentFunction){
        return function (){
            var result = parentFunction.apply(this, arguments);
            this.companions.forEach(function (theCompanion){
                theCompanion.setLevel(this.level);
            }, this);
            return result;
        };
    })(base.setLevel);
})(hero);
var companion = Object.create(person, {
    character: {value: 'g', writable: true},
    faction: {value: FACTION_GOBLIN, writable: true},
    color: {value: '#5c3', writable: true},
    moral: {value: 0, writable: true},
    terrified: {value: false, writable: true},
    companion: {value: true, witable: true},
    constructor: {value: function (){
        person.constructor.apply(this, arguments);
        this.moral = this.charisma;
        var colorR = randomInterval(64,204);
        var colorG = randomInterval(102,255);
        var colorB = randomInterval(0,64);
        this.colorNatural = 'rgb('+colorR+','+colorG+','+colorB+')';
        this.color = this.colorNatural;
        this.name = sWerd.name()+' (g)';
        var theHero = gameManager.currentGame.hero;
        if(theHero){ this.setLevel(theHero.level);}
        
        this.equip(Object.instantiate(itemLibrary.getItem('short bow')));
        this.equip(Object.instantiate(itemLibrary.getItem('arrow')));
        
        return this;
    }},
    adjustExperience: {value: function (amount){
        /**
        **/
        gameManager.currentGame.hero.adjustExperience(amount);
        return;
    }, writable: true},
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
        if(gameManager.currentGame.hero.companions.indexOf(this) == -1){
            gameManager.currentGame.hero.companions.push(this);
            this.sound('greeting', 10, this, this.name+' greets you!');
        }
        this.active = true;
    }},
    hurt: {value: function (){
        this.activate();
        return person.hurt.apply(this, arguments);
    }, writable: true},
    adjustHp: {value: function (){
        var adjustment = person.adjustHp.apply(this,arguments);
        this.adjustMoral(adjustment);
        return adjustment;
    }, writable: true},
    adjustMoral: {value: function (amount){
        this.moral += amount;
        var terrify = false;
        if(this.hp <= 1){
            terrify = true;
            this.moral = Math.min(this.moral, -1);
        }
        if(this.moral < 0){ terrify = true;}
        if(terrify && !this.terrified){
            this.terrified = true;
            this.color = 'red';
            this.update('color');
            this.sound('terror', 10, this, this.name+' is terrified!');
        } else if(!terrify && this.terrified){
            this.terrified = false;
            this.color = this.colorNatural;
            this.update('color');
            this.sound('courage', 10, this, this.name+' regains their courage!');
        }
    }, writable: true},
    takeTurn: {value: function (){
        var mean = this.charisma;
        var moralTweak = -(this.moral-mean)/20;
        var tweakRound = false;
        if(Math.abs(moralTweak) < 0.1){
            tweakRound = true;
        }
        this.adjustMoral(moralTweak);
        if(tweakRound){
            this.moral = mean;
            this.adjustMoral(0);
        }
        return person.takeTurn.apply(this, arguments);
    }, writable: true},
    hear: {value: function (tamber, amplitude, source, message){
        if(source && (source != this) && (source.faction & this.faction)){
            switch(tamber){
                case 'terror': this.adjustMoral(1); break;
                case 'courage': this.adjustMoral(-1); break;
                case 'pain': this.adjustMoral(-1); break;
                case 'death': this.adjustMoral(-10); break;
                case 'greeting': this.adjustMoral(10); break;
            }
        }
        return person.hear.apply(this, arguments);
    }, writable: true},
    dispose: {value: function (){
        if(gameManager.currentGame){
            var companionI = gameManager.currentGame.hero.companions.indexOf(this);
            if(companionI != -1){
                gameManager.currentGame.hero.companions.splice(companionI, 1);
            }
        }
        return person.dispose.apply(this, arguments);
    }, writable: true},
    bumped: {value: function (bumper){
        if(bumper.companion && bumper.terrified && !this.terrified){
            mapManager.swapPlaces(this, bumper);
        } else{
            person.bumped.apply(this, arguments);
        }
    }},
    behavior: {value: function (){
        var result = false;
        if(this.terrified){
            result = this.pursueSafety();
        }
        if(!result){ result = this.pursueHero( );}
        if(!result){ result = this.pursueEnemy();}
        return;
    }, writable: true},
    pursueHero: {value: function (){
        var target = gameManager.currentGame.hero;
        var pursueRange = Math.min(3, target.companions.length);
        if(!target || (
            (target.levelId == this.levelId) &&
            distance(this.x, this.y, target.x, target.y) <= pursueRange
        )){
            return false;
        }
        var pathArray = findPath(this, target, 1);
        if(!pathArray){
            return false;
        }
        if(pathArray[0].x == this.x && pathArray[0].y == this.y && pathArray[0].levelId == this.levelId){
            pathArray.shift();
        }
        var nextCoord = pathArray.shift();
        if(!nextCoord){
            return false;
        }
        if(nextCoord.levelId != this.levelId){
            this.place(nextCoord.x, nextCoord.y, nextCoord.levelId);
            return true;
        }
        var direction = directionTo(this.x,this.y,nextCoord.x,nextCoord.y);
        // Check for Door.
        var destination = mapManager.getTile(
            nextCoord.x, nextCoord.y, this.levelId
        );
        if(destination.dense && destination.toggleDoor){
            destination.toggleDoor(nextCoord.x, nextCoord.y, this);
            return true;
        }
        // Else, move.
        return this.move(direction);
    }, writable: true},
    pursueEnemy: {value: function (){
        // Find a target, and the path to that target. If no target, deactivate.
        var target;
        var path;
        var targetData = findTarget(this, this.faction);
        if(targetData && this.checkView(targetData.target)){
            target = targetData.target;
            path = targetData.path;
        } else{
            return false;
        }
        // Determine if target is in range of equipped weapon. Attack.
        var range = distance(this.x, this.y, target.x, target.y);
        var weapon = this.equipment? this.equipment[EQUIP_MAINHAND] : undefined;
        if(weapon && weapon.shoot && weapon.range){
            if(weapon.range >= range){
                var success = weapon.shoot(
                    this,
                    directionTo(this.x, this.y, target.x, target.y),
                    target
                );
                if(success || success === 0){
                    return true;
                }
            }
        // Else, attack with your hands.
        }
        if(range <= 1){
            this.attack(target);
            return true;
        }
        // If a skill was not used, move toward the target.
        var pathArray = path;
        var nextCoord = pathArray.shift();
        if(!nextCoord){
            return false;
        }
        var direction = directionTo(this.x, this.y, nextCoord.x, nextCoord.y);
        return this.move(direction);
    }, writable: true},
    pursueSafety: {value: function (){
        /**
            Each actor exerts a vector force on the companion. The terrified
            companion will then pursue a course in that direction, effectively
            away from enemies and toward the hero.
        **/
        var vector = {x: 0, y: 0};
        this.getViewContents().forEach(function (content){
            if(content.type != TYPE_ACTOR){ return;}
            if(!(content.faction & this.faction)){
                var enemyWeight = content.rewardExperience || 2;
                var deltaY = content.y - this.y;
                var deltaX = content.x - this.x;
                if(deltaY){ vector.y -= enemyWeight / deltaY;}
                if(deltaX){ vector.x -= enemyWeight / deltaX;}
            }
        }, this);
        var theHero = gameManager.currentGame.hero;
        var deltaYH = theHero.y - this.y;
        var deltaXH = theHero.x - this.x;
        vector.x += deltaXH? ((theHero.level*10) / (deltaXH)) : 0;
        vector.y += deltaYH? ((theHero.level*10) / (deltaYH)) : 0;
        var dirVert = 0;
        var dirHor  = 0;
        if(vector.x > 0){ dirHor  |=  EAST;}
        if(vector.x < 0){ dirHor  |=  WEST;}
        if(vector.y > 0){ dirVert |= NORTH;}
        if(vector.y < 0){ dirVert |= SOUTH;}
        var direction = dirVert|dirHor;
        var success = this.move(direction);
        if(!success){
            var primaryDir = dirVert;
            var secondaryDir = dirHor;
            if(Math.abs(vector.x) > Math.abs(vector.y)){
                primaryDir = dirHor;
                secondaryDir = dirVert;
            }
            success = this.move(primaryDir) || this.move(secondaryDir);
        }
        return true;
    }, writable: true}
});