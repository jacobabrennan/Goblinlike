

//== Class Extension ===========================================================
/*
    This is legacy code from before ECMA2015, and needs to be factored out.
*/

export default function extend(aPrototype, extention){
    const valueConfiguration = {};
    for(let key in extention){
        if(!extention.hasOwnProperty(key)){ continue;}
        const keyValue = extention[key];
        if(keyValue && keyValue.value){
            valueConfiguration[key] = keyValue;
            continue;
        }
        valueConfiguration[key] = {
            value: extention[key],
            configurable: true,
            enumerable: true,
            writable: true
        }
    }
    return Object.create(aPrototype, valueConfiguration);
}
