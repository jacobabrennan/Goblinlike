

/*===========================================================================

    This object is a prototype for creating items for the player to obtain and
    use.
    
    This is a prototype, and should not be used without first creating an
    instance.

==============================================================================*/

var item = Object.create(movable, {
    // Redefined Properties
    character: {value: '~', writable: true},
    color: {value: '#963', writable: true},
    type: {value: TYPE_ITEM, writable: true},
    dense: {value: false, writable: true},
    // New Properties
    targetClass: {value: TARGET_SELF, writable: true},
    targetRange: {value: RANGE_VIEW, writable: true},
    stackable: {value: false, writable: true},
    stackCount: {value: 1, writable: true},
    consumable: {value: false, writable: true},
    loreLevel: {value: 0, writable: true},
    weight: {value: 1, writable: true},
    effect: {value: function (user, targetData){}},
    use: {value: function(user, targetData){
        /**
            Structure of targetData:
            {
                target: uniqueId, // as per mapManager.idManager.assignId
                targets: [
                    uniqueId, // as per mapManager.idManager.assignId
                    ...
                ],
                direction: CONSTANT // Such as NORTHEAST, etc.
            }
         **/
        if(this.effect){
            this.effect(user, targetData);
        }
        if(this.consumable){
            this.consume(user);
        }
    }, writable: true},
    pack: {value: function (){
        /**
            This function creates a "sensory package" of the object for use by a
            client, possibly over the network. This allows a client to know
            enough about an object to make decisions without having a hard
            reference to it.
            
            This is a child function of containable.pack, and must call its
            parent in order to function properly.
            
            It returns a package representing the object. See containable.pack
            for basic structure. It adds the following to the returned package:
            {
                ... // Existing parent package.
                type: 'item',
                targetClass: CONSTANT,
                targetRange: CONSTANT
            }
         **/
        var sensoryData = containable.pack.apply(this, arguments);
        sensoryData.type = this.type;
        sensoryData.targetClass = this.targetClass;
        sensoryData.targetRange = this.targetRange;
        if(this.stackable && (this.stackCount > 1)){
            sensoryData.name = this.description()+'*'+this.stackCount;
        }
        return sensoryData;
    }, writable: true},
    description: {value: function (){
        return this.name;
    }},
    unstack: {value: function (){
        if(!(this.stackable && this.stackCount > 1)){
            return null;
        }
        var clone1 = this.constructor.call(Object.create(this));
        clone1.unplace();
        clone1.stackCount = 1;
        this.stackCount--;
        return clone1;
    }, writable: true},
    stack: {value: function (newItem){
        if(!(this.stackable && newItem.name == this.name)){
            return;
        }
        this.stackCount += newItem.stackCount;
        newItem.dispose();
    }, writable: true},
    getWeight: {value: function (){
        return this.stackCount * this.weight;
    }, writable: true},
    consume: {value: function (user){
        if(this.stackCount > 1){
            this.stackCount--;
        } else{
            if(user.inventory && user.inventory.indexOf(this) != -1){
                user.update('inventory');
                user.inventoryRemove(this);
            }
            this.dispose();
        }
    }}
});