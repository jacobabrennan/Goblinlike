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
    base.camp = (function (parentFunction){
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
    })(base.camp);
    base.hear = (function (parentFunction){
        return function (tamber, amplitude, source, message){
            if(this.camping){
                if(tamber != 'courage'){
                    this.camp(false);
                }
            }
            return parentFunction.apply(this, arguments);
        };
    })(base.hear);
})(hero);
hero.endTurn = (function (p){
    return function (){
        window.setTimeout(function (){p.call(this)}.bind(this), 10);
    };
})(hero.endTurn);
(function (base){
    base.moral = 0;
    base.terrified = false;
    base.constructor = (function (parentFunction){
        return function (){
            parentFunction.apply(this, arguments);
            this.moral = this.charisma;
            return this;
        };
    })(base.constructor);
    base.adjustMoral = function (amount){
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
        this.update('moral');
        return amount;
    };
    base.takeTurn = (function (parentFunction){
        return function (){
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
            return parentFunction.apply(this, arguments);
        };
    })(base.takeTurn);
    base.adjustHp = (function (parentFunction){
        return function (){
            var adjustment = parentFunction.apply(this,arguments);
            this.adjustMoral(adjustment);
            return adjustment;
        };
    })(base.adjustHp);
})(person);
var companion = Object.create(person, {
    character: {value: 'g', writable: true},
    faction: {value: FACTION_GOBLIN, writable: true},
    color: {value: '#5c3', writable: true},
    companion: {value: true, writable: true},
    mode: {value: MODE_FOLLOW, writable: true},
    constructor: {value: function (){
        person.constructor.apply(this, arguments);
        var colorR = randomInterval(64,204);
        var colorG = randomInterval(102,255);
        var colorB = randomInterval(0,64);
        this.colorNatural = 'rgb('+colorR+','+colorG+','+colorB+')';
        this.color = this.colorNatural;
        this.name = sWerd.name()+' (g)';
        var theHero = gameManager.currentGame.hero;
        if(theHero){ this.setLevel(theHero.level);}
        var randomIndex = randomInterval(0, 5);
        if(!theHero){ randomIndex = 0;}
        switch(randomIndex){
            case 0:
            case 1:
                this.equip(Object.instantiate(itemLibrary.getItem('short bow')));
                this.equip(Object.instantiate(itemLibrary.getItem('arrow')));
                break;
            case 2:
            case 4:
            case 5:
                var aRock = Object.instantiate(itemLibrary.getItem('rock'));
                if(this.equip(aRock)){
                    console.log('Rocking it')
                    break;
                }
            case 3:
                this.equip(Object.instantiate(itemLibrary.getItem('club')));
                break;
        }
        
        return this;
    }, writable: true},
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
            this.setLevel(gameManager.currentGame.hero.level);
            gameManager.currentGame.hero.companions.push(this);
            this.sound('greeting', 10, this, this.name+' greets you!');
        }
        this.active = true;
    }},
    hurt: {value: function (){
        this.activate();
        return person.hurt.apply(this, arguments);
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
    unequip: {value: function (oldItem){
        var success = person.unequip.apply(this, arguments);
        if(success){
            success = this.inventoryRemove(oldItem);
            if(success){
                success = oldItem.place(this.x, this.y, this.levelId);
                return success;
            }
        }
        return false;
    }},
    camp: {value: function (){
        this.camping = gameManager.currentGame.hero.camping;
        return this.camping;
    }, writable: true},
    behavior: {value: function (){
        var result = false;
        if(this.terrified){
            result = this.pursueSafety();
        }
        if(!result){ result = this.pursueHero( );}
        if(!result){ result = this.pursueEnemy();}
        if(!result){ result = this.pursueLoot( );}
        return;
    }, writable: true},
    move: {value: function (direction){
        var dest = getStepCoords(this.x, this.y, direction);
        var contents = mapManager.getTileContents(dest.x, dest.y, this.levelId);
        var trapFound;
        contents.forEach(function (content){
            if((content.type == TYPE_TRAP) && (!content.hidden)){
                trapFound = true;
            }
        });
        if(trapFound){ return false;}
        return person.move.apply(this, arguments);
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
        if(!(pathArray && pathArray.length)){
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
            return destination.toggleDoor(nextCoord.x, nextCoord.y, this);
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
        return true;
    }, writable: true},
    pursueLoot: {value: function (){
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
        if(!targetLoot){ return false;}
        if(targetDistance <= 1){
            this.getItem(targetLoot);
            if(this.inventory.indexOf(targetLoot) != -1){
                this.equip(targetLoot);
            }
            return true;
        }
        var direction = directionTo(this.x, this.y, targetLoot.x, targetLoot.y);
        // Else, move.
        return this.move(direction);
    }, writable: true},
    itemDesire: {value: function (theItem){
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
                    desire -= (theItem.weight - ownWeapon.weight);
                }
            }
        } else if(thePlace){
            // Check armor and ammo.
            var skipCheck = false;
            var ownEquip = this.equipment[thePlace];
            if(thePlace == EQUIP_OFFHAND){
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
    }, writable: true}
});