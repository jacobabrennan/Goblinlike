

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
    setup: {value: function (configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
         **/
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
    focused: {value: function (){
        this.display();
        //this.focus(client.drivers.gameplay.drivers.menu);
    }},
    newGame: {value: function (){
        // TODO: Document.
        /**
         *  This function spawns a new hero when the game begins. It directs
         *      the memory to blank out and prep for new data, places the hero,
         *      and sets the game in motion.
         *  It does not return anything.
         **/
        clearInterval(this.drawInterval);
        var gameDriver = client.drivers.gameplay;
        gameDriver.memory.blank();
        client.networking.sendMessage(COMMAND_NEWGAME, {});
        client.focus(gameDriver);
    }},
    display: {value: function (options){
        // TODO: Document.
        client.skin.clearCommands();
        client.skin.status('Version '+VERSION, '#008');
        /*var picture = '';
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
        picture += 'T\\|: -  - -  ~ :. .::';*/
        var drawMountain = function (){
            client.skin.drawString(0,20,'                                          ','#008');
            client.skin.drawString(0,19,'                                          ','#008');
            client.skin.drawString(0,18,'                                          ','#008');
            client.skin.drawString(0,17,'                                    /\\    ','#008');
            client.skin.drawString(0,16,'                                   /D \\ _ ','#008');
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
            client.skin.drawCommand(8, 11, 'A', 'Start', function (){
                client.drivers.title.newGame();
            });
            client.skin.drawCommand(8, 10, 'B', 'About', function (){});
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
        drawMountain();
        var colorTime = 256;
        var spectrumTime = colorTime*3;
        var currentTime = Math.round(colorTime/3); // Yellow
        this.drawInterval = setInterval(function (){
            currentTime++;
            var hue = currentTime%spectrumTime;
            if(hue === 0){
                drawMountain();
            }
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
            if(hue == spectrumTime - 25){
                drawMountain();
            }
            if(cloudFalloff > 0){
                drawClouds();
                cloudFalloff--;
            }
            if(hue == spectrumTime - 30){
                lightningStrike();
            } else if(hue >= spectrumTime-15){
                lightningStrike();
            }
            client.skin.drawString(6, 13, 'Goblin-Like', color);
        }, 10);
        //client.displayText(picture);
    }}
});