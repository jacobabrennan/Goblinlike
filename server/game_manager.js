
//-- TO DO: Refactor -----------------------------
function getClient() {
    return fakeNetwork.client;
}


//== Game Manager ==============================================================

//-- Imports -------------------------------------
import timeManager from './time_manager.js';
import mapManager from './map_manager.js';
import Hero from './hero.js';

//-- Implementation ------------------------------
const gameManager = {
    currentGame: undefined,
    newGame(options) {
        if(this.currentGame){ return false;}
        this.currentGame = new Game();
        this.currentGame.start(options);
        return this.currentGame;
    },
    gameOver() {
        getClient().reportScores()
        var oldGame = this.currentGame;
        this.currentGame = null;
        oldGame.gameOver();
        timeManager.reset();
        mapManager.reset();
        this.currentGame = undefined;
    },
    win() {
        var lastLevel = mapManager.getDepth(FINAL_DEPTH);
        if(!lastLevel){ // Wrapping for testing
            lastLevel = l();
        }
        // Destroy all enemies
        var disposeOrder = function (oldContent){
            if(oldContent.type !== TYPE_ACTOR || oldContent.faction === FACTION_GOBLIN){ return;}
            oldContent.dispose();
        };
        for(var posY = 0; posY < lastLevel.height; posY++){
            for(var posX = 0; posX < lastLevel.width; posX++){
                var tileContents = lastLevel.getTileContents(posX, posY);
                tileContents.forEach(disposeOrder);
            }
        }
        // Remove upward stairs
        lastLevel.placeTile(
            lastLevel.stairsUpCoords.x, lastLevel.stairsUpCoords.y,
            lastLevel.tileTypes['.']
        );
        // Cleanup
        var oldGame = this.currentGame;
        this.currentGame = null;
        oldGame.win();
        timeManager.reset();
        mapManager.reset();
        this.currentGame = undefined;
    },
    save() {
        if(!this.currentGame){ return;}
        let saveJSON = this.currentGame.toJSON();
        window.localStorage.setItem('gameSave', JSON.stringify(saveJSON));
    },
    load() {
        if(this.currentGame){ return;}
        let saveJSON = localStorage.getItem('gameSave');
        saveJSON = JSON.parse(saveJSON);
        this.currentGame = new Game();
        this.currentGame.start({gameSave: saveJSON});
        return this.currentGame;
    },
    // Time Management passthrough functions:
    currentTime() {
        /**
         *  This is a passthrough function to retrieve the time from the
         *      timeManager.
         *  Returns an integer, the current time.
         **/
        if(!this.currentGame){
            return NaN;
        }
        return this.currentGame.currentTime;
    },
    setTime(timeStamp) {
        /**
         *  Sets the current time on the current game.
         *  Does not return anything.
         **/
        if(!this.currentGame){ return;}
        this.currentGame.currentTime = timeStamp;
    },
    registerActor() {
        // This is a passthrough function to the timeManager.
        return timeManager.registerActor.apply(timeManager, arguments);
    },
    cancelActor() {
        // This is a passthrough function to the timeManager.
        return timeManager.cancelActor.apply(timeManager, arguments);
    },
    registerEvent(eventFunction, delay) {
        return timeManager.registerEvent.apply(timeManager, arguments);
    },
    turn() {
        // This is a passthrough function to the timeManager.
        return timeManager.turn.apply(timeManager, arguments);
    },
    clientCommand(command, options) {
        switch(command){
            case COMMAND_NEWGAME: {
                // Accept character options from client
                var name     = options.name || '';
                var vitality = options.vitality || 0;
                var strength = options.strength || 0;
                var wisdom   = options.wisdom || 0;
                var charisma = options.charisma || 0;
                // If options are invalid, reroll character
                var reroll = false;
                if(!vitality.toPrecision || vitality > 10 || vitality < 0 ||
                    (vitality != Math.round(vitality))){ reroll = true;}
                if(!strength.toPrecision || strength > 10 || strength < 0 ||
                    (strength != Math.round(strength))){ reroll = true;}
                if(!wisdom.toPrecision || wisdom > 10 || wisdom < 0 ||
                    (wisdom != Math.round(wisdom))){ reroll = true;}
                if(!charisma.toPrecision || charisma > 10 || charisma < 0 ||
                    (charisma != Math.round(charisma))){ reroll = true;}
                // TO DO: Check total stats in case client requested all 10s, etc.
                if(!name.substring || name.length < 1 || name.length > 8){
                    reroll = true;
                }
                if(reroll){ options = null;}
                // Begin new game
                this.newGame(options);
                break;
            }
            case COMMAND_LOADGAME: {
                this.load();
                break;
            }
            default: {
                this.currentGame.clientCommand(command, options);
            }
        }
    }
};

class Game {
    constructor() {
        this.hero = undefined;
        this.currentTime = 0;
        this.companionInfo = [];
    }

    //-- Saving & Loading ----------------------------
    toJSON() {
        let result = {
            map: mapManager.toJSON(),
            time: this.currentTime,
            hero: this.hero.id,
            companions: this.companionInfo.map(companion => companion.id)
        };
        return result;
    }
    fromJSON(data) {
        mapManager.fromJSON(data.map);
        this.currentTime = data.time;
        this.hero = mapManager.idManager.get(data.hero);
        mapManager.idManager.ids.forEach(mappable => {
            if(!mappable){ return;}
            if(!mappable.active){ return;}
            if(!mappable.activate){ return;}
            mappable.active = false;
            mappable.activate();
        });
        this.companionInfo = data.companions.map(id => mapManager.idManager.get(id));
    }

    //------------------------------------------------
    start(options) {
        let startLevel;
        // Attempt Load from Save
        if(options.gameSave){
            this.fromJSON(options.gameSave);
            startLevel = mapManager.getLevel(this.hero.levelId);
            this.hero.update('levelId');
        // Generate New Game
        } else{
            startLevel = mapManager.generateLevel(1);
            this.hero = new Hero();
            this.hero.initializer(options);
            this.hero.place(
                startLevel.startCoords.x, startLevel.startCoords.y, startLevel.id);
            this.hero.update('levelId');
        }
        this.hero.intelligence = new HeroIntelligence;
        let levelData = startLevel.packageSetup();
        gameManager.registerActor(this.hero);
        this.hero.intelligence.sendMessage(COMMAND_NEWGAME, {
            level: levelData
        });
        gameManager.turn();
    }
    dispose() {
        this.hero = null;
    }
    gameOver() {
        // Compile data to show to player about the conditions of their death.
        // Compile data about the hero's view.
        let currentLevel = mapManager.getLevel(this.hero.levelId);
        let viewData;
        if(currentLevel){
            viewData = currentLevel.packageView(
                this.hero.x, this.hero.y, this.hero.viewRange
            );
        }
        // Compile data about recent changes to the hero.
        let selfData = this.hero.packageUpdates();
        // Compile package of new messages.
        let newMessages;
        if(this.hero.messages && this.hero.messages.length){
            newMessages = this.hero.messages;
        }
        // Create final package and send it to the player.
        let deathData = {
            characterData: selfData,
            sensoryData: viewData,
            messageData: newMessages
        };
        this.hero.intelligence.gameOver(deathData);
        this.dispose();
    }
    win() {
        this.hero.inform('The undead have been defeated.');
        this.hero.inform('You have won the game!');
        // Compile data from final turn to display to player.
        // Compile data about the hero's view.
        let currentLevel = mapManager.getLevel(this.hero.levelId);
        let viewData;
        if(currentLevel){
            viewData = currentLevel.packageView(
                this.hero.x, this.hero.y, this.hero.viewRange
            );
        }
        // Compile data about recent changes to the hero.
        let selfData = this.hero.packageUpdates();
        // Compile package of new messages.
        let newMessages;
        if(this.hero.messages && this.hero.messages.length){
            newMessages = this.hero.messages;
        }
        // Compile info about each goblin.
        let goblinsData = [] // TODO
        for(var gI = 0; gI < this.companionInfo.length; gI++){
            var indexG = this.companionInfo[gI];
            goblinsData.push({
                name: indexG.name,
                dead: indexG.dead,
                lost: indexG.lost,
                gender: indexG.gender,
                color: indexG.colorNatural,
                level: indexG.level,
            });
        }
        // Create final package and send it to the player.
        var winData = {
            characterData: selfData,
            companionData: goblinsData,
            sensoryData: viewData,
            messageData: newMessages
        };
        this.hero.intelligence.win(winData);
        getClient().reportScores(true);
        this.dispose();
    }
    compileScores(win) {
        var scores = {
            name: this.hero.name,
            score: this.hero.experience,
            experience: this.hero.experience,
            level: this.hero.level,
            depth: mapManager.getLevel(this.hero.levelId).depth,
            goblins: [],
        };
        if(win){
            scores.score += GOBLIN_SCORE * this.hero.companions.length;
            scores.win = true;
        }
        var goblins = this.companionInfo.slice();
        goblins.unshift(this.hero);
        for(var gIndex = 0; gIndex < goblins.length; gIndex++){
            var indexG = goblins[gIndex];
            var gInfo = {
                name: indexG.name,
                gender: indexG.gender,
                level: indexG.level
            };
            if(indexG.lost){ gInfo.lost = true;}
            if(indexG.dead){ gInfo.dead = true;}
            scores.goblins.push(gInfo);
        }
        return scores;
    }
    clientCommand(command, options) {
        if(this.hero){
            switch(command){
                case COMMAND_ATTACK:  this.hero.commandAttack(options);  break;
                case COMMAND_CLOSE:   this.hero.commandClose(options);   break;
                case COMMAND_CAMP:    this.hero.commandCamp(options);    break;
                case COMMAND_DROP:    this.hero.commandDrop(options);    break;
                case COMMAND_EQUIP:   this.hero.commandEquip(options);   break;
                case COMMAND_UNEQUIP: this.hero.commandUnequip(options); break;
                case COMMAND_FIRE:    this.hero.commandFire(options);    break;
                case COMMAND_GET:     this.hero.commandGet(options);     break;
                case COMMAND_LOOK:    this.hero.commandLook(options);    break;
                case COMMAND_MOVE:    this.hero.commandMove(options);    break;
                case COMMAND_STAIRS:  this.hero.commandStairs(options);  break;
                case COMMAND_THROW:   this.hero.commandThrow(options);   break;
                case COMMAND_USE:     this.hero.commandUse(options);     break;
                case COMMAND_WAIT:    this.hero.commandWait(options);    break;
            }
        }
    }
}

// TODO: Refactor this with actual networking.
class HeroIntelligence {
    sendMessage(command, options) {
        getClient().networking.recieveMessage(command, options);
    }
    sense(sensoryData) {
        this.sendMessage(COMMAND_SENSE, sensoryData);
    }
    takeTurn(theMover) {
        // Compile sensory data about the player's view.
        let currentLevel = mapManager.getLevel(theMover.levelId);
        let viewData;
        if(currentLevel){
            viewData = currentLevel.packageView(
                theMover.x, theMover.y, theMover.viewRange);
        }
        // Compile data about recent changes to the person.
        let selfData = theMover.packageUpdates();
        theMover.updates = undefined;
        // Compile package of new messages.
        let newMessages;
        if(theMover.messages && theMover.messages.length){
            newMessages = theMover.messages;
            theMover.messages = null;
        }
        // Create final package and send it to the player.
        let turnData = {
            characterData: selfData,
            sensoryData: viewData,
            messageData: newMessages
        };
        this.sendMessage(COMMAND_TURN, turnData);
    }
    camp(theMover) {
        // Compile data about recent changes to the person.
        let selfData = theMover.packageUpdates();
        theMover.updates = undefined;
        // Create final package and send it to the player.
        let turnData = {
            characterData: selfData,
            time: gameManager.currentTime()
        };
        let delay = (Math.random() < 1/10)? 10 : 1;
        this.sendMessage(COMMAND_SENSE, turnData);
        setTimeout(function (){
            theMover.endTurn();
        }, delay);
    }
    gameOver(deathData) {
        this.sendMessage(COMMAND_GAMEOVER, deathData);
    }
    win(winData) {
        this.sendMessage(COMMAND_WIN, winData);
    }
}

export default gameManager;
