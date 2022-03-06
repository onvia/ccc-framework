import { AssetLoader } from "../loader/AssetLoader";
import { LoaderMgr } from "../loader/LoaderMgr";
import { Align } from "./Align";
import { UITriggerMode } from "./UITriggerMode";
import { UIViewBase } from "./UIViewBase";


let ACTION_TAG = 200;
let _plugins: UIViewPluginBase[] = [];

export interface UIQueueOpts<Options = any>{
    /** 预制体路径参数 */
    pathOpts: {
        bundle?: string,
        path: string
    }

    // ui 参数
    uiOptions?: Options;

    /** ui 加载完成的回调 */
    uiLoadedCallback?: (uiview)=> void;
}

class UILoaderPlugin implements LoaderPlugin{
    name: string = "UILoaderPlugin";
    onLoadComplete(path: string, asset: cc.Prefab, bundle: cc.AssetManager.Bundle) {
        
        UIMgr.getInstance().addToUIList(asset,path);
    }
    onLoadDirComplete(dir: string, assets: cc.Prefab[], bundle: cc.AssetManager.Bundle) {
        let paths = [];
        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            // @ts-ignore
            let info = bundle.getAssetInfo(asset._uuid);
            let path = info.path;
            paths.push(path);
        }
        UIMgr.getInstance().addListToUIList(assets,paths);
    }
    onLoadSceneComplete(sceneName: string, scene: cc.SceneAsset, bundle: cc.AssetManager.Bundle) {
    }
    onRelease(path: string, asset: cc.Prefab) {
        UIMgr.getInstance().removeUIFromList(asset,path);
    }

}
export class UIMgr extends cc.EventTarget{
    public readonly Event = {
        All_VIEW_CLOSED: 'All_VIEW_CLOSED', 
        WILL_SHOW_VIEW: "WILL_SHOW_VIEW",
        WILL_CLOSE_VIEW: "WILL_CLOSE_VIEW",
        SHOWN_VIEW: 'SHOWN_VIEW', 
        CLOSE_VIEW: 'CLOSE_VIEW',
    };
    
    private isLoaderInited = false;
    get loader(): AssetLoader{
        if(CC_EDITOR){
            return;
        }
        let uiLoader = LoaderMgr.getInstance().get(LoaderMgr.getInstance().KEY_UI);
        if(!this.isLoaderInited){
            this.isLoaderInited = true;
            uiLoader.registerPlugin(new UILoaderPlugin());
        }
        return uiLoader;
    }

    //存储所有“UI窗体预设”路径
    //参数含义： 第1个string 表示“窗体预设”名称，后一个string 表示对应的路径
    private _uiPaths:Record<string,string> = {};

    //缓存所有已经打开的“UI窗体预设”
    //参数含义： 第1个string 表示“窗体预设”名称，后一个 UIViewBase 表示对应的“窗体预设”
    private _uiList: Record<string,cc.Prefab> = {};
    //“栈”结构表示的“当前UI窗体”集合。
    private _stack: UIViewBase[] = [];
    //当前显示状态的UI窗体集合
    private _currentShowUI: Record<string,Array<UIViewBase>> = {};

    //ui 队列， 顺序显示
    private _uiQueue: UIQueueOpts[] = [];

    public isShowViewing = false;
    public transition: cc.Node;
    private callLoadingMask;

    
    private static instance: UIMgr = null;
    public static getInstance(): UIMgr {
        if (!this.instance) {
            this.instance = new UIMgr();
            this.instance.loader;
        }
        return this.instance;
    }

    // //批量注册 ui // 尽量使用 loader.addDir({path:"",isDir: true}) 去批量注册
    // registerBatch(obj: any) {
    //     console.warn('UIMgr-> 推荐使用： loader.addDir({path:"",isDir: true})');
    //     for (const key in obj) {
    //         const path = obj[key];
    //         this.register(key, path);
    //     }

    //     this.logAllUI();
    // }
    // //尽量使用 loader.addUI({path:""}) 去注册
    // register(name: string, prefabpath: string) {

    //     console.warn('UIMgr-> 推荐使用： loader.addUI({path:""})');
    //     this._uiPaths[name] = prefabpath;
    //     if (!(name in this._uiList)) {
    //         cc.resources.load(prefabpath, cc.Prefab, function (err, prefab) {
    //             this._UIList[name] = prefab;
    //         }.bind(this));
    //     }
    // }


    addListToUIList(prefabs: Array < cc.Prefab > , paths: Array < string > ) {
        for (let i = 0; i < prefabs.length; i++) {
            let prefab = prefabs[i];
            let path = paths[i];
            this.addToUIList(prefab, path);
        }
    }
    addToUIList(prefab: cc.Prefab, path: string) {
        this._uiPaths[prefab.name] = path;
        this._uiList[prefab.name] = prefab;
    }

    removeUIFromList(prefab: cc.Prefab, path: string){
        delete this._uiPaths[prefab.name];
        delete this._uiList[prefab.name];
    }

    //依次显示的界面队列
    addToQueue<Options>(opts: UIQueueOpts<Options>) {
        this._uiQueue.push(opts);
    }
    //插入到队列
    insertToQueue<Options>(opts: UIQueueOpts<Options>) {
        this._uiQueue.unshift(opts);
    }


    //开始依次显示界面
    showQueue(cb?: Function) {
        let self = this;
        if (self._uiQueue.length <= 0) {
            if (cb) {
                cb();
            }
            return;
        }
        let ui = self._uiQueue.shift();
        self.preShowUI(ui.pathOpts, ui.uiOptions, function (view) {
            if (view) {
                ui.uiLoadedCallback && ui.uiLoadedCallback(view);
                view.addCloseListener(function () {
                    self.showQueue(cb);
                }.bind(self));
            }
        });

    }

    formatName(name){
        if(name instanceof cc.Component){
            return name;
        }
        let start = name.lastIndexOf("/");
        if (start != -1) {
            name = name.substring(start + 1, name.length);
        }
        return name;
    }
    //判断是否已经加载了资源
    isLoaded(name: string): boolean {
        let self = this;
        name = this.formatName(name);
        let ui = self._uiList[name];
        if (ui == null || ui == undefined) {
            return false;
        }
        return true;
    }
    getPrefab(name: string): cc.Prefab {
        let self = this;
        let ui = self._uiList[name];
        if (ui == null || ui == undefined) {
            return null;
        }
        return ui;
    }
    showUI<Options>(name: string, options: Options & {trigger?: UITriggerMode,source?: any} = null): UIViewBase<Options> {
        let uiview = null;
        name = this.formatName(name);
        if (this.isShowing(name)) {
            uiview = this.getUI(name);
            if (uiview.isOnly) {
                return uiview;
            }
        }
        uiview = this.createUI(name, options);
        if (!uiview) { //
            console.error(`UIMgr-> ${name} is null`);

            return uiview;
        }
        if (uiview.isClearStack) {
            this.clearStackArray();
        }
        //判断不同的窗体显示模式，分别进行处理
        switch (uiview.showMode) {
            case UIViewBase.UIShowMode.Normal:
                this.addUICache(name, uiview);
                break;
            case UIViewBase.UIShowMode.ReverseChange:
                this.pushUI(name, uiview);
                break;
            case UIViewBase.UIShowMode.HideOther:
                this.addUIAndHideOther(name, uiview);
                break;
        };
        return uiview;
    }

    async preShowUI<Options>(opts: {bundle?,path: string}, options: Options & {trigger?: UITriggerMode,source?: any} = null, cb?: (_uiview: UIViewBase<Options>)=> void): Promise<UIViewBase<Options>> {
        let self = this;
        self.isShowViewing = true;
        if(this.callLoadingMask){
            this.callLoadingMask.showLoading();
        }
        let prefabpath = opts.path;
        self.showSwallowMask();
        let name = null;
        let start = prefabpath.lastIndexOf("/");
        if (start != -1) {
            name = prefabpath.substring(start + 1, prefabpath.length);
        } else {
            name = prefabpath;
            prefabpath = "prefabs/view/" + prefabpath;
        }
        
        let showUIFunc = (name, param)=>{
            return new Promise<UIViewBase<Options>>((resolve,reject)=>{
                if(self.callLoadingMask){
                    self.callLoadingMask.hideLoading();
                }
                self.hideSwallowMask();
                let _ui = self.showUI(name, param);
                if (cb) {
                    cb(_ui);
                }
                resolve(_ui);
            });
        }
        if (name in self._uiList) {
            return showUIFunc(name, options);
        }

        let prefab = await this.loader.load(prefabpath,cc.Prefab,opts.bundle);
        return showUIFunc(prefab.name, options);
        // let bundle: cc.AssetManager.Bundle = await this.getBundle(opts.bundle);
        
        // if(!!bundle){
        //    let prefab = await new Promise<cc.Prefab>((resolve,reject)=>{
        //         bundle.load(prefabpath, cc.Prefab, function (err, prefab) {
        //             if(!err){
        //                 resolve(prefab)
        //             }else{
        //                 reject(err);
        //             }
        //         }.bind(this));   
        //     });
        //     self.addToUIList(prefab, prefabpath);
        //     return showUIFunc(prefab.name, options);
        // }
    }
    private async getBundle(bundleStr){
        let bundle: cc.AssetManager.Bundle = null;
        if(bundleStr){
            if(typeof bundleStr == 'string'){
                bundle = cc.assetManager.getBundle(bundleStr);
                if(!bundle){
                    try {                    
                        bundle = await new Promise((resolve,reject)=>{
                            cc.assetManager.loadBundle(bundleStr,(err,_bundle)=>{
                                if(err){
                                    reject(err);
                                    return;
                                }
                                resolve(_bundle);
                            })
                        });
                    } catch (error) {
                        console.error(`UIMgr->getBundle error `,error);
                    }
                }
            }else if(bundleStr instanceof cc.AssetManager.Bundle){
                bundle = bundleStr;
            }
        }else{
            bundle = cc.resources;
        }
        
        return bundle;
    }
    closeUI(param: string | cc.Component = null) {
        if (param == null) {
            if (this._stack.length > 0) {
                let temp = this._stack.peek();
                param = temp.uiname;
            } else {
                // cc.error('ccui-manager-> [stack is empty] and [param] is null \n if has more view, maybe it not in stack');
                return null;
            }
        }else if(typeof param == "string"){            
            param = this.formatName(param);
        }

        if (!this.isShowing(param)) {
            return null;
        }
        let uiview = this.getUI(param);
        uiview.unregisterClickClose();
        //判断不同的窗体显示模式，分别进行处理
        switch (uiview.showMode) {
            case UIViewBase.UIShowMode.Normal:
                this.removeUICache(uiview.uiname);
                break;
            case UIViewBase.UIShowMode.ReverseChange:
                this.popUI(param);
                break;
            case UIViewBase.UIShowMode.HideOther:
                this.closeUIAndShowOther(param);
                break;
        };
        return uiview;
    }

    private pushCurUI(name: string, view: UIViewBase<any>) {
        if (!this._currentShowUI[name]) {
            this._currentShowUI[name] = [];
        }

        this._currentShowUI[name].push(view);
    }
    private removeCurUI(name: string, view: UIViewBase<any>) {
        if (!this._currentShowUI[name]) {
            return;
        }

        this._currentShowUI[name].remove(view);
        if (this._currentShowUI[name].length == 0) {
            console.log('UIMgr-> delete  ', name);

            delete this._currentShowUI[name]; //
        }

        if (Object.keys(this._currentShowUI).length == 0) {
            this.isShowViewing = false;
            this.emit(this.Event.All_VIEW_CLOSED);
        }
    }
    //添加 ui 到 "当前显示的窗体集合"
    private addUICache(name: string, view: UIViewBase<any>) {
        // //“正在显示UI窗体缓存”集合里有记录，则直接返回。
        if (name in this._currentShowUI && view.isOnly) {
            return;
        }

        this.pushCurUI(name, view);
        this._showUIAction(view);
    }

    //移除 ui 从"当前显示窗体集合" 
    private removeUICache(name: string) {
        let uiview = this.getUI(name);
        if (!uiview || !(uiview.uiname in this._currentShowUI)) {
            return;
        }
        this._closeUIAction(uiview);
        this.removeCurUI(name, uiview);
    }

    private pushUI(name: string, view: UIViewBase<any>) {
        if (this._stack.length > 0) {
            let topview = this._stack.peek();
            topview.onUIFreeze();
        }
        this.pushCurUI(name, view);
        this._stack.push(view);
        this._showUIAction(view);
    }

    private popUI(param: string | cc.Component = null): UIViewBase<any> {
        let rview = null;
        if (param != null) {
            let uiview = this.getUI(param);
            if (!uiview || !(uiview.uiname in this._currentShowUI)) {
                cc.error('ccui-manager-> popUI error');

                return null;
            }
            this._closeUIAction(uiview);
            this.removeCurUI(uiview.uiname, uiview);
            this._stack.remove(uiview);
            rview = uiview;
        } else {
            if (this._stack.length >= 2) {
                let topview = this._stack.pop();
                this._closeUIAction(topview);
                this.removeCurUI(topview.uiname, topview);
                let nextuiview = this._stack.peek();
                nextuiview.onUIAwake();
                rview = nextuiview;
            } else if (this._stack.length === 1) {
                let topview = this._stack.pop();
                this._closeUIAction(topview);
                this.removeCurUI(topview.uiname, topview);
                rview = topview;
            }
        }
        return rview;
    }

    private addUIAndHideOther(name: string, view: UIViewBase<any>) {
        cc.log('UIMgr-> addUIAndHideOther:  ', name);

        this._stack.forEach(function (element) {
            // element.node.active = false; //隐藏
            this._hideUIAction(element);
        }.bind(this));

        for (const key in this._currentShowUI) {
            const array = this._currentShowUI[key];
            for (let i = 0; i < array.length; i++) {
                const element = array[i];
                this._hideUIAction(element);
            }
            // element.node.active = false; //隐藏
            // this._hideUIAction(element);
        }

        this.pushUI(name, view);
    }

    private closeUIAndShowOther(param: string | cc.Component) {
        let val = this.popUI(param);
        if (val) {

            cc.log('UIMgr->closeUIAndShowOther ', val || val.uiname || val.name);
            this._stack.forEach(function (element) {
                element.node.active = true; //显示                
                this._reShowUIAction(element);
            }.bind(this));

            for (const key in this._currentShowUI) {
                const array = this._currentShowUI[key];
                for (let i = 0; i < array.length; i++) {
                    const element = array[i];
                    this._reShowUIAction(element);
                }
                // const element = this._currentShowUI[key];
                // element.node.active = true; //显示
                // this._reShowUIAction(element);
            }

        }
    }
    //执行 显示动画
    private _showUIAction(uiview: UIViewBase<any>) {
        let self = this;
        uiview.node.stopActionByTag(ACTION_TAG);
        uiview.node.setAnchorPoint(0.5, 0.5);
        uiview.node.setPosition(0, 0);
        this._onShowBeforByPlugins(uiview.node, uiview, uiview.uiname);
        self.emit(self.Event.WILL_SHOW_VIEW,uiview.uiname);
        let showEndFunc = function () {
            console.log(`UIMgr-> show ${uiview.name}`);
            self._onShowAfterByPlugins(uiview.node, uiview, uiview.uiname);
            uiview.onShowCallback();
            uiview.exeShowListeners();
            uiview.registerAutoClose();
            uiview.registerClickClose();
            self.emit(self.Event.SHOWN_VIEW,uiview.uiname);
            // uiview.node.width = uiview.mask.width;
            // uiview.node.height = uiview.mask.height;

        };
        let show = cc.tween(uiview.node);
        let _showAction = uiview.showAction();
        if (_showAction) {
            _showAction.target(uiview.node);
            // _showAction.target(uiview.node);
            // show = cc.sequence(_showAction, cc.callFunc(showEndFunc));
            // show = _showAction.call(showEndFunc);
            show.then(_showAction).call(showEndFunc);
        } else {
            // showEndFunc();
            // show = cc.sequence(cc.delayTime(0.01), cc.callFunc(showEndFunc));
            show.delay(0.01).call(showEndFunc);
        }
        show.tag(ACTION_TAG);
        show.start();
        // show.setTag(ACTION_TAG);
        // uiview.node.runAction(show);
        let uiRoot = this.getUIRoot(uiview);
        if (uiRoot) {
            uiview.node.parent = uiRoot.root;
            uiview.mask = uiRoot.mask;
            // uiview.node.width = uiRoot.root.width;
            // uiview.node.height = uiRoot.root.height;
        }
    }
    //执行 关闭动画
    private _closeUIAction(uiview: UIViewBase<any>) {
        let self = this;
        uiview.node.stopActionByTag(ACTION_TAG);
        let close = cc.tween(uiview.node);
        uiview.exeWillCloseListeners();
        self.emit(self.Event.WILL_CLOSE_VIEW,uiview.uiname);
        let _closeAction = uiview.closeAction();
        if(_closeAction){
            _closeAction.target(uiview.node);
            close = close.then(_closeAction);
        }
        close.removeSelf().call(()=>{
            self._onCloseByPlugins(uiview.node, uiview, uiview.uiname);
            uiview.onCloseCallback();
            uiview.exeCloseListeners();
            self.emit(self.Event.CLOSE_VIEW,uiview.uiname);
            cc.tween(uiview.mask).to(0.05,{opacity: 0}).removeSelf().call(()=>{
                uiview.node.destroyAllChildren();
                uiview.node.destroy();
            }).start();
        }).start();


    }

    private _hideUIAction(uiview: UIViewBase<any>) {

        uiview.node.stopActionByTag(ACTION_TAG);
        // let _closeAction = uiview.closeAction();
        // let _actionArr = [];
        // if (_closeAction) {
        //     _actionArr.push(_closeAction);
        // }
        // _actionArr.push(cc.hide());
        // _actionArr.push(cc.callFunc(function () {
        //     uiview.mask.runAction(cc.sequence(cc.fadeOut(0.05), cc.hide()));
        // }));

        // let action = cc.sequence(_actionArr);
        // action.setTag(ACTION_TAG);
        // uiview.node.runAction(action);
        uiview.exeWillCloseListeners();
        let action = cc.tween(uiview.node);
        let _closeAction = uiview.closeAction();
        if (_closeAction) {
            _closeAction.target(uiview.node);
            action = action.then(_closeAction);
        }

        action.hide().call(()=>{
            cc.tween(uiview.mask).to(0.05,{opacity: 0}).hide().start();
        })
        action.tag(ACTION_TAG);
        action.start();

    }
    private _reShowUIAction(uiview: UIViewBase<any>) {

        uiview.node.stopActionByTag(ACTION_TAG);
        uiview.mask.stopActionByTag(ACTION_TAG);

        cc.tween(uiview.mask).show().to(0.15,{opacity: uiview.maskOpacity}).tag(ACTION_TAG).start();

        let nodeaction = cc.tween(uiview.node);
        let _showAction = uiview.showAction();
        if (_showAction) {
            _showAction.target(uiview.node);
            nodeaction = nodeaction.show().then(_showAction);
        } else {
            nodeaction = nodeaction.show();
        }
        
        nodeaction.tag(ACTION_TAG);
        nodeaction.start();
    }

    /** 获取当前显示的顶部 界面 */
    getTopView(){
        return this._stack.peek();
    }

    //
    showDebugToast(msg, align : Align = Align.BOTTOM_LEFT) {
        
        let toastUI = cc.find("Canvas/ToastRoot");
        if (!toastUI) {
            let Canvas = cc.find("Canvas");
            toastUI = new cc.Node();
            toastUI.parent = Canvas;
            toastUI.name = "ToastRoot";
            toastUI.zIndex = cc.macro.MAX_ZINDEX;
            let size = this.getCanvasSize();
            toastUI.width = size.width;
            toastUI.height = size.height;
        }
        let node = new cc.Node();
        let label = node.addComponent(cc.Label);
        label.string = msg;
        label.fontSize = 32;
        label.lineHeight = label.fontSize;
        //@ts-ignore
        label._updateRenderData(true);
        node.y = -toastUI.height * 0.5 + label.lineHeight;
        if (align == Align.BOTTOM_RIGHT) {
            node.x = toastUI.width * 0.5 - node.width * 0.5 - 10;
        } else if (align == Align.BOTTOM_LEFT) {
            node.x = -toastUI.width * 0.5 + node.width * 0.5 + 10;
        }

        node.opacity = 0;
        let t = cc.tween(node);
        t.parallel(t.by(0.3,{x:0,y:node.height}),t.to(0.3,{opacity: 255})).delay(5).to(0.3,{opacity: 0}).removeSelf().start();
        // node.runAction(cc.sequence(
        //     cc.spawn(cc.moveBy(0.3, cc.v2(0, node.height)), cc.fadeIn(0.3)), //
        //     cc.delayTime(5),
        //     cc.fadeOut(0.3),
        //     cc.removeSelf()
        // ));

        for (let i = 0; i < toastUI.children.length; i++) {
            const child = toastUI.children[i];

            if (toastUI.children.length - i >= 10) {
                // child.runAction(cc.sequence(cc.spawn(cc.moveBy(0.3, cc.v2(0, node.height)), cc.fadeOut(0.3)), cc.removeSelf()));
                let t2 = cc.tween(child);
                t2.parallel(t2.by(0.3,{y: node.height}),t2.to(0.3,{opacity: 0})).removeSelf().start();
            } else {
                // child.runAction(cc.moveBy(0.3, cc.v2(0, child.height)));
                cc.tween(child).by(0.3,{y: child.height}).start();
            }
        }

        node.parent = toastUI;
        // widget.updateAlignment();
    }


    createUI(name: string, param: any): UIViewBase<any> {
        name = this.formatName(name);
        if (name in this._uiList) {
            let prefab = this._uiList[name];
            let newNode = cc.instantiate(prefab);
            let uiview:UIViewBase<any> = newNode.getComponent(UIViewBase);
            uiview.onCreate(param);
            uiview.onInit(param);
            uiview.uiname = name;
            return uiview;
        }
        return null;
    }

    getUIRoot(view: UIViewBase<any>): any {
        let scene = cc.director.getScene();
        let uiRoot = cc.find("Canvas/UIRoot", scene);
        if (view.isEffect) { //如果是特效UI，则放到特效层中
           uiRoot = this.getEffectRoot();
        }
        if (!uiRoot) {
            cc.error("Canvas/UIRoot cannot be find");
            return null;
        }
        // return uiRoot;


        let size = uiRoot.getContentSize();
        if(size.width == 0 || size.width == 0){
            cc.error("UIRoot size is zero");
        }
        let uimask = this._getMask(view, size);
        uimask.parent = uiRoot;
        return {
            root: uiRoot,
            mask: uimask
        };
    }

    getEffectRoot(){
        let scene = cc.director.getScene();
        let uiRoot = cc.find("Canvas/EffectRoot", scene);
        if (!uiRoot) {
            uiRoot = new cc.Node();
            let canvas = cc.find("Canvas");
            uiRoot.name = "EffectRoot";
            uiRoot.parent = canvas;
            uiRoot.width = canvas.width;
            uiRoot.height = canvas.height;
            uiRoot.zIndex = 999;
        }
        return uiRoot;
    }

    private _getMask(view: UIViewBase<any>, size: cc.Size): cc.Node {
        if (view) {
            let node = new cc.Node();
            let sprite = node.addComponent(cc.Sprite);

            cc.resources.load("singleColor", cc.SpriteFrame, function (error, spriteFrame: cc.SpriteFrame) {
                if(spriteFrame){
                    sprite.spriteFrame = spriteFrame;
                }else{                    
                    cc.error('UIMgr-> singleColor is not exist');
                }
                
                node.color = cc.color(0, 0, 0, 255);
                node.opacity = 0;

                let srcScaleForShowAll = Math.min(cc.view.getCanvasSize().width / size.width, cc.view.getCanvasSize().height / size.height);
                let realWidth = size.width * srcScaleForShowAll;
                let realHeight = size.height * srcScaleForShowAll;
                node.width = size.width * (cc.view.getCanvasSize().width / realWidth);
                node.height = size.height * (cc.view.getCanvasSize().height / realHeight);


                if (view.maskType == UIViewBase.MaskType.Translucence) { //半透明蒙版
                    // node.runAction(cc.fadeTo(0.15, view.maskOpacity))
                    
                    cc.tween(node).to(0.15,{opacity: view.maskOpacity}).start();
                } else if (view.maskType == UIViewBase.MaskType.Lucency) { //全透明

                }

            });



            if (view.touchMaskType == UIViewBase.TouchMaskType.Swallow) { //吞并
                node.addComponent(cc.BlockInputEvents);
            } else if (view.touchMaskType == UIViewBase.TouchMaskType.Pentrate) {
                
            }

            node.name = view.uiname + "Mask";
            return node;
        }

        return null;
    }

    fill(node: cc.Node) {
        let updateWidgetAlign = function (widget, dir, px = 0) {
            let Dir = dir.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase()); //首字母大写
            let align_bool = `isAlign${Dir}`;
            let absolute_bool = `isAbsolute${Dir}`;

            widget[align_bool] = true;
            widget[absolute_bool] = true; //以像素作为偏移值
            widget[dir] = px;
        }

        let widget = node.getComponent(cc.Widget);
        if (!widget) {
            widget = node.addComponent(cc.Widget);
        }
        updateWidgetAlign(widget, "left");
        updateWidgetAlign(widget, "right");
        updateWidgetAlign(widget, "top");
        updateWidgetAlign(widget, "bottom");
    }


    isShowing(name: string | cc.Component): boolean {
        name = this.formatName(name);
        let uiview = this.getUI(name);
        if (!uiview) {
            cc.log('UIMgr-> %s is not in current show list', name);
            return false;
        }
        if (uiview.uiname in this._currentShowUI) {
            return true;
        }
        return false;
    }

    hasViewShowing(): boolean {
        let num = Object.keys(this._currentShowUI).length;
        return num > 0 || this.isShowViewing;
    }

    getUI(viewparm: string | cc.Component): UIViewBase<any> {
        let nview = null;
        if (typeof viewparm === 'string') {
            if (viewparm in this._currentShowUI) {
                nview = this._currentShowUI[viewparm].peek();
            }
        } else if (viewparm instanceof cc.Component) {
            nview = viewparm;
        }

        return nview;
    }
    // 清空“栈”结构体集合
    clearStackArray(): boolean {
        if (this._stack.length > 0) {
            this._stack.forEach(function (element) {
                element.node.destroyAllChildren();
                element.node.destroy();
            }.bind(this))            
            this._stack.length = 0;
            return true;
        }
        return false;
    }
    cleanAllUI() { 
        this.clearStackArray();
        for (const key in this._currentShowUI) {
            const array = this._currentShowUI[key];
            for (let i = 0; i < array.length; i++) {
                const element = array[i];
                if (element && element.node) {
                    this._onBeCleanByPlugins(element.node, element, element.uiname);
                    element.mask && cc.isValid(element.mask,true) && element.mask.destroy();
                    element.node.destroyAllChildren();
                    element.node.destroy();
                }
            }
            array.length = 0;
            delete this._currentShowUI[key];
        }
        this.isShowViewing = false;
        this.emit(this.Event.All_VIEW_CLOSED);
    }

    logAllUI() {
        for (const key in this._uiPaths) {
            const element = this._uiPaths[key];
            cc.log('UIMgr->logAllUI: %s', element);
        }
    }

    //显示吞并所有事件的蒙版
    showSwallowMask() {
        let self = this;
        if (!self.transition) {
            self.transition = new cc.Node();
            self.transition.opacity = 0;
            let size = cc.winSize;
            self.transition.width = size.width * 10;
            self.transition.height = size.height * 10;
            self.transition.addComponent(cc.BlockInputEvents);
        }


        let scene = cc.director.getScene();
        self.transition.parent = scene;
    }

    hideSwallowMask() {
        let self = this;
        if (self.transition && self.transition.parent != null) {
            self.transition.removeFromParent(false);
        }
    }



    getCanvasSize(): cc.Size {
        let canvasSize = cc.view.getCanvasSize();
        let canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);
        let node = canvas.node;
        let srcScaleForShowAll = Math.min(canvasSize.width / node.width, canvasSize.height / node.height);
        let realWidth = node.width * srcScaleForShowAll;
        let realHeight = node.height * srcScaleForShowAll;

        let width = node.width * (canvasSize.width / realWidth);
        let height = node.height * (canvasSize.height / realHeight);
        return cc.size(width, height);
    }



    private _onShowBeforByPlugins(node: cc.Node, view: UIViewBase<any>, name: string) {
        _plugins.forEach((item) => {
            if (item.onShowBefor) {
                item.onShowBefor(node, view, name);
            }
        });
    }
    
    private _onShowAfterByPlugins(node: cc.Node, view: UIViewBase<any>, name: string) {
        _plugins.forEach((item) => {
            if (item.onShowAfter) {
                item.onShowAfter(node, view, name);
            }
        });
    }

    private _onCloseByPlugins(node: cc.Node, view: UIViewBase<any>, name: string) {
        _plugins.forEach((item) => {
            if (item.onClose) {
                item.onClose(node, view, name);
            }
        });
    }

    private _onBeCleanByPlugins(node: cc.Node, view: UIViewBase<any>, name: string) {
        _plugins.forEach((item) => {
            if (item.onBeClean) {
                item.onBeClean(node, view, name);
            }
        });
    }


    public static registerPlugin (plugins){
        if (!Array.isArray(plugins)) {
            plugins = [plugins];
        }
    
        plugins.forEach((plugin) => {
            //插件能不重复
            let findPlugin = _plugins.find(item => item.name === plugin.name || item === plugin);
            if (findPlugin) {
                return;
            }
    
            //执行插件注册事件
            _plugins.push(plugin);
            if (plugin.onRegister) {
                plugin.onRegister();
            }
        });
    }


    test() {
        cc.log('UIMgr-> ');
    }
}



export class UIViewPluginBase {
    name: string = "";
    constructor() {}
    public onRegister() {
    }
    public onShowBefor(node: cc.Node,view:UIViewBase<any>,name: string) {
    }
    public onShowAfter(node: cc.Node,view:UIViewBase<any>,name: string){

    }
    public onClose(node: cc.Node,view:UIViewBase<any>,name: string) {
    }
    public onBeClean(node: cc.Node,view:UIViewBase<any>,name: string) {
    }
}
