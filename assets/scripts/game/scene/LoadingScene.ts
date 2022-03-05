import SceneBase from "../../framework/core/scene/SceneBase";
import { engine } from "../../framework/Engine";
import { LoadingProcess } from "../../framework/loader/LoadingProcess";
import { R } from "../../utils/R";

const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class LoadingScene extends SceneBase implements OnLoadingListener, ISceneListener{
    
    @property(cc.ProgressBar)
    progressBar: cc.ProgressBar = null;

    @property(cc.Label)
    progerssLabel: cc.Label = null;
    
    @property(cc.Label)
    version: cc.Label = null;

    loader: LoadingProcess = null;
    

    @property(cc.Node)
    btnNext: cc.Node = null;

    lobbyScene: cc.SceneAsset = null;
    start () {
      engine.uibind.bind(this);
      engine.sceneMgr.group = 'UI';
      let loader = this.loader = new LoadingProcess();
      this.loader.addTask(loader.loadScene(R.scene.LobbyScene,(err,asset)=>{
        this.lobbyScene = asset;
      },R.bundle.lobby));
      this.loader.taskStart(this,2);
    }

    onLoadingComplete(){
        engine.sceneMgr.to(this.lobbyScene);
    }

    onSceneHideEnd(){

    }

    update (dt) {
        if(!this.loader){
            return;
        }
        let progress = this.loader.step(dt);
        this.progressBar.progress = progress;

        this.progerssLabel.string = `${Math.floor(progress*100)}%`
    }


}
