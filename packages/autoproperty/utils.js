let assets = [];
let prefabs = [];
let utils = {
    load(cb){
       this.reloadPrefabs(cb);
    },
    reloadPrefabs(cb = null){
        prefabs.length = 0;
        Editor.assetdb.queryAssets('db://assets/**\/*', 'prefab', function (err, results) {
            prefabs = results;            
            Editor.log('utils->prefabs: ',prefabs.length);
            console.log('utils->prefabs: ',prefabs.length);
            
            if(cb){
                cb();
            }
        });
    },
    prefabs(){        
        Editor.log('utils->prefabs: ',prefabs.length);
        console.log('utils->prefabs: ',prefabs.length);
        return prefabs;
    }
}

module.exports = utils