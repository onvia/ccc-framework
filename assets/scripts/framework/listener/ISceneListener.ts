interface ISceneListener {
    /** 开始预加载 */
    onSceneBeginPreLoad?();
    /** 预加载完成 */
    onScenePreLoaded?();
    
    onSceneHideBegin?();
    onSceneHideEnd?();
    

    onSceneWillShow?();
    onSceneShown?();
    
    onTransitionWillFinished?();
    onTransitionFinished?();

}