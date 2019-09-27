

//== Items =====================================================================

//-- Dependencies --------------------------------
import * as mathExtension from '../shared/math.js';
import Item from './item.js';
import modelLibrary from './model_library.js';
import {
    Weapon,
    Bow,
    Projectile
} from './extension_combat.js';
import Actor from './actor.js';
import mapManager from './map_manager.js';
import gameManager from './game_manager.js';


//== Base Prototypes (wands, rings, etc.) ======================================

class Wand extends Item {
    // Redefined Methods
    description() {
        return mapManager.idManager.describeWand(this);
    }
    toJSON() {
        let result = super.toJSON(...arguments);
        result.charges = this.charges;
        return result;
    }
    fromJSON(data) {
        let config = super.fromJSON(...arguments);
        this.charges = data.charges;
        return config;
    }
    // New Methods
    effect(user, targetData) {
        if(!targetData.direction){
            user.inform('You failed to use the '+this.description()+' properly.');
            return;
        }
        this.shoot(user, targetData.direction);
    }
    shoot(attacker, direction, forceTarget) {
        if(this.charges <= 0){
            attacker.inform('The wand is out of charges!');
            return 0;
        }
        this.charges--;
        if(attacker.equipment[this.placement] == this){
            attacker.update('equipment');
        } else{
            attacker.update('inventory');
        }
        var deltaLore = gameManager.currentGame.hero.lore() - this.lore;
        var loreAttempt = deltaLore;/*mathExtension.gaussRandom(
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
        var theProj = new this.projectileType();
        theProj.initializer();
        damageDone = theProj.project(direction, projectileOptions);
        // TODO: Return actual damage done.
        if(damageDone){
            return damageDone;
        } else{
            return 0;
        }
    }
}
// Redefined Properties
Wand.prototype.character = '-';
Wand.prototype.placement = EQUIP_MAINHAND;
Wand.prototype.targetClass = TARGET_DIRECTION;
Wand.prototype.lore = 10;
// New Properties
Wand.prototype.charges = 5;
Wand.prototype.range = 15;
Wand.prototype.projectileType = undefined;

class Scroll extends Item {
    description() {
        return mapManager.idManager.describeScroll(this);
    }
    use(user, targetData) {
        var deltaLore = gameManager.currentGame.hero.lore() - this.lore;
        var loreAttempt = deltaLore;/*mathExtension.gaussRandom(
            deltaLore,
            10-gameManager.currentGame.hero.wisdom
        );*/
        if(loreAttempt < 0){
            user.inform('You do not know how to use the '+this.description()+'.');
            //this.consume(user);
            //user.update('inventory');
        } else{
            super.use(...arguments);
        }
    }
}
// Redefined Properties
Scroll.prototype.character = '$';
Scroll.prototype.stackable = true;
Scroll.prototype.consumable = true;
Scroll.prototype.targetClass = TARGET_ANYONE;
Scroll.prototype.lore = 20;

class Potion extends Item {
    description(){
        return mapManager.idManager.describePotion(this);
    }
    bump(obstruction){
        this.use(obstruction);
    }
}
// Redefined Properties
Potion.prototype.character = '¡';
Potion.prototype.stackable = true;
Potion.prototype.consumable = true;
Potion.prototype.targetClass = TARGET_SELF;
Potion.prototype.lore = 30;

class Arrow extends Projectile {};
// Display:
Arrow.prototype.name = 'Arrow';
Arrow.prototype.character = '\\';
// Stats:
Arrow.prototype.weight = 1/4;
Arrow.prototype.baseDamage = 2;
Arrow.prototype.damageSigma = 0;
Arrow.prototype.stackCount = 1;
// Behavior:
Arrow.prototype.ammoType  = 'arrow';
Arrow.prototype.placement = EQUIP_OFFHAND;
Arrow.prototype.stackable = true;
Arrow.prototype.ephemeral = false;
// Description:
Arrow.prototype.viewText = 'You see an arrow.';


//== Un-data-reduced item types ================================================

modelLibrary.registerModel('special', (() => {// Ice Block
    class IceBlock extends Actor {
        constructor() {
            super(...arguments);
            this.lifeSpan = mathExtension.gaussRandom(20, 1);
        }
        place() {
            this.initializer();
            gameManager.registerActor(this);
            this.dense = false;
            let result = super.place(...arguments);
            this.dense = true;
            return result;
        }
        takeTurn(callback) {
            this.lifeSpan--;
            if(this.trapped){
                if(this.trapped.dead){ this.trapped = null;}
                else{ this.trapped.nextTurn += this.turnDelay;}
            }
            if(!this.trapped){
                this.color = '#0ff';
                this.character = '#';
            }
            if(this.lifeSpan <= 0){
                this.dispose();
                callback(false);
            } else{
                super.takeTurn(...arguments);
            }
        }
        trap(target) {
            this.trapped = target;
            this.trapped.nextTurn += this.turnDelay;
            this.color = target.color;
            this.character = target.character;
        }
    }
    IceBlock.prototype.generationId = 'iceBlock';
    IceBlock.prototype.faction = ~0;
    IceBlock.prototype.dense = true;
    IceBlock.prototype.character = '#';
    IceBlock.prototype.color = '#0ff';
    IceBlock.prototype.background = '#00f';
    IceBlock.prototype.name = 'ice block';
    IceBlock.prototype.viewText = 'You see a large block of ice.'
    return IceBlock;
})());

class FireProjectile extends Projectile {
    attack(attacker, target) {
        this.baseDamage = attacker.wisdom+attacker.level;
        attacker.hear(null, 10, target, 'A fireball engulfs the '+target.name+'!');
        return super.attack(...arguments);
    }
}
FireProjectile.prototype.damageType = DAMAGE_FIRE;
FireProjectile.prototype.damageSigma = 0;
FireProjectile.prototype.baseDamage = 3;

class IceProjectile extends Projectile {
    attack(attacker, target) {
        attacker.hear(null, 10, target, 'Ice engulfs the '+target.name+'!');
        let ice = modelLibrary.getModel('special', 'iceBlock');
        ice = new ice();
        ice.place(target.x, target.y, target.levelId);
        ice.trap(target);
    }
    move() {
        let success = super.move(...arguments);
        if(!success){ return success;}
        let ice = modelLibrary.getModel('special', 'iceBlock');
        ice = new ice();
        ice.place(this.x, this.y, this.levelId);
        return success;
    }
}
IceProjectile.prototype.damageType = DAMAGE_ICE;
IceProjectile.prototype.damageSigma = 0;
IceProjectile.prototype.baseDamage = 0;

class HealProjectile extends Projectile {
    attack(attacker, target) {
        if(target.creatureType & CREATURE_UNDEAD){
            attacker.hear(null, 10, target, `${target.name} resists the effects!`);
            return;
        }
        attacker.hear(null, 10, target, `${target.name} is healed!`);
        return target.adjustHp(30);
    }
}


//== Specific Mappable Items ===================================================

let itemArchetypes = {
    item: Item,
    weapon: Weapon,
    bow: Bow,
    projectile: Projectile,
    potion: Potion,
    wand: Wand,
    scroll: Scroll,
    arrow: Arrow
}
const effects = {
    healthPotion: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're healed!");
            }
            user.adjustHp(
                Math.max(this.potency/2, mathExtension.gaussRandom(this.potency,1))
            );
        }
    },
    acidPotion: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. It's Acid!");
            }
            user.hurt(
                Math.max(this.potency/2, mathExtension.gaussRandom(this.potency,1)),
                DAMAGE_ACID
            );
        }
    },
    cowardicePotion: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're terrified!");
            }
            if(user.adjustMoral){
                user.adjustMoral(
                    -Math.max(this.potency/2, mathExtension.gaussRandom(this.potency,1))
                );
            }
        }
    },
    couragePotion: function(user, targetData){
        if(user.type == TYPE_ACTOR){
            if(user.inform){
                user.inform("You quaff the potion. You're feel couragous!");
            }
            if(user.adjustMoral){
                user.adjustMoral(
                    Math.max(this.potency/2, mathExtension.gaussRandom(this.potency,1))
                );
            }
        }
    },
    scrollFire: function(user, targetData){
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
    },
};
let itemModels = [

    //-- Potions -------------------------------------
    {// weak health potion
        modelType: 'potion',
        generationId: 'weak health potion',
        generationWeight: 2,
        potency: 10,
        lore: 15,
        name: 'WkHealth Pot',
        effectId: 'healthPotion',
        // Description:
        viewText: 'You see a weak health potion. Drinking this potion will restore a small amount of health.'
    },
    {// health potion
        modelType: 'potion',
        generationId: 'health potion',
        generationWeight: 5,
        potency: 30,
        lore: 20,
        name: 'Health Pot',
        effectId: 'healthPotion',
        // Description:
        viewText: 'You see a health potion. Drinking this potion will restore a moderate amount of health.'
    },
    {// strong health potion
        modelType: 'potion',
        generationId: 'strong health potion',
        generationWeight: 9,
        potency: 80,
        lore: 40,
        name: 'StrHealth Pot',
        effectId: 'healthPotion',
        // Description:
        viewText: 'You see a strong health potion. Drinking this potion will restore a large amount of health.'
    },
    {// acid potion
        modelType: 'potion',
        generationId: 'acid potion',
        generationWeight: 3,
        potency: 10,
        lore: 15,
        name: 'Acid Potion',
        effectId: 'acidPotion',
        // Description:
        viewText: 'You see an acid potion. Most organic materials will corrode when covered in this liquid.'
    },
    /*{// cowardice potion
        modelType: 'potion',
        generationId: 'cowardice potion',
        generationWeight: 4,
        potency: 40,
        lore: 45,
        name: 'Cowardice Pot',
        effectId: 'cowardicePotion',
        // Description:
        viewText: 'You see a cowardice potion. Drinking this potion will lower your moral.'
    },*/
    {// courage potion
        modelType: 'potion',
        generationId: 'courage potion',
        generationWeight: 5,
        potency: 100,
        lore: 45,
        name: 'Courage Pot',
        effectId: 'couragePotion',
        // Description:
        viewText: 'You see a courage potion. Drinking this potion will raise your moral.'
    },

    //-- Wands ---------------------------------------
    {// fire wand
        modelType: 'wand',
        // Id:
        generationId: 'fire wand',
        generationWeight: 4,
        lore: 20,
        name: 'Wand of Fire',
        projectileType: FireProjectile,
        // Description:
        viewText: 'You see a wand of fire. This magical item can shoot fireballs at your enemies.'
    },
    {// ice wand
        modelType: 'wand',
        // Id:
        generationId: 'ice wand',
        generationWeight: 5,
        lore: 30,
        charges: 2,
        name: 'Wand of Ice',
        projectileType: IceProjectile,
        // Description:
        viewText: 'You see a wand of ice. This magical item creates a wall of ice to freeze your enemies.'
    },
    {// heal wand
        modelType: 'wand',
        // Id:
        generationId: 'heal wand',
        generationWeight: 4,
        lore: 25,
        charges: 3,
        name: 'Wand of Healing',
        projectileType: HealProjectile,
        // Description:
        viewText: `You see a wand of Healing. This magical item will heal your companions' wounds.`
    },
    /*
    {// Test Wand
        // Id:
        lore: 30,
        name: 'Wand of Haste',
        generationWeight: 4
    },*/

    //-- Scrolls -------------------------------------
    /*{// fire scroll
        modelType: 'scroll',
        generationId: 'fire scroll',
        generationWeight: 2,
        name: 'FireScroll',
        lore: 18,
        effectId: 'scrollFire',
        // Description:
        viewText: 'You see a fire scroll. This magical item can summon a blast of fire to envelope your enemy.'
    },*/

    //-- Weapons -------------------------------------
    { // Rock
        modelType: 'weapon',
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
    },
    { // Club
        modelType: 'weapon',
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
    },
    { // Cleaver
        modelType: 'weapon',
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
    },
    { // Spear
        modelType: 'weapon',
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
    },
    { // Sword
        modelType: 'weapon',
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
    },
    { // Hand Axe
        modelType: 'weapon',
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
    },
    { // Hammer
        modelType: 'weapon',
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
    },
    
    //-- Bows & Arrows -------------------------------
    { // Short Bow
        modelType: 'bow',
        // Id:
        generationId: 'short bow',
        generationWeight: 200, // Don't generate alone!
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
    },
    { // Crossbow
        modelType: 'bow',
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
    },
    { // Short Bow
        modelType: 'bow',
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
    },
    { // arrow
        modelType: 'arrow',
        // Id:
        generationId: 'arrow1',
        generationWeight: 200 // Don't generate alone!
    },
    { // arrow5
        modelType: 'arrow',
        generationId: 'arrow5',
        generationWeight: 4,
        stackCount: 5
    },
    { // arrow10
        modelType: 'arrow',
        generationId: 'arrow10',
        generationWeight: 6,
        stackCount: 10
    },
    { // arrowBarbed
        modelType: 'arrow',
        // Id:
        generationId: 'arrowBarbed1',
        generationWeight: 300, // Do not generate alone!
        // Display:
        name: 'BarbedArrow',
        // Stats:
        weight: 1/2,
        baseDamage: 4,
        // Description:
        viewText: 'You see an arrow. Its tip is covered in vicious hooks.'
    },
    { // arrowBarbed5
        modelType: 'arrow',
        // Id:
        generationId: 'arrowBarbed5',
        generationWeight: 7,
        stackCount: 5,
        // Display:
        name: 'BarbedArrow',
        // Stats:
        weight: 1/2,
        baseDamage: 4,
        // Description:
        viewText: 'You see an arrow. Its tip is covered in vicious hooks.'
    },
    { // arrowBarbed10
        modelType: 'arrow',
        // Id:
        generationId: 'arrowBarbed10',
        generationWeight: 10,
        stackCount: 10,
        // Display:
        name: 'BarbedArrow',
        // Stats:
        weight: 1/2,
        baseDamage: 4,
        // Description:
        viewText: 'You see an arrow. Its tip is covered in vicious hooks.'
    },

    //-- Armor ---------------------------------------
    {// leather shield
        generationId: 'leather shield',
        generationWeight: 2,
        character: '(',
        name: 'LeatherShield',
        placement: EQUIP_OFFHAND,
        evade: 1/10,
        weight: 1,
        // Description:
        viewText: 'You see a leather shield.'
    },
    {// leather armor
        generationId: 'leather armor',
        generationWeight: 3,
        character: ']',
        name: 'LeatherArmor',
        placement: EQUIP_BODY,
        defense: 1,
        weight: 2,
        // Description:
        viewText: 'You see leather body armor. It was made by dwarves, but you could probably wear it.'
    },
    {// leather cap
        generationId: 'leather cap',
        generationWeight: 2,
        character: '^',
        name: 'LeatherCap',
        placement: EQUIP_HEAD,
        defense: 1/2,
        weight: 1/2,
        // Description:
        viewText: 'You see a leather cap.'
    },
    {// chain cowl
        generationId: 'chain cowl',
        generationWeight: 4,
        character: '^',
        name: 'ChainCowl',
        placement: EQUIP_HEAD,
        defense: 1,
        weight: 2,
        // Description:
        viewText: 'You see a chainmail cowl. It\'s rusty, but well made.'
    },
    {// wood shield
        generationId: 'wood shield',
        generationWeight: 4,
        character: '(',
        name: 'WoodShield',
        placement: EQUIP_OFFHAND,
        evade: 1/8,
        weight: 2,
        // Description:
        viewText: 'You see a tough wooden shield, like those favored by goblin everywhere.'
    },
    {// chainmail armor
        generationId: 'chainmail armor',
        generationWeight: 5,
        character: ']',
        name: 'ChainArmor',
        placement: EQUIP_BODY,
        defense: 2,
        weight: 4,
        // Description:
        viewText: 'You see chainmail body armor. It\'s rusty, but well made.'
    },
    {// dwarven helmet
        generationId: 'dwarven helmet',
        generationWeight: 6,
        character: '^',
        name: 'DwarfHelmet',
        placement: EQUIP_HEAD,
        defense: 2,
        weight: 3,
        // Description:
        viewText: 'You see a Dwarven Helmet. The thick plates of metal make you feel very safe.'
    },
    {// dwarven shield
        generationId: 'dwarven shield',
        generationWeight: 7,
        character: '(',
        name: 'DwarfShield',
        placement: EQUIP_OFFHAND,
        evade: 1/6,
        weight: 4,
        // Description:
        viewText: 'You see a Dwarven Shield. The thick plates of metal make you feel very safe.'
    },
    {// dwarven armor
        generationId: 'dwarven armor',
        generationWeight: 9,
        character: ']',
        name: 'DwarfArmor',
        placement: EQUIP_BODY,
        defense: 4,
        weight: 6,
        // Description:
        viewText: 'You see Dwarven Armor. The thick plates of metal make you feel very safe.'
    }
];

//-- Load Data into Model Library ----------------
itemModels.forEach(itemModel => {
    let parentModel = Item;
    if(itemModel.modelType){
        parentModel = itemArchetypes[itemModel.modelType];
    }
    if(!parentModel){
        throw `No parentModel for ${itemModel.generationId}: ${itemModel.modelType}`
    }
    let itemClass = class extends parentModel {};
    Object.keys(itemModel).forEach(key => {
        switch(key){
            case 'modelType': break;
            case 'effectId':
                itemClass.prototype.effect = effects[itemModel[key]];
                if(itemClass.prototype.effect === undefined){
                    throw `Error assigning effect to item: ${itemModel.generationId}`;
                }
                break;
            default:
                itemClass.prototype[key] = itemModel[key];
        }
    })
    modelLibrary.registerModel('item', itemClass);
});


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