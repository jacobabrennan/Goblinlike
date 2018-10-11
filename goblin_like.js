

//== Goblin-Like ===============================================================

//-- Imports -------------------------------------
import client from './client/full_client.js';
//-- Construct Game:
import gameManager from './server/game_manager.js';
import './server/view.js';
import './server/skills.js';
import './server/sound.js';
import './server/enemy.js';
import './server/items.js';
import './server/map_generator.js';
import './server/models_enemy.js';

//-- Scaffolding (Remove) --------------------------
import mapManager from './server/map_manager.js';
import modelLibrary from './server/model_library.js';
fakeNetwork.client = client;
fakeNetwork.gameManager = gameManager;
fakeNetwork.mapManager = mapManager;
fakeNetwork.modelLibrary = modelLibrary;

//-- Launch Game ---------------------------------
client.setup({
    containerId: 'game_area',
    font: 'press_start_kregular',
    highlightColor: '#fc0'
});
