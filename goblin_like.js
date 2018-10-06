

//== Goblin-Like ===============================================================

//-- Imports -------------------------------------
import client from './client/full_client.js';
//-- Construct Game:
import gameManager from './server/game_manager.js';
    // time_manager.js
import './server/path_finder.js'
    // priority_queue.js
import './server/map_generator.js';
    // map_manager.js
    // model_library.js
    // level.js
    // tiles.js
    // mappables.js
import './server/view.js';
    // actor.js
import './server/sound.js';
    // person.js
import './extensions/stats/stats_server.js';
import './extensions/equipment/equipment_server.js';
    // hero.js
    // item.js
import './server/companion.js';
import './server/enemies.js';
import './server/skills.js';
import './server/items.js';
    // combat_server.js

//-- Scaffolding (Remove) --------------------------
fakeNetwork.client = client;
fakeNetwork.gameManager = gameManager;

//-- Launch Game ---------------------------------
client.setup({
    containerId: 'game_area',
    font: 'press_start_kregular',
    highlightColor: '#fc0'
});
