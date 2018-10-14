
    
// === Equipment System ========================================================

//-- Dependencies --------------------------------
import Person from './person.js';
import Hero from './hero.js';
import Item from './item.js';
import mapManager from './map_manager.js';


//== Extend Item ===============================================================

//-- New Properties ------------------------------
Item.prototype.placement = undefined;

//-- Redefined Methods ---------------------------
Item.prototype.pack = (function (parentFunction){
    return function (){
        /**
            This function creates a "sensory package" of the object for use
            by a client, possibly over the network. This allows a client to
            know enough about an object to make decisions without having a
            hard reference to it.
            
            This is a child function of containable.pack, and must call its
            parent in order to function properly.
            
            It returns a package representing the object. See item.pack for
            basic structure. It adds the following to the returned package:
            {
                ... // Existing parent package.
                placement: CONSTANT,
            }
            **/
        var sensoryData = parentFunction.apply(this, arguments);
        sensoryData.placement = this.placement;
        return sensoryData;
    };
})(Item.prototype.pack);
    

//== Extend Person =============================================================

//-- New Properties ------------------------------
Person.prototype.equipment = undefined;

//-- Redefined Methods ---------------------------
Person.prototype.initializer = (function (parentFunction){
    return function (){
        this.equipment = {};
        this.update('equipment');
        parentFunction.apply(this, arguments);
        return this;
    };
})(Person.prototype.initializer);
Person.prototype.toJSON = (function (parentFunction){
    return function (){
        let result = parentFunction.apply(this, arguments);
        result.equipment = Object.keys(this.equipment).map(position => {
            let testItem = this.equipment[position];
            if(!testItem){ return null;}
            return testItem.id;
        });
        return result;
    }
})(Person.prototype.toJSON);
Person.prototype.fromJSON = (function (parentFunction){
    return function (data){
        let config = parentFunction.apply(this, arguments);
        this.equipment = {};
        return () => {
            if(config){ config();}
            data.equipment.forEach(equipId => {
                let equipment = mapManager.idManager.get(equipId);
                this.equip(equipment);
            })
            this.update('equipment');
        }
    }
})(Person.prototype.fromJSON);
Person.prototype.packageUpdates = (function (parentFunction){
    return function (){
        /**
            This function creates a data package containing information
            about aspects of the person that have changed since the person's
            last turn.
            
            It returns said package.
            **/
        var updatePackage = parentFunction.apply(this, arguments);
        if(!this.updates){
            return updatePackage;
        }
        this.updates.forEach(function (changeKey){
            if(changeKey == 'equipment'){
                updatePackage.equipment = {};
                for(var placement in this.equipment){
                    if(this.equipment.hasOwnProperty(placement)){
                        var equipItem = this.equipment[placement];
                        if(equipItem.type != TYPE_ITEM){ continue;}
                        updatePackage.equipment[placement]=equipItem.pack();
                    }
                }
                return;
            }
        }, this);
        return updatePackage;
    };
})(Person.prototype.packageUpdates);

//-- New Methods ---------------------------------
Person.prototype.equip = function (equipItem){
    /**
        This function handles all aspects of equipping items.
        It returns true if the equip was successful, false otherwise.
        **/
    var equipPlacement = equipItem.placement;
    var success = false;
    if(!equipPlacement){
        this.inform('The '+equipItem.description()+' cannot be equiped.');
        return false;
    }
    // Check if the item is a main hand item (weapon) and too heavy.
    if(
        equipItem.placement == EQUIP_MAINHAND &&
        equipItem.weight > this.strength
    ){
        this.inform('The '+equipItem.description()+' is too heavy for you to wield.');
        return false;
    }
    // Check if item is a shield, and is wielding a two handed weapon.
    if(equipItem.placement == EQUIP_OFFHAND){
        var currentWeapon = this.equipment[EQUIP_MAINHAND];
        if(currentWeapon && currentWeapon.twoHanded){
            this.inform('The '+equipItem.description()+' cannot be equipped while wielding a two handed item.');
            return false;
        }
    }
    // Unequip old weapon (maybe cursed).
    var oldEquip = this.equipment[equipPlacement];
    if(oldEquip){
        success = this.unequip(oldEquip);
        if(!success){
            this.inform('The '+equipItem.description()+' could not be equipped.');
            return false;
        }
    }
    // If item is a two handed weapon, unequip shield (possibly cursed).
    if(equipItem.placement == EQUIP_MAINHAND && equipItem.twoHanded){
        var offHand = this.equipment[EQUIP_OFFHAND];
        if(offHand){
            success = this.unequip(offHand);
            if(!success){
                return false;
            }
        }
    }
    // Remove item from inventory.
    success = this.inventoryRemove(equipItem);
    if(!success){
        this.inform('the '+equipItem.description()+' could not be removed from inventory.');
        return false;
    }
    // Finalize equip.
    this.equipment[equipPlacement] = equipItem;
    this.inform('You equip the '+equipItem.description()+'.');
    this.update('equipment');
    return true;
};
Person.prototype.unequip = function (equipItem){
    /**
        This function handles all aspects of unequipping items.
        
        TODO: Curses!
        
        It returns true if the unequip was successful, false otherwise.
        **/
    // Check if item is currently equipped.
    var equipPlacement = equipItem.placement;
    if(this.equipment[equipPlacement] != equipItem){
        return false;
    }
    // Move item from equipment into inventory.
    var success = this.inventoryAdd(equipItem);
    if(!success){
        this.inform('The '+equipItem.description()+' could not be moved to inventory.');
        return false;
    }
    // Finalize unequip.
    delete this.equipment[equipPlacement];
    this.inform('You unequip the '+equipItem.description()+'.');
    this.update('equipment');
    return true;
};
Person.prototype.getWeight = (function (parentFunction){
    return  function (){
        var totalWeight = parentFunction.apply(this, arguments);
        for(var key in this.equipment){
            if(this.equipment.hasOwnProperty(key)){
                var equipItem = this.equipment[key];
                if(equipItem){
                    var itemWeight = equipItem.getWeight();
                    totalWeight += itemWeight;
                }
            }
        }
        return totalWeight;
    };
})(Person.prototype.getWeight);


//== Extend Hero (New Methods) ===================================================

Hero.prototype.commandEquip = function (options){
    /**
        This command from the player directs the person to equip the specified
        item from inventory.
        
        Structure of options:
        {
            itemId: uniqueId, // as per mapManager.idManager.assignId
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
        this.inform('You failed to equip the item properly.');
    } else{
        this.equip(theItem);
    }
    // End turn.
    this.endTurn();
};
Hero.prototype.commandUnequip = function (options){
    /**
        This command from the player directs the person to unequip the
        specified item.
        
        Structure of options:
        {
            itemId: uniqueId, // as per mapManager.idManager.assignId
        }
        **/
    var theItem;
    // Attempt to find the item by ID in equipment.
    var itemId = options.itemId;
    if(itemId !== undefined){
        var testItem = mapManager.idManager.get(itemId);
        if(testItem && testItem.placement){
            if(this.equipment[testItem.placement] == testItem){
            /* This placement test prevents a type of cheating where the
                * user would specify the id of an item /not/ currently
                * equipped so as to place that item into inventory. */
                theItem = testItem;
            }
        }
    }
    if(!theItem){
        this.inform('You failed to unequip the item properly.');
    } else{
        this.unequip(theItem);
    }
    // End turn.
    this.endTurn();
};
