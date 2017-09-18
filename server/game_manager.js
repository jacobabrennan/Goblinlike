var gameManager = (function (){
// ============================================================================
var manager = {
    currentGame: undefined,
    newGame: function (options){
        if(this.currentGame){ return false;}
        this.currentGame = Object.instantiate(game);
        this.currentGame.start(options);
        return this.currentGame;
    },
    gameOver: function (){
        var oldGame = this.currentGame;
        this.currentGame = null;
        oldGame.gameOver();
        timeManager.reset();
        mapManager.reset();
        this.currentGame = undefined;
    },
    win: function (){
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
    // Time Management passthrough functions:
    currentTime: function (){
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
    setTime: function (timeStamp){
        /**
         *  Sets the current time on the current game.
         *  Does not return anything.
         **/
        if(!this.currentGame){ return;}
        this.currentGame.currentTime = timeStamp;
    },
    registerActor: function (){
        // This is a passthrough function to the timeManager.
        return timeManager.registerActor.apply(timeManager, arguments);
    },
    cancelActor: function (){
        // This is a passthrough function to the timeManager.
        return timeManager.cancelActor.apply(timeManager, arguments);
    },
    registerEvent: function (eventFunction, delay){
        return timeManager.registerEvent.apply(timeManager, arguments);
    },
    turn: function (){
        // This is a passthrough function to the timeManager.
        return timeManager.turn.apply(timeManager, arguments);
    },
    clientCommand: function (command, options){
        if(command == COMMAND_NEWGAME){
            var name     = options.name || '';
            var vitality = options.vitality || 0;
            var strength = options.strength || 0;
            var wisdom   = options.wisdom || 0;
            var charisma = options.charisma || 0;
            var reroll = false;
            if(!vitality.toPrecision || vitality > 10 || vitality < 0 ||
                (vitality != Math.round(vitality))){ reroll = true;}
            if(!strength.toPrecision || strength > 10 || strength < 0 ||
                (strength != Math.round(strength))){ reroll = true;}
            if(!wisdom.toPrecision || wisdom > 10 || wisdom < 0 ||
                (wisdom != Math.round(wisdom))){ reroll = true;}
            if(!charisma.toPrecision || charisma > 10 || charisma < 0 ||
                (charisma != Math.round(charisma))){ reroll = true;}
            if(!name.substring || name.length < 1 || name.length > 8){
                reroll = true;
            }
            if(reroll){ options = null;}
            this.newGame(options);
        } else{
            this.currentGame.clientCommand(command, options);
        }
    }
};
game = {
    hero: undefined,
    currentTime: 0,
    constructor: function (){
        return this;
    },
    start: function (options){
        var newLevel = mapManager.generateLevel(1);
        this.hero = Object.instantiate(hero, options);
        this.hero.place(
            newLevel.startCoords.x, newLevel.startCoords.y, newLevel.id);
        this.hero.update('levelId');
        // TODO: Refactor this with actual networking.
        this.hero.intelligence = {
            sendMessage: function (command, options){
                client.networking.recieveMessage(command, options);
            },
            sense: function (sensoryData){
                this.sendMessage(COMMAND_SENSE, sensoryData);
            },
            takeTurn: function (theMover){
                // Compile sensory data about the player's view.
                var currentLevel = mapManager.getLevel(theMover.levelId);
                var viewData;
                if(currentLevel){
                    viewData = currentLevel.packageView(
                        theMover.x, theMover.y, theMover.viewRange);
                }
                // Compile data about recent changes to the person.
                var selfData = theMover.packageUpdates();
                theMover.updates = undefined;
                // Compile package of new messages.
                var newMessages;
                if(theMover.messages && theMover.messages.length){
                    newMessages = theMover.messages;
                    theMover.messages = null;
                }
                // Create final package and send it to the player.
                var turnData = {
                    characterData: selfData,
                    sensoryData: viewData,
                    messageData: newMessages
                };
                this.sendMessage(COMMAND_TURN, turnData);
            },
            camp: function (theMover){
                // Compile data about recent changes to the person.
                var selfData = theMover.packageUpdates();
                theMover.updates = undefined;
                // Create final package and send it to the player.
                var turnData = {
                    characterData: selfData,
                    time: gameManager.currentTime()
                };
                var delay = (Math.random() < 1/10)? 10 : 1;
                this.sendMessage(COMMAND_SENSE, turnData);
                setTimeout(function (){
                    theMover.endTurn();
                }, delay);
            },
            gameOver: function (deathData){
                this.sendMessage(COMMAND_GAMEOVER, deathData);
            },
            win: function (winData){
                this.sendMessage(COMMAND_WIN, winData);
            }
        };
        //--
        var levelData = newLevel.packageSetup();
        gameManager.registerActor(this.hero);
        this.hero.intelligence.sendMessage(COMMAND_NEWGAME, {
            level: levelData
        });
        gameManager.turn();
    },
    dispose: function (){
        this.hero = null;
    },
    gameOver: function (){
        // Compile data to show to player about the conditions of their death.
        // Compile data about the hero's view.
        var currentLevel = mapManager.getLevel(this.hero.levelId);
        var viewData;
        if(currentLevel){
            viewData = currentLevel.packageView(
                this.hero.x, this.hero.y, this.hero.viewRange
            );
        }
        // Compile data about recent changes to the hero.
        var selfData = this.hero.packageUpdates();
        // Compile package of new messages.
        var newMessages;
        if(this.hero.messages && this.hero.messages.length){
            newMessages = this.hero.messages;
        }
        // Create final package and send it to the player.
        var deathData = {
            characterData: selfData,
            sensoryData: viewData,
            messageData: newMessages
        };
        this.hero.intelligence.gameOver(deathData);
        this.dispose();
    },
    win: function (){
        this.hero.inform('The undead have been defeated.');
        this.hero.inform('You have won the game!');
        // Compile data from final turn to display to player.
        // Compile data about the hero's view.
        var currentLevel = mapManager.getLevel(this.hero.levelId);
        var viewData;
        if(currentLevel){
            viewData = currentLevel.packageView(
                this.hero.x, this.hero.y, this.hero.viewRange
            );
        }
        // Compile data about recent changes to the hero.
        var selfData = this.hero.packageUpdates();
        // Compile package of new messages.
        var newMessages;
        if(this.hero.messages && this.hero.messages.length){
            newMessages = this.hero.messages;
        }
        // Compile info about each goblin.
        var goblinsData = [] // TODO
        // Create final package and send it to the player.
        var winData = {
            characterData: selfData,
            companionData: goblinsData,
            sensoryData: viewData,
            messageData: newMessages
        };
        this.hero.intelligence.win(winData);
        console.log(this.hero.intelligence);
        this.dispose();
    },
    clientCommand: function (command, options){
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
};
var timeManager = (function (){
    var manager = {
        actors: priorityQueue.constructor.call(Object.create(priorityQueue), function (a,b){
            var turnDifference = a.nextTurn - b.nextTurn;
            if(turnDifference){
                return turnDifference;
            } else{
                var idPrecedence = (a.id || 0) - (b.id || 0);
                return idPrecedence;
            }
        }),
        events: [],
        registerActor: function (newActor){
            /**
                This function adds an object of type actor to the actors queue
                    The queue is a priorityQueue which orders who will take
                    turns.
                An actor should reregister itself after every turn, as they are
                    removed in nextActor as part of the process of assigning
                    the next turn.
                It does not return a value.
             **/
            if(!gameManager.currentGame){ return;}
            this.actors.enqueue(newActor);
        },
        cancelActor: function (oldActor){
            /**
                This function removes an object from the actors queue. It will
                    no longer be in line to recieve turns.
                It does not return a value.
             **/
            this.actors.removeItem(oldActor);
        },
        nextActor: function (){
            /**
                This function finds the next actor in line to take their turn.
                An actor should reregister itself after every turn, as they
                    are removed from the queue by this function.
                It returns an object of type actor if one is available, or
                    undefined if there are no actors registered.
             **/
            var nextActor = this.actors.dequeue();
            return nextActor;
        },
        turn: function (){
            /*
                Find next actor, give them a turn
                Nothing is returned by this function.
             */
            if(!gameManager.currentGame){ return;}
            var theTime = gameManager.currentTime();
            if(!isFinite(theTime)){ return;}
            var nextActor = this.nextActor();
            if(theTime > nextActor.nextTurn){
                nextActor.nextTurn = theTime;
            }
            gameManager.setTime(nextActor.nextTurn);
            var callback = (function (self){
                return function (active){
                    if(active){
                        self.registerActor(nextActor);
                    }
                    self.turn();
                };
            })(this);
            nextActor.takeTurn(callback);
        },
        reset: function (){
            var oldActors = [];
            while(!this.actors.isEmpty()){
                oldActors.push(this.nextActor());
            }
            oldActors.forEach(function (oldActor){
                oldActor.dispose();
            });
            this.events = [];
        },
        registerEvent: function (eventFunction, delay){
            var timeStamp = gameManager.currentTime() + delay;
            var newEvent = Object.instantiate(
                eventActor, eventFunction, timeStamp
            );
            this.registerActor(newEvent);
        }
    };
    var eventActor = {
        nextTurn: undefined,
        callbackStorage: undefined,
        eventFunction: undefined,
        takeTurn: function (callback){
            this.eventFunction();
            callback(false);
        },
        dispose: function (){},
        constructor: function (eventFunction, timeStamp){
            this.eventFunction = eventFunction;
            this.nextTurn = timeStamp;
            return this;
        }
    };
    return manager;
})();
// ============================================================================
    return manager;
})();