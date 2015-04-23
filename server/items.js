var itemLibrary = (function (){ // Open new namespace for items library.
//==============================================================================
var library = {
    items: {},
    itemWeights: [],
    registerItem: function (newPrototype){
        var prototypeName = newPrototype.name;
        if(!prototypeName || this.items[prototypeName]){
            console.log('Problem: Non-unique name for item prototype '+prototypeName);
        }
        var itemWeight = newPrototype.baseValue;
        if(itemWeight){
            var totalWeight = itemWeight;
            if(newPrototype.stackCount > 1){
                totalWeight *= newPrototype.stackCount;
            }
            var weightClass = this.itemWeights[totalWeight];
            if(!weightClass){
                weightClass = [];
                this.itemWeights[totalWeight] = weightClass;
            }
            weightClass.push(prototypeName);
        }
        this.items[prototypeName] = newPrototype;
    },
    getItem: function (itemName){
        var itemPrototype = this.items[itemName];
        return itemPrototype;
    },
    getItemByWeight: function (weight){
        weight = Math.round(weight);
        var weightClass;
        var itemPrototype;
        while(!weightClass && weight > 0){
            weightClass = this.itemWeights[weight];
            if(!weightClass){
                weight--;
                continue;
            }
            prototypeName = arrayPick(weightClass);
            itemPrototype = this.getItem(prototypeName);
            if(itemPrototype){
                break;
            }
        }
        return itemPrototype;
    }
};
item.baseValue = 1;

//== Base Prototypes (wands, rings, etc.) ======================================

var wand = Object.create(item, {
    // Redefined Properties
    character: {value: '-', writable: true},
    placement: {value: EQUIP_MAINHAND, writable: true},
    targetClass: {value: TARGET_DIRECTION, writable: true},
    lore: {value: 10, writable: true},
    // Redefined Methods
    description: {value: function (){
        return mapManager.idManager.describeWand(this)
        ;
    }},
    // New Properties
    charges: {value: 5, writable: true},
    range: {value: 15, writable: true},
    projectileType: {value: Object.create(projectile, {
        // Stats:
        damageType: {value: DAMAGE_FIRE, writable: true},
        damageSigma: {value: 0, writable: true},
        baseDamage: {value: 3, writable: true},
        attack: {value: function (attacker, target){
            attacker.hear(null, 10, target, 'A fireball engulfs the '+target.name+'!');
            return projectile.attack.apply(this, arguments);
        }}
    }), writable: true},
    // New Methods
    effect: {value: function (user, targetData){
        if(!targetData.direction){
            user.inform('You failed to use the '+this.description()+' properly.');
            return;
        }
        this.shoot(user, targetData.direction);
    }},
    shoot: {value: function (attacker, direction, forceTarget){
        if(this.charges <= 0){
            attacker.inform('There wand is out of charges!');
            return 0;
        }
        this.charges--;
        if(attacker.equipment[this.placement] == this){
            attacker.update('equipment');
        } else{
            attacker.update('inventory');
        }
        var deltaLore = gameManager.currentGame.hero.lore() - this.lore;
        var loreAttempt = gaussRandom(
            deltaLore,
            10-gameManager.currentGame.hero.wisdom
        );
        if(loreAttempt < 0){
            attacker.inform('You do not know how to use the '+this.description()+'.');
            return 0;
        }
        var damageDone;
        attacker.inform('You fire the '+this.description()+'.');
        var projectileOptions = {
            thrower: attacker,
            range: this.range,
            damageScale: 1,
            forceTarget: forceTarget
        };
        var theProj = Object.instantiate(this.projectileType);
        damageDone = theProj.project(direction, projectileOptions);
        // TODO: Return actual damage done.
        if(damageDone){
            return damageDone;
        } else{
            return 0;
        }
    }, writable: true}
});
var scroll = Object.create(item, {
    // Redefined Properties
    character: {value: '$', writable: true},
    stackable: {value: true, writable: true},
    consumable: {value: true, writable: true},
    targetClass: {value: TARGET_ANYONE, writable: true},
    lore: {value: 20, writable: true},
    description: {value: function (){
        return mapManager.idManager.describeScroll(this);
    }},
    use: {value: function(user, targetData){
        var deltaLore = gameManager.currentGame.hero.lore() - this.lore;
        var loreAttempt = gaussRandom(
            deltaLore,
            10-gameManager.currentGame.hero.wisdom
        );
        if(loreAttempt < 0){
            user.inform('You do not know how to use the '+this.description()+'.');
            //this.consume(user);
            //user.update('inventory');
        } else{
            item.use.apply(this, arguments);
        }
    }}
});
var potion = Object.create(item, {
    // Redefined Properties
    character: {value: '¡', writable: true},
    stackable: {value: true, writable: true},
    consumable: {value: true, writable: true},
    targetClass: {value: TARGET_SELF, writable: true},
    lore: {value: 30, writable: true},
    description: {value: function (){
        return mapManager.idManager.describePotion(this);
    }},
    bump: {value: function (obstruction){
        this.use(obstruction);
    }}
});


//== Specific Mappable Items ===================================================

library.registerItem(Object.create(potion, {
    potency: {value: 10, writable: true},
    baseValue: {value: 2, writable: true},
    lore: {value: 10, writable: true},
    name: {value: 'WkHealth Pot'},
    effect: {value: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're healed!");
            }
            user.adjustHp(
                Math.max(this.potency/2, gaussRandom(this.potency,1))
            );
        }
        potion.effect.apply(this, arguments);
    }}
}));
library.registerItem(Object.create(library.getItem('WkHealth Pot'), {
    potency: {value: 30, writable: true},
    baseValue: {value: 5, writable: true},
    lore: {value: 20, writable: true},
    name: {value: 'Health Pot'}
}));
library.registerItem(Object.create(library.getItem('WkHealth Pot'), {
    baseValue: {value: 9, writable: true},
    potency: {value: 80, writable: true},
    lore: {value: 40, writable: true},
    name: {value: 'StrHealth Pot'}
}));
library.registerItem(Object.create(potion, {
    baseValue: {value: 3, writable: true},
    potency: {value: 10, writable: true},
    lore: {value: 15, writable: true},
    name: {value: 'Acid Potion'},
    effect: {value: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. It's Acid!");
            }
            user.hurt(
                Math.max(this.potency/2, gaussRandom(this.potency,1)),
                DAMAGE_ACID
            );
        }
        potion.effect.apply(this, arguments);
    }}
}));
library.registerItem(Object.create(wand, {// Test Wand
    // Id:
    lore: {value: 18, writable: true},
    name: {value: 'Wand of Fire', writable: true},
    baseValue: {value: 4, writable: true}
}));/*
library.registerItem(Object.create(wand, {// Test Wand
    // Id:
    lore: {value: 30, writable: true},
    name: {value: 'Wand of Haste', writable: true},
    baseValue: {value: 4, writable: true}
}));*/

library.registerItem(Object.create(scroll, {
    name: {value: 'Fire Scroll'},
    lore: {value: 10, writable: true},
    baseValue: {value: 2, writable: true},
    effect: {value: function(user, targetData){
        // Attempt to find the target, by ID within view.
        var targetId = targetData.target.id;
        var testTarget = mapManager.idManager.get(targetId);
        if(!testTarget){
            user.inform('That is no longer there.');
        } else if(!user.checkView(testTarget)){
            user.inform('The '+testTarget.name+' is not in view.');
        } else{
            user.inform('You read the scroll. A fireball envelopes '+testTarget.name+'!');
            testTarget.hurt(5, DAMAGE_FIRE, user);
        }
        scroll.effect.apply(this, arguments);
        // TODO: Other kinds of checks.
    }}
}));
library.registerItem(Object.create(weapon, { // Rock
    // Id:
    name: {value: 'rock', writable: true},
    baseValue: {value: 1, writable: true},
    // Display:
    character: {value: ':', writable: true},
    color: {value: '#444', writable: true},
    // Stats:
    weight: {value: 8, writable: true},
    baseDamage: {value: 2, writable: true},
    damageSigma: {value: 1/3, writable: true},
    // Behavior:
    throwable: {value: true, writable: true},
    stackable: {value: true, writable: true}
}));
library.registerItem(Object.create(weapon, { // Club
    // Id:
    name: {value: 'club', writable: true},
    baseValue: {value: 2, writable: true},
    // Display:
    character: {value: '|', writable: true},
    // Stats:
    weight: {value: 4, writable: true},
    baseDamage: {value: 2, writable: true},
    damageSigma: {value: 1/3, writable: true}
    // Behavior:
}));
library.registerItem(Object.create(weapon, { // Cleaver
    // Id:
    name: {value: 'cleaver', writable: true},
    baseValue: {value: 4, writable: true},
    // Display:
    character: {value: '|', writable: true},
    // Stats:
    weight: {value: 2, writable: true},
    baseDamage: {value: 4, writable: true},
    damageSigma: {value: 1, writable: true}
    // Behavior:
}));
library.registerItem(Object.create(weapon, { // Spear
    // Id:
    name: {value: 'spear', writable: true},
    baseValue: {value: 5, writable: true},
    // Display:
    character: {value: '/', writable: true},
    // Stats:
    weight: {value: 5, writable: true},
    baseDamage: {value: 7, writable: true},
    damageSigma: {value: 1, writable: true},
    // Behavior:
    twoHanded: {value: true, writable: true},
    throwable: {value: true, writable: true}
}));
library.registerItem(Object.create(bow, { // Short Bow
    // Id:
    name: {value: 'short bow', writable: true},
    baseValue: {value: 2, writable: true},
    // Display:
    // Stats:
    weight: {value: 2, writable: true},
    range: {value: 5, writable: true},
    damageScale: {value: 1, writable: true},
    ammoType: {value: 'arrow', writable: true}
    // Behavior:
}));
library.registerItem(Object.create(projectile, { // arrow
    // Id:
    name: {value: 'arrow', writable: true},
    baseValue: {value: 2/5, writable: true},
    // Display:
    character: {value: '\\', writable: true},
    // Stats:
    weight: {value: 1/4, writable: true},
    baseDamage: {value: 2, writable: true},
    damageSigma: {value: 0, writable: true},
    stackCount: {value: 5, writable: true},
    // Behavior:
    ammoType : {value: 'arrow', writable:true},
    placement: {value: EQUIP_OFFHAND, writable:true},
    stackable: {value: true, writable: true},
    ephemeral: {value: false, writable: true}
}));


//== Armor =====================================================================

library.registerItem(Object.create(item, {
    baseValue: {value: 2, writable: true},
    character: {value: '('},
    name: {value: 'LeatherShield'},
    placement: {value: EQUIP_OFFHAND},
    evade: {value: 1/10}
}));
library.registerItem(Object.create(item, {
    baseValue: {value: 3, writable: true},
    character: {value: '('},
    name: {value: 'WoodShield'},
    placement: {value: EQUIP_OFFHAND},
    evade: {value: 1/8}
}));
library.registerItem(Object.create(item, {
    baseValue: {value: 3, writable: true},
    character: {value: ']'},
    name: {value: 'LeatherArmor'},
    placement: {value: EQUIP_BODY},
    defense: {value: 1}
}));
library.registerItem(Object.create(item, {
    baseValue: {value: 2, writable: true},
    character: {value: '^'},
    name: {value: 'LeatherCap'},
    placement: {value: EQUIP_HEAD},
    defense: {value: 1/2}
}));

//==============================================================================
    return library; // Return library, close namespace.
})();


/*

ItemTypes:
    , Food
    Light
    Digging Tools
    Door Spikes
    Spell Books
    - Wand
    - Staff
    $ Scroll
    ! Potion
    Armor:
        ) Offhand: Shield
        ^ Head: Helmet
        [ Body: Armor
    'Charms':
        " Neck: Amulets
        = Finger: Ring
    Weapon:
        Melee
            Orc Weapons:
            |   Club
            |   Spiked Club / Mace
            |   Cleaver
            /   Spear
            Dwarf Weapons:
            |   Hand Axe
            /   Axe
            /   Hammer
        Ranged
            Orc:
            {   Short Bow
            {   Long Bow
            Dwarf:
            }   Cross Bow
        
        
        Damage, Range, Weight
========================================
 Heavy | Weak     | Average  | High
-------+----------+----------+----------
 Short | Rock     | Mace     | Hammer
 Mid   | Rock     | CrossBow |
 Long  |          |          |
========================================
 Avg.  | Weak     | Average  | High
-------+----------+----------+----------
 Short | Club     | Spear    | Axe/Sword
 Mid   |          | Spear    |
 Long  | LongBow  |          |
========================================
 Light | Weak     | Average  | High
-------+----------+----------+----------
 Short | Cleaver  |          |
 Mid   | ShortBow |          |
 Long  |          |          |
========================================
        var EQUIP_MAINHAND = 'main';
        var EQUIP_OFFHAND = 'off';
        var EQUIP_BODY = 'body';
        var EQUIP_HEAD = 'head';
        var EQUIP_NECK = 'neck';
        var EQUIP_FINGER = 'finger';

Rock, Club
ShortBow, Cleaver, Spear, Mace
LongBow, CrossBow, Hammer, Axe, Sword


Rock, ShortBow, CrossBow, LongBow
Rock, Club, Cleaver, Spear, Mace, Axe, Sword

Rock
Bone
Club
ShortBow
Cleaver
Spear
Mace
CrossBow
Axe
Hammer
LongBow
Sword



*/