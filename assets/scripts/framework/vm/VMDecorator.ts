import { VM } from "./VMMgr";
import { VMFatory } from "./VMFactory";
import { VMLabelAttr, VMEntity, VMCustomAttr, VMBaseAttr, VMNodeAttr, VMProgressAttr, VMButtonAttr, VMEventAttr, VMSpriteAttr, VMChildAttr } from "./VMEntity";
import { VMConfig } from "./VMConfig";

/**
 * mvvm 装饰器
 * @param _tagOrDelay //唯一 标签  | 延迟注册
 * @param _delay // 延迟注册
 */
// 特殊要求： 必须在 @ccclass 之后调用
export function mvvm(_tagOrDelay?: string | number,_delay?: number){
    // if(CC_EDITOR){
    //     // 
    //     return (constructor: Function)=>{
    //     }
    // }
    return <T extends { new(...args: any[]): cc.Component }>(constructor: T) => {
        
        // 修复 使用类装饰器之后 导致 node.getComponent(组件基类) 返回值 为空的情况
        // 代表性示例为 UIMgr 需要获取 UIViewBase 
        var base = cc.js.getSuper(constructor);
        base === cc.Object && (base = null);
        if(base){
            // @ts-ignore
            base._sealed = false;
        }
        
        return class extends constructor{

            _vmObserversAttr: VMBaseAttr[];

            _vmEntitys: VMEntity[];

            private _vmTag: string = null;
            public get vmTag(): string {
                if(!this._vmTag){
                    if(_tagOrDelay && typeof _tagOrDelay === 'number'){
                        _delay = _tagOrDelay;
                        _tagOrDelay = undefined;
                    }
                    // @ts-ignore
                    this._vmTag = _tagOrDelay || ((this.name || "_temp") + '<'+ this.node.uuid.replace('.', '') + '>');
                }
                return this._vmTag;
            }


            // 只有观察 本类里的数据的时候才会有 data 属性，
            // 如果没有 data 则不注册观察事件
            data;
            
            onLoad(){
                super.onLoad && super.onLoad();
            }
            start(){
                super.start && super.start();
                if(this._vmEntitys){
                    for (let i = 0; i < this._vmEntitys.length; i++) {
                        const _vmEntity = this._vmEntitys[i];                        
                        _vmEntity.onStart();
                    }   
                }   
            }
            onVMBind(){
                if(!this.data){
                    return false;
                }
                VM.add(this.data, this.vmTag);
                return true;
            }

            onDestroy(){
                super.onDestroy && super.onDestroy();
            }

            onEnable(){
                this.onVMBind();
                super.onEnable && super.onEnable();
                if(_delay != undefined){
                    this.scheduleOnce(this._vmBind,_delay);
                    return;
                }
                this._vmBind();
            }

            private _vmBind(){

                !this._vmEntitys && (this._vmEntitys = []);
                if(this._vmEntitys.length == 0){
                    if(!this._vmObserversAttr){
                        return;
                    }
                    for (let i = 0; i < this._vmObserversAttr.length; i++) {
                        const _tmpObserverAttr = this._vmObserversAttr[i];
                        let _observerAttr = cc.instantiate(_tmpObserverAttr);
                        if(_observerAttr.formator){
                            _observerAttr.formator.bind(this);
                        }
                        // 格式化路径
                        this.vmFormatWatchPath(_observerAttr);
                        let _property: cc.Component = this[_observerAttr.propertyKey];
                        if(!_property){
                            // @ts-ignore
                            console.warn(`VMDecorator:  [${this.__proto__.__classname__}] ==> property: [${_observerAttr.propertyKey}] is null, can't add [${_observerAttr.vmName}] in list`);                            
                            continue;
                        }

                        // 检查依赖的组件
                        if(_observerAttr.requireComponent != undefined){
                            // @ts-ignore
                            if(_property.__classname__ != _observerAttr.requireComponent){
                                console.warn(`VMDecorator:  [${_observerAttr.propertyKey}] ==> is not [${_observerAttr.requireComponent}] Component, can't add [${_observerAttr.vmName}] in list`);                            
                                continue;
                            }                            
                        }

                        // @ts-ignore
                        let _componentName = !!_observerAttr.options.entityName ? _observerAttr.options.entityName : _property.__classname__;
                        let _vmEntityClass = VMFatory.getVMEntity(_componentName);
                        if(!_vmEntityClass){
                            console.warn(`VMDecorator: VMFatory can't find [${_componentName}], can't add [${_observerAttr.vmName}] in list`);
                            continue;
                        }
                        let _vmEntity = new _vmEntityClass() as VMEntity;
                        _vmEntity.component = _property;
                        _vmEntity.observerAttr = _observerAttr;
                        
                        let check = _vmEntity.onCheckProperty();
                        if(!check){
                            // @ts-ignore
                            console.warn(`VMDecorator:  [${this.__proto__.__classname__}] ==>  [${_observerAttr.propertyKey}] on Check Property failed !! can't add [${_observerAttr.vmName}] in list`);
                            continue;
                        }
                        _vmEntity.controllerUserComponent = this;
                        this._vmEntitys.push(_vmEntity);
                        _vmEntity.onValueInit();
                        this._vmBindPath(_vmEntity);
                    }
                }else{
                    for (let i = 0; i < this._vmEntitys.length; i++) {
                        const _vmEntity = this._vmEntitys[i];                        
                        _vmEntity.onValueInit();
                        this._vmBindPath(_vmEntity);
                    }
                }
            }
            onDisable(){
                super.onDisable && super.onDisable();
                VM.remove(this.vmTag);
                if(this._vmEntitys){
                    for (let i = 0; i < this._vmEntitys.length; i++) {
                        const _vmEntity = this._vmEntitys[i];
                        this._vmUnbindPath(_vmEntity);
                    }
                }
            }    

            private _vmBindPath(_vmEntity: VMEntity){
                if(VMConfig.DEBUG){
                    console.log(`VMDecorator: node: ${_vmEntity.observerAttr.propertyKey} bind ${_vmEntity.observerAttr.watchPath} ${_vmEntity.constructor.name}`);                    
                }
                _vmEntity.bindPath();
            }


            private _vmUnbindPath(_vmEntity: VMEntity){
                if(VMConfig.DEBUG){
                    console.log(`VMDecorator: node: ${_vmEntity.observerAttr.propertyKey} unbind ${_vmEntity.observerAttr.watchPath}`);                    
                }
                _vmEntity.unbindPath();
            }
            
            vmFormatWatchPath(_observerAttr: VMBaseAttr){
                let path = _observerAttr.watchPath;
                if(typeof path == 'string'){
                    //遇到特殊 path 就优先替换路径
                    if (path.startsWith('*')) {
                        _observerAttr.watchPath = path.replace('*', this.vmTag);
                    }
                }else if(Array.isArray(path)){
                    for (let j = 0; j < path.length; j++) {
                        const _path = path[j];
                        if (_path.startsWith('*')) {
                            path[j] = _path.replace('*', this.vmTag);
                        }
                    }
                    _observerAttr.watchPath = path;
                }
            }
        }
    }
}

export function VMBase(__vmAnyAttr: VMBaseAttr,entityName?: string){
    return function(target: any, propertyKey: string){
        lazyCheckWatchPath(__vmAnyAttr.watchPath,target.constructor.name,propertyKey);
        !target._vmObserversAttr && (target._vmObserversAttr = []);
        let _vmObserversAttr = target._vmObserversAttr;
        __vmAnyAttr.propertyKey = propertyKey;
        !__vmAnyAttr.options && (__vmAnyAttr.options = {});
        !!entityName && (__vmAnyAttr.options.entityName = entityName);        
        // if(Array.isArray(__vmAnyAttr.watchPath)){
        //     // 如果监听的是两个值，则必定是用的模板模式
        //     __vmAnyAttr.templateMode = true;
        // }
        _vmObserversAttr.push(__vmAnyAttr);
    }
}
export function VMLabel(__vmAnyAttr: VMLabelAttr){
    __vmAnyAttr.vmName = 'VMLabel';
    return function(target: any, propertyKey: string){

        !target._vmObserversAttr && (target._vmObserversAttr = []);
        let _vmObserversAttr = target._vmObserversAttr;
        __vmAnyAttr.propertyKey = propertyKey;
        !__vmAnyAttr.options && (__vmAnyAttr.options = {});  
        if(Array.isArray(__vmAnyAttr.watchPath)){
            // 如果监听的是两个值，则默认是用的模板模式
            if(__vmAnyAttr.templateMode === undefined){
                __vmAnyAttr.templateMode = true;
            }
        }
        _vmObserversAttr.push(__vmAnyAttr);
    }
}

export function VMCustom<T = any>(type: {prototype:T},__vmAnyAttr: VMCustomAttr<T>){
    __vmAnyAttr.vmName = 'VMCustom';
    __vmAnyAttr.execComponent = type;
    return VMBase(__vmAnyAttr,'vm.Custom');
}

export function VMNode(__vmAnyAttr: VMNodeAttr){
    __vmAnyAttr.vmName = 'VMNode';
    if(!__vmAnyAttr.property){
        __vmAnyAttr.property = 'active';
    }
    return VMBase(__vmAnyAttr,'cc.Node');
}

export function VMProgress(__vmAnyAttr: VMProgressAttr){
    __vmAnyAttr.vmName = 'VMProgress';
    return VMBase(__vmAnyAttr);
}

export function VMSprite(__vmAnyAttr: VMSpriteAttr){
    __vmAnyAttr.vmName = 'VMSprite';
    // @ts-ignore
    return VMBase(__vmAnyAttr,'cc.Sprite');
}




export function VMButton(__vmAnyAttr: VMButtonAttr){
    __vmAnyAttr.requireComponent = 'cc.Button';
    __vmAnyAttr.vmName = 'VMButton';
    // @ts-ignore
    return VMBase(__vmAnyAttr,'cc.Button');
}

export function VMEvent(__vmAnyAttr: VMEventAttr){
    __vmAnyAttr.vmName = 'VMEvent';
    return VMBase(__vmAnyAttr,'vm.Event');
}

export function VMChildren<T = any>(__vmAnyAttr: VMChildAttr<T>){
    __vmAnyAttr.vmName = 'VMChildren';
    // @ts-ignore
    return VMBase(__vmAnyAttr,'vm.Children');
}

function lazyCheckWatchPath(_watchPath: string | string [],clazz,proprety){
    let _watchPaths = Array.isArray(_watchPath) ? _watchPath : [_watchPath];
    for (let i = 0; i < _watchPaths.length; i++) {
        const _tmpWatchPath = _watchPaths[i];
        if(_tmpWatchPath.startsWith('*')){
            let idx = _tmpWatchPath.indexOf('.');
            if(idx == -1){
                console.warn(`VMDecorator-> ${clazz} ${proprety} watchPath error`);            
                return false;
            }
        }
    }
    return true;
}
// VMObserver
