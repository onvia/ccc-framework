
export type VMTransitionValueResults = (newValue: any,oldValue: any,path: any)=> void;

// 接口
declare global{
    interface IVMTween{
        onEnable();
        onDestroy();
        onTransition(newValue: any,oldValue: any,path: any,resolve: VMTransitionValueResults);
    }
}

class VMTransitionData{
    currentValue: number;
    targetValue: number;
    value: number;
}

// 数字滚动
export class GVMTween implements IVMTween{

    datas: Record<string,VMTransitionData> = {};
    duration = 0.3;
    constructor(_duration?:number){
        if(_duration != undefined){
            this.duration = _duration;
        }
    }

    onEnable(){

    }
    onDestroy(){
        for (const key in  this.datas) {
            const data =  this.datas[key];
            cc.Tween.stopAllByTarget(data);
        }
    }
    onTransition(newValue: any,oldValue: any,path: any,resolve: VMTransitionValueResults){
        let self:GVMTween = this;
        if(Array.isArray(newValue) && Array.isArray(oldValue)){
            this.onTransitionArray(newValue,oldValue,path,resolve);
            return;
        }


        let data = this.datas[path];
        if(data){
            cc.Tween.stopAllByTarget(data);
        }else{
            data = new VMTransitionData();
            this.datas[path] = data;
        }


        data.currentValue = oldValue;
        data.value = oldValue;
        data.targetValue = newValue;

        let t = cc.tween(data);
        t.to(this.duration,{value: newValue},{progress(start, end, current, t){
            if(newValue != end){
                return 0;
            }
            if (typeof start === 'number') {
                current = start + (end - start) * t;
            }
            else {
                start.lerp(end, t, current);
            }
            resolve(current,data.currentValue,path);
            data.currentValue = current;
            return current;
        }}).start();
    }

    onTransitionArray(newValue: any[],oldValue: any[],watchPaths: any[],resolve: VMTransitionValueResults){
        if(newValue.length != oldValue.length){
            cc.error(`VMTransitionValue-> 数据错误`);
            return;
        }
        let idx = newValue.findIndex((value,index)=>{
            return oldValue[index] != value;
        });
        let path = watchPaths[idx];

        let data = this.datas[`${path}.${idx}`];
        if(data){
            cc.Tween.stopAllByTarget(data);
        }else{
            data = new VMTransitionData();
            this.datas[path] = data;
        }
        data.currentValue = oldValue[idx];
        data.value = oldValue[idx];
        data.targetValue = newValue[idx];

        let _newValue = [...newValue];
        let _oldValue = [...oldValue];

        let t = cc.tween(data);
        t.to(this.duration,{value: newValue[idx]},{progress(start, end, current, t){
            if(newValue[idx] != end){
                return 0;
            }
            if (typeof start === 'number') {
                current = start + (end - start) * t;
            }
            else {
                start.lerp(end, t, current);
            }
            _newValue[idx] = current;
            resolve(_newValue,_oldValue,watchPaths);
            data.currentValue = current;
            _oldValue[idx] = current;
            return current;
        }}).start();
    }
}

export const VMTween = function(duration?: number) {
    return new GVMTween(duration);
}
