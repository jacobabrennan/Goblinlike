

//== Goblin-Like ===============================================================

//-- Imports -------------------------------------
import client from './client/full_client.js';
//-- Construct Game:
import gameManager from './server/game_manager.js';
import './server/view.js';
import './server/skills.js';
import './server/sound.js';
import './server/enemies.js';
import './server/items.js';
import './server/map_generator.js';

//-- Scaffolding (Remove) --------------------------
fakeNetwork.client = client;
fakeNetwork.gameManager = gameManager;

//-- Launch Game ---------------------------------
client.setup({
    containerId: 'game_area',
    font: 'press_start_kregular',
    highlightColor: '#fc0'
});
