import { UIMgr } from "./UIMgr";

const {ccclass, property,executeInEditMode} = cc._decorator;

    enum UIType {
        Dialog = 0, // 对话框
        Tip= 1, //提示，自动消失
    };
    /**UIShowMode 枚举，表示窗体不同的显示方式。
     *  Normal 类型表示窗体与其他窗体可以并列显示； 不会被 返回键 管理
     *  HideOther类型表示窗体显示的时候，需要隐藏所有其他窗体;
     *  ReverseChange 窗体主要应用与"弹出窗体"，维护多个弹出窗体的层级关系。 //后进先出 //后进不隐藏先出
     **/
    enum UIShowMode{
        //普通
        Normal=0,
        //反向切换
        ReverseChange=1,
        //隐藏其他
        HideOther= 2
    };
    //蒙版类型
    enum MaskType {
        Translucence= 0, // 半透明
        Lucency= 1, //完全透明
    };
    
    enum TouchMaskType {
        //吞并点击，不做处理
        Swallow= 0,
        //穿透
        Pentrate= 1,
    };
    enum CloseType {
        //普通关闭
        Normal= 0,
        //点击背景关闭
        Click= 1,
        //自动关闭
        Auto= 2,
        //点击且可以自动关闭
        ClickAndAuto= 3,
    };
    @ccclass
    // @executeInEditMode
    export class UIViewBase<Options = any> extends cc.Component {
        
        
        static UIType = UIType;
        static UIShowMode = UIShowMode;
        static MaskType = MaskType;
        static TouchMaskType = TouchMaskType;
        static CloseType = CloseType;
        
        
        public isEffect: boolean;
        public uiname: string;
        public mask: cc.Node;
    
        /** 弹窗 参数 */
        protected options: Options = null;
        
        @property()
        private _uiType: UIType = UIType.Dialog;
        @property({
            type: cc.Enum(UIType),
            tooltip: "UI 类型：\n1.对话框\n2.提示（自动关闭）",
        })
        public get uiType() : UIType {
            return this._uiType;
        }    
        public set uiType(v : UIType) {
            this._uiType = v;        
            this._updateUIType();     
        }
        
    
        @property({
            type: cc.Enum(UIShowMode),
            tooltip: "显示类型：\n1.普通\n2.反向切换（后进先出）\n3.隐藏其他",
        })
        showMode: UIShowMode = UIShowMode.ReverseChange;
    
        @property()
        private _maskType: MaskType = MaskType.Translucence;
        @property({
            type: cc.Enum(MaskType), 
            tooltip: "蒙版类型：\n1.半透明\n2.全透明",
        })
        public get maskType() : MaskType {
            return this._maskType;
        }
        public set maskType(v : MaskType) {
            this._maskType = v;
            this._updateMaskType();
        }
    
        @property({
            type: cc.Enum(TouchMaskType),
            tooltip: "点击类型：\n1.吞并点击\n2.穿透点击",
        })
        touchMaskType: TouchMaskType = TouchMaskType.Swallow;
    
        @property({
            type: cc.Enum(CloseType),
            tooltip:  "UI关闭方式：\n1.正常点击按钮和返回键关闭\n2.点击背景关闭\n3.自动关闭\n4.自动关闭且可以点击背景关闭",
        })
        closeType: CloseType = CloseType.Normal
    
        @property({
            type: cc.Float,
            min: 0.2,
            tooltip: "自动关闭延时",
            visible(){
                 return this.closeType == CloseType.Auto || this.closeType == CloseType.ClickAndAuto;
            }
        })
        autoCloseDuration: number = 1;
        
        @property({
            tooltip: "弹窗唯一性"
        })
        isOnly: boolean = true;
        
        @property({
            tooltip: "当显示这个窗体视图的时候，\n关闭其他窗体",
            visible(){
                return this.showMode == UIShowMode.ReverseChange;
           }
        })
        isClearStack: boolean = false;
    
        @property({
            min: 0,
            max: 255,
            type: cc.Integer,
            tooltip: "蒙版透明度",
            visible() {
                return this.maskType == MaskType.Translucence;
            }
        })
        private _maskOpacity: number = 230;
        public get maskOpacity(): number {
            return this._maskOpacity;
        }
        public set maskOpacity(value: number) {
            this._maskOpacity = value;
        }
    
        private _showListeners = [];
        private _closeListeners = [];
        private _willCloseListeners = [];
        
        onLoad(){
            
        }
    
        start () {
            
        }
        
        onCreate(param: Options){
            this.options = param;
        }

        onInit(param: Options){
            // if(param){
            //     cc.log('UIView->param: %s',JSON.stringify(param));
            // } 
        }
    
    
        //页面隐藏
        onUIHide(){
    
        }
        
        //页面从隐藏重新显示
        onUIReShow(){
    
        }
    
        
        /**
         * 页面唤醒 
         * 可能跟 onEnable 功能重叠
         */
        onUIAwake(){
    
        }
        /**
         * 页面冻结(显示，但是不参加事件监听，还在“栈”集合中) <\br>
         * 可能跟 onDisable 功能重叠
         */
        onUIFreeze(){
    
        }
        
        //监听显示
        addShowListener(func){
            this._showListeners.push(func);
        }
    
        //监听关闭
        addCloseListener(func){
            this._closeListeners.push(func);        
        }
    
        addWillCloseListener(func){
            this._willCloseListeners.push(func);
        }

        removeShowListener(func){
            var index = this._showListeners.indexOf(func);
            if (index > -1) {
                this._showListeners.splice(index, 1);
            }
        }
    
        removeCloseListener(func){
            var index = this._closeListeners.indexOf(func);
            if (index > -1) {
                this._closeListeners.splice(index, 1);
            }
        }
    
        removeWillCloseListener(func){
            var index = this._willCloseListeners.indexOf(func);
            if (index > -1) {
                this._willCloseListeners.splice(index, 1);
            }
        }

        exeShowListeners(){
            let self = this;
            for (let i = 0; i < self._showListeners.length; i++) {
                const func = self._showListeners[i];
                func();
            }
        }
    
        exeWillCloseListeners(){
            let self = this;
            for (let i = 0; i < self._willCloseListeners.length; i++) {
                const func = self._willCloseListeners[i];
                func();
            }
        }
        exeCloseListeners(){
            let self = this;
            for (let i = 0; i < self._closeListeners.length; i++) {
                const func = self._closeListeners[i];
                func();
            }
        }
    
        onShowCallback(){
            cc.log('UIView-> onShowCallback');
            
        }
        onCloseCallback(){
            cc.log('UIView-> onCloseCallback');
        }
    
        showAction (){
            this.node.scale = 0.2;
            this.node.opacity = 0;
            let duration = 0.2;
            // let action = cc.spawn(cc.scaleTo(duration,1.0).easing(cc.easeBackOut()),cc.fadeIn(duration));
           let action = cc.tween().to(duration,{ scale: {value: 1,easing: cc.easing.backOut }, opacity: 255})
            return action;
        }
    
        closeAction(){
            let duration = 0.2;
            // let action = cc.spawn(cc.scaleTo(duration,0).easing(cc.easeBackIn()),cc.fadeOut(duration));
            let action = cc.tween().to(duration,{ scale: {value: 0,easing: cc.easing.backIn }, opacity: 0})
            return action;
        }
        
        //注册自动关闭
        registerAutoClose(){
            let self = this;
            //如果是提示则自动关闭   或者手动选择为自动关闭和手动关闭
            if(self.uiType == UIType.Tip || self.closeType == CloseType.Auto || self.closeType == CloseType.ClickAndAuto){
                // cc.tween(self.node)
                // .delay(self.autoCloseDuration)
                // .call(()=>{
                //     self.close();
                // }).start();
                cc.tween(this.node).delay(self.autoCloseDuration).call(()=>{
                    this.close();
                }).start();
                // self.node.runAction(cc.sequence(
                //     cc.delayTime(self.autoCloseDuration),
                //     cc.callFunc(function() {
                //         self.close();
                //      }, self)
                //     ));
            }
        }
    
        //注册点击关闭
        registerClickClose(){
            let self = this;
            if(self.closeType == CloseType.Click || self.closeType == CloseType.ClickAndAuto){
                let buttonNode = new cc.Node();
                buttonNode.addComponent(cc.Button);
                buttonNode.width = this.node.width;
                buttonNode.height = this.node.height;
                buttonNode.parent = this.node;
                buttonNode.zIndex = -999;
                buttonNode.name = 'ViewClickClose';
                buttonNode.on("click",self._onClickMask,self);
            }
        }
        unregisterClickClose(){
            let self = this;
            if(self.closeType == CloseType.Click || self.closeType == CloseType.ClickAndAuto){
                let buttonNode = self.node.getChildByName('ViewClickClose');
                buttonNode && buttonNode.off("click",self._onClickMask,self);
            }
        }
        
        //点击关闭
        _onClickMask(){
            this.close();
        }
    
        onKeyBack(){
            return true;
        }
    
        close(){
            UIMgr.getInstance().closeUI(this);
        }
    
    
         //只有在编辑器才执行
         _updateUIType(){
            if (CC_EDITOR) {
                if(this.uiType === UIType.Dialog){//一般情况下是 半透明，吞并点击，普通关闭
                    this.maskType = MaskType.Translucence;
                    this.closeType = CloseType.Normal;
                }else if(this.uiType === UIType.Tip){//一般情况下是 透明，穿透，自动关闭
                    this.maskType = MaskType.Lucency;
                    this.closeType = CloseType.Auto;
                }
            }
        }
    
        _updateMaskType(){
            if (CC_EDITOR) {
                if(this.maskType === MaskType.Translucence){// 半透明一般情况下是，吞并点击，普通关闭
                    this.touchMaskType = TouchMaskType.Swallow;
                }else if(this.maskType === MaskType.Lucency){//一般情况下是 透明，穿透，自动关闭
                    this.touchMaskType = TouchMaskType.Pentrate;
                }
            }
        }
        // update (dt) {}
    }
 
