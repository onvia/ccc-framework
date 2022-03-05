
   
function updateSceneRenderers () { // very costly iterations    
    let rootNodes = cc.director.getScene().children;
    // walk all nodes with localize label and update
    let allLocalizedLabels = [];
    for (let i = 0; i < rootNodes.length; ++i) {
        let labels = rootNodes[i].getComponentsInChildren('LocalizedLabel');
        Array.prototype.push.apply(allLocalizedLabels, labels);
    }
    for (let i = 0; i < allLocalizedLabels.length; ++i) {
        let label = allLocalizedLabels[i];
        if(!label.node.active)continue;
        label.updateLabel();
    }
    // walk all nodes with localize sprite and update
    let allLocalizedSprites = [];
    for (let i = 0; i < rootNodes.length; ++i) {
        let sprites = rootNodes[i].getComponentsInChildren('LocalizedSprite');
        Array.prototype.push.apply(allLocalizedSprites, sprites);
    }
    for (let i = 0; i < allLocalizedSprites.length; ++i) {
        let sprite = allLocalizedSprites[i];
        if(!sprite.node.active)continue;
        sprite.updateSprite();
    }
}

module.exports = {    
    "update-default-language": updateSceneRenderers,
};