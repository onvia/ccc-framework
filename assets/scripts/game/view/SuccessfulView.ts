import { engine } from "../../framework/Engine";
import { UIViewBase } from "../../framework/ui/UIViewBase";

const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class SuccessfulView extends UIViewBase {


    public get loader() {
        return engine.loaderMgr.get(this.uuid);;
    }


    start () {

        engine.uibind.bind(this);
        this.loadAsset();
        console.log(`SuccessfulView-> `);
    }

    loadAsset(){
        this.loader.loadDir("images/decor",cc.SpriteFrame);
        this.loader.loadDir("images/skins",cc.SpriteFrame);
    }

    onClickHome(){
        this.close();
        engine.loaderMgr.releaseLoader(this.uuid);
    }
    // update (dt) {}
}
