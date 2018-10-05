

//== Debugging Utilities =======================================================

const g = () => {
    return gameManager.currentGame;
};
const h = () => {
    return g().hero;
};
const l = () => {
    return mapManager.getLevel(h().levelId);
};
