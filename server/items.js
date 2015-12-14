(function (){ // Open new namespace for items (to hide base item types).
//==============================================================================

//item.generationId = '';
item.generationWeight = 1;

//== Base Prototypes (wands, rings, etc.) ======================================

var wand = Object.create(item, {
    // Redefined Properties
    character: {value: '-', writable: true},
    placement: {value: EQUIP_MAINHAND, writable: true},
    targetClass: {value: TARGET_DIRECTION, writable: true},
    lore: {value: 10, writable: true},
    // Redefined Methods
    description: {value: function (){
        return mapManager.idManager.describeWand(this);
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

modelLibrary.registerModel('item', Object.create(potion, {
    generationId: {value: 'weak health potion'},
    generationWeight: {value: 2, writable: true},
    potency: {value: 10, writable: true},
    lore: {value: 15, writable: true},
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
    }},
    // Description:
    viewText: {value: 'You see a weak health potion. Drinking this potion will restore a small amount of health.'}
}));
modelLibrary.registerModel('item', Object.create(
    modelLibrary.getModel('item', 'weak health potion'), {
    generationId: {value: 'health potion'},
    generationWeight: {value: 5, writable: true},
    potency: {value: 30, writable: true},
    lore: {value: 20, writable: true},
    name: {value: 'Health Pot'},
    // Description:
    viewText: {value: 'You see a health potion. Drinking this potion will restore a moderate amount of health.'}
}));
modelLibrary.registerModel('item', Object.create(
    modelLibrary.getModel('item', 'weak health potion'), {
    generationId: {value: 'strong health potion'},
    generationWeight: {value: 9, writable: true},
    potency: {value: 80, writable: true},
    lore: {value: 40, writable: true},
    name: {value: 'StrHealth Pot'},
    // Description:
    viewText: {value: 'You see a strong health potion. Drinking this potion will restore a large amount of health.'}
}));
modelLibrary.registerModel('item', Object.create(potion, {
    generationId: {value: 'acid potion'},
    generationWeight: {value: 3, writable: true},
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
    }},
    // Description:
    viewText: {value: 'You see an acid potion. Most organic materials will corrode when covered in this liquid.'}
}));
modelLibrary.registerModel('item', Object.create(potion, {
    generationId: {value: 'cowardice potion'},
    generationWeight: {value: 4, writable: true},
    potency: {value: 40, writable: true},
    lore: {value: 45, writable: true},
    name: {value: 'Cowardice Pot'},
    effect: {value: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're terrified!");
            }
            user.adjustMoral(
                -Math.max(this.potency/2, gaussRandom(this.potency,1))
            );
        }
        potion.effect.apply(this, arguments);
    }},
    // Description:
    viewText: {value: 'You see a cowardice potion. Drinking this potion will lower your moral.'}
}));
modelLibrary.registerModel('item', Object.create(potion, {
    generationId: {value: 'courage potion'},
    generationWeight: {value: 5, writable: true},
    potency: {value: 100, writable: true},
    lore: {value: 45, writable: true},
    name: {value: 'Courage Pot'},
    effect: {value: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're feel couragous!");
            }
            user.adjustMoral(
                Math.max(this.potency/2, gaussRandom(this.potency,1))
            );
        }
        potion.effect.apply(this, arguments);
    }},
    // Description:
    viewText: {value: 'You see a courage potion. Drinking this potion will raise your moral.'}
}));
modelLibrary.registerModel('item', Object.create(wand, {// Test Wand
    // Id:
    generationId: {value: 'fire wand'},
    generationWeight: {value: 4, writable: true},
    lore: {value: 20, writable: true},
    name: {value: 'Wand of Fire', writable: true},
    // Description:
    viewText: {value: 'You see a wand of fire. This magical item can shoot fireballs at your enemies.'}
}));/*
modelLibrary.registerModel('item', Object.create(wand, {// Test Wand
    // Id:
    lore: {value: 30, writable: true},
    name: {value: 'Wand of Haste', writable: true},
    generationWeight: {value: 4, writable: true}
}));*/

modelLibrary.registerModel('item', Object.create(scroll, {
    generationId: {value: 'fire scroll', writable: true},
    generationWeight: {value: 2, writable: true},
    name: {value: 'FireScroll'},
    lore: {value: 18, writable: true},
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
        
    }},
    // Description:
    viewText: {value: 'You see a fire scroll. This magical item can summon a blast of fire to envelope your enemy.'}
}));
modelLibrary.registerModel('item', Object.create(weapon, { // Rock
    // Id:
    generationId: {value: 'rock'},
    generationWeight: {value: 1, writable: true},
    // Display:
    name: {value: 'Rock', writable: true},
    character: {value: ':', writable: true},
    color: {value: '#444', writable: true},
    // Stats:
    weight: {value: 4, writable: true},
    baseDamage: {value: 1, writable: true},
    damageSigma: {value: 1/3, writable: true},
    // Behavior:
    throwable: {value: true, writable: true},
    stackable: {value: true, writable: true},
    // Description:
    viewText: {value: "You see a heavy rock, a weapon of last resort. Many goblins have lived another day thanks to a well thrown rock."}
}));
modelLibrary.registerModel('item', Object.create(weapon, { // Club
    // Id:
    generationId: {value: 'club'},
    generationWeight: {value: 2, writable: true},
    // Display:
    name: {value: 'Club', writable: true},
    character: {value: '|', writable: true},
    // Stats:
    weight: {value: 4, writable: true},
    baseDamage: {value: 2, writable: true},
    damageSigma: {value: 1/3, writable: true},
    // Behavior:
    // Description:
    viewText: {value: 'You see a wooden club. This is a crude weapon, but effective.'}
}));
modelLibrary.registerModel('item', Object.create(weapon, { // Cleaver
    // Id:
    generationId: {value: 'cleaver'},
    generationWeight: {value: 4, writable: true},
    // Display:
    name: {value: 'Cleaver', writable: true},
    character: {value: '|', writable: true},
    // Stats:
    weight: {value: 2, writable: true},
    baseDamage: {value: 4, writable: true},
    damageSigma: {value: 1, writable: true},
    // Behavior:
    // Description:
    viewText: {value: 'You see a cleaver. This hacking weapon is much more effective in the hands of a goblin than when wielded by a dwarf.'}
}));
modelLibrary.registerModel('item', Object.create(weapon, { // Spear
    // Id:
    generationId: {value: 'spear'},
    generationWeight: {value: 5, writable: true},
    // Display:
    name: {value: 'Spear', writable: true},
    character: {value: '/', writable: true},
    // Stats:
    weight: {value: 5, writable: true},
    baseDamage: {value: 7, writable: true},
    damageSigma: {value: 1, writable: true},
    // Behavior:
    twoHanded: {value: true, writable: true},
    throwable: {value: true, writable: true},
    // Description:
    viewText: {value: 'You see a spear, a favorite weapon of goblin when hunting. It is equally effected when thrown.'}
}));
modelLibrary.registerModel('item', Object.create(weapon, { // Sword
    // Id:
    generationId: {value: 'sword'},
    generationWeight: {value: 7, writable: true},
    // Display:
    name: {value: 'Sword', writable: true},
    character: {value: '|', writable: true},
    // Stats:
    weight: {value: 3, writable: true},
    baseDamage: {value: 7, writable: true},
    damageSigma: {value: 2, writable: true},
    // Behavior:
    // Description:
    viewText: {value: 'You see a sword. Goblins are less familiar than humans with this weapon, but no less deadly.'}
}));
modelLibrary.registerModel('item', Object.create(weapon, { // Hand Axe
    // Id:
    generationId: {value: 'hand axe'},
    generationWeight: {value: 8, writable: true},
    // Display:
    name: {value: 'Hand Axe', writable: true},
    character: {value: '|', writable: true},
    // Stats:
    weight: {value: 6, writable: true},
    baseDamage: {value: 10, writable: true},
    damageSigma: {value: 2, writable: true},
    // Behavior:
    // Description:
    viewText: {value: 'You see a dwarven hand axe - heavier than a sword, but alse more savage.'}
}));
modelLibrary.registerModel('item', Object.create(weapon, { // Hammer
    // Id:
    generationId: {value: 'hammer'},
    generationWeight: {value: 9, writable: true},
    // Display:
    name: {value: 'Hammer', writable: true},
    character: {value: '/', writable: true},
    // Stats:
    weight: {value: 8, writable: true},
    baseDamage: {value: 15, writable: true},
    damageSigma: {value: 1, writable: true},
    // Behavior:
    twoHanded: {value: true, writable: true},
    // Description:
    viewText: {value: 'You see a dwarven hammer. This finely crafted stone weapon is what dwarven warcraft is all about. You doubt you could weild it.'}
}));
modelLibrary.registerModel('item', Object.create(bow, { // Short Bow
    // Id:
    generationId: {value: 'short bow'},
    generationWeight: {value: 2, writable: true},
    // Display:
    name: {value: 'ShortBow', writable: true},
    // Stats:
    weight: {value: 2, writable: true},
    range: {value: 5, writable: true},
    damageScale: {value: 1, writable: true},
    ammoType: {value: 'arrow', writable: true},
    // Behavior:
    // Description:
    viewText: {value: 'You see a short bow. Most goblin carry a short bow to hunt and defend themselves in the wilderness.'}
}));
modelLibrary.registerModel('item', Object.create(bow, { // Crossbow
    // Id:
    generationId: {value: 'crossbow'},
    generationWeight: {value: 4, writable: true},
    // Display:
    name: {value: 'Crossbow', writable: true},
    // Stats:
    weight: {value: 5, writable: true},
    range: {value: 5, writable: true},
    damageScale: {value: 2, writable: true},
    ammoType: {value: 'arrow', writable: true},
    // Behavior:
    // Description:
    viewText: {value: "You see a dwarven crossbow. It's heavy, and looks more complicated than it needs to be."}
}));
modelLibrary.registerModel('item', Object.create(bow, { // Short Bow
    // Id:
    generationId: {value: 'long bow'},
    generationWeight: {value: 6, writable: true},
    // Display:
    name: {value: 'LongBow', writable: true},
    // Stats:
    weight: {value: 2, writable: true},
    range: {value: 10, writable: true},
    damageScale: {value: 2, writable: true},
    ammoType: {value: 'arrow', writable: true},
    // Behavior:
    // Description:
    viewText: {value: 'You see a long bow.'}
}));
modelLibrary.registerModel('item', Object.create(projectile, { // arrow
    // Id:
    generationId: {value: 'arrow1'},
    generationWeight: {value: 200, writable: true},
            // Do not generate alone.
    // Display:
    name: {value: 'Arrow', writable: true},
    character: {value: '\\', writable: true},
    // Stats:
    weight: {value: 1/4, writable: true},
    baseDamage: {value: 2, writable: true},
    damageSigma: {value: 0, writable: true},
    stackCount: {value: 1, writable: true},
    // Behavior:
    ammoType : {value: 'arrow', writable:true},
    placement: {value: EQUIP_OFFHAND, writable:true},
    stackable: {value: true, writable: true},
    ephemeral: {value: false, writable: true},
    // Description:
    viewText: {value: 'You see an arrow.'}
}));
modelLibrary.registerModel('item', Object.create(
    modelLibrary.getModel('item', 'arrow1'),
    {
        generationId: {value: 'arrow5'},
        generationWeight: {value: 4, writable: true},
        stackCount: {value: 5, writable: true}
    }
));
modelLibrary.registerModel('item', Object.create(
    modelLibrary.getModel('item', 'arrow1'),
    {
        generationId: {value: 'arrow10'},
        generationWeight: {value: 6, writable: true},
        stackCount: {value: 10, writable: true}
    }
));
modelLibrary.registerModel('item', Object.create(projectile, { // arrow
    // Id:
    generationId: {value: 'arrowBarbed1'},
    generationWeight: {value: 300, writable: true},
            // Do not generate alone!
    // Display:
    name: {value: 'BarbedArrow', writable: true},
    character: {value: '\\', writable: true},
    // Stats:
    weight: {value: 1/2, writable: true},
    baseDamage: {value: 4, writable: true},
    damageSigma: {value: 0, writable: true},
    stackCount: {value: 1, writable: true},
    // Behavior:
    ammoType : {value: 'arrow', writable:true},
    placement: {value: EQUIP_OFFHAND, writable:true},
    stackable: {value: true, writable: true},
    ephemeral: {value: false, writable: true},
    // Description:
    viewText: {value: 'You see an arrow. Its tip is covered in vicious hooks.'}
}));
modelLibrary.registerModel('item', Object.create(
    modelLibrary.getModel('item', 'arrowBarbed1'),
    {
        generationId: {value: 'arrowBarbed5'},
        generationWeight: {value: 7, writable: true},
        stackCount: {value: 5, writable: true}
    }
));
modelLibrary.registerModel('item', Object.create(
    modelLibrary.getModel('item', 'arrowBarbed1'),
    {
        generationId: {value: 'arrowBarbed10'},
        generationWeight: {value: 10, writable: true},
        stackCount: {value: 10, writable: true}
    }
));


//== Armor =====================================================================

modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'leather shield'},
    generationWeight: {value: 2, writable: true},
    character: {value: '('},
    name: {value: 'LeatherShield'},
    placement: {value: EQUIP_OFFHAND},
    evade: {value: 1/10},
    weight: {value: 1},
    // Description:
    viewText: {value: 'You see a leather shield.'}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'leather armor'},
    generationWeight: {value: 3, writable: true},
    character: {value: ']'},
    name: {value: 'LeatherArmor'},
    placement: {value: EQUIP_BODY},
    defense: {value: 1},
    weight: {value: 2},
    // Description:
    viewText: {value: 'You see leather body armor. It was made by dwarves, but you could probably wear it.'}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'leather cap'},
    generationWeight: {value: 2, writable: true},
    character: {value: '^'},
    name: {value: 'LeatherCap'},
    placement: {value: EQUIP_HEAD},
    defense: {value: 1/2},
    weight: {value: 1/2},
    // Description:
    viewText: {value: 'You see a leather cap.'}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'chain cowl'},
    generationWeight: {value: 4, writable: true},
    character: {value: '^'},
    name: {value: 'ChainCowl'},
    placement: {value: EQUIP_HEAD},
    defense: {value: 1},
    weight: {value: 2},
    // Description:
    viewText: {value: "You see a chainmail cowl. It's rusty, but well made."}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'wood shield'},
    generationWeight: {value: 4, writable: true},
    character: {value: '('},
    name: {value: 'WoodShield'},
    placement: {value: EQUIP_OFFHAND},
    evade: {value: 1/8},
    weight: {value: 2},
    // Description:
    viewText: {value: 'You see a tough wooden shield, like those favored by goblin everywhere.'}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'chainmail armor'},
    generationWeight: {value: 5, writable: true},
    character: {value: ']'},
    name: {value: 'ChainArmor'},
    placement: {value: EQUIP_BODY},
    defense: {value: 2},
    weight: {value: 4},
    // Description:
    viewText: {value: "You see chainmail body armor. It's rusty, but well made."}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'dwarven helmet'},
    generationWeight: {value: 6, writable: true},
    character: {value: '^'},
    name: {value: 'DwarfHelmet'},
    placement: {value: EQUIP_HEAD},
    defense: {value: 2},
    weight: {value: 3},
    // Description:
    viewText: {value: "You see a Dwarven Helmet. The thick plates of metal make you feel very safe."}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'dwarven shield'},
    generationWeight: {value: 7, writable: true},
    character: {value: '('},
    name: {value: 'DwarfShield'},
    placement: {value: EQUIP_OFFHAND},
    evade: {value: 1/6},
    weight: {value: 4},
    // Description:
    viewText: {value: 'You see a Dwarven Shield. The thick plates of metal make you feel very safe.'}
}));
modelLibrary.registerModel('item', Object.create(item, {
    generationId: {value: 'dwarven armor'},
    generationWeight: {value: 9, writable: true},
    character: {value: ']'},
    name: {value: 'DwarfArmor'},
    placement: {value: EQUIP_BODY},
    defense: {value: 4},
    weight: {value: 6},
    // Description:
    viewText: {value: 'You see Dwarven Armor. The thick plates of metal make you feel very safe.'}
}));

//==============================================================================
    // Close namespace.
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
            {   Cross Bow
        
        
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
 Mid   |          |          |
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