import { vmevent } from "./VMEventTarget";
import { ViewModel } from "./ViewModel";
import { VMConfig, setValueFromPath, getValueFromPath } from "./VMConfig";



class VMMgr {
    /**静态数组，保存创建的 mv 组件 */
    private _mvs:Array<{tag:string,vm:ViewModel<any>}> = [];

    /**
     * 绑定一个数据，并且可以由VM所管理
     * @param data 需要绑定的数据
     * @param tag 对应该数据的标签(用于识别为哪个VM，不允许重复)
     * @param activeRootObject 激活主路径通知，可能会有性能影响，一般不使用
     */
    add<T>(data:T,tag:string = 'global',activeRootObject:boolean = false){
       
        if(tag.includes('.')){
            console.warn('cant write . in tag:',tag);
            return;
        }
        
        let has = this._mvs.find(v=>v.tag === tag);
        if(has){
            console.warn('already set VM tag:'+ tag);
            return;
        }
        
        let vm = new ViewModel<T>(data,tag);
        vm.emitToRootPath = activeRootObject;
        this._mvs.push({tag:tag,vm:vm});
    }


     /**
     * 移除并且销毁 VM 对象
     * @param tag 
     */
    remove(tag:string){
        let index = this._mvs.findIndex(v => v.tag === tag);
        if(index >=0 ) this._mvs.splice(index,1);
    }
    /**
     * 获取绑定的数据
     * @param tag 数据tag
     */
    get<T>(tag:string):ViewModel<T>{
        let res = this._mvs.find(v => v.tag === tag);
        if(res == null){
            console.warn('cant find VM from:',tag);
        }else{
            return res.vm;
        }
    }

    /**
     * 通过全局路径,而不是 VM 对象来 设置值
     * @param path - 全局取值路径
     * @param value - 需要增加的值
     */
    addValue(path: string, value: any) {
        path =  path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if(rs.length<2){console.warn('Cant find path:'+path)};
        let vm = this.get(rs[0]);
        if(!vm){console.warn('Can\'t Set VM:'+rs[0]);return;};
        let resPath = rs.slice(1).join('.');
        vm.setValue(resPath,vm.getValue(resPath)+value);
    }

    /**
     * 通过全局路径,而不是 VM 对象来 获取值
     * @param path - 全局取值路径
     * @param def - 如果取不到值的返回的默认值
     */
    getValue(path: string,def?:any):any {
        path =  path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if(rs.length<2){
            console.warn('Get Value Cant find path:'+path);
            return def;
        }
        let vm = this.get(rs[0]);
        if(!vm){
            console.warn('Cant Get VM:'+rs[0]);
            return def;
        }
        return vm.getValue(rs.slice(1).join('.'),def);
    }

    /**
     * 通过全局路径,而不是 VM 对象来 设置值
     * @param path - 全局取值路径
     * @param value - 需要设置的值
     */
    setValue(path: string, value: any) {
        path =  path.trim();//防止空格,自动剔除
        let rs = path.split('.');
        if(rs.length<2){console.warn('Set Value Cant find path:'+path);return;};
        let vm = this.get(rs[0]);
        if(!vm){console.warn('Cant Set VM:'+rs[0]);return;};
        vm.setValue(rs.slice(1).join('.'),value);
    }

    on(path: string, callback: Function, target?: any, useCapture?: boolean):void{
        path =  path.trim();//防止空格,自动剔除
        if(path == ''){
            console.warn(target.node.name,'节点绑定的路径为空');
            return;
        }
        if(path.startsWith('*')){
            if(target && target._vmTag){
                path = path.replace('*', target._vmTag);
            }else{
                console.warn(`VMMgr on [${path}] 路径不合法`);
                return;
            }
        }
        vmevent.on(VMConfig.VM_EVENT_HEAD + path, callback, target, useCapture);
    }

    //通过路径设置数据的方法
    setObjectValue = setValueFromPath;
    //获取路径的值
    getObjectValue = getValueFromPath;
    
    off(path: string, callback: Function, target?: any):void{
        path =  path.trim();//防止空格,自动剔除
        if(path.startsWith('*')){
            if(target && target._vmTag){
                path = path.replace('*', target._vmTag);
            }else{
                console.warn(`VMMgr off [${path}] 路径不合法`);
                return;
            }
        }
        vmevent.off(VMConfig.VM_EVENT_HEAD + path, callback, target);
    }
    
    targetOff(target: any){
        vmevent.targetOff(target);  
    }

    /**冻结所有标签的 VM，视图将不会受到任何信息 */
    freeze():void{
        this._mvs.forEach(mv=>{
            mv.vm.active = false;
        })
    }

    /**激活所有标签的 VM*/
    active():void{
        this._mvs.forEach(mv=>{
            mv.vm.active = true;
        })
    }

    private static instance: VMMgr = null;
    public static getInstance(): VMMgr {
        if (!this.instance) {
            this.instance = new VMMgr();
        }
        return this.instance;
    }
}

export let VM = VMMgr.getInstance();