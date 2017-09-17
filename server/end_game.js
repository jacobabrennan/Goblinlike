/**
    This file provides one function to be called as soon as the end boss has
        been defeated. It configures the game world to provide safety to the
        player until whatever time they continue to the game's ending, as
        provided by the client.
**/

game.win = (function (){
    var accessFunction;
//==== Open Namespace ==========================================================
    accessFunction = function (){
        var lastLevel = mapManager.getDepth(FINAL_DEPTH);
        // Destroy all enemies
        var disposeOrder = function (oldContent){
            if(oldContent.type !== TYPE_ACTOR || oldContent.faction === FACTION_GOBLIN){ return;}
            oldContent.dispose();
        };
        for(var posY = 0; posY < lastLevel.height; posY++){
            for(var posX = 0; posX < lastLevel.width; posX++){
                var tileContents = lastLevel.getTileContents(posX, posY);
                tileContents.forEach(disposeOrder);
            }
        }
        // Remove upward stairs
        lastLevel.placeTile(
            lastLevel.stairsUpCoords.x, lastLevel.stairsUpCoords.y,
            lastLevel.tileTypes['.']
        );
    };
//==== Close Namespace =========================================================
    return accessFunction;
})();