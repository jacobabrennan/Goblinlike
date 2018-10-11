

//== Items =====================================================================

//-- Dependencies --------------------------------
import item from './item.js';
import modelLibrary from './model_library.js';
import {weapon, bow, projectile} from './extension_combat.js';
import mapManager from './map_manager.js';
import gameManager from './game_manager.js';


//== Base Prototypes (wands, rings, etc.) ======================================

const wand = Object.extend(item, {
    // Redefined Properties
    character: '-',
    placement: EQUIP_MAINHAND,
    targetClass: TARGET_DIRECTION,
    lore: 10,
    // New Properties
    charges: 5,
    range: 15,
    projectileType: Object.extend(projectile, {
        // Stats:
        damageType: DAMAGE_FIRE,
        damageSigma: 0,
        baseDamage: 3,
        attack(attacker, target){
            this.baseDamage = attacker.wisdom+attacker.level;
            attacker.hear(null, 10, target, 'A fireball engulfs the '+target.name+'!');
            return projectile.attack.apply(this, arguments);
        }
    }),
    // Redefined Methods
    description(){
        return mapManager.idManager.describeWand(this);
    },
    toJSON() {
        let result = item.toJSON.apply(this, arguments);
        result.charges = this.charges;
        return result;
    },
    // New Methods
    effect(user, targetData){
        if(!targetData.direction){
            user.inform('You failed to use the '+this.description()+' properly.');
            return;
        }
        this.shoot(user, targetData.direction);
    },
    shoot(attacker, direction, forceTarget){
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
        var loreAttempt = deltaLore;/*gaussRandom(
            deltaLore,
            10-gameManager.currentGame.hero.wisdom
        );*/
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
    }
});
const scroll = Object.extend(item, {
    // Redefined Properties
    character: '$',
    stackable: true,
    consumable: true,
    targetClass: TARGET_ANYONE,
    lore: 20,
    description(){
        return mapManager.idManager.describeScroll(this);
    },
    use: function(user, targetData){
        var deltaLore = gameManager.currentGame.hero.lore() - this.lore;
        var loreAttempt = deltaLore;/*gaussRandom(
            deltaLore,
            10-gameManager.currentGame.hero.wisdom
        );*/
        if(loreAttempt < 0){
            user.inform('You do not know how to use the '+this.description()+'.');
            //this.consume(user);
            //user.update('inventory');
        } else{
            item.use.apply(this, arguments);
        }
    }
});
const potion = Object.extend(item, {
    // Redefined Properties
    character: '¡',
    stackable: true,
    consumable: true,
    targetClass: TARGET_SELF,
    lore: 30,
    description(){
        return mapManager.idManager.describePotion(this);
    },
    bump(obstruction){
        this.use(obstruction);
    }
});


//== Specific Mappable Items ===================================================

modelLibrary.registerModel('item', Object.extend(potion, {
    generationId: 'weak health potion',
    generationWeight: 2,
    potency: 10,
    lore: 15,
    name: 'WkHealth Pot',
    effect: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're healed!");
            }
            user.adjustHp(
                Math.max(this.potency/2, gaussRandom(this.potency,1))
            );
        }
        potion.effect.apply(this, arguments);
    },
    // Description:
    viewText: 'You see a weak health potion. Drinking this potion will restore a small amount of health.'
}));
modelLibrary.registerModel('item', Object.extend(
    modelLibrary.getModel('item', 'weak health potion'), {
    generationId: 'health potion',
    generationWeight: 5,
    potency: 30,
    lore: 20,
    name: 'Health Pot',
    // Description:
    viewText: 'You see a health potion. Drinking this potion will restore a moderate amount of health.'
}));
modelLibrary.registerModel('item', Object.extend(
    modelLibrary.getModel('item', 'weak health potion'), {
    generationId: 'strong health potion',
    generationWeight: 9,
    potency: 80,
    lore: 40,
    name: 'StrHealth Pot',
    // Description:
    viewText: 'You see a strong health potion. Drinking this potion will restore a large amount of health.'
}));
modelLibrary.registerModel('item', Object.extend(potion, {
    generationId: 'acid potion',
    generationWeight: 3,
    potency: 10,
    lore: 15,
    name: 'Acid Potion',
    effect: function(user, targetData){
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
    },
    // Description:
    viewText: 'You see an acid potion. Most organic materials will corrode when covered in this liquid.'
}));
modelLibrary.registerModel('item', Object.extend(potion, {
    generationId: 'cowardice potion',
    generationWeight: 4,
    potency: 40,
    lore: 45,
    name: 'Cowardice Pot',
    effect: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're terrified!");
            }
            if(user.adjustMoral){
                user.adjustMoral(
                    -Math.max(this.potency/2, gaussRandom(this.potency,1))
                );
            }
        }
        potion.effect.apply(this, arguments);
    },
    // Description:
    viewText: 'You see a cowardice potion. Drinking this potion will lower your moral.'
}));
modelLibrary.registerModel('item', Object.extend(potion, {
    generationId: 'courage potion',
    generationWeight: 5,
    potency: 100,
    lore: 45,
    name: 'Courage Pot',
    effect: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're feel couragous!");
            }
            if(user.adjustMoral){
                user.adjustMoral(
                    Math.max(this.potency/2, gaussRandom(this.potency,1))
                );
            }
        }
        potion.effect.apply(this, arguments);
    },
    // Description:
    viewText: 'You see a courage potion. Drinking this potion will raise your moral.'
}));
modelLibrary.registerModel('item', Object.extend(wand, {// Test Wand
    // Id:
    generationId: 'fire wand',
    generationWeight: 4,
    lore: 20,
    name: 'Wand of Fire',
    // Description:
    viewText: 'You see a wand of fire. This magical item can shoot fireballs at your enemies.'
}));
/*
modelLibrary.registerModel('item', Object.extend(wand, {// Test Wand
    // Id:
    lore: 30,
    name: 'Wand of Haste',
    generationWeight: 4
}));*/

modelLibrary.registerModel('item', Object.extend(scroll, {
    generationId: 'fire scroll',
    generationWeight: 2,
    name: 'FireScroll',
    lore: 18,
    effect: function(user, targetData){
        // Attempt to find the target, by ID within view.
        var targetId = targetData.target.id;
        var testTarget = mapManager.idManager.get(targetId);
        if(!testTarget){
            user.inform('That is no longer there.');
        } else if(!user.checkView(testTarget)){
            user.inform('The '+testTarget.name+' is not in view.');
        } else{
            user.inform('A fireball envelopes '+testTarget.name+'!');
            testTarget.hurt(15+user.level, DAMAGE_FIRE, user);
        }
        scroll.effect.apply(this, arguments);
        // TODO: Other kinds of checks.
        
    },
    // Description:
    viewText: 'You see a fire scroll. This magical item can summon a blast of fire to envelope your enemy.'
}));
modelLibrary.registerModel('item', Object.extend(weapon, { // Rock
    // Id:
    generationId: 'rock',
    generationWeight: 1,
    // Display:
    name: 'Rock',
    character: '*',
    //color: '#444',
    // Stats:
    weight: 1,
    baseDamage: 1,
    damageSigma: 1/3,
    // Behavior:
    throwable: true,
    stackable: true,
    // Description:
    viewText: "You see a heavy rock, a weapon of last resort. Many goblins have lived another day thanks to a well thrown rock."
}));
modelLibrary.registerModel('item', Object.extend(weapon, { // Club
    // Id:
    generationId: 'club',
    generationWeight: 2,
    // Display:
    name: 'Club',
    character: '|',
    // Stats:
    weight: 2,
    baseDamage: 2,
    damageSigma: 1/3,
    // Behavior:
    // Description:
    viewText: 'You see a wooden club. This is a crude weapon, but effective.'
}));
modelLibrary.registerModel('item', Object.extend(weapon, { // Cleaver
    // Id:
    generationId: 'cleaver',
    generationWeight: 4,
    // Display:
    name: 'Cleaver',
    character: '|',
    // Stats:
    weight: 2,
    baseDamage: 4,
    damageSigma: 1,
    // Behavior:
    // Description:
    viewText: 'You see a cleaver. This hacking weapon is much more effective in the hands of a goblin than when wielded by a dwarf.'
}));
modelLibrary.registerModel('item', Object.extend(weapon, { // Spear
    // Id:
    generationId: 'spear',
    generationWeight: 5,
    // Display:
    name: 'Spear',
    character: '/',
    // Stats:
    weight: 5,
    baseDamage: 7,
    damageSigma: 1,
    // Behavior:
    twoHanded: true,
    throwable: true,
    // Description:
    viewText: 'You see a spear, a favorite weapon of goblin when hunting. It is equally effected when thrown.'
}));
modelLibrary.registerModel('item', Object.extend(weapon, { // Sword
    // Id:
    generationId: 'sword',
    generationWeight: 7,
    // Display:
    name: 'Sword',
    character: '|',
    // Stats:
    weight: 3,
    baseDamage: 7,
    damageSigma: 2,
    // Behavior:
    // Description:
    viewText: 'You see a sword. Goblins are less familiar than humans with this weapon, but no less deadly.'
}));
modelLibrary.registerModel('item', Object.extend(weapon, { // Hand Axe
    // Id:
    generationId: 'hand axe',
    generationWeight: 8,
    // Display:
    name: 'Hand Axe',
    character: '|',
    // Stats:
    weight: 6,
    baseDamage: 10,
    damageSigma: 2,
    // Behavior:
    // Description:
    viewText: 'You see a dwarven hand axe - heavier than a sword, but alse more savage.'
}));
modelLibrary.registerModel('item', Object.extend(weapon, { // Hammer
    // Id:
    generationId: 'hammer',
    generationWeight: 9,
    // Display:
    name: 'Hammer',
    character: '/',
    // Stats:
    weight: 8,
    baseDamage: 15,
    damageSigma: 1,
    // Behavior:
    twoHanded: true,
    // Description:
    viewText: 'You see a dwarven hammer. This finely crafted stone weapon is what dwarven warcraft is all about. You doubt you could weild it.'
}));
modelLibrary.registerModel('specials', Object.extend(bow, { // Short Bow
    // Id:
    generationId: 'short bow',
    generationWeight: 2,
    // Display:
    name: 'ShortBow',
    // Stats:
    weight: 2,
    range: 5,
    damageScale: 1,
    ammoType: 'arrow',
    // Behavior:
    // Description:
    viewText: 'You see a short bow. Most goblin carry a short bow to hunt and defend themselves in the wilderness.'
}));
modelLibrary.registerModel('item', Object.extend(bow, { // Crossbow
    // Id:
    generationId: 'crossbow',
    generationWeight: 4,
    // Display:
    name: 'Crossbow',
    // Stats:
    weight: 5,
    range: 5,
    damageScale: 2,
    ammoType: 'arrow',
    // Behavior:
    // Description:
    viewText: "You see a dwarven crossbow. It's heavy, and looks more complicated than it needs to be."
}));
modelLibrary.registerModel('item', Object.extend(bow, { // Short Bow
    // Id:
    generationId: 'long bow',
    generationWeight: 6,
    // Display:
    name: 'LongBow',
    // Stats:
    weight: 2,
    range: 10,
    damageScale: 2,
    ammoType: 'arrow',
    // Behavior:
    // Description:
    viewText: 'You see a long bow.'
}));
modelLibrary.registerModel('item', Object.extend(projectile, { // arrow
    // Id:
    generationId: 'arrow1',
    generationWeight: 200,
            // Do not generate alone.
    // Display:
    name: 'Arrow',
    character: '\\',
    // Stats:
    weight: 1/4,
    baseDamage: 2,
    damageSigma: 0,
    stackCount: 1,
    // Behavior:
    ammoType : 'arrow', writable:true,
    placement: EQUIP_OFFHAND, writable:true,
    stackable: true,
    ephemeral: false,
    // Description:
    viewText: 'You see an arrow.'
}));
modelLibrary.registerModel('item', Object.extend(
    modelLibrary.getModel('item', 'arrow1'),
    {
        generationId: 'arrow5',
        generationWeight: 4,
        stackCount: 5
    }
));
modelLibrary.registerModel('item', Object.extend(
    modelLibrary.getModel('item', 'arrow1'),
    {
        generationId: 'arrow10',
        generationWeight: 6,
        stackCount: 10
    }
));
modelLibrary.registerModel('item', Object.extend(projectile, { // arrow
    // Id:
    generationId: 'arrowBarbed1',
    generationWeight: 300,
            // Do not generate alone!
    // Display:
    name: 'BarbedArrow',
    character: '\\',
    // Stats:
    weight: 1/2,
    baseDamage: 4,
    damageSigma: 0,
    stackCount: 1,
    // Behavior:
    ammoType : 'arrow', writable:true,
    placement: EQUIP_OFFHAND, writable:true,
    stackable: true,
    ephemeral: false,
    // Description:
    viewText: 'You see an arrow. Its tip is covered in vicious hooks.'
}));
modelLibrary.registerModel('item', Object.extend(
    modelLibrary.getModel('item', 'arrowBarbed1'),
    {
        generationId: 'arrowBarbed5',
        generationWeight: 7,
        stackCount: 5
    }
));
modelLibrary.registerModel('item', Object.extend(
    modelLibrary.getModel('item', 'arrowBarbed1'),
    {
        generationId: 'arrowBarbed10',
        generationWeight: 10,
        stackCount: 10
    }
));


//== Armor =====================================================================

modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'leather shield',
    generationWeight: 2,
    character: '(',
    name: 'LeatherShield',
    placement: EQUIP_OFFHAND,
    evade: 1/10,
    weight: 1,
    // Description:
    viewText: 'You see a leather shield.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'leather armor',
    generationWeight: 3,
    character: ']',
    name: 'LeatherArmor',
    placement: EQUIP_BODY,
    defense: 1,
    weight: 2,
    // Description:
    viewText: 'You see leather body armor. It was made by dwarves, but you could probably wear it.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'leather cap',
    generationWeight: 2,
    character: '^',
    name: 'LeatherCap',
    placement: EQUIP_HEAD,
    defense: 1/2,
    weight: 1/2,
    // Description:
    viewText: 'You see a leather cap.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'chain cowl',
    generationWeight: 4,
    character: '^',
    name: 'ChainCowl',
    placement: EQUIP_HEAD,
    defense: 1,
    weight: 2,
    // Description:
    viewText: 'You see a chainmail cowl. It\'s rusty, but well made.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'wood shield',
    generationWeight: 4,
    character: '(',
    name: 'WoodShield',
    placement: EQUIP_OFFHAND,
    evade: 1/8,
    weight: 2,
    // Description:
    viewText: 'You see a tough wooden shield, like those favored by goblin everywhere.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'chainmail armor',
    generationWeight: 5,
    character: ']',
    name: 'ChainArmor',
    placement: EQUIP_BODY,
    defense: 2,
    weight: 4,
    // Description:
    viewText: 'You see chainmail body armor. It\'s rusty, but well made.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'dwarven helmet',
    generationWeight: 6,
    character: '^',
    name: 'DwarfHelmet',
    placement: EQUIP_HEAD,
    defense: 2,
    weight: 3,
    // Description:
    viewText: 'You see a Dwarven Helmet. The thick plates of metal make you feel very safe.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'dwarven shield',
    generationWeight: 7,
    character: '(',
    name: 'DwarfShield',
    placement: EQUIP_OFFHAND,
    evade: 1/6,
    weight: 4,
    // Description:
    viewText: 'You see a Dwarven Shield. The thick plates of metal make you feel very safe.'
}));
modelLibrary.registerModel('item', Object.extend(item, {
    generationId: 'dwarven armor',
    generationWeight: 9,
    character: ']',
    name: 'DwarfArmor',
    placement: EQUIP_BODY,
    defense: 4,
    weight: 6,
    // Description:
    viewText: 'You see Dwarven Armor. The thick plates of metal make you feel very safe.'
}));


/*==============================================================================

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