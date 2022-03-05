
import { engine } from "../scripts/framework/Engine";
import { LoadingProcess } from "../scripts/framework/loader/LoadingProcess";
import { R } from "../scripts/utils/R";

const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class LoaderTest extends cc.Component {

    @property(cc.Sprite)
    icon: cc.Sprite = null;
    @property(cc.Sprite)
    icon2: cc.Sprite = null;
    
    
    loadingProcess: LoadingProcess = null;

    start () {
        
    }

    async onClickLoad(){
        

        // let spriteFrame = await engine.loader.load('image/default_sprite_splash',cc.SpriteFrame,cc.assetManager.internal);
        // this.icon.spriteFrame = spriteFrame;

        
        let spriteFrame2 = await engine.loader.load(R.image.setting1,cc.SpriteFrame,'core');
        this.icon2.spriteFrame = spriteFrame2;

        
        
    }
    async onClickRelease(){
        engine.loader.releaseAll();
    }

    async onClickScene(){
        let sceneAsset = await engine.loader.loadScene(R.scene.LobbyScene);
        cc.director.runScene(sceneAsset)
        console.log(`LoaderTest-> `);
    }

    onClickStartLoad(){
        this.loadingProcess = new LoadingProcess();
        let loader = this.loadingProcess;

        let onprogress = (a,b,c: cc.AssetManager.RequestItem)=>{
            console.log(`LoaderTest-> 进度  ${c.url}`);
            
        }

        let oncomplete = (err,res: cc.Asset)=>{
            console.log(`LoaderTest-> 完成 ${res.name}`);
            
        }

        loader.addTask(loader.load(R.image.setting1,cc.SpriteFrame,onprogress,oncomplete,'core'));
        loader.addTask(loader.load(R.image.setting2,cc.SpriteFrame,oncomplete,'core'));
        loader.addTask(loader.load(R.image.setting3,cc.SpriteFrame,'core'));
        loader.addTask(loader.load(R.image.setting4,cc.SpriteFrame,'core'));
        loader.addTask(loader.load(R.image.setting5,cc.SpriteFrame,'core'));
        loader.addTask(loader.load(R.image.setting6,cc.SpriteFrame,'core'));
        loader.addTask(loader.loadScene(R.scene.LobbyScene));

        loader.taskStart({
            onLoadingComplete: ()=>{
                console.log(`LoaderTest-> 加载完成`);
                
            }
        },3);

    }

    
    update (dt) {
        if(this.loadingProcess?.isLoading){
            let progress =  this.loadingProcess.step(dt);
            console.log(`LoaderTest-> ${progress}`);
            
        }
    }
}
