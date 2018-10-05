

//== Goblin-Like ===============================================================

//-- Imports -------------------------------------
import client from './client/full_client.js';

//-- Scaffolding (Remove) --------------------------
window.goblinClient = client;

//-- Launch Game ---------------------------------
client.setup({
    containerId: 'game_area',
    font: 'press_start_kregular',
    highlightColor: '#fc0'
});
