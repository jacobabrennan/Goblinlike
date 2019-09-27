

//== Random ====================================================================

//-- Exports -------------------------------------
export {
    randomInterval,
    gaussRandom,
    pick,
    arrayPick,
}

//-- Random Number Generation --------------------
const randomInterval = function (min, max){
    // Returns a randomly select integer between min and max, inclusive.
    if(!min){ min = 0;}
    if(!max){ max = min; min = 0;}
    const range = max-min;
    return min + Math.floor(Math.random()*(range+1));
};
const gaussRandom = function (mean, standardDeviation){
    /**
     *  Generates random integers with a gaussian (normal) distribution about
     *      the specified mean, with the specified standard deviation.
     *  Returns an integer.
     **/
    let leg1;
    let leg2;
    do{
        leg1 = Math.random();
        leg2 = Math.random();
    } while(!(leg1 && leg2));
    let normal = Math.cos(2*Math.PI*leg2) * Math.sqrt(-(2*Math.log(leg1)));
    let gaussian = mean + normal*standardDeviation;
    return Math.round(gaussian);
};

//-- Random Selection ----------------------------
const pick = function (){
    return arrayPick(arguments);
};
const arrayPick = function (sourceArray){
    // Returns a randomly chosen element from the source array.
    const randomIndex = Math.floor(Math.random()*sourceArray.length);
    const randomElement = sourceArray[randomIndex];
    if(!randomElement){
        console.log("Problem: "+randomIndex+'/'+sourceArray.length);
    }
    return randomElement;
};
