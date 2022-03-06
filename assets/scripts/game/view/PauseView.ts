import { engine } from "../../framework/Engine";
import { AssetLoader } from "../../framework/loader/AssetLoader";
import { UIViewBase } from "../../framework/ui/UIViewBase";
import { R } from "../../utils/R";

const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class PauseView extends UIViewBase {

    public get loader() {
        return engine.loaderMgr.get(PauseView);
    }

    start () {
        engine.uibind.bind(this);
        console.log(`PauseView-> `);

        this.loadAsset();
    }

    onClickClose(){
        this.close();
        this.loader.releaseAll();
    }

    loadAsset(){
        this.loader.loadDir("images/decor",cc.SpriteFrame);
    }
    
    onClickResume(){
        engine.uiMgr.preShowUI({path: R.prefab.SuccessfulView});
    }

    // update (dt) {}
}
