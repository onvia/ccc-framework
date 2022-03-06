import { UITriggerMode } from "../../framework/ui/UITriggerMode";
import { UIViewBase } from "../../framework/ui/UIViewBase";

const {ccclass, property} = cc._decorator;

/** 事件 id */
interface _UIEventID {
    
    ClickVideo?: number;
    BeginPlayVideo?: number;
    VideoSuccess?: number;
    VideoFail?: number;
    VideoReward?: number;
    
    /** 自动关闭界面 */
    AutoClose?: number;

    /** 用户主动关闭界面 */
    UserClose?: number;
    
    /** 自动打开界面 */
    AutoOpen?: number;

    /** 用户打开界面 */
    UserOpen?: number;
    
    /** 无论何种方式打开界面都会发送此事件 */
    NormalOpen?: number;
    /** 无论何种方式关闭界面都会发送此事件 */
    NormalClose?: number;
};

type OptsLife = {trigger?: UITriggerMode,source?: any | string};
type UISource = any;
@ccclass
export default class UIView<Options> extends UIViewBase<Options> implements _UIEventID{

    ClickVideo: number;
    BeginPlayVideo: number;
    VideoSuccess: number;
    VideoFail: number;
    VideoReward: number;
    
    /** 自动关闭界面 */
    AutoClose: number;

    /** 用户主动关闭界面 */
    UserClose: number;
    
    /** 自动打开界面 */
    AutoOpen: number;

    /** 用户打开界面 */
    UserOpen: number;

    /** 无论何种方式打开界面都会发送此事件 */
    NormalOpen: number;

    /** 无论何种方式关闭界面都会发送此事件 */
    NormalClose: number;

    @property(cc.Node)
    bannerTemplate: cc.Node = null;
    
    /** 弹窗 参数 */
    protected options: Options & OptsLife = null;
    //激励类型
    // protected incentiveType: IncentiveType = IncentiveType.Unknow;
    protected uiSource: UISource;
    protected triggerMode: UITriggerMode = UITriggerMode.unknow;
    onCreate(param: Options & OptsLife){
        super.onCreate(param);
        // this.dot && sdkAgent.trackVideoDialogShow(this.dot);
        
        if(this.NormalOpen != void 0 && this.NormalOpen != -1){
            this.addShowListener(this._onNormalOpenEvent.bind(this));
        }
        
        if(this.NormalClose != void 0 && this.NormalClose != -1){
            this.addCloseListener(this._onNormalCloseEvent.bind(this));
        }
    }
    
    public onInit(param: Options & OptsLife) {
        
    }
    protected parseParams(param: OptsLife){
        this.parseTriggerMode(param);
        this.parseSource(param);
    }
     /** 解析界面来源 并发送 来源事件*/
    protected parseSource(param: OptsLife){
        if(!param || !param.source){
            return;
        }
        this.uiSource = param.source;

    }
    
    /** 解析界面触发方式 并发送 事件*/
    protected parseTriggerMode(param: OptsLife){
        if(!param || !param.trigger){
            return;
        }
        this.triggerMode = param.trigger;
        if(this.triggerMode == UITriggerMode.auto){
            // trackMgr.onEvent(this.AutoOpen,{type: TrackEventType.MainEvent});
        }else if(this.triggerMode == UITriggerMode.initiative){
            // trackMgr.onEvent(this.UserOpen,{type: TrackEventType.MainEvent});
        }
    }
  

    //点击关闭
    onClickClose() {
        this.close();
        //发送关闭事件
        this.onUserClose();
    }
    
    /** 自动关闭界面 */
    onAutoClose(){
        if(this.AutoClose != -1){
            // trackMgr.onEvent(this.AutoClose,{type: TrackEventType.MainEvent});
        }
    }
    /** 用户主动关闭界面 */
    onUserClose(){
        if(this.UserClose != -1){
            // trackMgr.onEvent(this.UserClose,{type: TrackEventType.MainEvent});
        }
    }

    protected _onNormalOpenEvent(){
        if(this.NormalOpen != -1){
            // trackMgr.onEvent(this.NormalOpen,{type: TrackEventType.MainEvent});
        }
    }
    protected _onNormalCloseEvent(){
        if(this.NormalClose != -1){
            // trackMgr.onEvent(this.NormalClose,{type: TrackEventType.MainEvent});
        }
    }
}

export function UIEventID(_eventID: _UIEventID){
    return function (target: any) {
        for (const key in _eventID) {
            if (Object.prototype.hasOwnProperty.call(_eventID, key)) {
                const value = _eventID[key];

                Object.defineProperty(target.prototype,key,{
                    get(){
                        if(this[`__${key}`] === undefined){
                            this[`__${key}`] = value;
                        }
                        return this[`__${key}`];
                    },
                    set(val){
                        this[`__${key}`] = val;
                    },
                    enumerable: true,
                    configurable: true
                })
                
            }
        }
   } 
}
