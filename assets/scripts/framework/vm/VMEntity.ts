import { VM } from "./VMMgr";

type FormatorOpts = {newValue: any,oldValue?: any,node?: cc.Node,nodeIdx?: number,watchPath?: string,entity: VMEntity};

type Opts<T> =  { [Key in keyof T]?: Key };
type K2V<B> = Opts<B>[keyof B];

export class VMBaseAttr<T = any>{
    vmName?: string = 'VMBase'; // 用作 错误提示使用
    watchPath: string | string [];
    propertyKey?: string;
    /**
     * templateMode 是否使用模板模式 当 [watchPath] 是数组的时候，自动开启 templateMode = true
     */
    templateMode?: boolean;
    requireComponent?: string;

    /** 数据处理 */ 
    vmTween?: IVMTween;
    /**
     * formator 格式化的方法
     */
    formator?: (options: FormatorOpts)=> any;
    
    /**
     * entityName 对数据进行处理的实体名字
     */
    options?: {entityName?: string};
}

/**
 * 自定义
 */

 export class VMCustomAttr<T = any> extends VMBaseAttr{   
    
    execComponent?: {prototype: T};
    /**
     * 被修改的属性
     */   
    property: K2V<T>;
}

/**
 * Label 观察者的属性
 */
// @ts-ignore
export class VMLabelAttr extends VMCustomAttr{
    i18n?: boolean;
    property?: string;
}

/**
 * Node 
 */
// @ts-ignore
export class VMNodeAttr extends VMCustomAttr<cc.Node>{    
    controlChildren?: boolean = false;
    
    property?: K2V<cc.Node>;
}

export class VMChildAttr<T = any> extends VMCustomAttr{
    
    children: string;
    childrenComponent?: {prototype : T};
    formator: (options: FormatorOpts & {children: T})=> void;
}



// @ts-ignore
export class VMSpriteAttr extends VMCustomAttr{
    private property?: string;
    private templateMode?: boolean;
    public formator: (options: FormatorOpts)=> Promise<cc.SpriteFrame>;
}


/**
 * Progress 
 */
// @ts-ignore
export class VMProgressAttr extends VMCustomAttr{        
    watchPath: string | string [];
    private property?: string;

}


/**
 * Button 
 */
// @ts-ignore
export class VMButtonAttr extends VMBaseAttr{
    min?: number | (()=> number);
    max?: number | (()=> number);
    
    operation: (options: { currentValue: any | any[] ,watchPath: string | string[]})=> Object;
    // 
    private formator?: (options: FormatorOpts)=> any;
}


/**
 * VMEvent
 */
// @ts-ignore
export class VMEventAttr extends VMCustomAttr{
    // @ts-ignore
    private property?: string;
    onChangeEvent?: (options: {newValue: any,oldValue?: any,node?: cc.Node,nodeIdx?: number,watchPath?: string,entity?: VMEntity})=> any;
}


/**
 * 回调的执行 实体
 */
export abstract class VMEntity{
    component: cc.Component;
    observerAttr: VMBaseAttr;
    // 用户控制组件
    controllerUserComponent: any;
    templateValuesCache = [];
    _node: cc.Node;
    isValid = false;
    
    get node(): cc.Node{
        if(!this._node && this.component){
            if(this.component instanceof cc.Node){
                this._node =  this.component;
            }else if(this.component instanceof cc.Component){
                this._node = this.component.node;
            }else{
                // @ts-ignore
                this._node = this.component.node;                
            }
        }
        return this._node;
    }

    // 绑定路径
    bindPath(){
        let watchPath = this.observerAttr.watchPath;
        this.onBind();
        if(Array.isArray(watchPath)){
            // 监听多路径
            this.setMultiPathEvent(true);
        }else if(watchPath != ''){
            VM.on(watchPath as string,this._onValueChanged,this);
        }
        
        let vmTween = this.observerAttr.vmTween;
        vmTween?.onEnable();
        this.isValid = true;
    }
    // 解绑路径
    unbindPath(){
        if(!this.isValid){
            return;
        }
        this.isValid = false;
        let watchPath = this.observerAttr.watchPath;
        this.onUnBind();
        
        let vmTween = this.observerAttr.vmTween;
        vmTween?.onDestroy();
        if(Array.isArray(watchPath)){
            this.setMultiPathEvent(false);
        }else if(watchPath != ''){
            VM.off(watchPath as string,this._onValueChanged,this);
        }   
    }
    
    
    //多路径监听方式
    private setMultiPathEvent(enabled: boolean){
        if(CC_EDITOR){ return; }
        let arr = this.observerAttr.watchPath;
        for (let i = 0; i < arr.length; i++) {
            const path = arr[i];
            if(enabled){
                VM.on(path,this._onValueChanged,this);
            }else{
                VM.off(path,this._onValueChanged,this);
            }
        }
    }

    /**
     * 绑定
     */
    abstract onBind();
    /**
     * 解绑
     */
    abstract onUnBind();
    /**
     * 初始化值
     */
    abstract onValueInit();
    
    abstract onStart();
    /**
     * 值的修改
     * @param newValue 
     * @param oldValue 
     * @param pathArr 
     */
    _onValueChanged(newValue,oldValue,pathArr:string[]){
        if(!cc.isValid(this.node)){
            this.unbindPath();
            return;
        }
        this.onValueChanged(newValue,oldValue,pathArr);
    }

    /**
     * 值的修改
     * @param newValue 
     * @param oldValue 
     * @param pathArr 
     */
    protected abstract onValueChanged(newValue,oldValue,pathArr: readonly string[]);

    /**
     * 格式化值
     * @param newValue 
     * @param oldValue 
     * @param node 
     * @param nodeIdx 
     * @param watchPath 
     */
    formatValue(newValue: any,oldValue: any,node: cc.Node,nodeIdx: number,watchPath: string){
        if(this.observerAttr.formator){
         return this.observerAttr.formator.call(this.controllerUserComponent,{
             entity: this,
             newValue,
             oldValue,
             node,
             nodeIdx,
             watchPath
         });
        }
        return newValue;
    }
    
    abstract onCheckProperty(): boolean;
}
