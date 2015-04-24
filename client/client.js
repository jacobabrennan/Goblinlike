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
                //if(client.drivers.gameplay.memory.statusUpdate){
                client.drivers.gameplay.display();
                //}
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
    "escape": COMMAND_CANCEL,
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
    "r": COMMAND_CAMP,
    "s": COMMAND_NONE,
    "t": COMMAND_UNEQUIP,
    "u": COMMAND_USE,
    "v": COMMAND_NONE,
    "w": COMMAND_NONE,
    "x": COMMAND_NONE,
    "y": COMMAND_NONE,
    "z": COMMAND_NONE,
    "F": COMMAND_THROW,
    "L": COMMAND_LEADERSHIP,
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
	}
};