import SceneBase from "../../framework/core/scene/SceneBase";
import { engine } from "../../framework/Engine";
import { R } from "../../utils/R";

const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class FightingScene extends SceneBase {


    start () {

        engine.uibind.bind(this);
    }

    onClickExit(){
        engine.sceneMgr.to(R.scene.LobbyScene);
    }
}
