// TODO: Document.
var client = Object.create(driver, {
    drivers: {value: {}, writable: true},
    setup: {value: function (configuration){
        this.keyCapture.setup(configuration);
        this.skin.setup(configuration);
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
}

client.preferencesLegacy = {
    '12': WAIT,
    '33': NORTHEAST,
    '34': SOUTHEAST,
    '35': SOUTHWEST,
    '36': NORTHWEST,
    '37': WEST,
    '38': NORTH,
    '39': EAST,
    '40': SOUTH,
    '27': CANCEL,
    '63': COMMAND_HELP,
   '117': COMMAND_USE,
   '105': COMMAND_USE,
   '103': COMMAND_GET,
   '100': COMMAND_DROP,
   '108': COMMAND_LOOK,
   '101': COMMAND_EQUIP,
   '116': COMMAND_UNEQUIP,
    '60': COMMAND_STAIRS,
    '62': COMMAND_STAIRS,
   '102': COMMAND_FIRE,
    '70': COMMAND_THROW,
    '99': COMMAND_CLOSE,
    '91': COMMAND_PAGEDOWN,
    '93': COMMAND_PAGEUP
};
client.preferences = {
	"Up": NORTH,
	"Down": SOUTH,
	"Left": WEST,
	"Right": EAST,
	"ArrowUp": NORTH,
	"ArrowDown": SOUTH,
	"ArrowLeft": WEST,
	"ArrowRight": EAST,
    "Home": NORTHWEST,
    "End": SOUTHWEST,
    "PageUp": NORTHEAST,
    "PageDown": SOUTHEAST,
    "Unidentified": WAIT,
    "Esc": CANCEL,
    "Escape": CANCEL,
	/*"w": NORTH,
	"s": SOUTH,
	"a": WEST,
	"d": EAST,*/
    "?": COMMAND_HELP,
    "u": COMMAND_USE,
    "i": COMMAND_USE,
    "g": COMMAND_GET,
    "d": COMMAND_DROP,
    "l": COMMAND_LOOK,
    "e": COMMAND_EQUIP,
    "t": COMMAND_UNEQUIP,
    "<": COMMAND_STAIRS,
    ">": COMMAND_STAIRS,
    "f": COMMAND_FIRE,
    "F": COMMAND_THROW,
    "c": COMMAND_CLOSE,
    "[": COMMAND_PAGEDOWN,
    "]": COMMAND_PAGEUP
};

// TODO: Document.
client.keyCapture = {
	setup: function (configuration){
        // TODO: Document.
        document.body.addEventListener("keydown", function(e){
            return client.keyCapture.keyPress(e);
        });
	},
	keyPress: function (e){
        // TODO: Document.
        var keyCode = ''+(e.keyCode || e.which);
        var key = String.fromCharCode(keyCode);// = e.key;
        var command = client.preferencesLegacy[keyCode];
        /*if(!command){
            command = client.preferences[key];
        } else{
            key = String.fromCharCode(keyCode);
        }*/
        client.command(command, {
            key: key,
            keyCode: keyCode
        });
	}
};