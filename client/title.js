

/*===========================================================================
 *      
  ===========================================================================*/

//-- Imports -------------------------------------
import extend from './extend.js';
import sWerd from '../shared/swerd.js';
import client from './client.js';
import driver from './driver.js';

//------------------------------------------------
client.drivers.title = extend(driver, {
    drivers: {},
    setup(configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
         **/
    },
    command(command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        if(options && options.key){
            if(options.key == 'a' || options.key == 'A'){
                command = COMMAND_ENTER;}
            if(options.key == 'b' || options.key == 'B'){
                command = COMMAND_HELP;}
        }
        switch(command){
            case COMMAND_ENTER:
            case COMMAND_CANCEL:
                clearInterval(this.drawInterval);
                if(localStorage.getItem(SAVE_STORAGE)){
                    this.loadGame();
                } else{
                    this.newGame();
                }
                return true;
            case COMMAND_HELP:
                clearInterval(this.drawInterval);
                this.focus(this.drivers.about);
                return true;
        }
        return false;
    },
    focused(){
        this.display();
        //this.focus(client.drivers.gameplay.drivers.menu);
    },
    blurred(){
        this.focus(null);
    },
    newGame(){
        // TODO: Document.
        /**
         *  This function spawns a new hero when the game begins. It directs
         *      the memory to blank out and prep for new data, places the hero,
         *      and sets the game in motion.
         *  It does not return anything.
         **/
        this.focus(this.drivers.rollCharacter);
        /*clearInterval(this.drawInterval);
        var gameDriver = client.drivers.gameplay;
        gameDriver.memory.blank();
        client.networking.sendMessage(COMMAND_NEWGAME, {});
        client.focus(gameDriver);*/
    },
    loadGame() {
        // TO DO: Document.
        client.skin.clearCommands();
        client.skin.fillRect(0, 0, displaySize*2, displaySize, '#000');
        clearInterval(this.drawInterval);
        var gameDriver = client.drivers.gameplay;
        gameDriver.memory.blank();
        client.networking.sendMessage(COMMAND_LOADGAME);
        client.focus(gameDriver);
        gameDriver.display();
    },
    display(options){
        // TODO: Document.
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        client.skin.clearCommands();
        var drawMountain = function (){
            client.skin.drawString(0,20,'                                          ','#008');
            client.skin.drawString(0,19,'                                          ','#008');
            client.skin.drawString(0,18,'                                          ','#008');
            client.skin.drawString(0,17,'                                    /\\    ','#008');
            client.skin.drawString(0,16,'                                   /  \\ _ ','#008');
            client.skin.drawString(0,15,'                     ____-----  __/   \\\\  ','#008');
            client.skin.drawString(0,14,'                      _ ____     /     \\\\ ','#008');
            client.skin.drawString(0,13,'                              /\\/        \\','#008');
            client.skin.drawString(0,12,'                             /   \\     \\\\ ','#008');
            client.skin.drawString(0,11,'                            /   \\\\      \\ ','#008');
            client.skin.drawString(0,10,'                          _/     \\ \\  /   ','#008');
            client.skin.drawString(0, 9,'                         / \\      \\  /   \\','#008');
            client.skin.drawString(0, 8,'\\                 _    |/|\\ \\     \\\\/     ','#008');
            client.skin.drawString(0, 7,' \\              _/ \\ ||/|  | |  |  /      ','#008');
            client.skin.drawString(0, 6,' \\\\___         /  \\ |T\\|T|| \\ |  |/     | ','#008');
            client.skin.drawString(0, 5,'\\ \\   \\_      /   |/T||/T\\T ||  |    | /T\\','#008');
            client.skin.drawString(0, 4,':\\|  \\ \\\\__|_/|  /T\\T/T|T/T\\ : |  | |.|/T\\','#008');
            client.skin.drawString(0, 3,'|:.\\|_\\__\\/T\\|_|_/T|\\//T\\/T\\~~~:.: . /T\\T|','#008');
            client.skin.drawString(0, 2,':.:.:. . ./T\\ /T\\//T\\|/T:|:~-  ~~~: ./T\\/T','#008');
            client.skin.drawString(0, 1,'.|  .   .:/T\\:/T\\:/T/T\\:::~ -   - ~:  .:/T','#008');
            client.skin.drawString(0, 0,': .   .  .::.:/T\\|::/T\\|: -  - -  ~ :. .::','#008');
            if(localStorage.getItem(SAVE_STORAGE)){
                client.skin.drawCommand(8, 11, 'A', 'Start', COMMAND_ENTER);
            } else{
                client.skin.drawCommand(6, 11, 'A', 'Continue', COMMAND_ENTER);
            }

            //client.skin.drawCommand(8,  9, 'B', 'About', COMMAND_HELP);
        };
        var maxCloud = 40;
        var cloudFalloff = 0;
        var drawClouds = function (){
            var clouds = '';
            clouds += '   **********          ';
            clouds += ' *** *     * * **    **';
            clouds += '**  *    *  * **    * *';
            clouds += '**         **        **';
            clouds += ' ** *    * ***        *';
            clouds += '   *  *** *            ';
            clouds += '  ****  **             ';
            clouds += '      ***              ';
            var cloudW = 23;
            var cloudH = 8;
            var cloudX = 19;
            var cloudY = displaySize-cloudH-3;
            var cloudFade = cloudFalloff/maxCloud;
            //var cloudRed = Math.round(80*cloudFade);
            var cloudGrey = Math.round(64*cloudFade);
            var cloudBack = 'rgb('+cloudGrey+','+cloudGrey+','+cloudGrey+')';
            for(var posY = 0; posY < cloudH; posY++){
                for(var posX = 0; posX < cloudW; posX++){
                    var fixedY = cloudH - posY;
                    var cloudI = posY*cloudW + posX;
                    var cloudC = clouds.charAt(cloudI);
                    if(cloudC === ' '){ continue;}
                    var cloudColor = cloudBack;
                    if(cloudC != '*'){
                        cloudColor = '#fff';
                    }
                    client.skin.drawCharacter(
                        posX+cloudX,
                        fixedY+cloudY,
                        cloudC,
                        cloudColor
                    );
                }
            }
        };
        var lightningStrike = function (){
            var lightning = '';
            lightning += '  \\      ';
            lightning += '   \\     ';
            lightning += '   |\\    ';
            lightning += '   | \\   ';
            lightning += '   /  \\  ';
            lightning += '       \\ ';
            lightning += '  | \\   \\';
            lightning += '  / /\\   ';
            lightning += ' /  \\    ';
            lightning += '/\\       ';
            lightning += '| \\      ';
            var lightningW = 9;
            var lightningH = 11;
            var lightningX = 24;
            var lightningY = displaySize-lightningH-1;
            cloudFalloff = maxCloud;
            for(var posY = 0; posY < lightningH; posY++){
                for(var posX = 0; posX < lightningW; posX++){
                    var fixedY = lightningH - posY;
                    var lightningI = posY*lightningW + posX;
                    var lightningC = lightning.charAt(lightningI);
                    if(lightningC === ' '){ continue;}
                    client.skin.drawCharacter(
                        posX+lightningX,
                        fixedY+lightningY,
                        lightningC,
                        '#ff0'
                    );
                }
            }
        };
        var colorTime = 256;
        var spectrumTime = colorTime*3;
        var currentTime = Math.round(colorTime/3); // Yellow
        this.drawInterval = setInterval(function (){
            client.skin.status('Version '+VERSION, '#008');
            drawMountain();
            currentTime++;
            var hue = currentTime%spectrumTime;
            var red = 0;
            var green = 0;
            var blue = 0;
            if(hue < spectrumTime/3){
                red = colorTime-hue;
                green = hue;
            } else if(hue < spectrumTime*2/3){
                green = colorTime-(hue-colorTime);
                blue = hue-colorTime;
            } else{
                blue = colorTime-(hue-(colorTime*2));
                red = hue-(colorTime*2);
            }
            red   = Math.floor(Math.sin((Math.PI/2)*(red  /colorTime))*256);
            blue  = Math.floor(Math.sin((Math.PI/2)*(blue /colorTime))*256);
            green = Math.floor(Math.sin((Math.PI/2)*(green/colorTime))*256);
            var color = 'rgb('+red+','+green+','+blue+')';
            if(cloudFalloff > 0){
                drawClouds();
                cloudFalloff--;
            }
            if(hue >= spectrumTime - 30 && hue < spectrumTime -25){
                lightningStrike();
            } else if(hue >= spectrumTime-15){
                lightningStrike();
            }
            client.skin.drawString(6, 13, 'Goblin-Like', color);
        }, 10);
        return true;
        //client.displayText(picture);
    }
});
client.drivers.title.drivers.rollCharacter = extend(driver, {
    roll(){
        client.skin.clearCommands();
        client.skin.fillRect(0, 0, displaySize*2, displaySize, '#000');
        client.skin.status('New Character');
        var statTotal = 28; // TODO: Magic Number!
        this.vitality = 1;
        this.strength = 1;
        this.wisdom = 1;
        this.charisma = 1;
        statTotal -= 4; // Total of innitial population of 1s.
        while(statTotal){
            switch(Math.floor(Math.random()*4)){
                case 0:
                    if(this.vitality >= 10){ continue;}
                    this.vitality++;
                    break;
                case 1:
                    if(this.strength >= 10){ continue;}
                    this.strength++;
                    break;
                case 2:
                    if(this.wisdom >= 10){ continue;}
                    this.wisdom++;
                    break;
                case 3:
                    if(this.charisma >= 10){ continue;}
                    this.charisma++;
                    break;
            }
            statTotal--;
        }
        this.display();
    },
    display(){
        client.skin.clearCommands();
        client.skin.fillRect(0, 0, displaySize*2, displaySize, '#000');
        client.skin.status('New Character');
        client.skin.drawString(14, 16, 'Character Stats');
        client.skin.drawString(16, 14, 'Vitality: '+this.vitality);
        client.skin.drawString(16, 13, 'Strength: '+this.strength);
        client.skin.drawString(16, 12, 'Wisdom  : '+this.wisdom  );
        client.skin.drawString(16, 11, 'Courage : '+this.charisma);
        if(!this.name && this.name !== ''){
            client.skin.drawCommand(14,  9, 'A', 'Accept Stats', COMMAND_ENTER);
            client.skin.drawCommand(14,  8, 'B', 'Reroll Stats', COMMAND_CANCEL);
        } else{
            client.skin.drawString(14, 9, 'Enter Name:');
            client.skin.drawString(16, 7, this.name+'_');
            if(this.name.length >= 1){
                client.skin.drawCommand(14, 5, 'Enter', 'Finished', COMMAND_ENTER);
                client.skin.drawCommand(14, 4, 'Space', 'Reroll', COMMAND_CANCEL);
            }
        }
        return true;
    },
    command(command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        if(!this.name && this.name !== ''){
            if(options && options.key){
                if(options.key == 'a' || options.key == 'A'){
                    command = COMMAND_ENTER;}
                if(options.key == 'b' || options.key == 'B'){
                    command = COMMAND_CANCEL;}
            }
            switch(command){
                case COMMAND_ENTER:
                    this.name = sWerd.name();
                    this.display();
                    return true;
                case COMMAND_CANCEL:
                    this.roll();
                    return true;
            }
        } else {
            if(options && options.key){
                var key = options.key;
                if(key.length === 1){
                    if(this.name.length == 8){
                        this.name = this.name.substring(0, 7);
                    }
                    this.name += key;
                    if(this.name.length == 1){
                        this.name = this.name.toUpperCase();
                    }
                } else if(key == 'backspace' || key == 'del'){
                    this.name = this.name.substring(0, this.name.length-1);
                }
                this.display();
            }
            if(command == COMMAND_ENTER){
                this.start();
            } else if(command == COMMAND_CANCEL){
                this.name = null;
                this.roll();
            }
        }
        return true;
    },
    focused(){
        this.roll();
        this.display();
        //this.focus(client.drivers.gameplay.drivers.menu);
    },
    blurred(){
        this.name = null;
        this.vitality = null;
        this.strength = null;
        this.wisdom   = null;
        this.charisma = null;
    },
    start(){
        // TODO: Document.
        /**
         *  This function spawns a new hero when the game begins. It directs
         *      the memory to blank out and prep for new data, places the hero,
         *      and sets the game in motion.
         *  It does not return anything.
         **/
        client.skin.clearCommands();
        client.skin.fillRect(0, 0, displaySize*2, displaySize, '#000');
        clearInterval(this.drawInterval);
        var gameDriver = client.drivers.gameplay;
        gameDriver.memory.blank();
        client.networking.sendMessage(COMMAND_NEWGAME, {
            name    : this.name,
            vitality: this.vitality,
            strength: this.strength,
            wisdom  : this.wisdom,
            charisma: this.charisma
        });
        client.focus(gameDriver);
        gameDriver.display();
    }
});
client.drivers.title.drivers.about = extend(driver, {
    display(){
        client.skin.clearCommands();
        client.skin.fillRect(0, 0, displaySize*2, displaySize, '#000');
        client.skin.status('About');
        client.skin.drawString(15, 14, "Goblin-Like");
        client.skin.drawString(13, 12, "Version  "+VERSION);
        client.skin.drawString(9, 10, "By Jacob A Brennan, 2015");
        client.skin.drawCommand(1,  1, 'Enter', 'Back to Title Screen', COMMAND_ENTER);
        return true;
    },
    command(command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        if(command == COMMAND_ENTER){
            client.drivers.title.focus(null);
            client.drivers.title.display();
        }
        return true;
    },
    focused(){
        this.display();
    }
});
