

/*===========================================================================
 *
 *  !!!!!!!!!!!! Incorrect (copy/pasted) documentation) !!!!!!!!!!!!!!!!!!!!!
 *  TODO: Document.
 *  The gameplay driver is single point of contact between the game and
 *      the player once the game is running. It collects all input from the
 *      player, via keyboard, touch, and mouse, and displays the game state
 *      via a map and a menuing system.
 *  It is not a prototype, and should not be instanced.
 *      
  ===========================================================================*/

client.drivers.title = Object.create(driver, {
    displayPane: {value: undefined, writable: true},
    picturePane: {value: undefined, writable: true},
    setup: {value: function (configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
         **/
        this.picturePane = document.createElement('pre');
        this.picturePane.setAttribute('id', 'title_picture');
        this.picturePane.setAttribute('class', 'pane');
        this.displayPane = document.createElement('div');
        this.displayPane.setAttribute('id', 'title');
        this.displayPane.setAttribute('class', 'pane');
        var titleElement = document.createElement('span');
        var linkNewGame = document.createElement('a');
        var linkAbout = document.createElement('a');
        titleElement.textContent = 'Goblin-like';
        linkNewGame.textContent = 'Space- New Game';
        linkAbout.textContent = 'Esc- About';
        linkNewGame.setAttribute('class', 'control');
        linkAbout.setAttribute('class', 'control');
        linkNewGame.addEventListener('click', this.newGame.bind(this));
        //
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(titleElement);
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(linkNewGame);
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        //this.displayPane.appendChild(linkAbout);
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
        this.displayPane.appendChild(document.createElement('br'));
    }},
    command: {value: function (command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        switch(command){
            case COMMAND_ENTER:
                this.newGame();
                return true;
            case COMMAND_CANCEL:
                return true;
        }
        return false;
    }},
    display: {value: function (options){
        // TODO: Document.
        client.skin.updateStatus('Version '+VERSION);
        var picture = '';
        picture += '                     '+'\n';
        picture += '                     '+'\n';
        picture += '                     '+'\n';
        picture += '               /\\   '+'\n';
        picture += '              /D \\ _ '+'\n';
        picture += '____-----  __/   \\\\  '+'\n';
        picture += ' _ ____     /     \\\\ '+'\n';
        picture += '         /\\/        \\'+'\n';
        picture += '        /   \\     \\\\ '+'\n';
        picture += '       /   \\\\      \\'+'\n';
        picture += '     _/     \\ \\  /   '+'\n';
        picture += '    / \\      \\  /   \\'+'\n';
        picture += '  |/|\\ \\     \\\\/     '+'\n';
        picture += '||/|  | |  |  /      '+'\n';
        picture += 'T\\|T|| \\ |  |/     | '+'\n';
        picture += '||/T\\T ||  |    | /T\\'+'\n';
        picture += '/T|T/T\\ : |  | |.|/T\\'+'\n';
        picture += '//T\\/T\\~~~:.: . /T\\T|'+'\n';
        picture += '|/T:|:~-  ~~~: ./T\\/T'+'\n';
        picture += 'T\\:::~ -   - ~:  .:/T'+'\n';
        picture += 'T\\|: -  - -  ~ :. .::';
        this.picturePane.textContent = picture;
    }},
    focused: {value: function (){
        this.display();
        //this.focus(client.drivers.gameplay.drivers.menu);
        client.skin.registerPanel(this.displayPane, true);
        client.skin.registerPanel(this.picturePane);
    }},
    newGame: {value: function (){
        // TODO: Document.
        var gameplayDriver = client.drivers.gameplay;
        /**
         *  This function spawns a new hero when the game begins. It directs
         *      the memory to blank out and prep for new data, places the hero,
         *      and sets the game in motion.
         *  It does not return anything.
         **/
        var gameDriver = client.drivers.gameplay;
        gameDriver.memory.blank();
        client.networking.sendMessage(COMMAND_NEWGAME, {});
        client.focus(gameplayDriver);
    }}
});