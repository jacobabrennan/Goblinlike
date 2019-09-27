

//== Swerd Documentation =======================================================

/* Thanks to Christopher Pound ( christopherpound.com ),
by way of LummoxJR ( byond.com/developer/LummoxJR/sWerd ).
/*

Enter W
Pick Sequence
Find Sub-Rules and substitute recursively
setTimeout(function (){
var finishedPatterns = [];
sWerd.rules.W.forEach(function (pattern){
    if(finishedPatterns.indexOf(pattern) != -1){
        return;
    }
    finishedPatterns.push(pattern);
    var C = document.createElement('center');
    document.body.appendChild(C);
    C.style.color='white';
    for(var i = 0; i<50; i++){
        var N = sWerd.substitute(pattern);
        N = N.charAt(0).toUpperCase()+N.substring(1);
        var E = document.createElement('span');
        E.textContent = N+', ';
        C.appendChild(E);
    }
    C.appendChild(document.createElement('br'))
    C.appendChild(document.createElement('br'))
})
//
    var C = document.createElement('center');
    document.body.appendChild(C);
    for(var i = 0; i < 100; i++){
    C.style.color='white';
        var N = sWerd.name();
        N = N.charAt(0).toUpperCase()+N.substring(1);
        var E = document.createElement('span');
        E.textContent = N+', ';
        C.appendChild(E);
    }
}, 100);*/


//== Swerd =====================================================================

//-- Dependencies --------------------------------
import * as random from '../shared/ramdom.js';

//-- Utility -------------------------------------
const sWerdRepeat = function (ruleArray){
    var finishArray = [];
    for(var I = 0; I < ruleArray.length; I++){
        var entry = ruleArray[I];
        if(entry.indexOf('*') == -1){
            finishArray.push(entry);
            continue;
        }
        var rule = entry.substring(0,entry.indexOf('*'));
        var repeats = parseInt(entry.substring(entry.indexOf('*')+1));
        for(var rI = 0; rI < repeats; rI++){
            finishArray.push(rule);
        }
    }
    return finishArray;
};

//-- Definition ----------------------------------
export default {
    rules: {
        // Orc Rules
        W: sWerdRepeat(['VCR','VRK','BVXK*2','VXK*2','BVXR*2','VXR*2']), // Master Rule
        X: sWerdRepeat(['MV']), // Recursion, if you wanted it.
        U: sWerdRepeat(['V*5','i','e']), // Beginning Vowels
        V: sWerdRepeat(['a*5','o*5','u*3','ai','oe']), // Vowels
        B: sWerdRepeat(['C*2','CR']), // Beginning Consonants
        C: sWerdRepeat(['c','d','g','k','n','p','t','w']), // Consonants
        M: sWerdRepeat(['C*10','CR*10','ll','x','y','ff','tt']), // Middle Consonants
        K: sWerdRepeat(['c','d','g','m','r']), // Ending Consonants
        R: sWerdRepeat(['h','l','r','s']), // Frickatives
        // Scroll Rules
        S: sWerdRepeat(['DOD','DODO']),
        D: sWerdRepeat(['f','h','j','l','n','r','s','v','z','dj','hr','mn','st','th']), // Consonant
        O: sWerdRepeat(['a*10','e*10','i*10','oi*2','ae*5','y'])
    },
    /*rules: { // Elf Test
        //W: sWerdRepeat(['BVK*2','VCR','BVMVK*10','VMVK*3','BVMVR','VMVR']), // Master Rule
        W: sWerdRepeat(['UMVME','UMVK','UMVMVK','BVME','BVMVME','BVMVK']),
        U: sWerdRepeat(['a*3','e*5','i*10','ae','ia']), // Beginning Vowels
        V: sWerdRepeat(['a*3','e*5','i*10','u*2','ai','oe','ae','io','eau','eo','ia']), // Vowels
        E: sWerdRepeat(['ia*3','a*4','e*4','i','ae*2','io']), // Ending Vowels
        B: sWerdRepeat(['C*2','K','CR']), // Beginning Consonants
        C: sWerdRepeat(['c','k','p','t','w','y']), // Consonants
        M: sWerdRepeat(['C*10','CR*10','t','y','f']), // Middle Consonants
        K: sWerdRepeat(['f','l','h','s','y']), // Ending Consonants
        R: sWerdRepeat(['h','f','s']) // Frickatives
        None: bdgjmnqrvxz
    },*/
    a() {
        var W = this.substitute('W', 1);
        var S = W.S;
        S = S.charAt(0).toUpperCase()+S.substring(1);
        return W.R+': '+S;
    },
    full() {
        var W = this.substitute('W');
        var X = this.substitute('X');
        W = W.charAt(0).toUpperCase()+W.substring(1);
        X = X.charAt(0).toUpperCase()+X.substring(1);
        return (W+' '+X);
    },
    name() {
        var W = this.substitute('W', 1);
        var S = W.S;
        if(S.indexOf('coc') != -1){
            return this.name();
        }
        S = S.charAt(0).toUpperCase()+S.substring(1);
        return S;
    },
    scroll() {
        return this.substitute('S');
    },
    substitute(rule, temp) {
        var subList = this.rules[rule];
        var selection;
        if(subList){
            selection = random.arrayPick(subList);
        } else if(rule && ((rule.length != 1) || (rule.toUpperCase() != rule))){
            selection = rule;
        } else{
            return rule;
        }
        var substitution = '';
        for(var charI = 0; charI < selection.length; charI++){
            var character = selection.charAt(charI);
            if(character.toLowerCase() == character){
                substitution += character;
            } else{
                substitution += this.substitute(character);
            }
        }
        if(temp){
            return {R: selection, S: substitution};
        }
        return substitution;
    }
};
