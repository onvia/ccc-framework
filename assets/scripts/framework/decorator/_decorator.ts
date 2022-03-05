

/** 查看方法运行时间 */
export function time (tag: string) {
    return (target: any,
            propertyKey: string,
            descriptor: TypedPropertyDescriptor<any>) => {
     const oldValue = descriptor.value
 
     descriptor.value = function (...rest: any[]) {
       console.time(tag)
       oldValue.apply(target, rest)
       console.timeEnd(tag)
     }
 
     return descriptor
   }
 }


 /** 禁用运行时执行方法 */
 export function disableRuntime(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>){   
    // const oldValue = descriptor.value
    if(!CC_EDITOR){
        descriptor.value = function (...rest: any[]) {
        }
    }
    return descriptor;
}

 /** 禁用编辑器执行方法 */
 export function disableEditor(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>){   
    // const oldValue = descriptor.value
    if(CC_EDITOR){
        descriptor.value = function (...rest: any[]) {
        }
    }
    return descriptor;
}
// 禁止序列化
export let nonserialization = function(){
    return (target: any,propertyKey: string)=>{
        if(!target.__unserialization){
            target.__unserialization = [];
        }
        target.__unserialization.push(propertyKey);

        if(!target.toJSON){
            // JSON.stringify 自动调用
            target.toJSON = function(){
                let data:Record<any,any> = {};
                for (const key in this) {
                    if (Object.prototype.hasOwnProperty.call(this, key)) {
                        // @ts-ignore
                        if(this.__unserialization.indexOf(key) !== -1){
                            continue;
                        }
                        const value = this[key];
                        data[key] = value;
                    }
                }
                return data;
            }
        }
    }
}

export function ecclass(name: string) {
    return (ctor: Function) => {
        Object.defineProperty(ctor, "name", {
            value: name,
            writable: false,
        });
    };
}
