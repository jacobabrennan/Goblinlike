(function (){ // Open new namespace for skills.
//==============================================================================
var skill = {
    name: undefined,
    range: 1,
    targetClass: TARGET_ENEMY,
    use: function (user, target){}
};
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'attack', writable: true},
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
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'breath fire', writable: true},
    name: {value: 'breath fire', writable: true},
    range: {value: 4, writable: true},
    targetClass: {value: TARGET_ENEMY, writable: true},
    use: {value: function (user, target){
        target.hear('fire', 10, user, 'The '+user.name+' breathes fire!');
        var attemptedDamage = gaussRandom(user.baseIntelligence,1);
        var damageDone = target.hurt(attemptedDamage, DAMAGE_FIRE, user);
        return damageDone;
    }, writable: true}
}));
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'teleport', writable: true},
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
        }
        return false;
    }, writable: true}
}));
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'glare', writable: true},
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
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'wail', writable: true},
    name: {value: 'wail', writable: true},
    range: {value: 10, writable: true},
    targetClass: {value: TARGET_ENEMY|TARGET_ALL, writable: true},
    use: {value: function (user, target){
        target.hear('wail', 10, user, 'The '+user.name+' lets out a terrible wail.');
        if(target.adjustMoral){
            var damageDone = target.adjustMoral(-10); // TODO: Stats
            return damageDone;
        }
        return 0;
    }, writable: true}
}));
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'breed', writable: true},
    name: {value: 'breed', writable: true},
    targetClass: {value: TARGET_SELF, writable: true},
    use: {value: function (user, target){
        var selfType = modelLibrary.getmModel('enemy', user.generationId);
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
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'acid trap', writable: true},
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
                    Object.instantiate(modelLibrary.getModel('trap', 'acid')).place(
                        user.x+posX,user.y+posY,user.levelId);
                }
            }
        }
        return true;
    }, writable: true}
}));
modelLibrary.registerModel('skill', Object.create(skill, {
    generationId: {value: 'sap', writable: true},
    name: {value: 'sap', writable: true},
    range: {value: 10, writable: true},
    targetClass: {value: TARGET_ENEMY, writable: true},
    use: {value: function (user, target){
        target.hear('sap', 10, user, 'The '+user.name+' saps your health!');
        var damageDone = target.hurt(5, DAMAGE_MAGIC, user); // TODO: Stats
        var healingDone = user.adjustHp(damageDone);
        return healingDone;
    }, writable: true}
}));
//==============================================================================
    // Close namespace.
})();