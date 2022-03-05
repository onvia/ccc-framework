'use strict';

let utils = require('./utils');
// let {ipcMain} = require('electron')
let OPERATION_CREATE = 0;
let OPERATION_MOVE = 1;
let OPERATION_DELETE = 2;
let OPERATION_CHANGE = 3;
let OPERATION_REWRITE = 4;
let operation_des = {
    0: "创建",
    1: "移动",
    2: "删除",
    3: "修改",
};
function assetChanged(arg, operation) {
    if (arg && arg.length > 0) {
        let pathOrUrl = arg[0].url || arg[0].path;
        
        // Editor.log(`autoproperty: ${operation_des[operation]} 文件： ${pathOrUrl}`);

        let isPrefab = pathOrUrl.endsWith(`.prefab`);

        if(isPrefab){
            utils.reloadPrefabs(()=>{
                sendMsgToRenderer();
            });
        }
        if(operation == OPERATION_CREATE){
         
        }else if(operation == OPERATION_DELETE){
        
        }

    } else if (!arg) {
        Editor.log('autoproperty: assetChanged error');
    }
}

function sendMsgToRenderer(){
    console.log('autoproperty  main-> sendMsgToRenderer');    
    // ipcMain.send('autoproperty-prefabs',utils.prefabs());
}

module.exports = {
  load () {
    // execute when package loaded
    Editor.log('autoproperty: loaded');
    
    utils.load(()=>{
        Editor.log('autoproperty: loaded prefabs');        
        sendMsgToRenderer();
    });
    
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
        'log' (event,args){
            Editor.log(`${args}`);
        },
        'savescene'(){
            Editor.Ipc.sendToPanel('scene', 'scene:stash-and-save');
            Editor.log("autoproperty: save scene");
        },
        'reloadend'(){
            Editor.success('autoproperty: prefabs loaded');
        },
        'open' () {
            // open entry panel registered in package.json
            Editor.Panel.open('autoproperty');
        },
        // 文件操作
        'asset-db:assets-created'(arg1, arg2) {
            assetChanged(arg2, OPERATION_CREATE)
        },
        'asset-db:assets-moved'(arg1, arg2) {
            assetChanged(arg2, OPERATION_MOVE)
        },
        'asset-db:assets-deleted'(arg1, arg2) {
            assetChanged(arg2, OPERATION_DELETE)
        },
  },
};