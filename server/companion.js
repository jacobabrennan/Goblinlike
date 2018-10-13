

//== Extend Basic Types ========================================================

//-- Dependencies --------------------------------
import Hero from './hero.js';
import Person from './person.js';
import pathFinder from './path_finder.js';
import mapManager from './map_manager.js';
import gameManager from './game_manager.js';
import modelLibrary from './model_library.js';
// Extensions must be executed first, so redefinions can references prior methods
import './extension_stats.js';
import './extension_combat.js';
import './extension_equipment.js';


//== Extend Hero (All Redefines) ===============================================
Hero.prototype.initializer = (function (parentFunction){
    return function (){
        this.companions = [];
        parentFunction.apply(this, arguments);
        return this;
    };
})(Hero.prototype.initializer);
Hero.prototype.die = (function (parentFunction){
    return function (){
        this.companions = null;
        return parentFunction.apply(this, arguments);
    };
})(Hero.prototype.die);
Hero.prototype.setLevel = (function (parentFunction){
    return function (){
        var result = parentFunction.apply(this, arguments);
        this.companions.forEach(function (theCompanion){
            theCompanion.setLevel(this.level);
        }, this);
        return result;
    };
})(Hero.prototype.setLevel);
Hero.prototype.camp = (function (parentFunction){
    return function (setCamping){
        if(setCamping !== undefined){
            this.camping = setCamping;
        }
        if(!this.camping){ return false;}
        var notFull = false;
        for(var cI = 0; cI < this.companions.length; cI++){
            var theCompanion = this.companions[cI];
            if(theCompanion.hp < theCompanion.maxHp()){
                notFull = true;
                break;
            }
        }
        if(notFull){
            return true;
        }
        return parentFunction.apply(this, arguments);
    };
})(Hero.prototype.camp);
Hero.prototype.hear = (function (parentFunction){
    return function (tamber, amplitude, source, message){
        if(this.camping){
            if(tamber != 'courage'){
                this.camp(false);
            }
        }
        return parentFunction.apply(this, arguments);
    };
})(Hero.prototype.hear);
Hero.prototype.endTurn = (function (p){
    return function (){
        window.setTimeout(function (){p.call(this);}.bind(this), 10);
    };
})(Hero.prototype.endTurn);


//== Extend Person =============================================================

//-- New Properties ------------------------------
Person.prototype.moral = 0;
Person.prototype.terrified = false;

//-- New Methods ---------------------------------
Person.prototype.adjustMoral = function (amount){
    this.moral += amount;
    var terrify = false;
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
    this.update('moral');
    return amount;
};

//-- Redefined Methods ---------------------------
Person.prototype.initializer = (function (parentFunction){
    return function (){
        parentFunction.apply(this, arguments);
        this.moral = this.charisma;
        return this;
    };
})(Person.prototype.initializer);
Person.prototype.takeTurn = (function (parentFunction){
    return function (){
        var mean = this.meanMoral();
        var moralTweak = -(this.moral-mean)/(25-this.charisma);
        moralTweak *= this.hp/this.maxHp();
        var tweakRound = false;
        if(Math.abs(moralTweak) < 0.1){
            tweakRound = true;
        }
        this.adjustMoral(moralTweak);
        if(tweakRound){
            this.moral = mean;
            this.adjustMoral(0);
        }
        return parentFunction.apply(this, arguments);
    };
})(Person.prototype.takeTurn);
Person.prototype.adjustHp = (function (parentFunction){
    return function (){
        var adjustment = parentFunction.apply(this,arguments);
        if(adjustment < 0 && this.hp <= 11-this.charisma){
            this.adjustMoral(-(this.moral+this.charisma));
        } else{
            this.adjustMoral(adjustment*2);
        }
        return adjustment;
    };
})(Person.prototype.adjustHp);


//== Companion =================================================================

class Companion extends Person {
    initializer() {
        super.initializer(...arguments);
        var colorR = randomInterval(64,204);
        var colorG = randomInterval(102,255);
        var colorB = randomInterval(0,64);
        this.colorNatural = 'rgb('+colorR+','+colorG+','+colorB+')';
        this.color = this.colorNatural;
        this.name = sWerd.name();//+' (g)';
        var theHero = gameManager.currentGame.hero;
        if(theHero){ this.setLevel(theHero.level);}
        this.adjustHp(this.maxHp());
        var randomIndex = randomInterval(0, 5);
        if(!theHero){ randomIndex = 0;}
        switch(randomIndex){
            case 0:
            case 1:
                let shortBow = modelLibrary.getModel('item', 'short bow');
                shortBow = new shortBow();
                shortBow.initializer();
                let newArrow = modelLibrary.getModel('item', 'arrow10');
                newArrow = new newArrow();
                newArrow.initializer()
                this.equip(shortBow);
                this.equip(newArrow);
                break;
            case 2:
            case 4:
            case 5:
                var aRock = modelLibrary.getModel('item', 'rock');
                aRock = new aRock();
                aRock.initializer();
                if(this.equip(aRock)){
                    break;
                }
                // No break here. Equip club if rock not equipped.
            case 3:
                let aClub = modelLibrary.getModel('item', 'club');
                aClub = new aClub();
                aClub.initializer();
                this.equip(aClub);
                break;
        }
        gameManager.currentGame.companionInfo.push(this);
        return this;
    }
    toJSON() {
        let result = super.toJSON(...arguments);
        result.loadInstruction = 'companion';
        result.companion = true;
        if(this.goal){ result.goal = this.goal.toJSON();}
        if(this.dead){ result.dead = this.dead;}
        if(this.lost){ result.lost = this.lost;}
        return result;
    }
    fromJSON(data){
        super.fromJSON(...arguments);
        if(data.dead){ this.dead = data.dead;}
        if(data.lost){ this.lost = data.lost;}
        if(data.goal){
            // TO DO
        }
    }
    adjustExperience(amount) {
        /**
        **/
        gameManager.currentGame.hero.adjustExperience(amount);
        return;
    }
    activate() {
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
            this.setLevel(gameManager.currentGame.hero.level);
            gameManager.currentGame.hero.companions.push(this);
            this.sound('greeting', 10, this, this.name+' joins you!');
        }
        this.active = true;
    }
    hurt() {
        this.activate();
        return super.hurt(...arguments);
    }
    hear(tamber, amplitude, source, message) {
        if(source && (source != this) && (source.faction & this.faction)){
            switch(tamber){
                case 'terror': this.adjustMoral(1); break;
                case 'courage': this.adjustMoral(-1); break;
                case 'pain': this.adjustMoral(-1); break;
                case 'death': this.adjustMoral(-10); break;
                case 'greeting': this.adjustMoral(10); break;
            }
        }
        return super.hear(...arguments);
    }
    dispose() {
        if(!this.dead){
            this.lost = true;
        }
        if(gameManager.currentGame){
            var companionI = gameManager.currentGame.hero.companions.indexOf(this);
            if(companionI != -1){
                gameManager.currentGame.hero.companions.splice(companionI, 1);
            }
        }
        return super.dispose(...arguments);
    }
    bumped(bumper) {
        if(bumper.companion && bumper.terrified && !this.terrified){
            mapManager.swapPlaces(this, bumper);
        } else{
            super.bumped(...arguments);
        }
    }
    unequip(oldItem) {
        var success = super.unequip(...arguments);
        if(success){
            success = this.inventoryRemove(oldItem);
            if(success){
                success = oldItem.place(this.x, this.y, this.levelId);
                return success;
            }
        }
        return false;
    }
    camp() {
        this.camping = gameManager.currentGame.hero.camping;
        return this.camping;
    }
    behavior() {
        var result = false;
        if(this.terrified){
            result = this.pursueSafety();
            if(!result){ result = this.desperation();}
        }
        if(!result && this.goal){ result = this.pursueGoal();}
        if(!result){
            this.pursueHero( );
            result = this.pursueGoal();
        }
        if(!result && !this.terrified){
            this.pursueEnemy();
            result = this.pursueGoal();
        }
        if(!result && !this.terrified){
            this.pursueLoot();
            result = this.pursueGoal();
        }
        return;
    }
    pursueHero() {
        this.setGoal(GoalHero);
    }
    pursueEnemy() {
        this.setGoal(GoalEnemy);
    }
    pursueSafety() {
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
        vector.x += deltaXH? (1 / (deltaXH)) : 0;
        vector.y += deltaYH? (1 / (deltaYH)) : 0;
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
        return success;
    }
    desperation() {
        /**
            Attack any nearby enemy.
        **/
        var nearbyContents = mapManager.getRangeContents(
            this.x, this.y, this.levelId, 1);
        var target;
        for(var contentI = 0; contentI < nearbyContents.length; contentI++){
            var indexedContent = nearbyContents[contentI];
            if(
                indexedContent.type == TYPE_ACTOR &&
                !(indexedContent.faction & this.faction)
            ){
                if(!target){ target = indexedContent;}
                else if(indexedContent.hp < target.hp){
                    target = indexedContent;
                }
            }
        }
        if(target){
            this.attack(target);
            return true;
        } else{
            return false;
        }
    }
    pursueLoot() {
        var viewContents = this.getViewContents();
        var targetLoot;
        var highDesire = 0;
        var targetDistance;
        for(var lootI = 0; lootI < viewContents.length; lootI++){
            var theLoot = viewContents[lootI];
            if(theLoot.type != TYPE_ITEM){ continue;}
            var lootDesire = this.itemDesire(theLoot);
            if(lootDesire <= 0){ continue;}
            var lootDist = distance(theLoot.x, theLoot.y, this.x, this.y);
            var lootWeight = lootDesire / lootDist;
            if(lootWeight > highDesire){
                targetLoot = theLoot;
                highDesire = lootWeight;
                targetDistance = lootDist;
                continue;
            }
        }
        if(!targetLoot){ return;}
        this.setGoal(GoalLoot, targetLoot);
    }
    itemDesire(theItem) {
        var desire = 0;
        var desireMultiplier = 1;
        // Check wand, and charges.
        if(theItem.hasOwnProperty('charges')){
            desireMultiplier = theItem.charges;
            if(desireMultiplier === 0){ return desire;}
        }
        // Check Equipment.
        var thePlace = theItem.placement;
        if(thePlace == EQUIP_MAINHAND){
            // Check Main Equip; mostly weapons, but also bows.
            if(theItem.weight > this.strength){ return desire;}
            var ownWeapon = this.equipment[EQUIP_MAINHAND];
            if(ownWeapon){
                if(ownWeapon.damageScale && theItem.damageScale){
                    // Check Bow.
                    desire += (theItem.damageScale - ownWeapon.damageScale)*5;
                    desire -= (theItem.weight - ownWeapon.weight);
                } else if(ownWeapon.baseDamage && theItem.baseDamage){
                    // Check Weapon.
                    desire += theItem.baseDamage - ownWeapon.baseDamage;
                    desire -= (theItem.weight - ownWeapon.weight)/3;
                }
            }
        } else if(thePlace){
            // Check armor and ammo.
            var skipCheck = false;
            var ownEquip = this.equipment[thePlace];
            if(thePlace == EQUIP_OFFHAND){
                // Check two-handed weapon
                var twoHander = this.equipment[EQUIP_MAINHAND];
                if(twoHander && twoHander.twoHanded){
                    desire = 0;
                    skipCheck = true;
                }
                // Check ammo.
                var ownBow = this.equipment[EQUIP_MAINHAND];
                if(ownBow && ownBow.damageScale && ownBow.ammoType){
                    // We have a bow.
                    if(ownBow.ammoType == theItem.ammoType){
                        // The ammo is good for our bow.
                        if(ownEquip && ownEquip.ammoType == ownBow.ammoType){
                            // We already have proper ammo.
                            if(ownEquip.name != theItem.name){
                                // This is proper ammo, but a different kind.
                                desire += theItem.baseDamage - ownEquip.baseDamage;
                            } else{
                                // This is the same kind of ammo we have.
                                if(ownEquip.stackCount >= 10){ return 0;}
                                desire += theItem.stackCount || 1;
                            }
                        } else{
                            // We don't have proper ammo yet, so get this.
                            desire += theItem.stackCount || 1;
                        }
                    } else{
                        // The ammo is not good for our bow.
                        desire = 0;
                    }
                    skipCheck = true;
                }
            }
            if(!skipCheck){
                // Check armor.
                var ownValue = 0;
                if(ownEquip){
                    ownValue = (ownEquip.defense || 0) + (10*ownEquip.evade || 0);
                }
                var itemValue = (theItem.defense || 0) + (10*theItem.evade || 0);
                desire += itemValue - ownValue;
            }
        }
        // Return desire.
        return desire * desireMultiplier;
    }
    setGoal(goalType, goalTarget) {
        if(!goalType){
            this.goal = null;
            return;
        }
        this.goal = new goalType(goalTarget);
    }
    pursueGoal() {
        if(!this.goal){ return false;}
        var success = this.goal.behavior(this);
        if(!success){ this.setGoal();}
        return success;
    }
}
Companion.prototype.character = 'g';
Companion.prototype.faction = FACTION_GOBLIN;
Companion.prototype.color = '#5c3';
Companion.prototype.companion = true;

//-- Goal Types ----------------------------------
// TO DO
class Goal {
    constructor() {
        this.target = undefined;
    }
    behavior(controllee){
        return false;
    }
    toJSON() {
        return {};
    }
    fromJSON(data){
        // TO DO
    }
}
class GoalLoot extends Goal {
    constructor(goalTarget) {
        super(...arguments);
        this.target = goalTarget;
    }
    behavior(controllee) {
        if(
            !this.target ||
            this.target.x === undefined || this.target.y === undefined
        ){ return false;}
        var targetDistance = distance(
            this.target.x, this.target.y, controllee.x, controllee.y
        );
        if(targetDistance <= 1){
            controllee.getItem(this.target);
            if(controllee.inventory.indexOf(this.target) != -1){
                controllee.equip(this.target);
            }
            return true;
        }
        var direction = directionTo(
            controllee.x, controllee.y, this.target.x, this.target.y);
        // Else, move.
        return controllee.move(direction);
    }
}
class GoalEnemy extends Goal {
    behavior(controllee) {
        // Check if any targets in view.
        var viewContents = controllee.getViewContents();
        var noEnemies = true;
        for(var vI = 0; vI < viewContents.length; vI++){
            var indexedC = viewContents[vI];
            if(indexedC.type === TYPE_ACTOR && !(indexedC.faction&controllee.faction)){
                noEnemies = false;
                break;
            }
        }
        if(noEnemies){
            return false;
        }
        // Find a target, and the path to that target. If no target, deactivate.
        var target;
        var path;
        var targetData = pathFinder.findTarget(controllee, controllee.faction);
        if(targetData && controllee.checkView(targetData.target)){
            target = targetData.target;
            path = targetData.path;
        } else{
            return false;
        }
        // Determine if target is in range of equipped weapon. Attack.
        var range = distance(controllee.x, controllee.y, target.x, target.y);
        var weapon = controllee.equipment? controllee.equipment[EQUIP_MAINHAND] : undefined;
        if(weapon && weapon.shoot && weapon.range){
            if(weapon.range >= range){
                var success = weapon.shoot(
                    controllee,
                    directionTo(controllee.x, controllee.y, target.x, target.y),
                    target
                );
                if(success || success === 0){
                    return true;
                }
            }
        // Else, attack with your hands.
        }
        if(range <= 1){
            controllee.attack(target);
            return true;
        }
        // If a skill was not used, move toward the target.
        var pathArray = path;
        var nextCoord = pathArray.shift();
        if(!nextCoord){
            return false;
        }
        var direction = directionTo(controllee.x, controllee.y, nextCoord.x, nextCoord.y);
        return controllee.move(direction);
    }
}
class GoalHero extends Goal {
    behavior(controllee) {
        var target = gameManager.currentGame.hero;
        var pursueRange = Math.max(2, Math.min(3, target.companions.length));
        if(!target || (
            (target.levelId == controllee.levelId) &&
            distance(controllee.x, controllee.y, target.x, target.y) <= pursueRange
        )){
            return false;
        }
        var pathArray = pathFinder.findPath(controllee, target, 1);
        if(!(pathArray && pathArray.length)){
            return false;
        }
        if(pathArray[0].x == controllee.x && pathArray[0].y == controllee.y && pathArray[0].levelId == controllee.levelId){
            pathArray.shift();
        }
        var nextCoord = pathArray.shift();
        if(!nextCoord){
            return false;
        }
        if(nextCoord.levelId != controllee.levelId){
            controllee.place(nextCoord.x, nextCoord.y, nextCoord.levelId);
            return true;
        }
        var direction = directionTo(controllee.x,controllee.y,nextCoord.x,nextCoord.y);
        // Check for Door.
        var destination = mapManager.getTile(
            nextCoord.x, nextCoord.y, controllee.levelId
        );
        if(destination.dense && destination.toggleDoor){
            return destination.toggleDoor(nextCoord.x, nextCoord.y, controllee);
        }
        // Else, move.
        return controllee.move(direction);
    }
}


//== Exports ===================================================================

export default Companion;
