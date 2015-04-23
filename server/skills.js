var skillLibrary = (function (){ // Open new namespace for skill library.
//==============================================================================
var library = {
    skills: {},
    registerSkill: function (newPrototype){
        var prototypeName = newPrototype.name;
        if(!prototypeName || this.skills[prototypeName]){
            console.log('Problem: Non-unique name for skill prototype '+prototypeName);
        }
        this.skills[prototypeName] = newPrototype;
    },
    getSkill: function (skillName){
        var skillPrototype = this.skills[skillName];
        return skillPrototype;
    }/*,
    getEnemyByWeight: function (weight){
        weight = Math.round(weight);
        var enemyId;
        switch (weight){
            case  1: enemyId = 'Red Beetle'; break;
            case  2: enemyId = 'Worm'; break;
            case  3: enemyId = 'Tarantula'; break;
        }
        var enemyPrototype = this.getEnemy(enemyId);
        return enemyPrototype;
    }*/
};
var skill = {
    name: undefined,
    range: 1,
    targetClass: TARGET_ENEMY,
    use: function (user, target){}
};
library.registerSkill(Object.create(skill, {
    name: {value: 'attack', writable: true},
    range: {value: 1, writable: true},
    targetClass: {value: TARGET_ENEMY, writable: true},
    use: {value: function (user, target){
        var result = 0;
        if(target){
            result = user.attack(target);
        }
        return result;
    }, writable: true}
}));
library.registerSkill(Object.create(skill, {
    name: {value: 'breath fire', writable: true},
    range: {value: 3, writable: true},
    targetClass: {value: TARGET_ENEMY, writable: true},
    use: {value: function (user, target){
        target.hear('fire', 10, user, 'The '+user.name+' breathes fire!');
        var attemptedDamage = gaussRandom(3,1); // TODO: stats here, for example.
        var damageDone = target.hurt(attemptedDamage, DAMAGE_FIRE, user);
        return damageDone;
    }, writable: true}
}));
library.registerSkill(Object.create(skill, {
    name: {value: 'teleport', writable: true},
    range: {value: 10, writable: true},
    targetClass: {value: TARGET_ENEMY|TARGET_RANGE, writable: true},
    use: {value: function (user, target){
        var range = 3;
        if(distance(user.x,user.y, target.x,target.y) <= range){ return false;}
        var possibles = [];
        for(var posY = target.y-range; posY <= target.y+range; posY++){
            for(var posX = target.x-range; posX <= target.x+range; posX++){
                if(distance(posX, posY, target.x, target.y) >= 2){
                    possibles.push({x: posX, y: posY});
                }
            }
        }
        while(possibles.length){
            var rI = randomInterval(0, possibles.length-1);
            var testDest = possibles[rI];
            possibles.splice(rI, 1);
            if(user.place(testDest.x, testDest.y, target.levelId)){
                return true;
            }
            console.log(possibles.length);
        }
        return false;
    }, writable: true}
}));
library.registerSkill(Object.create(skill, {
    name: {value: 'glare', writable: true},
    range: {value: 10, writable: true},
    targetClass: {value: TARGET_ENEMY, writable: true},
    use: {value: function (user, target){
        target.hear('glare', 10, user, 'The '+user.name+' glares at you.');
        if(target.adjustMoral){
            var damageDone = target.adjustMoral(-10); // TODO: Stats
            return damageDone;
        }
        return 0;
    }, writable: true}
}));
library.registerSkill(Object.create(skill, {
    name: {value: 'breed', writable: true},
    targetClass: {value: TARGET_SELF, writable: true},
    use: {value: function (user, target){
        var selfType = enemyLibrary.getEnemy(user.name);
        if(!selfType){ return false;}
        var oldX = user.x;
        var oldY = user.y;
        var oldL = user.levelId;
        var directions = [
            NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,SOUTHEAST,SOUTHWEST];
        var success;
        while(!success && directions.length){
            var rI = randomInterval(0, directions.length-1);
            var randomDirection = directions[rI];
            directions.splice(rI, 1);
            success = user.move(randomDirection);
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
}));
library.registerSkill((function (){
    var acidTrap = Object.create(trap, {
        name: {value: 'acid trap'},
        background: {value: '#690'},
        character: {value: null},
        faction: {value: FACTION_ENEMY},
        constructor: {value: function (){
            var self = this;
            gameManager.registerEvent(function (){
                self.dispose();
            }, gaussRandom(20,2));
            return trap.constructor.apply(this, arguments);
        }},
        trigger: {value: function (content){
            if(content.type != TYPE_ACTOR){ return;}
            if(content.faction & this.faction){ return;}
            content.hear('acid', 10, null, "You're splashed with acid!");
            content.hurt(5, DAMAGE_ACID);
            this.dispose();
        }, writable: true}
    });
    return Object.create(skill, {
        name: {value: 'acid trap', writable: true},
        targetClass: {value: TARGET_SELF, writable: true},
        use: {value: function (user, target){
            for(var posX = -1; posX < 2; posX++){
                for(var posY = -1; posY < 2; posY++){
                    var acidFound = false;
                    var placeContents = mapManager.getTileContents(
                        user.x+posX,user.y+posY,user.levelId);
                    for(var aI = 0; aI < placeContents.length; aI++){
                        var testContent = placeContents[aI];
                        if(testContent.name == 'acid trap'){
                            acidFound = true;
                        }
                    }
                    if(!acidFound){
                        Object.instantiate(acidTrap).place(
                            user.x+posX,user.y+posY,user.levelId);
                    }
                }
            }
            return true;
        }, writable: true}
    });
})());
//==============================================================================
    return library; // Return library, close namespace.
})();