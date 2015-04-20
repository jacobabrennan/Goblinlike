

/*===========================================================================
 *
 *  This prototype represents an actor in the game capable of moving about
 *      world and interacting with all other kinds of data objects present on
 *      the map. Most notably, actors can take part in combat.
 *  This is a prototype. I must be instantiated and it's constructor called
 *      in order to be used properly.
 *          
 *===========================================================================*/

var actor = Object.create(movable, {
    // Redefined properties:
    character: {value: '@', writable: true},
    type: {value: TYPE_ACTOR, writable: true},
    // Newly defined Properties:
    intelligence: {value: undefined, writable: true},
    viewRange: {value: 7, writable: true},
    turnDelay: {value: 1, writable: true},
    nextTurn: {value: 0, writable: true},
    //
    /*constructor: {value: function (){
        movable.constructor.apply(this, arguments);
        return this;
    }, writable: true},*/
    dispose: {value: function (){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        gameManager.cancelActor(this);
        movable.dispose.apply(this, arguments);
    }, writable: true},
    takeTurn: {value: function (callback){
        /**
            This function causes the actor to perform their turn taking
                behavior, such as moving about the map, attacking, or alerting
                the player, possibly over the network, to issue a command.
            The game will halt until callback is called. All behavior
                associated with this object taking a turn must take place
                between the initial call to takeTurn, and the call to callback.
            It does not return anything.
         **/
        if(this.intelligence){
            // Compile Sensory data about the actor's view.
            var currentLevel = mapManager.getLevel(this.levelId);
            var viewData;
            if(currentLevel){
                viewData = currentLevel.packageView(this.x, this.y, this.viewRange);
            }
            // Create final data package, and send it to the intelligence.
            var intelligenceCallback = (function (self){
                return function (){
                    self.nextTurn += self.turnDelay;
                    callback();
                };
            })(this);
            this.intelligence.takeTurn({
                sensoryData: viewData,
                callback: intelligenceCallback
            });
        } else{ // TODO: Handle simple NPC / Enemy AI.
            this.nextTurn += this.turnDelay;
            callback(true);
        }
    }, writable: true},
    pack: {value: function (){
        /**
            This function creates a "sensory package" of the object for use by
                a client, possibly over the network. This allows a client to
                know enough about an object to make decisions without having a
                hard reference to it.
            This is a child function of containable.pack, and must call its
                parent in order to function properly.
            It returns a package representing the object. See containable.pack
                for basic structure. It adds the following to the returned
                package:
            {
                ... // Existing parent package.
                type: 'actor';
            }
         **/
        var sensoryData = containable.pack.apply(this, arguments);
        sensoryData.type = TYPE_ACTOR;
        return sensoryData;
    }, writable: true},
    inform: {value: function (body){
        /**
            This function sends a message to the actor's intelligence. it is a
                stub to be used by the prototypes further derived decendants.
            It doesn't return anything.
         **/
    }, writable: true}
});