
export let VMConfig = {

    VM_EVENT_HEAD: "VM:",
    DEBUG: false,

}


//通过 .  路径 设置值
export function setValueFromPath(obj:any,path: string, value: any, tag:string = '') {
    let props = path.split('.');
    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        if (propName in obj === false) { console.error('['+propName + '] not find in ' +tag+'.'+ path); break; }
        if (i == props.length - 1) {
            obj[propName] = value;
        } else {
            obj = obj[propName];
        }
    }
}

//通过 . 路径 获取值
export function getValueFromPath(obj:any,path: string,def?:any, tag:string = ''):any {
    let props = path.split('.');
    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        if ((propName in obj === false)) { console.error('['+propName + '] not find in '+tag+'.'+ path); return def; }
        obj = obj[propName];
    }
    if(obj === null||typeof obj === "undefined")obj = def;//如果g == null 则返回一个默认值
    return obj;

}