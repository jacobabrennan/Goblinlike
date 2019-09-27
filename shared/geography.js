

//== Geography =================================================================

//-- Exports -------------------------------------
export {
    distance,
    getStepCoords,
    directionTo,
}

//-- Geography Utilities -------------------------
const distance = function (startX, startY, endX, endY){
    const deltaX = Math.abs(endX-startX);
    const deltaY = Math.abs(endY-startY);
    return Math.max(deltaX, deltaY);
};
const getStepCoords = function (startX, startY, direction){
    if(direction & NORTH){ startY++;}
    if(direction & SOUTH){ startY--;}
    if(direction & EAST ){ startX++;}
    if(direction & WEST ){ startX--;}
    return {x: startX, y: startY};
};
const directionTo = function (startX, startY, endX, endY){
    let deltaX = endX-startX;
    let deltaY = endY-startY;
    if(!deltaX && !deltaY){
        return 0;
    }
    let direction = 0;
    let angle = Math.atan2(deltaY, deltaX); // Reversed, don't know why.
    angle /= Math.PI;
    angle /= 2; // Convert to Tau.
    angle += 1/16;
    if(angle < 0){
        angle += 1;
    } else if(angle > 1){
        angle -= 1;
    }
    if     (angle >=   0 && angle < 1/8){ direction = EAST     ;}
    else if(angle >= 1/8 && angle < 2/8){ direction = NORTHEAST;}
    else if(angle >= 2/8 && angle < 3/8){ direction = NORTH    ;}
    else if(angle >= 3/8 && angle < 4/8){ direction = NORTHWEST;}
    else if(angle >= 4/8 && angle < 5/8){ direction = WEST     ;}
    else if(angle >= 5/8 && angle < 6/8){ direction = SOUTHWEST;}
    else if(angle >= 6/8 && angle < 7/8){ direction = SOUTH    ;}
    else if(angle >= 7/8 && angle < 8/8){ direction = SOUTHEAST;}
    return direction;
};
