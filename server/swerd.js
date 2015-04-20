/* Thanks to Christopher Pound ( christopherpound.com ), by way of LummoxJR ( byond.com/developer/LummoxJR/sWerd ).
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
var sWerd = (function (){
    var repeat = function (ruleArray){
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
    return {
        rules: {
            // Orc Rules
            W: repeat(['VCR','VRK','BVXK*2','VXK*2','BVXR*2','VXR*2']), // Master Rule
            X: repeat(['MV']), // Recursion, if you wanted it.
            U: repeat(['V*5','i','e']), // Beginning Vowels
            V: repeat(['a*5','o*5','u*3','ai','oe']), // Vowels
            B: repeat(['C*2','CR']), // Beginning Consonants
            C: repeat(['c','d','g','k','n','p','t','w']), // Consonants
            M: repeat(['C*10','CR*10','ll','x','y','ff','tt']), // Middle Consonants
            K: repeat(['c','d','g','m','r']), // Ending Consonants
            R: repeat(['h','l','r','s']), // Frickatives
            // Scroll Rules
            S: repeat(['DOD','DODO']),
            D: repeat(['f','h','j','l','n','r','s','v','z','dj','hr','mn','st','th']), // Consonant
            O: repeat(['a*10','e*10','i*10','oi*2','ae*5','y'])
        },
        /*rules: { // Elf Test
            //W: repeat(['BVK*2','VCR','BVMVK*10','VMVK*3','BVMVR','VMVR']), // Master Rule
            W: repeat(['UMVME','UMVK','UMVMVK','BVME','BVMVME','BVMVK']),
            U: repeat(['a*3','e*5','i*10','ae','ia']), // Beginning Vowels
            V: repeat(['a*3','e*5','i*10','u*2','ai','oe','ae','io','eau','eo','ia']), // Vowels
            E: repeat(['ia*3','a*4','e*4','i','ae*2','io']), // Ending Vowels
            B: repeat(['C*2','K','CR']), // Beginning Consonants
            C: repeat(['c','k','p','t','w','y']), // Consonants
            M: repeat(['C*10','CR*10','t','y','f']), // Middle Consonants
            K: repeat(['f','l','h','s','y']), // Ending Consonants
            R: repeat(['h','f','s']) // Frickatives
            None: bdgjmnqrvxz
        },*/
        a: function (){
            var W = this.substitute('W', 1);
            var S = W.S;
            S = S.charAt(0).toUpperCase()+S.substring(1);
            return W.R+': '+S;
        },
        full: function (){
            var W = this.substitute('W');
            var X = this.substitute('X');
            W = W.charAt(0).toUpperCase()+W.substring(1);
            X = X.charAt(0).toUpperCase()+X.substring(1);
            return (W+' '+X);
        },
        name: function (){
            var W = this.substitute('W', 1);
            var S = W.S;
            if(S.indexOf('coc') != -1){
                return this.name();
            }
            S = S.charAt(0).toUpperCase()+S.substring(1);
            return S;
        },
        scroll: function (){
            return this.substitute('S');
        },
        substitute: function (rule, temp){
            var subList = this.rules[rule];
            var selection;
            if(subList){
                selection = arrayPick(subList);
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
})();