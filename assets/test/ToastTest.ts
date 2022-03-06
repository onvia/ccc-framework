import { engine } from "../scripts/framework/Engine";
import { Toast } from "../scripts/framework/gui/Toast";

const {ccclass,inspector, property} = cc._decorator;

const toast_texts = ["短的提示",'这是一个长的提示','这个是一个非常长的大提示，需要换行的哟'];

@ccclass
//@inspector("packages://autoproperty/inspector.js")
export default class ToastTest extends cc.Component {



    start () {

    }

    onClickAdd(){
        // setInterval(()=>{
            
        // },100);
        engine.toast.show(toast_texts.random());
        
    }

    // update (dt) {}
}
