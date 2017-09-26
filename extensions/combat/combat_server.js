
    
// === Combat System ======================================================
// TODO: Document this mess.

// Damage Types (bit flags):
var DAMAGE_PHYSICAL = 1;
var DAMAGE_FIRE =  2;
var DAMAGE_ACID =  4;
var DAMAGE_MAGIC =  8;
var DAMAGE_0000000000010000 = 16;
var DAMAGE_0000000000100000 = 32;
var DAMAGE_0000000000000000 =  0;

(function (){
    /**
     *  extend Actor
     **/
    // Redefined Properties
    // New Properties
    actor.hp = undefined;
    actor.baseHp = undefined;
    actor.maxHp = function (){
        return this.baseHp;
    };
    actor.baseAttack = 1;
    // Redefined Functions
    actor.constructor = (function (parentFunction){
        return function (){
            this.hp = this.maxHp();
            parentFunction.apply(this, arguments);
            return this;
        };
    })(actor.constructor);
    // New Functions
    actor.adjustHp = function (amount){
        /**
            Modifies the health points (HP) of the actor from both healing and
                taking damage. Hp should not be set outside of this function.
            Initiates death if HP drops below critical existence threshold (0).
            Bounds HP between critical existence threshold and actor's Max HP.
            Returns the actual change in HP, positive indicates healing.
         **/
        var oldHp = this.hp;
        this.hp = Math.max(0, Math.min(this.maxHp(), this.hp+amount));
        var deltaHp = this.hp - oldHp;
        // TODO: Find a good way to tell the player the results of their attack.
        if(deltaHp < 0){
            this.sound('pain', 7, this)//, 'The '+this.name+' cries out in pain!');
        } else if(deltaHp === 0){
        } else{
        }
        // --
        if(this.hp <= 0){
            this.sound('death', 10, this, 'The '+this.name+' dies!');
            this.die();
        }
        return deltaHp;
    };
    actor.die = function (){
        /**
            TODO
            Remove actor from world
            Award Exp
            Drop items
            Inform actors in view of death
            Assure garbage collection
            Etc.
         **/
        // TODO: Find a way to inform the attacker, even if they can't hear.
        this.dead = true;
        this.dispose();
    };
    actor.hurt = function (damage, damageType, attacker, proxy){
        /**
            This function is the entry point whenever the actor takes damage
                from any source. From here all other aspects associated with
                taking damage are organized, such as defense, adjusting hp,
                and death.
            Damage is the amount of damage attempted, damage type is one of the
                damage type constants, attacker the (optional) actor who
                initiated the attack, and proxy is the (optional) weapon the
                attacker used in their attack.
            It returns the amount of damage actually done, positive indicates
                a loss of HP.
         **/
        if(!damageType){ damageType = DAMAGE_PHYSICAL;}
        var damageDone = damage;
        if(this.equipment){
            for(var placement in this.equipment){
                if(this.equipment.hasOwnProperty(placement)){
                    var equipped = this.equipment[placement];
                    if(!equipped || !equipped.defend){ continue;}
                    damageDone -= equipped.defend(
                        damageDone, damageType, attacker, proxy
                    );
                }
            }
        }
        damageDone = Math.max(0, damageDone);
        if(damageDone > 0){
            damageDone = -this.adjustHp(-damage);
        }
        return damageDone;
    };
    actor.attack = function (target){
        /**
         *  This function initiates an attempt to hurt an enemy actor via
         *      physical means, such as melee or bow attacks.
         *  Target is an enemy actor to attack, and weapon is an (optional)
         *      item to use in the attack. If weapon is not supplied, a melee
         *      attack will be initiated using the actor's base stats.
         *  It returns the amount of damage actually done, positive indicates
         *      a loss of HP.
         **/
        // Create Attack Info Message
        var theHero = gameManager.currentGame.hero
        var sourceName = (this === theHero)? 'You attack' : this.name+' attacks';
        var targetName = (target === theHero)? 'you' : target.name;
        var message = sourceName+' '+targetName;
        if(theHero){ theHero.inform(message);}
        //
        var damageDone;
        // If a weapon is equipped, attack with that.
        var weapon = this.equipment? this.equipment[EQUIP_MAINHAND] : undefined;
        if(weapon && weapon.attack){
            damageDone = weapon.attack(this, target);
        // Else, attack with your hands.
        } else{
            var damage = this.baseAttack;
            var damageType = DAMAGE_PHYSICAL;
            damageDone = target.hurt(damage, damageType, this);
        }
        // Return that actual damage done.
        return damageDone;
    };
    // End extend actor
    
    /**
     *  Extend person
     **/
    person.lastHeal = 0;
    person.constructor = (function (parentFunction){
        return function (){
            parentFunction.apply(this, arguments);
            this.update('hp');
            this.update('maxHp');
            return this;
        };
    })(person.constructor);
    person.packageUpdates = (function (parentFunction){
        return function (){
            /**
                This function creates a data package containing information about
                    aspects of the person that have changed since the person's last
                    turn.
                It returns said package.
             **/
            var updatePackage = parentFunction.apply(this, arguments);
            if(!this.updates){
                return updatePackage;
            }
            this.updates.forEach(function (changeKey){
                switch(changeKey){
                    /*  For the following cases, an attribute is appended to the
                        object at the top level. */
                    case 'hp'   : updatePackage.hp    = this.hp;      return;
                    case 'maxHp': updatePackage.maxHp = this.maxHp(); return;
                }
            }, this);
            return updatePackage;
        };
    })(person.packageUpdates);
    person.adjustHp = (function (parentFunction){
        return function (){
            var result = parentFunction.apply(this, arguments);
            if(result){
                this.update('hp');
            }
            return result;
        };
    })(person.adjustHp);
    person.takeTurn = (function (parentFunction){
        return function (){
            /**
                This function causes the actor to perform their turn taking
                behavior, such as moving about the map, attacking, or alerting
                the player, possibly over the network, to issue a command.
                
                The game will halt until callback is called. All behavior
                associated with this object taking a turn must take place
                between the initial call to takeTurn, and the call to callback.
                
                It does not return anything.
             **/
            if(this.hp == this.maxHp()){
                this.lastHeal = gameManager.currentTime();
            } else{
                var healWait = gameManager.currentTime() - this.lastHeal;
                if(healWait >= this.healDelay()){
                    this.adjustHp(1);
                    this.lastHeal = gameManager.currentTime();
                }
            }
            return parentFunction.apply(this, arguments);
        };
    })(person.takeTurn);
    person.throwItem = function (theItem, direction){
        var throwOptions = {
            thrower: this,
            range: this.strength
        };
        if(theItem.stackable && theItem.stackCount > 1){
            var singleAmmo = theItem.unstack();
            if(singleAmmo){
                theItem = singleAmmo;
            }
            this.update('equipment');
        }
        this.inventoryRemove(theItem);
        var damageDone = theItem.project(direction, throwOptions);
        return damageDone;
    };
    person.commandFire = function (options){
        /**
            This command from the player directs the person to fire their equipped
            weapon in the specified direction.
            
            Structure of options:
            {
                direction: CONSTANT, // NORTH, SOUTHEAST, etc.
            }
         **/
        // Check if the user has a fireable item equipped.
        var theWeapon = this.equipment[EQUIP_MAINHAND];
        if(!theWeapon){
            this.inform('You need to Equip a bow or wand first.');
            this.endTurn();
            return;
        }
        if((typeof theWeapon.shoot) != 'function'){
            this.inform('You cannot "Fire" the '+theWeapon.description()+'.');
            this.inform('(Only Bows and Wands can be fired.)');
            this.endTurn();
            return;
        }
        // Fire the item.
        theWeapon.shoot(this, options.direction);
        // End turn.
        this.endTurn();
    };
    person.commandThrow = function (options){
        /**
            This command from the player directs the person to throw the specified
            item from inventory in the specified direction.
            
            Structure of options:
            {
                itemId: uniqueId, // as per mapManager.idManager.assignId
                direction: CONSTANT, // NORTH, SOUTHEAST, etc.
            }
         **/
        var theItem;
        // Attempt to find the item by ID in inventory.
        var itemId = options.itemId;
        if(itemId !== undefined){
            var testItem = mapManager.idManager.get(itemId);
            if(testItem && this.inventory.indexOf(testItem) != -1){
                /* This indexOf test prevents a type of cheating where the user
                   would specify the id of an item /not/ in inventory. */
                theItem = testItem;
            }
        }
        if(!theItem){
            this.inform('You cannot find the item in your inventory.');
            this.endTurn();
            return;
        }
        // Throw the item.
        this.inform('You throw the '+theItem.description()+'.');
        this.throwItem(theItem, options.direction);
        // End turn.
        this.endTurn();
    };
    // End extend person
})();


//== Define Weapons ============================================================
// TODO: Refactor projectiles. It's a real mess, really.
var weapon = Object.create(item, {
    // Redefined Properties
    character: {value: '/', writable: true},
    placement: {value: EQUIP_MAINHAND, writable: true},
    // Redefined Methods
    // New Properties
    damageType: {value: DAMAGE_PHYSICAL, writable: true},
    baseDamage: {value: 1, writable: true},
    damageSigma: {value: 0, writable: true},
    twoHanded: {value: false, writable: true},
    throwable: {value: false, writable: true},
    // New Methods
    attack: {value: function (attacker, target){
        /**
         *  This function handles one attacker attacking an enemy actor via a
         *      weapon. This is a hook that derived types can use for all sorts
         *      of effects, such as an HP stealing weapon that heals the
         *      attacker based on the amount of damage dealt to the enemy, etc.
         *  It returns the actual amount of damage done to the enemy, positive
         *      indicating damage.
         **/
        // TODO: Add strength stat from player, perhaps.
        var damage = Math.max(
            0,
            gaussRandom(this.baseDamage, this.damageSigma)
        );
        var damageType = this.damageType;
        var damageDone = target.hurt(damage, damageType, attacker, this);
        // Return that actual damage done.
        return damageDone;
    }, writable: true}
});
var bow = Object.create(item, {
    // Redefined Properties
    character: {value: '}', writable: true},
    placement: {value: EQUIP_MAINHAND, writable: true},
    // Redefined Methods
    // New Properties
    damageScale: {value: 1, writable: true},
    range: {value: 6, writable: true},
    ammoType: {value: 'arrow', writable: true},
        // TODO: Better ammo types, perhaps with bit flags. That way, you could
            // fire 'blizzard arrows' or silly stuff like that.
    // New Methods
    shoot: {value: function (attacker, direction, forceTarget){
        /**
         *  This function handles one attacker attacking an enemy actor via a
         *      weapon. This is a hook that derived types can use for all sorts
         *      of effects, such as an HP stealing weapon that heals the
         *      attacker based on the amount of damage dealt to the enemy, etc.
         *  It returns the actual amount of damage done to the enemy, positive
         *      indicating damage.
         **/
        if(!attacker.equipment){
            console.log('Problem: Non-person using bow.');
                // TODO: Companions or enemies attacking?
            return null;
        }
        var ammo = attacker.equipment[EQUIP_OFFHAND];
        var damageDone;
        if(!ammo){
            attacker.inform('You have no ammo equipped.');
            return null;
        } else if(ammo.ammoType != this.ammoType){ // TODO: Ammo types, see above.
            attacker.inform('You need to equip an '+this.ammoType+'.');
            return null;
        } else{
            attacker.inform('You fire the '+this.description()+'.');
            var projectileOptions = {
                thrower: attacker,
                range: this.range,
                damageScale: this.damageScale,
                forceTarget: forceTarget
            };
            var singleAmmo = ammo.unstack();
            if(!singleAmmo){
                //attacker.unequip(ammo);
                delete attacker.equipment[ammo.placement];
                singleAmmo = ammo;
            }
            attacker.update('equipment');
            damageDone = singleAmmo.project(direction, projectileOptions);
        }
        // TODO: Return actual damage done.
        if(damageDone || damageDone === 0){
            return damageDone;
        } else{
            return null;
        }
    }, writable: true}
});

item.project = function (direction, options){
    // Returns damage done, if any.
    delete this.projectDamageDone;
    var originalStackable = this.stackable;
    this.stackable = false;
    var thrower = options.thrower;
    if(thrower){
        this.place(thrower.x, thrower.y, thrower.levelId);
    }
    if(!this.x || !this.y || !this.levelId){
        this.stackable = originalStackable;
        return 0;
    }
    var originalDensity = this.dense;
    this.dense = true;
    var movement = true;
    var rangeTraversed = 0;
    var maxRange = options.range;
    if(maxRange === undefined){ maxRange = displaySize;} // MAGIC NUMBERS!
    /* Rational for MAGIC NUMBER: Infinity could lead to problem with the loop
    below. Making the max range equal to the display size means the projectile
    can travel twice as far as the player's view range. This seems like a good
    limit. */
    while(movement && rangeTraversed < maxRange){
        movement = this.move(direction);
        rangeTraversed++;
    }
    this.dense = originalDensity;
    this.stackable = originalStackable;
    if(this.stackable){
        var contents = mapManager.getTileContents(
            this.x, this.y, this.levelId);
        if(contents){
            for(var cI = 0; cI < contents.length; cI++){
                var testContent = contents[cI];
                if(testContent == this){ continue;}
                if(testContent.name == this.name){
                    this.unplace();
                    testContent.stack(this);
                }
            }
        }
    }
    this.stackable = false;
    return this.projectDamageDone;
};
item.bump = (function (parentFunction){
    return function (obstruction){
        if(obstruction.type == TYPE_ACTOR){
            if((typeof obstruction.hurt) == 'function'){
                var damageDone = obstruction.hurt(1, undefined, this.thrower);
                this.projectDamageDone = damageDone;
            }
        }
        if(this.thrower){
            delete this.thrower;
        }
        return parentFunction.apply(this, arguments);
    };
})(item.bump);
weapon.bump = function (obstruction){
    if(!this.throwable){
        return item.bump.apply(this, arguments);
    }
    if(obstruction.type == TYPE_ACTOR){
        if((typeof obstruction.hurt) == 'function'){
            var damageDone = this.attack(this.thrower, obstruction);
            this.projectDamageDone = damageDone;
        }
    }
    if(this.thrower){
        delete this.thrower;
    }
    return movable.bump.apply(this, arguments);
};
var projectile = Object.create(weapon, {
    placement: {value: EQUIP_OFFHAND, writable: true},
    ephemeral: {value: true, writable: true},
    project: {value: function (direction, options){
        // Returns damage done, if any.
        delete this.projectDamageDone;
        var originalStackable = this.stackable;
        this.stackable = false;
        var thrower = options.thrower;
        if(options.forceTarget){
            var target = options.forceTarget;
            this.place(target.x, target.y, target.levelId);
            this.thrower = thrower;
            this.bump(target);
            this.thrower = null;
            if(this.ephemeral){
                this.dispose();
            }
            this.stackable = originalStackable;
            if(this.stackable){
                var contents = mapManager.getTileContents(
                    this.x, this.y, this.levelId);
                if(contents){
                    for(var cI = 0; cI < contents.length; cI++){
                        var testContent = contents[cI];
                        if(testContent == this){ continue;}
                        if(testContent.name == this.name){
                            this.unplace();
                            testContent.stack(this);
                        }
                    }
                }
            }
            return this.projectDamageDone;
        }
        if(thrower){
            this.place(thrower.x, thrower.y, thrower.levelId);
        }
        if(!this.x || !this.y || !this.levelId){
            this.stackable = originalStackable;
            return 0;
        }
        if(options.damageScale){
            this.damageScale = options.damageScale;
        } else{
            this.damageScale = undefined;
        }
        var originalDensity = this.dense;
        this.dense = true;
        var movement = true;
        var rangeTraversed = 0;
        var maxRange = options.range;
        if(maxRange === undefined){ maxRange = displaySize;} // MAGIC NUMBERS!
        /* Rational for MAGIC NUMBER: Infinity could lead to problem with the loop
        below. Making the max range equal to the display size means the projectile
        can travel twice as far as the player's view range. This seems like a good
        limit. */
        this.thrower = thrower;
        while(movement && rangeTraversed < maxRange){
            movement = this.move(direction);
            rangeTraversed++;
        }
        this.thrower = null;
        this.dense = originalDensity;
        this.stackable = originalStackable;
        if(this.stackable){
            var contents2 = mapManager.getTileContents(
                this.x, this.y, this.levelId);
            if(contents2){
                for(var cI2 = 0; cI2 < contents2.length; cI2++){
                    var testContent2 = contents2[cI2];
                    if(testContent2 == this){ continue;}
                    if(testContent2.name == this.name){
                        this.unplace();
                        testContent2.stack(this);
                    }
                }
            }
        }
        if(this.ephemeral){
            this.dispose();
        }
        return this.projectDamageDone;
    }, writable: true},
    bump: {value: function (obstruction){
        if(!this.damageScale){
            return weapon.bump.apply(this, arguments);
        }
        if(obstruction.type == TYPE_ACTOR){
            if((typeof obstruction.hurt) == 'function'){
                var damageDone = this.attack(this.thrower, obstruction);
                this.projectDamageDone = damageDone;
            }
        }
        if(this.thrower){
            delete this.thrower;
            delete this.damageScale;
        }
        return movable.bump.apply(this, arguments);
    }},
    attack: {value: function (attacker, target){
        /**
         *  This function handles one attacker attacking an enemy actor via a
         *      weapon. This is a hook that derived types can use for all sorts
         *      of effects, such as an HP stealing weapon that heals the
         *      attacker based on the amount of damage dealt to the enemy, etc.
         *  It returns the actual amount of damage done to the enemy, positive
         *      indicating damage.
         **/
        var scale = this.damageScale || 1;
        var damage = Math.max(
            0,
            gaussRandom(this.baseDamage*scale, this.damageSigma)
        );
        var damageType = this.damageType;
        var damageDone = target.hurt(damage, damageType, attacker, this);
        // Return that actual damage done.
        return damageDone;
    }}
});


//== Define Armor ==============================================================

(function (base){
    base.defense = 0;
    base.evade = 0;
    base.defend = function (damage, damageType, attacker, proxy){
        var defended = 0;
        if(damageType & DAMAGE_PHYSICAL){
            if(this.evade && Math.random() < this.evade){
                defended = damage;
            } else if(this.defense){
                defended += Math.max(0, gaussRandom(this.defense, 1));
            }
        }
        return defended;
    };
})(item);



//== Storage ===================================================================

/* Simple JavaScript Inheritance
     * By John Resig http://ejohn.org/
     * MIT Licensed.
     * /  
     // Inspired by base2 and Prototype
(function(){
  var initializing = false
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.* /; // Remove space between '* /' when uncommenting.

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = (typeof prop[name] == "function") &&
        (typeof _super[name] == "function") && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();*/