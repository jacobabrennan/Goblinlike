

//== Sound - Extend Actor ======================================================

//-- Dependencies --------------------------------
import Actor from './actor.js';
import mapManager from './map_manager.js';

//-- Add Hooks -----------------------------------
Actor.prototype.sound = function (tamber, amplitude, source, message){
    if(!this.x || !this.y|| !this.levelId){ return;}
    //var hearers = getDijkstraContents(this, amplitude);
    var hearers = mapManager.getRangeContents(
        this.x, this.y, this.levelId, amplitude);
    for(var hIndex = 0; hIndex < hearers.length; hIndex++){
        var indexedHearer = hearers[hIndex];
        if(indexedHearer.type == TYPE_ACTOR){
            indexedHearer.hear(tamber, amplitude, source, message);
        }
    }
};
Actor.prototype.hear = function (tamber, amplitude, source, message){
    
};
