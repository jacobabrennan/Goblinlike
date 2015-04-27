

/*===========================================================================
 *
 * TODO: Document.
 *
 *===========================================================================*/

var mapManager = {
    /**
        This object keeps track of all levels in the game and allows them
            to be accessed via unique ids. This prevents the need for managing
            hard references in many other parts of the program.
        This object is for global use. It is not meant as a prototype.
     **/
    levels: {},
    depths: [],
    reset: function (){
        // TODO: document.
        this.idManager.reset();
        this.depths = [];
        for(var levelId in this.levels){
            if(this.levels.hasOwnProperty(levelId)){
                var oldLevel = this.levels[levelId];
                delete this.levels[levelId];
                oldLevel.dispose();
            }
        }
    },
    registerLevel: function (newLevel){
        /**
            This function must be called whenever a new level is created. It
                ensures that the supplied level is properly referenced so
                other parts of the program can access it via level id.
            It does not return anything.
         **/
        this.levels[newLevel.id] = newLevel;
        if(newLevel.depth){
            this.depths[newLevel.depth] = newLevel;
        }
    },
    cancelLevel: function (oldLevel){
        /**
            This function must be called whenever a level is no longer in use.
                Otherwise, levels would not be garbage collected.
            It does not return anything.
         **/
        delete this.levels[oldLevel.id];
        if(oldLevel.depth){
            this.depths[oldLevel.depth] = undefined;
        }
    },
    getLevel: function (levelId){
        /**
            This function allows any part of the game to access any level by
                level id.
            It returns the level, if found. Otherwise, it returns undefined.
         **/
        return this.levels[levelId];
    },
    getDepth: function (depth, buildNew){
        /**
            This function returns the level at the specified depth, creating it
            if neccessary and buildNew is true. Otherwise, it return undefined.
        **/
        var depthLevel = this.depths[depth];
        //var higherDepth = this.depths[depth-1];
        var disposeDepth = this.depths[depth-2];
        if(!depthLevel && buildNew){
            /*var generatorOptions = { // TODO: MAGIC NUMBERS!
                'depth': depth,
                'width': DEFAULT_MAP_SIZE,
                'height': DEFAULT_MAP_SIZE
            };*/
            /*if(higherDepth){
                generatorOptions.startX = higherDepth.stairsDownCoords.x;
                generatorOptions.startY = higherDepth.stairsDownCoords.y;
            }*/
            if(disposeDepth){
                disposeDepth.dispose();
            }
            depthLevel = this.generateLevel(depth);
            this.depths[depth] = depthLevel;
        }
        return depthLevel;
    },
    getTile: function (x, y, levelId){
        /**
            This function allows any part of the game to access any tile on any
                level by coordinates and id.rsc/fonts/
            It returns a tile, if found. Otherwise, it returns undefined.
         **/
        var referencedLevel = this.getLevel(levelId);
        if(!referencedLevel){ return undefined;}
        return referencedLevel.getTile(x, y);
    },
    getTileContents: function (x, y, levelId, onlyFirst){
        /**
            This function allows any part of the game to access the contents of
                any tile on any level by coordinates and id.
            It returns:
                An array of all containable objects at the supplied coordinates,
                    or an empty array if there are no objects.
                The first object of type containable at this location, if
                    "onlyFirst" is true, or undefined if there is no object.
                An empty array or undefined (onlyFirst) if the supplied
                    coordinates are outside the dimentions of this level.
         **/
        var referencedLevel = this.getLevel(levelId);
        if(!referencedLevel){ return undefined;}
        return referencedLevel.getTileContents(x, y, onlyFirst);
    },
    getRangeContents: function (x, y, levelId, range){
        /**
            This function compiles an array of all containables within range of
            the given coordinates. The grid includes all coordinates within the
            supplied range, including the center, giving dimensions of
            (range+1+range)^2.
            
            It returns said array.
         **/
        var referencedLevel = this.getLevel(levelId);
        if(!referencedLevel){ return undefined;}
        return referencedLevel.getRangeContents(x, y, range);
    },
    generateLevel: function (options){
        /**
         *  This function proceedurally generates a new level with the supplied
         *      parameters:
         *      {
         *          id: 'string', // Optional. The name of this level.
         *          width: integer, // Optional.
         *          height: integer, // Optional.
         *          roomSideMax: integer, // Optional.
         *          roomSideMin: integer, // Optional.
         *          hallLengthMax: integer, // Optional.
         *          hallLengthMin: integer, // Optional.
         *      }
         *  It returns a new level object, ready for use.
         **/
        var generator = Object.create(this.levelGenerator);
        var newLevel = generator.generate(options);
        return newLevel;
    },
    swapPlaces: function (content1, content2){
        var oldX = content1.x;
        var oldY = content1.y;
        var oldId = content1.levelId;
        var obsX = content2.x;
        var obsY = content2.y;
        var obsId = content2.levelId;
        content1.unplace();
        var success = content2.place(oldX, oldY, oldId);
        if(success){  content1.place(obsX, obsY, obsId);}
        else{         content1.place(oldX, oldY, oldId);}
        return success;
    },
/*==== Id Manager ===========================================================*/
    idManager: {
        // TODO: Document.
        ids: [],
        recycledIds: [],
        reset: function (){
            this.recycledIds = [];
            this.unusedColors = this.totalColors;
            this.potionColors = {};
            this.scrolls = {};
            this.scrollNames = {};
            this.unusedMetals = this.totalMetals;
            for(var id = 0; id < this.ids.length; id++){
                var idObject = this.ids[id];
                if(idObject && idObject.dispose){
                    idObject.dispose();
                }
            }
            this.ids = [];
        },
        assignId: function (thing){
            // TODO: Document.
            var newId;
            if(this.recycledIds.length){
                newId = this.recycledIds.shift();
            } else{
                newId = this.ids.length;
            }
            this.ids[newId] = thing;
            return newId;
        },
        cancelId: function (id){
            // TODO: Document.
            var identifiedThing = this.ids[id];
            if(!identifiedThing){ return;}
            this.ids[id] = null;
            var oldIndex = this.recycledIds.indexOf(id);
            if(oldIndex){ return;}
            this.recycledIds.push(id);
        },
        get: function (id){
            // TODO: Document.
            return this.ids[id];
        },
        //=== Unidentified Item Descriptions ===========
        totalColors: [
          //'123456 Potion*99',
            'Red'   ,'Orange','Yellow', 'Green',
            'Violet'  ,'Cyan'  ,'Blue'  ,'Purple',
            'Brown' ,'Grey'  ,'White' ,'Hazy'  ,
            'Murky' ,'Clear' ,'Chunky','Fizzy'
        ],
        unusedColors: [
          //'123456 Potion*99',
            'Red'   ,'Orange','Yellow', 'Green',
            'Aqua'  ,'Cyan'  ,'Blue'  ,'Purple',
            'Brown' ,'Grey'  ,'White' ,'Hazy'  ,
            'Murky' ,'Clear' ,'Chunky','Fizzy'
        ],
        totalMetals: [
            'tin','nickle','copper','iron','miþril','gold',
            'silver','bronze','alum','steel'
        ],
        unusedMetals: [
            'tin','nickle','copper','iron','miþril','gold',
            'silver','bronze','alum','steel'
        ],
        potionColors: {}, // Item.name : color
        wandMetals: {}, // Item.name : metal
        scrolls: {}, // item.name : scroll name
        scrollNames: {}, // scroll name : item.name
        describeScroll: function (item){
            if(
                gameManager.currentGame &&
                gameManager.currentGame.hero.lore() >= item.lore
            ){
                return item.name;
            }
            var scrollName = this.scrolls[item.name];
            if(!scrollName){
                var tries = 100;
                while(!scrollName && tries-- >0){
                    var randomName = sWerd.scroll();
                    if(!this.scrollNames[randomName]){
                        scrollName = randomName;
                    }
                }
                this.scrolls[item.name] = scrollName;
                this.scrollNames[scrollName] = item;
            }
            return scrollName+' scroll';
        },
        describePotion: function (item){
            if(
                gameManager.currentGame &&
                gameManager.currentGame.hero.lore() >= item.lore
            ){
                return item.name;
            }
            var potionColor = this.potionColors[item.name];
            if(!potionColor){
                var randomIndex = randomInterval(0, this.unusedColors.length);
                var randomColor = this.unusedColors.splice(randomIndex, 1);
                randomColor = randomColor[0];
                this.potionColors[item.name] = randomColor;
                potionColor = randomColor;
            }
            return potionColor+' potion';
        },
        describeWand: function (item){
            if(
                gameManager.currentGame &&
                gameManager.currentGame.hero.lore() >= item.lore
            ){
                var returnName = item.name;
                if(item.charges !== undefined){
                    returnName += '('+item.charges+')';
                }
                return returnName;
            }
            var wandMetal = this.wandMetals[item.name];
            if(!wandMetal){
                var randomIndex = randomInterval(0, this.unusedMetals.length);
                var randomMetal = this.unusedMetals.splice(randomIndex, 1);
                randomMetal = randomMetal[0];
                this.wandMetals[item.name] = randomMetal;
                wandMetal = randomMetal;
            }
            return wandMetal+' wand';
        }
    }
};