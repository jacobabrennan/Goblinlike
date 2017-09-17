var g = () => {
    return gameManager.currentGame;
};
var h = () => {
    return g().hero;
};
var l = () => {
    return mapManager.getLevel(h().levelId);
};