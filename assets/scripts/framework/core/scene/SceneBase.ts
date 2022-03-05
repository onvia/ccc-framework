const {ccclass, property} = cc._decorator;


@ccclass
export default class SceneBase<Options = any> extends cc.Component{
   

    options: Options;
    
    /** 场景启动选项，已经跳转进场景，但是未显示*/
    onLaunchOpts(options: Options){
        this.options = options;
    }

    /**
     * 场景加载完成 同 this.onLaunchOpts(...)
     */
    onSceneLoaded(){
        
    }
    
    /**
     * 开始隐藏场景
     */
    onSceneHideBegin() {
        
    }
    /**
     * 场景隐藏完成，可以释放资源
     */
    onSceneHideEnd() {
        
    }
    /**
     * 将要过渡结束 (没有完全显示完成，但是能看清场景)
     */
    onTransitionWillFinished(){
        
    }

    /**
     * 过渡结束，完整显示场景
     */
    onTransitionFinished(){
        
    }
}
