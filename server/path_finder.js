/*

Updates
(May 17th 2007) Version 10
Added new functionality to the dijkstra algorithm to allow for simultanious
searches from a single starting point. This is much faster than making several
calls as no work is repeated in the search. Depending on how you handled your
finished proc previously this may break old code. Previously finished only
expected a bool and now it expects specific values to know if it should just add
a list or add a list and continue. For the old behaviour you should just return
P_DIJKSTRA_FINISHED(which is equal to 1). Since it's equal to 1 I'm hoping that
it won't break most code. However you should still update to the constants to
ensure your code won't break in future versions if I need to change these values
or possibly add more. There is also a compatibility mode which is by default on.
If only one list is returned and compatibility mode is on the return value will
be the same as previous versions. If it's off then it'll simple return a list of
one path which should be simpler if you're expecting the new functionality and
are handling a nested list.

(May 15th 2007) Version 9
Adjusted when testing if a node is the finish point or not. Previously if the
ending node was accessable from a node it'd jump to it ignoring the cost. For
most cases this is ok. However if the costs for entering vary depending on
direction this could produce paths which aren't the shortest according to the
weighted distances. This is now fixed in all 3 algorithms. Thanks goes to
Shadowdancer for finding the bug.

(April 22nd 2007) Version 8
Includes several new parameters to help improve the effeciency of searches
preformed by the library.

maxNodeDepth - Defines the maximum number of nodes that can be traversed to get
to the destination node. This will prevent any extra long paths from being found
but will prevent the algorithm from spending too long if you don't care to find
these paths anyway. This parameter has been added for all the algorithms.

minTargetDist - Defines the minimum distance from the target for the path to be
complete. Use this if you only need a path to be obtained that just needs to be
close to the target rather than get all the way there. Note however that the
dist() proc passed in is used for calculating distance. This parameter is only
for aStar().

minNodeDist:src.minNodeDist(dst) - A proc passed in which returns the minimum
possible nodes it could take to get from src to dst. For example if this is used
on a turf map and the player can only possibly move one turf at a time with
diagonals then the minimum node distance from the target to the destination
would be the same as the value returned by the get_dist() proc. However if you
need to compensate for a complex portal network or your movement isn't simple
then it may be unreasonable to try and solve for the minimum number of nodes it
would take to traverse from one to another. If you can define this and set a
maxNodeDepth then the preformance of the search should be drastically removed as
many impossible nodes will be quickly dropped off(along with all the nodes you'd
need to test if they had been tested.)

(April 14th 2007) Version 7
Fixes a runtime error generated from the case in which no path can be found.
null is properly returned now.

Version 6 fixes a small glitch with the Dijkstra procs starting with a weight of
1 on the first node rather than 0.

Version 5 adds in a parameter to DijkstraTurfInRange which allows you to select
whether or not you want it to return the interior datums or datums that met the
finishing criteria, or both.

Version 4 updates the demo to demonstrate adding movement costs to terrain as
well as adding a new function DijkstraTurfInRange. This doesn't solve for a path
rather finds all turfs within a given range using a terminating function. This
was mainly added at Unknown Persons request for solving tiles which can be moved
to given the movement style and range of a unit however it can be used for many
other purposes such as finding all tiles accessable from a specific location
that you can get to without crossing a certain barrier. Version 4 doesn't mess
with any of the old functionality so it should be fully backwards compatible
with version 3.

Version 3 fixs the order of the path


Usage
This library contains implementations for two different pathfinding algorithms.
The A* algorithm is used to find the shortest path from one point to another
while the Dijkstra algorithm is used when the destination isn't known until you
get there or if you want to get several paths at once from the same starting
point. For example if you want a mob to find a path to the nearest player but
don't know which is nearest you'd use the Dijkstra algorithm. However if you
have a specific player you want to find a path to you'd use the A* algorithm.

aStar(start,end,adjacent,dist,maxNodes,maxNodeDepth,minTargetDist,minNodeDist)

start - The starting location of the path

end - The destination location of the path

adjacent - The function which returns all adjacent nodes from the source node.

dist - The function which returns either the distance(along with any added
weights for taking the path) between two adjacent nodes or if the nodes aren't
adjacent the guessed distance between the two.

maxNodes - The maximum number of nodes that can be in the open list.  Pass in 0
for no limit.  Limiting the number of nodes may prevent certain paths from being
found but the the nodes removed are the least likely to lead to good paths so as
long as this value is sufficiently high this shouldn't be a problem.

maxNodeDepth - Defines the maximum number of nodes that can be traversed to get
to the destination node.  This will prevent any extra long paths from being
found but will prevent the algorithm from spending too long if you don't care to
find these paths anyway.

minTargetDist - Defines the minimum distance from the target for the path to be
complete.  Use this if you only need a path to be obtained that just needs to be
close to the target rather than get all the way there.  Note however that the
dist() proc passed in is used for calculating distance.

minNodeDist:src.minNodeDist(dst) - A proc passed in which returns the minimum
possible nodes it could take to get from src to dst.  For example if this is
used on a turf map and the player can only possibly move one turf at a time with
diagonals then the minimum node distance from the target to the destination
would be the same as the value returned by the get_dist() proc.  However if you
need to compensate for a complex portal network or your movement isn't simple
then it may be unreasonable to try and solve for the minimum number of nodes it
would take to traverse from one to another.  If you can define this and set a
maxNodeDepth then the preformance of the search should be drastically removed as
many impossible nodes will be quickly dropped off(along with all the nodes you'd
need to test if they had been tested.)



Dijkstra(start,adjacent,dist,finished,maxNodeDepth,compatibility=1)
start - The starting location of the path
adjacent - The function which returns all adjacent nodes
from the source node.
dist - The function which returns either the distance(along with any added
weights for taking the path) between two adjacent nodes or if the nodes aren't
adjacent the guessed distance between the two.
finished - The function which returns a flag which is either
P_DIJKSTRA_NOT_FOUND, P_DIJKSTRA_FINISHED, or P_DIJKSTRA_ADD_PATH.
P_DIJKSTRA_NOT_FOUND indicates this node is not a finishing point.
P_DIJKSTRA_FINISHED indicates this node is a finishing point and that no more
paths need to be found.
P_DIJKSTRA_ADD_PATH indicates this node is a finishing point and adds the path
to this node to the paths list.  However rather than terminating the search it
continues to try and find more paths.
maxNodeDepth - Defines the maximum number of nodes that can be traversed to get
to the destination node.  This will prevent any extra long paths from being
found but will prevent the algorithm from spending too long if you don't care to
find these paths anyway.
compatibility - A boolean turning on or off compatibility mode.  If
compatibility mode is on and only one path is generated then it'll return that
path rater than returning a list of paths containing one path.  If there are
more than 1 paths however then a list of paths will be returned regardless of
this setting

DijkstraTurfInRange(start,adjacent,dist,finished,include,maxNodeDepth)
This functions like the Dijkstra proc except that rather than returning a path
it returns all nodes up to and including the finishing one.  And it keeps
running until all paths up to a finishing point are tested so ensure you have
some kind of distance constraint or are searching in an area tightly bound by
finishing restrictions.

include - A parameter which determines which datums to return
	Values
	P_INCLUDE_INTERIOR - All datums in the area except the ones meeting the
		finishing conditions.
	P_INCLUDE_FINISHED - All datums meeting the finishing conditions.
	If you or the parameters you get everything which is the default parameter
	if nothing is passed for it.

*/


var P_DIJKSTRA_NOT_FOUND = 0;
var P_DIJKSTRA_FINISHED  = 1;
var P_DIJKSTRA_ADD_PATH  = 2;
var P_INCLUDE_INTERIOR   = 1;
var P_INCLUDE_FINISHED   = 2;


tile.adjacent = function (instanceData, closed){
    var adjacentArray = [];
    for(var posY = instanceData.y-1; posY <= instanceData.y+1; posY++){
        for(var posX = instanceData.x-1; posX <= instanceData.x+1; posX++){
            if(posX == instanceData.x && posY == instanceData.y){
                continue;
            }
            var distinction = (''+posX+','+posY+','+instanceData.levelId);
            if(closed[distinction]){
                adjacentArray.push(closed[distinction]);
                continue;
            }
            var tileModel = mapManager.getTile(
                posX, posY, instanceData.levelId
            );
            if(!tileModel){
                continue;
            }
            if(tileModel.dense){
                if(!tileModel.pathable){
                    continue;
                }
            }
            adjacentArray.push({
                x: posX,
                y: posY,
                levelId: instanceData.levelId,
                distinction: distinction,
                tile: tileModel
            });
        }
    }
    return adjacentArray;
};
genericTileTypes['+'].pathable = true;
genericTileTypes['<'].adjacent = function (instanceData, closed){
    var adjacentArray = tile.adjacent.apply(this, arguments);
    var currentLevel = mapManager.getLevel(instanceData.levelId);
    var currentDepth = currentLevel.depth;
    var higherLevel = mapManager.getDepth(currentDepth-1);
    if(higherLevel){
        var stairsC = higherLevel.stairsDownCoords;
        if(!higherLevel.id){
            throw new Error();
        }
        var distinction = (''+stairsC.x+','+stairsC.y+','+higherLevel.id);
        if(closed[distinction]){
            adjacentArray.push(closed[distinction]);
        } else{
            adjacentArray.push({
                x: stairsC.x,
                y: stairsC.y,
                levelId: higherLevel.id,
                distinction: distinction,
                tile: higherLevel.getTile(stairsC.x, stairsC.y)
            });
        }
    }
    return adjacentArray;
};
genericTileTypes['>'].adjacent = function (instanceData, closed){
    var adjacentArray = tile.adjacent.apply(this, arguments);
    var currentLevel = mapManager.getLevel(instanceData.levelId);
    var currentDepth = currentLevel.depth;
    var lowerLevel = mapManager.getDepth(currentDepth+1);
    if(lowerLevel){
        var stairsC = lowerLevel.stairsUpCoords;
        if(!lowerLevel.id){
            throw new Error();
        }
        var distinction = (''+stairsC.x+','+stairsC.y+','+lowerLevel.id);
        if(closed[distinction]){
            adjacentArray.push(closed[distinction]);
        } else{
            adjacentArray.push({
                x: stairsC.x,
                y: stairsC.y,
                levelId: lowerLevel.id,
                distinction: distinction,
                tile: lowerLevel.getTile(stairsC.x, stairsC.y)
            });
        }
    }
    return adjacentArray;
};

var nodeCleanup = function (){
    this.source = null;
    this.prevNode = null;
}
var pathNode = function (source, prevNode, parentG, parentH, parentsNodesTraversed){
    this.source = source;
    this.prevNode = prevNode;
    this.travelCost = parentG;
    this.h = parentH;
    this.f = this.travelCost + this.h;
    this.source.bestF = this.f;
    this.nodesTraversed = parentsNodesTraversed;
    this.cleanup = nodeCleanup;
    return this;
};

var pathDist = function (coords1, skipDense){
    var coords2 = this;
    /*return Math.max(
        Math.abs(coords1.x-coords2.x),
        Math.abs(coords1.y-coords2.y)
    );*/
    var hDist = 0;
    var deltaX = coords1.x-coords2.x;
    var deltaY = coords1.y-coords2.y;
    //hDist += Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    hDist = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    if(deltaX && deltaY){
        hDist += 1/16;
    }
    if(coords2.levelId != coords1.levelId){
        var level1 = mapManager.getLevel(coords1.levelId);
        var level2 = mapManager.getLevel(coords2.levelId);
        var highLevel = (level1.depth < level2.depth)? level1 : level2;
        var lowLevel = (highLevel == level1)? level2 : level1;
        var deltaDepth = highLevel.depth - lowLevel.depth;
        if(deltaDepth > 1){
            return 500;
        }
        var highTarget = (coords1.levelId == highLevel.id)? coords1 : coords2;
        var lowTarget = (highTarget == coords1)? coords2 : coords1;
        var lowDist = Math.max(
            Math.abs(lowTarget.x-lowLevel.stairsUpCoords.x),
            Math.abs(lowTarget.y-lowLevel.stairsUpCoords.y)
        );
        var highDist = Math.max(
            Math.abs(highTarget.x-highLevel.stairsDownCoords.x),
            Math.abs(highTarget.y-highLevel.stairsDownCoords.y)
        );
        return highDist+lowDist+1;
    }
    if(!skipDense && hDist <= 1+1/16){
        // Check density
        var contents = mapManager.getTileContents(coords2.x,coords2.y,coords2.levelId);
        for(var cI = 0; cI < contents.length; cI++){
            var testC = contents[cI];
            if(testC.dense){
                hDist += 2;
            }
        }
    }
    return hDist;
};
var findTarget = function (start, faction){
    start = {
        x: start.x,
        y: start.y,
        levelId: start.levelId,
        distinction: (''+start.x+','+start.y+','+start.levelId),
        tile: mapManager.getTile(start.x, start.y, start.levelId),
        faction: faction
    };
    /*var minDist = function (coords1){
        return dist.call(this, coords1, false);
    };*/
    var finished = function (start, current, travelCost){
        /*
        This function returns a flag which is either
         - P_DIJKSTRA_NOT_FOUND: indicates this node is not a finishing point.
         - P_DIJKSTRA_FINISHED: indicates this node is a finishing point and that no more
        paths need to be found.
         - P_DIJKSTRA_ADD_PATH: indicates this node is a finishing point and adds the path
        to this node to the paths list.  However rather than terminating the search it
        continues to try and find more paths.
        */
        var target = mapManager.getTileContents(
            current.x, current.y, current.levelId, true
        );
        if(target && target.faction &&
            !(target.faction & start.faction) &&
            target.hurt
        ){
            return P_DIJKSTRA_FINISHED;
        }
        return P_DIJKSTRA_NOT_FOUND;
    };
    var pathsArray = dijkstra(start, pathDist, finished, 10);
    var path = pathsArray[0];
    if(path && path.length){
        path.shift(); // Remove starting point.
        var destination = path[path.length-1];
        return {
            path: path,
            target: mapManager.getTileContents(
                destination.x, destination.y, destination.levelId, true
            )
        };
    }
    return null;
};

var findPath = function (start, end, limit){
    var isActor = (start.type == TYPE_ACTOR);
    end = {
        x: end.x,
        y: end.y,
        levelId: end.levelId,
        distinction: (''+end.x+','+end.y+','+end.levelId),
        tile: mapManager.getTile(end.x, end.y, end.levelId)
    };
    start = {
        x: start.x,
        y: start.y,
        levelId: start.levelId,
        distinction: (''+start.x+','+start.y+','+start.levelId),
        tile: mapManager.getTile(start.x, start.y, start.levelId)
    };
    if(!limit){ limit = 1;}
    var minDist = function (coords1){
        return pathDist.call(this, coords1, false);
    };
    var pathArray = aStar(start, end, pathDist, 20, 10, limit, minDist);
    if(isActor && pathArray && pathArray.length){
        var firstStep = pathArray[0];
        if(!distance(start, firstStep)){ pathArray.shift();}
    }
    return pathArray;
};

var getDijkstra = function (start, range){
    start = {
        x: start.x,
        y: start.y,
        levelId: start.levelId,
        distinction: (''+start.x+','+start.y+','+start.levelId),
        tile: mapManager.getTile(start.x, start.y, start.levelId)
    };
    return dijkstraRange(start, pathDist, range);
};

var getDijkstraContents = function (start, range){
    var rangeContents = [];
    var rangeTiles = getDijkstra(start, range);
    for(var rangeI = 0; rangeI < rangeTiles.length; rangeI++){
        var indexedTile = rangeTiles[rangeI];
        var tileContent = mapManager.getTileContents(
            indexedTile.x, indexedTile.y, indexedTile.levelId
        );
        for(var contentI = 0; contentI < tileContent.length; contentI++){
            rangeContents.push(tileContent[contentI]);
        }
    }
    return rangeContents;
}


var pathWeightCompare = function (a, b){
    return a.f - b.f;
};

var aStar = function (start, end, dist, maxNodes, maxNodeDepth, minTargetDist, minNodeDist){
    // Create heap for open nodes, list for closed nodes, and variable for final path.
    var open = priorityQueue.constructor.call(
        Object.create(priorityQueue),
        pathWeightCompare
    );
    var closed = {};
    var path;
    // Add the starting position to the heap.
    open.enqueue(new pathNode(
        start, null, 0, dist.call(start, end)
    ));
    while(!open.isEmpty() && !path){
        // Get the next most likely step.
        var cur = open.dequeue();
        closed[cur.source.distinction] = cur.source;
        var closeEnough;
        // Check if this is our final destination.
        if(minTargetDist){
            closeEnough = dist.call(cur.source, end) <= minTargetDist;
        }
        if(cur.source.distinction == end.distinction || closeEnough){ //Found the path
            path = [];
            path.push(cur.source);
            while(cur.prevNode){
                cur = cur.prevNode;
                path.push(cur.source);
            }
            break;
        }
        // Find adjacent nodes.
        var L = cur.source.tile.adjacent(cur.source, closed);
        if(minNodeDist && maxNodeDepth){
            if(minNodeDist.call(cur.source, end) + cur.nodesTraversed >= maxNodeDepth){
                continue;
            }
        } else if(maxNodeDepth){
            if(cur.nodesTraversed >= maxNodeDepth){
                continue;
            }
        }
        for(var lIndex = 0; lIndex < L.length; lIndex++){
            var d = L[lIndex];
            //Get the accumulated weight up to this point
            var runningCost = cur.travelCost + dist.call(cur.source, d);
            if(d.bestF){
                if(runningCost + dist.call(d, end) < d.bestF){
                    for(var i = 0; i < open.leaves.length; i++){
                        var n = open.leaves[i];
                        if(n.source.distinction == d.distinction){
                            open.remove(i);
                            break;
                        }
                    }
                } else{
                    continue;
                }
            }
            // Add each adjacent node to the heap.
            //console.log(d.distinction+' Open Length: '+open.leaves.length)
            open.enqueue(new pathNode(
                d, cur, runningCost, dist.call(d, end), cur.nodesTraversed+1
            ));
            if(maxNodes && open.leaves.length > maxNodes){
                open.leaves.splice(open.leaves.length-1);
            }
        }
    }
    var temp;
    while(!open.isEmpty()){
        temp = open.dequeue();
        temp.cleanup();
    }
    if(path){
        path.reverse();
    }
    return path;
};
var dijkstra = function (start, dist, finished, maxNodeDepth){
    var open = priorityQueue.constructor.call(
        Object.create(priorityQueue),
        pathWeightCompare
    );
    var closed = {};
    var ret = [];
    var path;
    open.enqueue(new pathNode(start, null, 0, 0, 0));
    while(!open.isEmpty()){
        var cur = open.dequeue();
        var isDone = false;
        closed[cur.source.distinction] = cur.source;
        isDone = finished(start, cur.source, cur.travelCost);
        if(isDone){
            var tmpNode = cur;
            path = [];
            path.push(tmpNode.source);
            while(tmpNode.prevNode){
                tmpNode = tmpNode.prevNode;
                path.push(tmpNode.source);
            }
            ret.push(path);
        }
        if(isDone == P_DIJKSTRA_FINISHED){
            break;
        }
        var L = cur.source.tile.adjacent(cur.source, closed);
        if(maxNodeDepth && cur.nodesTraversed >= maxNodeDepth){
            continue;
        }
        for(var lIndex = 0; lIndex < L.length; lIndex++){
            var d = L[lIndex];
            //Get the accumulated weight up to this point
            var runningCost = cur.travelCost + dist.call(cur.source, d);
            if(d.bestF){
                if(runningCost < d.bestF){
                    for(var i = 0; i < open.leaves.length; i++){
                        var n = open.leaves[i];
                        if(n.source.distinction == d.distinction){
                            open.remove(i);
                            break;
                        }
                    }
                } else{
                    continue;
                }
            }
            open.enqueue(new pathNode(
                d, cur, runningCost, 0, cur.nodesTraversed+1
            ));
        }
    }
    var temp;
    while(!open.isEmpty()){
        temp = open.dequeue();
        temp.cleanup();
    }
    if(path){
        path.reverse();
    }
    return ret;
};
var dijkstraRange = function (start, dist, maxRange){
    var open = Object.instantiate(priorityQueue, pathWeightCompare);
    var closed = {};
    var path = [];
    open.enqueue(new pathNode(start,null,0,0,0));
    while(!open.isEmpty()){
        var cur = open.dequeue();
        closed[cur.source.distinction] = cur.source;
        if(cur.nodesTraversed >= maxRange){
            continue;
        }
        var L = cur.source.tile.adjacent(cur.source, closed);
        for(var lIndex = 0; lIndex < L.length; lIndex++){
            //Get the accumulated weight up to this point
            var d = L[lIndex];
            var runningCost = cur.travelCost + dist.call(cur.source, d);
            if(d.bestF){
                if(runningCost < d.bestF){
                    for(var i = 0; i < open.leaves.length; i++){
                        var n = open.leaves[i];
                        if(n.source.distinction == d.distinction){
                            open.remove(i);
                            break;
                        }
                    }
                } else{
                    continue;
                }
            }
            open.enqueue(new pathNode(
                d, cur, runningCost, 0, cur.nodesTraversed+1)
            );
        }
    }
    var temp;
    while(!open.isEmpty()){
        temp = open.dequeue();
        temp.cleanup();
    }
    for(var key in closed){
        if(closed.hasOwnProperty(key)){
            temp = closed[key];
            path.push(temp);
            delete closed[key];
        }
    }
    return path;
};