

// === Statistics System ==================================================
// TODO: Document.

(function (base){
    /**
     *  Extend person
     **/
    // Redefined Properties
    base.viewRange = 10;
    // New Properties
    base.vitality = undefined;
    base.strength = undefined;
    base.wisdom = undefined;
    base.charisma = undefined;
    base.experience = undefined;
    base.maxHp = function (){
        var base = this.vitality;
        var subTotal = (base + this.level + Math.ceil(base*this.level * 0.85));
        return subTotal;
    };
    base.meanMoral = function (){
        var base = this.charisma;
        var subTotal = (base + this.level + Math.ceil(base*(this.level-1) * 0.50));
        return subTotal;
    };
    base.carryCapacity = function (){
        return this.strength * (1+this.level/2);
    };
    base.lore = function (){
        return this.wisdom * (1+(this.level/2));
        /* Progression
        Wisdom 1:
            1: 1.5
            2: 2
            3: 2.5
            4: 3
            5: 3.5
           10: 6
           20: 11
           30: 16
        Wisdom 5:
            1: 7.5
            2: 10
            3: 12.5
            4: 15
            5: 17.5
           10: 30
           20: 55
           30: 80
        Wisdom 7:
            1: 10.5
            2: 14
            3: 17.5
            4: 21
            5: 24.5
           10: 42
           20: 77
           30: 112
        Wisdom 10:
            1: 15
        */
    };
    base.influence = function (){
        return this.charisma * (1+this.level);
    };
    base.healDelay = function (){
        if(this.camping){ return 5;}
        return 30 - this.vitality;
    };
    // Redefined Methods
    base.constructor = (function (parentFunction){
        return function (options){
            this.setLevel(1);
            this.experience = 0;
            var statTotal = 28; // TODO: Magic Number!
            if(options){
                this.name     = options.name    ;
                this.vitality = options.vitality;
                this.strength = options.strength;
                this.wisdom   = options.wisdom  ;
                this.charisma = options.charisma;
            } else{
                this.vitality = 1;
                this.strength = 1;
                this.wisdom = 1;
                this.charisma = 1;
                statTotal -= 4; // Total of innitial population of 1s.
                while(statTotal){
                    switch(Math.floor(Math.random()*4)){
                        case 0:
                            if(this.vitality >= 10){ continue;}
                            this.vitality++;
                            break;
                        case 1:
                            if(this.strength >= 10){ continue;}
                            this.strength++;
                            break;
                        case 2:
                            if(this.wisdom >= 10){ continue;}
                            this.wisdom++;
                            break;
                        case 3:
                            if(this.charisma >= 10){ continue;}
                            this.charisma++;
                            break;
                    }
                    statTotal--;
                }
            }
            parentFunction.apply(this, arguments);
            return this;
        };
    })(base.constructor);
    base.packageUpdates = (function (parentFunction){
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
                switch(changeKey){
                    /*  For the following cases, an attribute is appended to the
                        object at the top level. */
                    case 'experience': updatePackage.experience = this.experience; return;
                    case 'level': updatePackage.level = this.level; return;
                    case 'vitality': updatePackage.vitality = this.vitality; return;
                    case 'strength': updatePackage.strength = this.strength; return;
                    case 'wisdom': updatePackage.wisdom = this.wisdom; return;
                    case 'charisma': updatePackage.charisma = this.charisma; return;
                }
            }, this);
            return updatePackage;
        };
    })(base.packageUpdates);
    // New Methods
    base.adjustExperience = function (amount){
        /**
         **/
        // TODO: Magic Numbers!
        var expToLvl = ((this.level)*100) - this.experience;
        expToLvl *= this.level;
        if(amount >= expToLvl){
            amount -= expToLvl;
            var newLevel = this.level+1;
            this.experience = this.level*100;
            this.setLevel(newLevel);
            this.adjustExperience(amount);
            return;
        }
        amount /= this.level;
        this.experience += amount;
        this.update('experience');
    };
    base.setLevel = function (newLevel){
        this.level = newLevel;
        this.update('level');
        this.update('experience');
        this.update('vitality');
        this.update('strength');
        this.update('wisdom');
        this.update('charisma');
        this.update('maxHp');
        // Update item names, in case something was identified.
        this.update('inventory');
        this.update('equipment');
    };
    // End extend person
})(person);