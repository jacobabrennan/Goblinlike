client.drivers.ending = Object.create(driver, {
    display: {value: function (){
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