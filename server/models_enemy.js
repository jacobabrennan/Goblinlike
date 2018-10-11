//-- Dependencies --------------------------------
import {enemy, blobPrototype, snakePrototype} from './enemy.js';
import modelLibrary from './model_library.js';

//== Model Library (All Enemy Types) ===========================================

modelLibrary.registerModel('enemy', Object.extend(enemy, { // white rat
    // Id:
    generationId: 'white rat',
    generationWeight: 5,
    name: 'White Rat',
    // Display:
    character: "r",
    // Stats:
    rewardExperience: 5,
    vigilance: 0,
    erratic: 1/2,
    baseHp: 1,
    // Behavior:
    breedRate: 1/8,
    skills: ["attack"],
    // Description:
    viewText: 'You see a small white rodent.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // giant ant
    // Id:
    generationId: 'giant ant',
    generationWeight: 10,
    name: 'Giant Ant',
    // Display:
    character: "a",
    // Stats:
    rewardExperience: 10,
    vigilance: 10,
    erratic: 1/8,
    baseHp: 3,
    // Behavior:
    // Description:
    viewText: 'You see a giant ant about the size of a wolf.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // cave beetle
    // Id:
    generationId: 'cave beetle',
    generationWeight: 10,
    name: 'Cave Beetle',
    // Display:
    color: "#666",
    character: "b",
    // Stats:
    rewardExperience: 10,
    turnDelay: 2,
    baseAttack: 2,
    baseHp: 8,
    vigilance: 10,
        // The minimum distance from which the enemy can be activated by sound.
    forgetful: 0,
    // Behavior:
    opensDoors: 1/4,
    // Description:
    viewText: 'You see a large armored beetle about the size of a bear. It menaces with sharp pincers.'
}));
modelLibrary.registerModel('enemy', Object.extend(snakePrototype, { // centepede
    // Id:
    generationId: 'centipede',
    generationWeight: 20,
    name: 'Centipede',
    // Display:
    character: 'c',
    //color: '',
    bodyCharacter: 'o',
    //bodyColor: '#a53',
    bodyBackground: undefined,
    // Stats:
    rewardExperience: 20,
    //turnDelay: 1/2,
    baseHp: 15,
    erratic: 1/4,
    // Behavior:
    bodyLength: 3,
    // Description:
    viewText: 'You see a long centipede, large enough to block the narrow halls of the dwarven city.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // floating eye
    // Id:
    generationId: 'floating eye',
    generationWeight: 18,
    name: 'Floating Eye',
    // Display:
    character: "e",
    // Stats:
    rewardExperience: 18,
    vigilance: 0,
    erratic: 0,
    baseHp: 10,
    // Behavior:
    sedentary: true,
    skills: ["glare","attack"],
    // Description:
    viewText: 'You see a large eyeball. It bobs up and down slowly.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // ksuzzy
    // Id:
    generationId: 'ksuzzy',
    generationWeight: 18,
    name: 'Ksuzzy',
    // Display:
    character: "k",
    color: '#4cf',
    // Stats:
    rewardExperience: 18,
    vigilance: 0,
    baseHp: 3,
    // Behavior:
    sedentary: true,
    behavior: enemy.behaviorErratic,
    // Description:
    viewText: "You see a small blob with many small eyes on stalks rising from it's body. It squirms slowly through a puddle of acid."
}));*/
modelLibrary.registerModel('enemy', Object.extend(enemy, { // yellow mold
    // Id:
    generationId: 'yellow mold',
    generationWeight: 30,
    name: 'Yellow Mold',
    // Display:
    character: "m",
    color: "#990",
    background: "#440",
    // Stats:
    rewardExperience: 10,
    vigilance: 0,
    forgetful: 1,
    sedentary: 1,
    baseHp: 3,
    // Behavior:
    breedRate: 1/10,
    breedRateDecay: 0.9,
    skills: ["attack"],
    // Description:
    viewText: 'You see a mass of dense yellow mold covering the walls and floor. It seems to be growing at an alarming rate.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // minor imp
    // Id:
    generationId: 'minor imp',
    generationWeight: 30,
    name: 'Minor Imp',
    // Display:
    character: "i",
    color: "#f00",
    // Stats:
    rewardExperience: 30,
    baseAttack: 3,
    vigilance: 10,
    erratic: 1/8,
    baseHp: 15,
    // Behavior:
    opensDoors: 1,
    skills: ["teleport","attack"],
    // Description:
    viewText: 'You see a minor imp, one of the lowest of demons. This dwarven city must have once housed a wizard or two.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // skeletal dwarf
    // Id:
    generationId: 'skeletal dwarf',
    generationWeight: 40,
    name: 'Skeletal Dwarf',
    // Display:
    character: "s",
    color: "#fd9",
    // Stats:
    baseAttack: 4,
    rewardExperience: 40,
    forgetful: 15,
    baseHp: 30,
    // Behavior:
    opensDoors: 1,
    // Description:
    viewText: "You see a skeletal dwarf, one of the citizens of this city raised from the dead. It's vacant eye sockets seem to be fixed directly on you."
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // zombie dwarf
    // Id:
    generationId: 'zombie dwarf',
    generationWeight: 45,
    name: 'Zombie Dwarf',
    // Display:
    character: "z",
    color: "#fd9",
    // Stats:
    rewardExperience: 45,
    baseAttack: 7,
    forgetful: 15,
    turnDelay: 2,
    baseHp: 60,
    // Behavior:
    opensDoors: 1,
    // Description:
    viewText: 'You see a zombie dwarf, a mighty warrior of this city raised from the dead.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // black rat
    // Id:
    generationId: 'black rat',
    generationWeight: 50,
    name: 'Black Rat',
    // Display:
    character: "r",
    color: '#444',
    // Stats:
    rewardExperience: 20,
    vigilance: 0,
    erratic: 1/2,
    baseAttack: 2,
    baseHp: 8,
    // Behavior:
    breedRate: 1/4,
    breedRateDecay: 0.85,
    skills: ["attack"],
    // Description:
    viewText: 'You see a large black rat.'
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // red beetle
    // Id:
    generationId: 'red beetle',
    generationWeight: 50,
    name: 'Red Beetle',
    // Display:
    color: "#f00",
    character: "b",
    // Stats:
    rewardExperience: 50,
    turnDelay: 2,
    baseAttack: 6,
    baseIntelligence: 4,
    baseHp: 50,
    vigilance: 10,
        // The minimum distance from which the enemy can be activated by sound.
    forgetful: 0,
    // Behavior:
    opensDoors: 1/4,
    skills: ["breath fire", "attack"],
    // Description:
    viewText: "You see a large armored red beetle. Tendrils of smoke escape from the corners of it's crooked mouth."
}));
modelLibrary.registerModel('enemy', Object.extend(blobPrototype, { // yellow blob
    // Id:
    generationId: 'yellow blob',
    generationWeight: 40,
    name: 'Yellow Blob',
    // Display:
    color: "#990",
    background: "#440",
    bodyColor: "#990",
    bodyBackground: "#440",
    // Stats:
    rewardExperience: 50,
    //turnDelay: 1/2,
    baseHp: 50,
    baseAttack: 4,
    erratic: 1/4,
    forgetful: 5,
    // Behavior:
    bodyMass: 9,
    // Description:
    viewText: "You see a large yellow blob. It is gelatinous and jiggles and convulses constantly."
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // imp
    // Id:
    generationId: 'imp',
    generationWeight: 55,
    name: 'Imp',
    // Display:
    character: "i",
    color: "#802",
    // Stats:
    rewardExperience: 55,
    baseAttack: 6,
    vigilance: 10,
    erratic: 1/8,
    baseHp: 40,
    // Behavior:
    opensDoors: 1,
    skills: ["teleport","attack"],
    // Description:
    viewText: "You see an imp. These artificial creatures of magic are filled with malice."
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // blue mold
    // Id:
    generationId: 'blue mold',
    generationWeight: 60,
    name: 'Blue Mold',
    // Display:
    character: "m",
    color: '#4cf',
    background: "#08a",
    // Stats:
    rewardExperience: 30,
    vigilance: 0,
    forgetful: 1,
    sedentary: 1,
    baseHp: 10,
    // Behavior:
    breedRate: 1/10,
    breedRateDecay: 0.9,
    skills: ["attack"],
    // Description:
    viewText: "You see a mass of blue mold. Acid drips from all parts of it, and it seems to be growing at an alarming rate."
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // phantom
    // Id:
    generationId: 'phantom',
    generationWeight: 65,
    name: 'Phantom',
    // Display:
    character: "p",
    // Stats:
    rewardExperience: 65,
    vigilance: 10,
    erratic: 2/3,
    turnDelay: 2/3,
    baseHp: 50,
    behavior: enemy.behaviorDirect,
    // Behavior:
    skills: ['attack', 'wail'],
    // Description:
    viewText: 'You see a shadowy figure shifting through the air. The hairs on your neck stand on end as you think you hear a shrill voice inches away from your ear.'
}));
modelLibrary.registerModel('enemy', Object.extend(blobPrototype, { // blue blob
    // Id:
    generationId: 'blue blob',
    generationWeight: 80,
    name: 'Blue Blob',
    // Display:
    color: '#4cf',
    background: "#08a",
    bodyColor: "#4cf",
    bodyBackground: "#08a",
    // Stats:
    rewardExperience: 80,
    baseHp: 90,
    baseAttack: 4,
    erratic: 1/4,
    forgetful: 5,
    // Behavior:
    bodyMass: 16,
    // Description:
    viewText: "You see a large blue blob. There are bones and corroded pieces of dwarven armor floating in it's gelatinous body. It is dripping acid."
}));
modelLibrary.registerModel('enemy', Object.extend(enemy, { // bloodshot eye
    // Id:
    generationId: 'bloodshot eye',
    generationWeight: 80,
    name: 'Bloodshot Eye',
    // Display:
    character: "e",
    // Stats:
    rewardExperience: 80,
    vigilance: 0,
    erratic: 0,
    baseHp: 20,
    // Behavior:
    sedentary: true,
    skills: ["glare", "sap", "attack"],
    // Description:
    viewText: "You see a large bloodshot eyeball. It's ceaseless gaze chills you to the bone."
}));
modelLibrary.registerModel('enemy', Object.extend(snakePrototype, { // worm
    // Id:
    generationId: 'worm',
    generationWeight: 90,
    name: 'Giant Worm',
    // Display:
    character: 'w',
    color: '#a0a',
    bodyCharacter: 'o',
    bodyColor: '#a0a',
    bodyBackground: undefined,
    // Stats:
    rewardExperience: 90,
    turnDelay: 2,
    baseHp: 100,
    baseAttack: 10,
    //erratic: 1,
    // Behavior:
    bodyLength: 7,
    // Description:
    viewText: "You see a giant worm. It's massive bulk blocks the halls completely."
}));
modelLibrary.registerModel('special', Object.extend(enemy, { // emperor wight
    // Id:
    generationId: 'emperor wight',
    name: 'Emperor Wight',
    // Display:
    character: "W",
    color: "#fd9",
    // Stats:
    baseAttack: 8,
    rewardExperience: 400,
    forgetful: 15,
    baseHp: 150,
    // Behavior:
    breedRate: 8,
    breedRateDecay: 1/2,
    opensDoors: 1,
    erratic: 3/4,
    turnDelay: 1/2,
    vigilance: 10,
    skills: ['attack', 'attack', 'attack', 'wail', 'wail', 'breed'],
    // Description:
    viewText: "You see a pale dwarf with sharp eyes, undead arms reach up from beneath the ground all around it. On it's face is a contorted mixture of pain and rage.",
    breed(){
        this.breedId = pick('skeletal dwarf', 'zombie dwarf');
        var result = enemy.breed.apply(this, arguments);
        return result;
    },
    die(){
        //var crown = modelLibrary.getModel('special', 'crown');
        //crown.place(this.x, this.y);
        gameManager.currentGame.win();
        return enemy.die.apply(this, arguments);
    },
}));
