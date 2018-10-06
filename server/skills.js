

//== Skills ====================================================================

//-- Dependencies --------------------------------
import modelLibrary from './model_library.js';

//-- Skill Definition ----------------------------
const skill = {
    name: undefined,
    range: 1,
    targetClass: TARGET_ENEMY,
    use(user, target){}
};

//-- Skill Types ---------------------------------
modelLibrary.registerModel('skill', Object.extend(skill, {
    generationId: 'attack',
    name: 'attack',
    range: 1,
    targetClass: TARGET_ENEMY,
    use(user, target){
        var result = 0;
        if(target){
            result = user.attack(target);
        }
        return result;
    }
}));
modelLibrary.registerModel('skill', Object.extend(skill, {
    generationId: 'breath fire',
    name: 'breath fire',
    range: 4,
    targetClass: TARGET_ENEMY,
    use(user, target){
        target.hear('fire', 10, user, 'The '+user.name+' breathes fire!');
        var attemptedDamage = gaussRandom(user.baseIntelligence,1);
        var damageDone = target.hurt(attemptedDamage, DAMAGE_FIRE, user);
        return damageDone;
    }
}));
modelLibrary.registerModel('skill', Object.extend(skill, {
    generationId: 'teleport',
    name: 'teleport',
    range: 10,
    targetClass: TARGET_ENEMY|TARGET_RANGE,
    use(user, target){
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
    }
}));
modelLibrary.registerModel('skill', Object.extend(skill, {
    generationId: 'glare',
    name: 'glare',
    range: 10,
    targetClass: TARGET_ENEMY,
    use(user, target){
        target.hear('glare', 10, user, 'The '+user.name+' glares at you.');
        if(target.adjustMoral){
            var damageDone = target.adjustMoral(-10); // TODO: Stats
            return damageDone;
        }
        return 0;
    }
}));
modelLibrary.registerModel('skill', Object.extend(skill, {
    generationId: 'wail',
    name: 'wail',
    range: 10,
    targetClass: TARGET_ENEMY|TARGET_ALL,
    use(user, target){
        target.hear('wail', 10, user, 'The '+user.name+' lets out a terrible wail.');
        if(target.adjustMoral){
            var damageDone = target.adjustMoral(-10); // TODO: Stats
            return damageDone;
        }
        return 0;
    }
}));
modelLibrary.registerModel('skill', Object.extend(skill, {
    generationId: 'breed',
    name: 'breed',
    targetClass: TARGET_SELF,
    use(user, target){
        return user.breed();
        /*var selfType = modelLibrary.getModel('enemy', user.generationId);
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
        return true;*/
    }
}));
modelLibrary.registerModel('skill', Object.extend(skill, {
    generationId: 'sap',
    name: 'sap',
    range: 10,
    targetClass: TARGET_ENEMY,
    use(user, target){
        target.hear('sap', 10, user, 'The '+user.name+' saps your health!');
        var damageDone = target.hurt(5, DAMAGE_MAGIC, user); // TODO: Stats
        var healingDone = user.adjustHp(damageDone);
        return healingDone;
    }
}));


//-- Exports -------------------------------------
export default skill;
