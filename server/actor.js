

/*===========================================================================
 *
 *  This prototype represents an Actor in the game capable of moving about
 *      world and interacting with all other kinds of data objects present on
 *      the map. Most notably, Actors can take part in combat.
 *  This is a prototype. I must be instantiated and it's initializer called
 *      in order to be used properly.
 *          
 *===========================================================================*/
//-- Dependencies --------------------------------
import {Movable, Containable} from './mappables.js';
import gameManager from './game_manager.js';
import mapManager from './map_manager.js';

//-- Implementation ------------------------------
class Actor extends Movable {
    /*initializer(){
        Movable.prototype.initializer.apply(this, arguments);
        return this;
    },*/
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        gameManager.cancelActor(this);
        Movable.prototype.dispose.apply(this, arguments);
    }
    toJSON() {
        let result = Movable.prototype.toJSON.apply(this, arguments);
        result.nextTurn = this.nextTurn;
        return result;
    }
    fromJSON(data){
        console.log(this.name)
        Movable.prototype.fromJSON.apply(this, arguments);
        this.nextTurn = data.nextTurn;
    }
    takeTurn(callback){
        /**
            This function causes the Actor to perform their turn taking
                behavior, such as moving about the map, attacking, or alerting
                the player, possibly over the network, to issue a command.
            The game will halt until callback is called. All behavior
                associated with this object taking a turn must take place
                between the initial call to takeTurn, and the call to callback.
            It does not return anything.
         **/
        if(this.intelligence){
            // Compile Sensory data about the Actor's view.
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
    }
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
        var sensoryData = Containable.prototype.pack.apply(this, arguments);
        sensoryData.type = TYPE_ACTOR;
        return sensoryData;
    }
    inform(body){
        /**
            This function sends a message to the Actor's intelligence. it is a
                stub to be used by the prototypes further derived decendants.
            It doesn't return anything.
         **/
    }
}
// Redefined properties:
Actor.prototype.character = '@';
Actor.prototype.type = TYPE_ACTOR;
// Newly defined Properties:
Actor.prototype.intelligence = undefined;
Actor.prototype.viewRange = 7;
Actor.prototype.turnDelay = 1;
Actor.prototype.nextTurn = 0;

//-- Export --------------------------------------
export default Actor;
