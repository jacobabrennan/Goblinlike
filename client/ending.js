client.drivers.ending = Object.create(driver, {
    focused: {value: function (){
        this.offsetY = 0
        this.interval = setInterval(function (){
            client.display()
        }, 100);
    }},
    blurred: {value: function (){
        clearInterval(this.interval);
    }},
    display: {value: function (){
        this.offsetY++;
        client.skin.context.setTransform(1, 0, 0, 1, 0, -this.offsetY);
        for(var posY = 0; posY < displaySize; posY++){
            for(var posX = 0; posX < displaySize*2; posX++){
                client.skin.drawCharacter(
                    posX, posY,
                    pick('#','.','+',"'",'g'),
                    pick('#a40', '#4a0', '#00f')
                )
            }
        }
    }},
});