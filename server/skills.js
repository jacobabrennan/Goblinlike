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
    name: {value: 'breed', writable: true},
    targetClass: {value: TARGET_SELF, writable: true},
    use: {value: function (user, target){
        var selfType = enemyLibrary.getEnemy(user.name);
        if(!selfType){ console.log('Cannot breed'); return false;}
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
        if(!success){ console.log('Cannot breed'); return false;}
        var progeny = Object.instantiate(selfType);
        success = progeny.place(oldX, oldY, oldL);
        if(!success){
            progeny.dispose();
            console.log('Cannot breed'); 
            return false;
        }
        progeny.activate();
        return true;
    }, writable: true}
}));
//==============================================================================
    return library; // Return library, close namespace.
})();