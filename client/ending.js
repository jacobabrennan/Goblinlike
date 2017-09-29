client.drivers.ending = Object.create(driver, {
    endLines: {value: 10, writable: true}, // Set in display. Any number > ~2 will do for initial setting.
    focused: {value: function (){
        //this.winInfo = client.drivers.gameplay.won; // Set separately by menu
        this.offsetY = 0;
        this.interval = setInterval(function (){
            client.display()
        }, 100);
    }},
    blurred: {value: function (){
        this.winInfo = null;
        clearInterval(this.interval);
    }},
    display: {value: function (){
        var scrollStop = (this.offsetY/FONT_SIZE > this.endLines+displaySize/2)? true : false;
        if(!scrollStop){
            this.offsetY++;
        }
        var timeStop = false;
        client.skin.fillRect(0, 0, displaySize*2, displaySize+2, '#000');
        client.skin.context.setTransform(1, 0, 0, 1, 0, -this.offsetY*(FONT_SIZE/8));
        // TODO: Document.
        var I = 21;
        var artColor = '#fff';
        client.skin.drawString(0,--I,'                                          ', artColor);
        client.skin.drawString(0,--I,'                                          ', artColor);
        client.skin.drawString(0,--I,'                                          ', artColor);
        client.skin.drawString(0,--I,'                                    /\\    ', artColor);
        client.skin.drawString(0,--I,'                                   /  \\ _ ', artColor);
        client.skin.drawString(0,--I,'                     ____-----  __/   \\\\  ', artColor);
        client.skin.drawString(0,--I,'                      _ ____     /     \\\\ ', artColor);
        client.skin.drawString(0,--I,'                              /\\/        \\', artColor);
        client.skin.drawString(0,--I,'                             /   \\     \\\\ ', artColor);
        client.skin.drawString(0,--I,'                            /   \\\\      \\ ', artColor);
        client.skin.drawString(0,--I,'                          _/     \\ \\  /   ', artColor);
        client.skin.drawString(0,--I,'                         / \\      \\  /   \\', artColor);
        client.skin.drawString(0,--I,'\\                 _    |/|\\ \\     \\\\/     ', artColor);
        client.skin.drawString(0,--I,' \\              _/ \\ ||/|  | |  |  /      ', artColor);
        client.skin.drawString(0,--I,' \\\\___         /  \\ |T\\|T|| \\ |  |/     | ', artColor);
        client.skin.drawString(0,--I,'\\ \\   \\_      /   |/T||/T\\T ||  |    | /T\\', artColor);
        client.skin.drawString(0,--I,':\\|  \\ \\\\__|_/|  /T\\T/T|T/T\\ : |  | |.|/T\\', artColor);
        client.skin.drawString(0,--I,'|:.\\|_\\__\\/T\\|_|_/T|\\//T\\/T\\~~~:.: . /T\\T|', artColor);
        client.skin.drawString(0,--I,':.:.:. . ./T\\ /T\\//T\\|/T:|:~-  ~~~: ./T\\/T', artColor);
        client.skin.drawString(0,--I,'.|  .   .:/T\\:/T\\:/T/T\\:::~ -   - ~:  .:/T', artColor);
        client.skin.drawString(0,--I,': .   .  .::.:/T\\:::/T\\:: -  - -  ~ :. .::', artColor);
        I--;
        I--;
        I--;
        I -= client.skin.drawParagraph(1,--I, "Deep underground in caverns hewn by dwarven hands, and inhabited by the undead, the goblins bravely fought, eradicating the enemy and wining a home for themselves...");
        client.skin.drawString(1, --I, 'The Goblins:');
        I--;
        var C = this.winData.characterData;
        client.skin.drawString(2, --I, C.name, '#0f0');
        client.skin.drawString(3+C.name.length, I, ': Level '+C.level+' goblin ('+C.gender+')');
        var goblinCount = 0;
        for(var gI = 0; gI < FINAL_DEPTH-1; gI++){
            var indexG = this.winData.companionData[gI];
            if(!indexG){
                --I;
                continue;
            }
            client.skin.drawString(2, --I, indexG.name, indexG.color)
            var status = '';
            if(indexG.dead){ status = '(dead)';}
            else if(indexG.lost){ status = '(lost)';}
            else{ goblinCount++;}
            client.skin.drawString(3+indexG.name.length, I, status+': Level '+indexG.level+' goblin ('+indexG.gender+')');
        }
        --I;
        client.skin.drawString(1, --I, 'Goblins: '+(goblinCount+1)+'/7');
        client.skin.drawString(1, --I, 'Goblin Bonus: '+goblinCount*GOBLIN_SCORE);
        --I;
        --I;
        --I;
        --I;
        --I;
        --I;
        --I;
        --I;
        --I;
        client.skin.drawString(displaySize-4, --I, 'THE END');
        --I;
        client.skin.drawString(displaySize-9, --I, 'Final Score: '+Math.floor(C.experience+(goblinCount*GOBLIN_SCORE)));
        client.skin.context.setTransform(1, 0, 0, 1, 0, 0);
        this.endLines = -I;
    }}
});
