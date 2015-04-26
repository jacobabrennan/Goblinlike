var trapLibrary = (function (){ // Open new namespace for trap library.
//==============================================================================
var library = {
    traps: {},
    registerTrap: function (newPrototype){
        var prototypeName = newPrototype.name;
        if(!prototypeName || this.traps[prototypeName]){
            console.log('Problem: Non-unique name for trap prototype '+prototypeName);
        }
        this.traps[prototypeName] = newPrototype;
    },
    getTrap: function (trapName){
        var trapPrototype = this.traps[trapName];
        return trapPrototype;
    }/*,
    getEnemyByWeight: function (weight){
        weight = Math.round(weight);
        var enemyId;
        switch (weight){
            case  1: enemyId = 'Red Beetle'; break;
            case  2: enemyId = 'Worm'; break;
            case  3: enemyId = 'Tarantula'; break;
        }
        var enemyPrototype = this.getEnemy(enemyId);
        return enemyPrototype;
    }*/
};
library.registerTrap(Object.create(trap, {
    name: {value: 'acid trap'},
    background: {value: '#690'},
    character: {value: null},
    hidden: {value: false, writable: true},
    faction: {value: FACTION_ENEMY},
    constructor: {value: function (){
        var self = this;
        gameManager.registerEvent(function (){
            self.dispose();
        }, gaussRandom(20,2));
        return trap.constructor.apply(this, arguments);
    }},
    trigger: {value: function (content){
        if(content.type != TYPE_ACTOR){ return;}
        if(content.faction & this.faction){ return;}
        content.hear('acid', 10, null, "You're splashed with acid!");
        content.hurt(5, DAMAGE_ACID);
        this.dispose();
    }, writable: true},
    // Description
    viewText: {value: "You see a puddle of acid. Hot vapors rise from the surface and sting your eyes."}
}));
//==============================================================================
    return library; // Return library, close namespace.
})();