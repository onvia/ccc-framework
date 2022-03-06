
import { engine } from "../scripts/framework/Engine";
import { LoaderMgr } from "../scripts/framework/loader/LoaderMgr";
import { LoadingProcess } from "../scripts/framework/loader/LoadingProcess";
import { mvvm, VMLabel } from "../scripts/framework/vm/VMDecorator";
import { R } from "../scripts/utils/R";

const {ccclass,inspector, property} = cc._decorator;


@ccclass
@mvvm()
@inspector("packages://autoproperty/inspector.js")
export default class LoaderTestScene1 extends cc.Component {

    loadingProcess: LoadingProcess = null;

    @property(cc.Label)
    @VMLabel({watchPath: "*.progress"})
    progress: cc.Label = null;


    data = {
        progress: 0,
    }

    start () {
        engine.uibind.bind(this);
    }

    onClickProgressTest(){
        let uiLoader = engine.loaderMgr.get(engine.loaderMgr.KEY_UI);
        let share = engine.loaderMgr.share;
        this.loadingProcess = new LoadingProcess();
        let loader = this.loadingProcess;

        let onprogress = (a,b,c: cc.AssetManager.RequestItem)=>{
            console.log(`LoaderTest-> 进度  ${c.url}`);
            
        }

        let oncomplete = (err,res: cc.Asset)=>{
            console.log(`LoaderTest-> 完成 ${res.name}`);
            
        }

        loader.addTask(share.load(R.image.setting1,cc.SpriteFrame,onprogress,oncomplete,'core'));
        loader.addTask(share.load(R.image.setting2,cc.SpriteFrame,oncomplete,'core'));
        loader.addTask(share.load(R.image.setting3,cc.SpriteFrame,'core'));
        loader.addTask(share.load(R.image.setting4,cc.SpriteFrame,'core'));
        loader.addTask(share.load(R.image.setting5,cc.SpriteFrame,'core'));
        loader.addTask(share.load(R.image.setting6,cc.SpriteFrame,'core'));
        // loader.addTask(loader.loadScene(R.scene.LobbyScene,R.bundle.lobby));
        loader.addTask(uiLoader.load(R.prefab.FailureView,cc.Prefab))
        loader.addTask(uiLoader.load(R.prefab.SuccessfulView,cc.Prefab))
        loader.addTask(uiLoader.load(R.prefab.PauseView,cc.Prefab))
        loader.addTask(uiLoader.loadDir("view",cc.Prefab));
        loader.taskStart({
            onLoadingComplete: ()=>{
                
                loader
                this.debug();
                console.log(`LoaderTest-> 加载完成`);
            }
        },3);
    }

    onClickReleaseUI(){
        
        // let uiLoader = engine.loaderMgr.get(engine.loaderMgr.UI);
        engine.loaderMgr.releaseLoader(engine.loaderMgr.KEY_UI);
        this.debug();

        this.scheduleOnce(()=>{
            this.debug();
        });
    }

    debug(){
        
        engine.loaderMgr;
        engine.uiMgr
        cc.assetManager.assets

        console.log(`LoaderTestScene1-> debug`);
    }

    async onClickView1(){
        engine.uiMgr.showUI(R.prefab.PauseView);
        
        
    }
    async onClickView2(){
        await engine.uiMgr.preShowUI({path: R.prefab.SuccessfulView});
        this.debug();
    }

    async onClickScene(){
        let sceneAsset = await engine.loader.loadScene(R.scene.LobbyScene,R.bundle.lobby);
        cc.director.runScene(sceneAsset)
        console.log(`LoaderTest-> `);
    }


    
    update (dt) {
        if(this.loadingProcess?.isLoading){
            let progress =  this.loadingProcess.step(dt);
            this.data.progress = progress;
            console.log(`LoaderTest-> ${progress}`);
            
        }
    }
}
