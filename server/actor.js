

/*===========================================================================
 *
 *  This prototype represents an actor in the game capable of moving about
 *      world and interacting with all other kinds of data objects present on
 *      the map. Most notably, actors can take part in combat.
 *  This is a prototype. I must be instantiated and it's initializer called
 *      in order to be used properly.
 *          
 *===========================================================================*/
//-- Dependencies --------------------------------
import {movable, containable} from './mappables.js';
import gameManager from './game_manager.js';
import mapManager from './map_manager.js';

//-- Implementation ------------------------------
const actor = Object.extend(movable, {
    // Redefined properties:
    character: '@',
    type: TYPE_ACTOR,
    // Newly defined Properties:
    intelligence: undefined,
    viewRange: 7,
    turnDelay: 1,
    nextTurn: 0,
    //
    /*initializer(){
        movable.initializer.apply(this, arguments);
        return this;
    },*/
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        gameManager.cancelActor(this);
        movable.dispose.apply(this, arguments);
    },
    takeTurn(callback){
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
    },
    pack(){
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
    },
    inform(body){
        /**
            This function sends a message to the actor's intelligence. it is a
                stub to be used by the prototypes further derived decendants.
            It doesn't return anything.
         **/
    }
});

//-- Export --------------------------------------
export default actor;
