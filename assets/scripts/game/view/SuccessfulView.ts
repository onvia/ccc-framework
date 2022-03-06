import { engine } from "../../framework/Engine";
import { UIViewBase } from "../../framework/ui/UIViewBase";

const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class SuccessfulView extends UIViewBase {



    start () {

        engine.uibind.bind(this);
        let loader = engine.loaderMgr.get(SuccessfulView);
        console.log(`SuccessfulView-> `);
    }

    // update (dt) {}
}
