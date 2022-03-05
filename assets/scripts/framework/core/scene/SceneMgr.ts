import { EventMgr } from "../../event/EventMgr";
import { AssetLoader } from "../../loader/AssetLoader";
import SceneBase from "./SceneBase";

export class SceneMgr extends EventMgr implements ISceneListener{

    readonly EVENT_EXIT_SCENE = "EVENT_EXIT_SCENE";

    private duartion = 0;
    private previousScene = null;
    private currentScene = null; //当前的
    private listeners: Array<ISceneListener> = [];
    public static _sceneMgr: SceneMgr = null;
    public group = 'default';

    private isTransing = false;
    
    addSceneListener(listener: ISceneListener){
        if(!listener){ return; }
        this.listeners.push(listener);
    }
    removeSceneListener(listener: ISceneListener){
        if(!listener){ return; }
        let idx = this.listeners.indexOf(listener);
        if(idx != -1){
            this.listeners.splice(idx,1);
        }
    }


    public async to<Opts>(newscene: string | cc.SceneAsset,opts?:{opts?: Opts,group?:string,color?: cc.Color,listener?: ISceneListener,pure?: boolean,bundle?: string,duration?: number}) {
        let self = this;

        if(self.isTransing){
            cc.log(`SceneMgr-> 正在跳转场景`);
            
            return;
        }
        self.isTransing = true;
        let sceneAsset: cc.SceneAsset = null;
        if(newscene instanceof cc.SceneAsset){
            sceneAsset = newscene;
            newscene = sceneAsset.name;
        }
        
        let listener: ISceneListener = opts && opts.listener;
        let color = (opts && opts.color && opts.color)  || cc.color(0, 0, 0, 255);
        let pure = (opts && opts.pure) || false;
        let duration = (opts && opts.duration) || 1;

        
        let transition = new cc.Node();
        let sprite = transition.addComponent(cc.Sprite);
        transition.opacity = 0;
        transition.color = color;
        let size = cc.winSize;
        transition.width = size.width;
        transition.height = size.height;
        transition.addComponent(cc.BlockInputEvents);
        transition.group = (opts && opts.group) || this.group;
        
        transition.scale = 10;

        transition.x = transition.width / 2;
        transition.y = transition.height / 2; 

        transition.name = "transition";
        // cc.assetManager.main



        // 引擎内置单色图
        let texture = cc.assetManager.assets.get('0275e94c-56a7-410f-bd1a-fc7483f7d14a') as cc.Texture2D;

        sprite.spriteFrame = new cc.SpriteFrame(texture);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        transition.setContentSize(size);

        // cc.resources.load("singleColor", cc.SpriteFrame, function (error, spriteFrame: cc.SpriteFrame) {
        //     let size = transition.getContentSize();
        //     if(error){
        //         cc.error('SceneMgr-> singleColor is not exist');
        //         return;
        //     }
        //     sprite.spriteFrame = spriteFrame;
        //     sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        //     transition.setContentSize(size);
        // });

        cc.game.addPersistRootNode(transition);
        let sceneName = newscene;

        this.previousScene = this.currentScene;
        this.currentScene = sceneName;
        cc.log('SceneMgr-> to: ', sceneName);

        listener && this.listeners.unshift(listener);

        self.onSceneBeginPreLoad();

        let onLaunched = ()=> {
            let _sceneBase = cc.director.getScene().getComponentInChildren(SceneBase);
            _sceneBase?.onLaunchOpts(opts && opts.opts);
            _sceneBase?.onSceneLoaded();
            self.onSceneWillShow();
            cc.tween(transition)
            .to(pure? 0 : 0.627 * duration,{opacity:pure?0:160})
            .call(function(){
                _sceneBase?.onTransitionWillFinished();
                self.onTransitionWillFinished();
                transition.removeComponent(cc.BlockInputEvents);
                self.isTransing = false;
            })
            .to(pure?0:0.372 * duration,{opacity: 0})
            .call(()=>{
                cc.game.removePersistRootNode(transition);
                transition.destroy();
                _sceneBase?.onTransitionFinished();
                self.onTransitionFinished();
                self.onSceneShown();
                this.removeSceneListener(listener);
            })
            .start();
        };

        if(!sceneAsset){
            sceneAsset = await AssetLoader.getInstance().loadScene(sceneName,
                (finish: number,total: number,item: cc.AssetManager.RequestItem)=>{
    
                },
                (err,sceneAsset: cc.SceneAsset)=>{

                },
                opts?.bundle);
        }

        if(sceneAsset){
            let _sceneBase = cc.director.getScene().getComponentInChildren(SceneBase);
            _sceneBase?.onSceneHideBegin();
            self.onScenePreLoaded();  //场景加载完成
            self.onSceneHideBegin();
            cc.tween(transition)
            .to(pure? 0 : 0.5 * duration,{opacity: pure?0:255})
            .call(()=>{
                _sceneBase?.onSceneHideEnd();
                self.onSceneHideEnd();
                EventMgr.getInstance().emit(self.EVENT_EXIT_SCENE);
                self.emit(self.EVENT_EXIT_SCENE);
                cc.director.runSceneImmediate(sceneAsset,()=>{
                },onLaunched);
            })
            .start();
        }
        
    }

    public isPreviousScene(scenename: string | number) {
        return this.previousScene == scenename;
    }

    public isCurrentScene(scenename: string | number) {
        return this.currentScene == scenename;
    }

    public getCurrentSceneName(){
        return this.currentScene;
    }


    onSceneBeginPreLoad(){
        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onSceneBeginPreLoad?.();
        }
    }
    onScenePreLoaded(){
        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onScenePreLoaded?.();
        }
    }
    onSceneHideBegin() {
        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onSceneHideBegin?.();
        }
    }
    onSceneHideEnd(){
        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onSceneHideEnd?.();
        }
    }

    onTransitionWillFinished(){

        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onTransitionWillFinished?.();
        }
    }
    onTransitionFinished(){
        
        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onTransitionFinished?.();
        }
    }


    onSceneWillShow() {
        
        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onSceneWillShow?.();
        }
    }
    onSceneShown() {
        
        let self = this;
        for (let index = 0; index < self.listeners.length; index++) {
            const listener = self.listeners[index];
            listener.onSceneShown?.();
        }
    }
    







    private static instance: SceneMgr = null;
    public static getInstance(): SceneMgr {
        if (!this.instance) {
            this.instance = new SceneMgr();
        }
       return this.instance;
    }
}
