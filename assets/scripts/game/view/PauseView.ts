import { engine } from "../../framework/Engine";
import { UIViewBase } from "../../framework/ui/UIViewBase";

const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class PauseView extends UIViewBase {

    @property(cc.Label)
    label: cc.Label = null;


    

    start () {
        engine.uibind.bind(this);
    }

    onClickClose(){

    }


    // update (dt) {}
}
