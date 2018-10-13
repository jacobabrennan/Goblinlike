

/*===========================================================================

    This object is a prototype for creating items for the player to obtain and
    use.
    
    This is a prototype, and should not be used without first creating an
    instance.

==============================================================================*/

//-- Dependencies --------------------------------
import {Movable, Containable} from './mappables.js';

//-- Implementation ------------------------------
class Item extends Movable {
    // Redefined Methods
    toJSON() {
        let result = Movable.prototype.toJSON.apply(this, arguments);
        result.generationId = this.generationId;
        if(this.stackable){
            result.stackCount = this.stackCount;
        }
        return result;
    }
    fromJSON(data){
        Movable.prototype.fromJSON.apply(this, arguments);
        this.generationId = data.generationId;
        if(data.stackCount){ this.stackCount = data.stackCount;}
    }
    // New Methods
    effect(user, targetData){}
    use(user, targetData){
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
    }
    pack(){
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
        var sensoryData = Containable.prototype.pack.apply(this, arguments);
        sensoryData.type = this.type;
        sensoryData.targetClass = this.targetClass;
        sensoryData.targetRange = this.targetRange;
        if(this.stackable && (this.stackCount > 1)){
            sensoryData.name = this.description()+'*'+this.stackCount;
        }
        return sensoryData;
    }
    description(){
        return this.name;
    }
    unstack(){
        if(!(this.stackable && this.stackCount > 1)){
            return null;
        }
        var clone1 = this.initializer.call(Object.create(this));
        clone1.unplace();
        clone1.stackCount = 1;
        this.stackCount--;
        return clone1;
    }
    stack(newItem){
        if(!(this.stackable && newItem.name == this.name)){
            return;
        }
        this.stackCount += newItem.stackCount;
        newItem.dispose();
    }
    getWeight(){
        return this.stackCount * this.weight;
    }
    consume(user){
        if(this.stackCount > 1){
            this.stackCount--;
        } else{
            if(user.inventory && user.inventory.indexOf(this) != -1){
                user.update('inventory');
                user.inventoryRemove(this);
            }
            this.dispose();
        }
    }
}
// Redefined Properties
Item.prototype.character = '~';
Item.prototype.color = '#963';
Item.prototype.type = TYPE_ITEM;
Item.prototype.dense = false;
// New Properties
Item.prototype.generationId = undefined;
Item.prototype.generationWeight = 1;
Item.prototype.targetClass = TARGET_SELF;
Item.prototype.targetRange = RANGE_VIEW;
Item.prototype.stackable = false;
Item.prototype.stackCount = 1;
Item.prototype.consumable = false;
Item.prototype.loreLevel = 0;
Item.prototype.weight = 1;
Item.prototype.effectFlags = 0;

//-- Export --------------------------------------
export default Item;
