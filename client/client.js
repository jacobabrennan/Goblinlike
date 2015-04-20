// TODO: Document.
var client = Object.create(driver, {
    drivers: {value: {}, writable: true},
    setup: {value: function (configuration){
        this.skin.setup(configuration);
        this.keyCapture.setup(configuration);
        this.drivers.title.setup(configuration);
        this.drivers.gameplay.setup(configuration);
        this.focus(this.drivers.title);
    }}
    /*currentFocus: undefined,
    focus: function (newFocus){
        if(this.currentFocus){
            this.blur();
        }
        this.currentFocus = newFocus;
        if(this.currentFocus && this.currentFocus.focused){
            this.currentFocus.focused();
        }
    },
    blur: function (){
        if(this.currentFocus.blurred){
            this.currentFocus.blurred();
        }
        this.currentFocus = undefined;
    },
    focused: function (){},
    blurred: function (){},
    command: {value: function (which){
        if(!(this.currentFocus && this.currentFocus.command)){ return false;}
        return this.currentFocus.command(which);
    }},
    display: function (){
        if(!(this.currentFocus && this.currentFocus.display)){ return false;}
        return this.currentFocus.display(this.currentFocus, arguments);
    }*/
});

client.networking = {
    sendMessage: function (command, options){
        gameManager.clientCommand(command, options);
    },
    recieveMessage: function (command, options){
        switch(command){
            case COMMAND_NEWGAME:
                client.drivers.gameplay.newGame(options);
                break;
            case COMMAND_GAMEOVER:
                client.drivers.gameplay.gameOver(options);
                break;
            case COMMAND_SENSE:
                client.drivers.gameplay.memory.sense(options);
                break;
            case COMMAND_TURN:
                client.drivers.gameplay.takeTurn(options);
                break;
        }
    }
};
client.preferences = {
    /* Special Key Names: backspace, tab, enter, return, capslock, esc, escape,
       space, pageup, pagedown, end, home, left, up, right, down, ins, del,
       plus.*/
    // COMMAND_NONE needed to register alphabet keypresses with Mousetrap.
    "up": NORTH,
	"down": SOUTH,
	"left": WEST,
	"right": EAST,
    "home": NORTHWEST,
    "end": SOUTHWEST,
    "pageup": NORTHEAST,
    "pagedown": SOUTHEAST,
    //"Unidentified": WAIT, // See setup for special case.
    "escape": CANCEL,
    "a": COMMAND_NONE,
    "b": COMMAND_NONE,
    "c": COMMAND_CLOSE,
    "d": COMMAND_DROP,
    "e": COMMAND_EQUIP,
    "f": COMMAND_FIRE,
    "g": COMMAND_GET,
    "h": COMMAND_NONE,
    "i": COMMAND_USE,
    "j": COMMAND_NONE,
    "k": COMMAND_NONE,
    "l": COMMAND_LOOK,
    "m": COMMAND_NONE,
    "n": COMMAND_NONE,
    "o": COMMAND_NONE,
    "p": COMMAND_NONE,
    "q": COMMAND_USE, // Alias for those who 'quaff' potions.
    "r": COMMAND_USE, // Alias for those who 'read' scrolls.
    "s": COMMAND_NONE,
    "t": COMMAND_UNEQUIP,
    "u": COMMAND_USE,
    "v": COMMAND_NONE,
    "w": COMMAND_NONE,
    "x": COMMAND_NONE,
    "y": COMMAND_NONE,
    "z": COMMAND_NONE,
    "F": COMMAND_THROW,
    "?": COMMAND_HELP,
    "<": COMMAND_STAIRS,
    ">": COMMAND_STAIRS,
    "[": COMMAND_PAGEDOWN,
    "]": COMMAND_PAGEUP,
    "space": COMMAND_ENTER,
    "enter": COMMAND_ENTER
    //"return": COMMAND_ENTER
        // Don't use. Mousetrap will fire events for both enter AND return.
};
/*client.preferencesLegacy = {
    '12': WAIT, '33': NORTHEAST, '34': SOUTHEAST, '35': SOUTHWEST, '36':
    NORTHWEST, '37': WEST, '38': NORTH, '39': EAST, '40': SOUTH, '27': CANCEL,
   '191': COMMAND_HELP, '117': COMMAND_USE, '105': COMMAND_USE, '103':
   COMMAND_GET, '100': COMMAND_DROP, '108': COMMAND_LOOK, '101': COMMAND_EQUIP,
   '116': COMMAND_UNEQUIP, '190': COMMAND_STAIRS, '188': COMMAND_STAIRS, '102':
   COMMAND_FIRE,
    '70': COMMAND_THROW, '99': COMMAND_CLOSE,
   '219': COMMAND_PAGEDOWN, '221': COMMAND_PAGEUP,
    '81': COMMAND_USE, // Alias for those who 'quaff' potions.
    '82': COMMAND_USE // Alias for those who 'read' scrolls.
};*/

// TODO: Document.
client.keyCapture = {
	setup: function (configuration){
        // TODO: Document.
        // TODO: Change focus to container in 'production'.
        //client.skin.container.addEventListener('keydown', function (e){
        document.body.addEventListener('keydown', function (e){
            if(e.keyCode == 12){
                client.command(COMMAND_WAIT, {'key': null});
            }
        });
        var trapCreator = function (key, command){
            return function(){
                client.command(command, {'key': key});
            };
        };
        //this.mousetrap = Mousetrap(client.skin.container);
        this.mousetrap = Mousetrap(document.body);
        for(var key in client.preferences){
            if(client.preferences.hasOwnProperty(key)){
                var command = client.preferences[key];
                this.mousetrap.bind(key, trapCreator(key, command));
            }
        }
	}/*,
	keyPress: function (e){
        // TODO: Document.
        // This is a mess because of Google Chrome. Back in 2009 the devs
        // Decided that a bug in Internet Explorer had to be matched by a bug in
        // Chrome, leading to messed up behavior with key presses. Also, they
        // haven't implemented keyboardEvent.key yet.
        console.log(e);
        var keyCode = ''+(e.keyCode || e.which);
        var key = e.key || String.fromCharCode(keyCode);// = e.key;
        if(!e.shiftKey){
            key = key.toLowerCase(key);
        }
        var command = client.preferences[key];
        if(!command){
            command = client.preferencesLegacy[keyCode];
        }
        / *if(!command){
            command = client.preferences[key];
        } else{
            key = String.fromCharCode(keyCode);
        }* /
        client.command(command, {
            key: key,
            keyCode: keyCode
        });
	}*/
};