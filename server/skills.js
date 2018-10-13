

//== Skills ====================================================================

//-- Dependencies --------------------------------
import modelLibrary from './model_library.js';

//-- Skill Definition ----------------------------
class Skill {
    use(user, target){}
}
Skill.prototype.name = undefined;
Skill.prototype.range = 1;
Skill.prototype.targetClass = TARGET_ENEMY;

//-- Skill Types ---------------------------------
const skillModels = [
    {// attack
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
    },
    {// breath fire
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
    },
    {// teleport
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
    },
    {// glare
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
    },
    {// wail
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
    },
    {// breed
        generationId: 'breed',
        name: 'breed',
        targetClass: TARGET_SELF,
        use(user, target){
            return user.breed();
        }
    },
    {// sap
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
    }
];

//------------------------------------------------
skillModels.forEach(skillModel => {
    let skillClass = class extends Skill {};
    Object.keys(skillModel).forEach(key => {
        skillClass.prototype[key] = skillModel[key];
    })
    modelLibrary.registerModel('skill', skillClass);
});

//-- Exports -------------------------------------
export default Skill;
