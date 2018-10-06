

//== Time Manager ==============================================================

//-- Dependencies --------------------------------
import PriorityQueue from './priority_queue.js';
import gameManager from './game_manager.js';

//-- Implementation ------------------------------
const timeManager = {
    events: [],
    actors: new PriorityQueue(function (a,b){
        var turnDifference = a.nextTurn - b.nextTurn;
        if(turnDifference){
            return turnDifference;
        } else{
            var idPrecedence = (a.id || 0) - (b.id || 0);
            return idPrecedence;
        }
    }),
    registerActor: function (newActor){
        /**
            This function adds an object of type actor to the actors queue
                The queue is a PriorityQueue which orders who will take
                turns.
            An actor should reregister itself after every turn, as they are
                removed in nextActor as part of the process of assigning
                the next turn.
            It does not return a value.
            **/
        if(!gameManager.currentGame){ return;}
        this.actors.enqueue(newActor);
    },
    cancelActor: function (oldActor){
        /**
            This function removes an object from the actors queue. It will
                no longer be in line to recieve turns.
            It does not return a value.
            **/
        this.actors.removeItem(oldActor);
    },
    nextActor: function (){
        /**
            This function finds the next actor in line to take their turn.
            An actor should reregister itself after every turn, as they
                are removed from the queue by this function.
            It returns an object of type actor if one is available, or
                undefined if there are no actors registered.
            **/
        var nextActor = this.actors.dequeue();
        return nextActor;
    },
    turn: function (){
        /*
            Find next actor, give them a turn
            Nothing is returned by this function.
            */
        if(!gameManager.currentGame){ return;}
        var theTime = gameManager.currentTime();
        if(!isFinite(theTime)){ return;}
        var nextActor = this.nextActor();
        if(theTime > nextActor.nextTurn){
            nextActor.nextTurn = theTime;
        }
        gameManager.setTime(nextActor.nextTurn);
        var callback = (function (self){
            return function (active){
                if(active){
                    self.registerActor(nextActor);
                }
                self.turn();
            };
        })(this);
        nextActor.takeTurn(callback);
    },
    reset: function (){
        var oldActors = [];
        while(!this.actors.isEmpty()){
            oldActors.push(this.nextActor());
        }
        oldActors.forEach(function (oldActor){
            oldActor.dispose();
        });
        this.events = [];
    },
    registerEvent: function (eventFunction, delay){
        var timeStamp = gameManager.currentTime() + delay;
        var newEvent = new EventActor(eventFunction, timeStamp);
        this.registerActor(newEvent);
    }
};

class EventActor {
    constructor(eventFunction, timeStamp) {
        this.eventFunction = eventFunction;
        this.nextTurn = timeStamp;
        this.callbackStorage = undefined;
    }
    takeTurn(callback) {
        this.eventFunction();
        callback(false);
    }
    dispose() {}
}

//-- Export --------------------------------------
export default timeManager;
