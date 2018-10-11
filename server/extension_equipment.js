
    
// === Equipment System ========================================================

//-- Dependencies --------------------------------
import person from './person.js';
import hero from './hero.js';
import item from './item.js';
import mapManager from './map_manager.js';


//== Extend Item ===============================================================

//-- New Properties ------------------------------
item.placement = undefined;

//-- Redefined Methods ---------------------------
item.pack = (function (parentFunction){
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
})(item.pack);
    

//== Extend Person =============================================================

//-- New Properties ------------------------------
person.equipment = undefined;

//-- Redefined Methods ---------------------------
person.initializer = (function (parentFunction){
    return function (){
        this.equipment = {};
        this.update('equipment');
        parentFunction.apply(this, arguments);
        return this;
    };
})(person.initializer);
person.toJSON = (function (parentFunction){
    return function (){
        let result = parentFunction.apply(this, arguments);
        let equipmentKeys = Object.keys(this.equipment);
        result.equipment = [];
        for(let keyIndex = 0; keyIndex < equipmentKeys.length; keyIndex++){
            let equippedItem = this.equipment[equipmentKeys[keyIndex]];
            result.equipment.push(equippedItem);
        }
        return result;
    }
})(person.toJSON);
person.packageUpdates = (function (parentFunction){
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
})(person.packageUpdates);

//-- New Methods ---------------------------------
person.equip = function (equipItem){
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
person.unequip = function (equipItem){
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
person.getWeight = (function (parentFunction){
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
})(person.getWeight);


//== Extend Hero (New Methods) ===================================================

hero.commandEquip = function (options){
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
hero.commandUnequip = function (options){
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
