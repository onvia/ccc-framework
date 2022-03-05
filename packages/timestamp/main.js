'use strict';

let startTime;
function onBuildStart(options, callback){
    
    let date = new Date();
    startTime = date;
    callback();
}
function onBeforeBuildFinish(options, callback){

    let date = new Date();
    let duration = (date.getTime() - startTime.getTime());
    Editor.success(`构建完成  ${date.toLocaleDateString()} ${date.toLocaleTimeString()}，耗时 ${(duration/1000).toFixed(2)} 秒`);
    callback();
}

module.exports = {
  
    load () {
        Editor.log("时间戳插件加载完成");
        Editor.Builder.on('build-start', onBuildStart);
        // Editor.Builder.on('before-change-files', onBeforeChangeFiles);
        Editor.Builder.on('build-finished', onBeforeBuildFinish);
    },
    
    unload() {
        Editor.Builder.removeListener('build-start', onBuildStart);
        // Editor.Builder.removeListener('before-change-files', onBeforeChangeFiles);
        Editor.Builder.removeListener('build-finished', onBeforeBuildFinish);
    },

  // register your ipc messages here
  messages: {
  },
};