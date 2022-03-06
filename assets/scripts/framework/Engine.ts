import { SceneMgr } from "./core/scene/SceneMgr";
import { UIBind } from "./core/UIBind";
import { EventMgr } from "./event/EventMgr";
import { Toast } from "./gui/Toast";
import { Keyboard } from "./input/Keyboard";
import { Touch } from "./input/Touch";
import { AssetLoader } from "./loader/AssetLoader";
import { LoaderMgr } from "./loader/LoaderMgr";
import { Mathf } from "./math/Mathf";
import { Services } from "./services/Services";
import { UIMgr } from "./ui/UIMgr";

class Engine{
    readonly EVENT_TIME_NOW = "EVENT_TIME_NOW";
    
    keyboard: Keyboard = Keyboard.getInstance();
    event: EventMgr = EventMgr.getInstance();
    touch: Touch = Touch.getInstance();
    uibind: UIBind = UIBind.getInstance();
    loader: AssetLoader = AssetLoader.getInstance();
    sceneMgr: SceneMgr = SceneMgr.getInstance();
    services: Services = Services.getInstance();
    toast: Toast = Toast.getInstance();
    math: Mathf = Mathf.getInstance();
    uiMgr: UIMgr = UIMgr.getInstance();
    loaderMgr: LoaderMgr = LoaderMgr.getInstance();
    
    nowTime(){
        cc.game.emit(this.EVENT_TIME_NOW,cc.sys.now());
    }

    enableTimer(){
        let self = this;
        if (!CC_EDITOR) {
            setInterval(self.nowTime.bind(self), 1000);
        }
    }
    private static instance: Engine = null;
    public static getInstance(): Engine {
        if (!this.instance) {
            this.instance = new Engine();
        }
       return this.instance;
    }
}

export const engine = Engine.getInstance();