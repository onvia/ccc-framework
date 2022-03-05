import { JsonObserve } from "./JsonObserve";
import { vmevent } from "./VMEventTarget";
import { VMConfig, setValueFromPath, getValueFromPath } from "./VMConfig";


/**
 * ModelViewer 类
 */
export class ViewModel<T>{
    constructor(data:T,tag:string) {
        new JsonObserve(data,this._callback.bind(this));
        this.$data = data;
        this._tag = tag;
    }

    public $data:T;

    //索引值用的标签
    private _tag: string = null;

    /**激活状态, 将会通过 cc.director.emit 发送值变动的信号, 适合需要屏蔽的情况 */
    public active: boolean = true;

    /**是否激活根路径回调通知, 不激活的情况下 只能监听末端路径值来判断是否变化 */
    public emitToRootPath:boolean = false;

    //回调函数 请注意 回调的 path 数组是 引用类型，禁止修改
    private _callback(_newValue: any, _oldValue: any, path: readonly string[]):void{
        if(this.active == true){
            let name = VMConfig.VM_EVENT_HEAD + this._tag+'.'+ path.join('.')
            if(VMConfig.DEBUG){
                cc.log('>>',_newValue,_oldValue,path);
            }

            let _paths = [this._tag].concat(path);

            vmevent.emit(name,_newValue,_oldValue,_paths); //通知末端路径

            if(this.emitToRootPath){
                vmevent.emit(VMConfig.VM_EVENT_HEAD+this._tag,_newValue,_oldValue,path);//通知主路径
            }

        }
    }

    //通过路径设置数据的方法
    public setValue(path: string, value: any) {
        setValueFromPath(this.$data,path,value,this._tag);
    }
    //获取路径的值
    public getValue(path: string,def?:any):any {
        return getValueFromPath(this.$data,path,def,this._tag);
    }
}