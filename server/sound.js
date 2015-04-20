actor.sound = function (tamber, amplitude, source, message){
    var hearers = getDijkstraContents(this, amplitude);
    for(var hIndex = 0; hIndex < hearers.length; hIndex++){
        var indexedHearer = hearers[hIndex];
        if(indexedHearer.type == TYPE_ACTOR){
            indexedHearer.hear(tamber, amplitude, source, message);
        }
    }
};
actor.hear = function (tamber, amplitude, source, message){
    
};