

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

client.drivers.gameOver = Object.create(driver, {
    displayPane: {value: undefined, writable: true},
    displayPane2: {value: undefined, writable: true},
    characterData: {value: undefined, writable: true},
    setup: {value: function (configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
         **/
        this.displayPane = document.createElement('div');
        this.displayPane.setAttribute('id', 'gameOverMenu');
        this.displayPane.setAttribute('class', 'pane');
        this.displayPane2 = document.createElement('div');
        this.displayPane2.setAttribute('id', 'gameOverMap');
        this.displayPane2.setAttribute('class', 'pane');
    }},
    acceptDeath: {value: function (characterData){
        this.characterData = characterData;
    }},
    command: {value: function (command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        client.focus(client.drivers.title);
        return false;
    }},
    display: {value: function (options){
        // TODO: Document.
    }},
    focused: {value: function (){
        this.display();
        //this.focus(client.drivers.gameplay.drivers.menu);
        client.skin.registerPanel(this.displayPane, true);
        client.skin.registerPanel(this.displayPane2, true);
    }},
    blurred: {value: function (){
        this.characterData = null;
    }}
});