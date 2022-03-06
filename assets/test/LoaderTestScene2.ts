
const {ccclass,inspector, property} = cc._decorator;

@ccclass
//@inspector("packages://autoproperty/inspector.js")
export default class LoaderTestScene2 extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
