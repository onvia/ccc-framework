import { VMI18NLabelAdapter } from "./i18n/VMI18NLabelAdapter";
import { VMEntity, VMLabelAttr, VMNodeAttr, VMCustomAttr, VMButtonAttr, VMEventAttr, VMSpriteAttr, VMChildAttr } from "./VMEntity";
import { VM } from "./VMMgr";


class VMLabelEntity extends VMEntity{
   
    observerAttr: VMLabelAttr;
    originText: string;
    
    //保存着字符模板格式的数组 (只会影响显示参数)
    templateFormatArr: string[] = [];
    i18nAdapter: VMI18NLabelAdapter = null;
    onValueInit() {
        if(CC_EDITOR){
            return;
        }
        if(!this.originText){
            
            let i18nAdapter = this.component.node.getComponent(VMI18NLabelAdapter);
            if(i18nAdapter){
                i18nAdapter.vmLabelEntity = this;
                this.originText = i18nAdapter.getLocalizedOriginText();
                this.i18nAdapter = i18nAdapter;
            }else{
                this.originText = this.getValue();
            }
        }
        this.parseTemplate();
        this.updateValue();
    }
    onStart() {
        if(CC_EDITOR){
            return;
        }
    }

    updateValue(){
        
        let _watchPath = this.observerAttr.watchPath;
        if(this.observerAttr.templateMode){
            // 如果监听的是两个值，则必定是用的模板模式
            if(!Array.isArray(_watchPath)){
                _watchPath = [_watchPath];
            }
            let max = _watchPath.length;
            for (let i = 0; i < max; i++) {
                let val0 = VM.getValue(_watchPath[i], '?');
                // 单数据路径
                let val = this.formatValue(val0,'',_watchPath[i]);
                this.templateValuesCache[i] = val;
            }
            this.setValue(this.getFormatText(this.templateValuesCache)); // 重新解析
        }else{
            if(Array.isArray(_watchPath)){
                let max = _watchPath.length;
                for (let i = 0; i < max; i++) {
                    let val = VM.getValue(_watchPath[i],'?');
                    this.templateValuesCache[i] = val;
                }
                // 多数据路径
                let val = this.formatValue(this.templateValuesCache,'',_watchPath); // 重新解析
                this.setValue(this.getFormatText(val));
            }else{
                let val0 = VM.getValue(_watchPath as string);
                let val = this.formatValue(val0,'',_watchPath);
                this.setValue(this.getFormatText(val));
            }

        }
    }

    onValueChanged(newValue: any, oldValue: any, pathArr: readonly string[]) {
        if(CC_EDITOR){
            return;
        }
        let self = this;
        let _watchPath = this.observerAttr.watchPath;
        let vmTween = this.observerAttr.vmTween as IVMTween;

         let _updateParamsByLabelEntity = (params)=> {
             if(!Array.isArray(params)){
                params = [params];
             }
            this.i18nAdapter && this.i18nAdapter.updateParamsByLabelEntity(params);
         }

        if(this.observerAttr.templateMode){    
            if(!Array.isArray(_watchPath)){
                _watchPath = [_watchPath];
            }
            let path = pathArr.join('.');
            //寻找缓存位置
            let index = _watchPath.findIndex(v => v === path);
            if (index >= 0) {
                
                let _resolve = (_newValue: any,_oldValue: any,_path: any)=>{
                    // 单数据 路径
                    let val = self.formatValue(_newValue,_oldValue,_path);
                    self.templateValuesCache[index] = val; //缓存值
                    _updateParamsByLabelEntity(self.templateValuesCache);
                    self.setValue(self.getFormatText(self.templateValuesCache)); // 重新解析文本
                }

                if(vmTween){
                    vmTween.onTransition(newValue,oldValue,path,_resolve);
                }else{
                    _resolve(newValue,oldValue,path);
                }
            }
        }else{
            let _resolve = (_newValue: any,_oldValue: any,_path: any)=>{
                let val = self.formatValue(_newValue,_oldValue,_path); // 重新解析
                _updateParamsByLabelEntity(val);
                self.setValue(self.getFormatText(val));
            }

            if(Array.isArray(_watchPath)){
                
                let _oldVal = [...this.templateValuesCache];

                let path = pathArr.join('.');
                //寻找缓存位置
                let index = _watchPath.findIndex(v => v === path);
                if (index >= 0) {
                    //如果是所属的路径，就可以替换文本了
                    this.templateValuesCache[index] = newValue; //缓存值
                }

                if(vmTween){
                    vmTween.onTransition(this.templateValuesCache,_oldVal,_watchPath,_resolve);
                }else{
                    _resolve(this.templateValuesCache,_oldVal,path);
                }
            }else{

                if(vmTween){
                    vmTween.onTransition(newValue,oldValue,_watchPath,_resolve);
                }else{
                    _resolve(newValue,oldValue,_watchPath);
                }
            }
        }
    }

    formatValue(newValue,oldValue,watchPath){
        if(this.observerAttr.formator){
            return this.observerAttr.formator.call(this.controllerUserComponent,{
                entity: this,
                newValue,
                oldValue,
                watchPath,
                node: this.node,
                nodeIdx: 0
            });
        }
        return newValue;
    }

    //解析模板 获取初始格式化字符串格式 的信息
    parseTemplate() {
        let regexAll = /\{(.+?)\}/g; //匹配： 所有的{value}
        let regex = /\{(.+?)\}/;//匹配： {value} 中的 value
        let res = this.originText.match(regexAll);//匹配结果数组
        if (res == null) return;
        for (let i = 0; i < res.length; i++) {
            const e = res[i];
            let arr = e.match(regex);
            let matchName = arr[1];
            //let paramIndex = parseInt(matchName)||0;
            let matchInfo = matchName.split(':')[1] || '';
            this.templateFormatArr[i] = matchInfo;

            // 这里不再自动设置为 模板模式
            // if(matchInfo != ''){
            //     this.observerAttr.templateMode = true;
            // }
        }
    }

    getFormatText(value){
        if(!this.originText){
            return '';
        }
        if(!Array.isArray(value)){
            value = [value];
        }
        let _string = this.originText;
        _string = _string.format.apply(_string,value);
        return _string;
    }


    setValue(value: string){
        if(this.component instanceof cc.Label || this.component instanceof cc.RichText || this.component instanceof cc.EditBox){
            this.component.string = value;
        }
    }

    getValue(): string {
        if(this.component instanceof cc.Label || this.component instanceof cc.RichText || this.component instanceof cc.EditBox){
            return this.component.string;
        }
        return '';
    }

    changeOriginText(value){
        this.originText = value;
        this.updateValue();
    }

    onBind() {
        if(CC_EDITOR){
            return;
        }        
    }
    onUnBind() {  
        if(CC_EDITOR){
            return;
        }      
    }
    onCheckProperty(){
        return 'string' in this.component;
    }
}


class VMCustomEntity extends VMEntity{
   
    observerAttr: VMCustomAttr;
    // 执行组件
    private _execComponent: cc.Component;
    public get execComponent(): cc.Component {
        if(!this._execComponent){
            if(this.observerAttr.execComponent){
                this._execComponent = this.component.getComponent(this.observerAttr.execComponent);
            }else{
                this._execComponent = this.component;
            }
        }
        return this._execComponent;
    }

    onBind() {
        if(CC_EDITOR){ return; }
        
    }
    onUnBind() {
        if(CC_EDITOR){ return; }
        
    }
    onValueInit() {
        if(CC_EDITOR){ return; }
        let _watchPath = this.observerAttr.watchPath;
        if(Array.isArray(_watchPath)){
            let max = _watchPath.length;
            for (let i = 0; i < max; i++) {
                let val = VM.getValue(_watchPath[i],null);
                this.templateValuesCache[i] = val;
            }
            this._updateValue(this.templateValuesCache,null,_watchPath); // 重新解析
        }else{
            let val = VM.getValue(_watchPath as string);
            this._updateValue(val,null,_watchPath);
        }
    }
    onStart() {
        if(CC_EDITOR){ return; }
        
    }
    

    protected onValueChanged(newValue: any, oldValue: any, pathArr: readonly string[]) {
        if(CC_EDITOR){ return; }
        let path = pathArr.join('.');
        let _watchPath = this.observerAttr.watchPath;
        let vmTween = this.observerAttr.vmTween as IVMTween;
        
        let _resolve = (_newValue: any,_oldValue: any,_path: any)=>{
           
            this._updateValue(_newValue,_oldValue,_path); // 重新解析
        }

        if(Array.isArray(_watchPath)){
            let _oldVal = [...this.templateValuesCache];
            //寻找缓存位置
            let index = _watchPath.findIndex(v => v === path);
            if (index >= 0) {
                //如果是所属的路径，就可以替换文本了
                this.templateValuesCache[index] = newValue; //缓存值
            }


            if(vmTween){
                vmTween.onTransition(this.templateValuesCache,_oldVal,_watchPath,_resolve);
            }else{
                _resolve(this.templateValuesCache,_oldVal,_watchPath);
            }

        }else{
            
            if(vmTween){
                vmTween.onTransition(newValue,oldValue,_watchPath,_resolve);
            }else{
                _resolve(newValue,oldValue,_watchPath);
            }
        }
    }

    protected _updateValue(newValue,oldValue,watchPath){
        let val = this.formatValue(newValue,oldValue,this.node,0,watchPath);
        this.execComponent[this._property] = val;
    }
    
    get _property(){
        let _observerAttr = this.observerAttr;
        return _observerAttr.property;
    }
    onCheckProperty(){
        return this._property in this.execComponent;
    }
}

class VMNodeEntity extends VMCustomEntity{
    // @ts-ignore
    observerAttr: VMNodeAttr;
    watchNodes: cc.Node [] = [];
    onBind() {
        if(CC_EDITOR){ return; }
        if(this.observerAttr.controlChildren){
            this.node.on(cc.Node.EventType.CHILD_ADDED,this._onChildrenChanged,this);
            this.node.on(cc.Node.EventType.CHILD_REMOVED,this._onChildrenChanged,this);
            this.node.on(cc.Node.EventType.CHILD_REORDER,this._onChildrenChanged,this);    
        }
        
    }
    onUnBind() {
        if(CC_EDITOR){ return; }        
        if(this.observerAttr.controlChildren){
            this.node.targetOff(this);
        }
    }
    _onChildrenChanged(){
        if(this.observerAttr.controlChildren){
            this.watchNodes.length = 0;
            if(this.node.childrenCount == 0){
                CC_DEV && console.warn(`VMFactory->VMNodeEntity [${this.node.name}] VMNodeEntity [controlChildren] ,but childrenCount == 0 !!`);                    
            }
            this.watchNodes = this.watchNodes.concat(this.node.children);   
        }
    }
    onValueInit() {
        if(CC_EDITOR){ return; }
        
        if(this.watchNodes.length == 0){
            if(this.observerAttr.controlChildren){
                if(this.node.childrenCount == 0){
                    console.warn(`VMFactory->VMNodeEntity [${this.node.name}] VMNodeEntity [controlChildren] ,but childrenCount == 0 !!`);                    
                }
                this.watchNodes = this.watchNodes.concat(this.node.children);               
            }else{
                this.watchNodes.push(this.node);
            }
        }
        super.onValueInit();
    }
    onStart() {
        if(CC_EDITOR){ return; }
        
    }
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
    
    _updateValue(newValue,oldValue,watchPath){
        
        this.watchNodes.forEach((node,index)=>{
            let state = this.formatValue(newValue,oldValue,node,index,watchPath);
            let _property = this._property;
            node[_property] = state;
        })
    }

    get _property(){
        let _observerAttr = this.observerAttr;
        return _observerAttr.property as string;
    }
    onCheckProperty(){        

        return this._property in this.node;
    }
}

class VMProgressEntity extends VMCustomEntity{
    
    // _updateValue(newValue,oldValue,watchPath){
        
    //     let _newValue = newValue;
    //     let _oldValue = oldValue;
    //     if(Array.isArray(watchPath)){
    //         _newValue = newValue[0]/newValue[1];
    //         if(oldValue === null || oldValue === undefined){
    //             _oldValue = 0;
    //         }else{
    //             _oldValue = oldValue[0]/oldValue[1];
    //         }
    //     }

    //     let val = this.formatValue(_newValue,_oldValue,this.node,0,watchPath);
        
    //     if(val>1)val = 1;
    //     if(val<0||Number.isNaN(val)){
    //         val = 0;
    //     }
    //     this.execComponent[this._property] = val;
    // }

    /**
     * 格式化值
     * @param newValue 
     * @param oldValue 
     * @param node 
     * @param nodeIdx 
     * @param watchPath 
     */
     formatValue(newValue: any,oldValue: any,node: cc.Node,nodeIdx: number,watchPath: string){
         let value = null;
        if(this.observerAttr.formator){
            value = this.observerAttr.formator.call(this.controllerUserComponent,{
             entity: this,
             newValue,
             oldValue,
             node,
             nodeIdx,
             watchPath
         });
        }else{
            
            let _newValue = newValue;
            let _oldValue = oldValue;
            if(Array.isArray(watchPath)){
                _newValue = newValue[0]/newValue[1];
                if(oldValue === null || oldValue === undefined){
                    _oldValue = 0;
                }else{
                    _oldValue = oldValue[0]/oldValue[1];
                }
            }
            value = _newValue;
            if(value>1)value = 1;
            if(value<0||Number.isNaN(value)){
                value = 0;
            }
        }
        return value;
    }
    
    get _property(){
        return 'progress';
    }
}

class VMSpriteEntity extends VMCustomEntity{
    // @ts-ignore
    observerAttr: VMSpriteAttr;

    protected async _updateValue(newValue,oldValue,watchPath){
        let val = await this.formatValue(newValue,oldValue,this.node,0,watchPath);
        this.component[this._property] = val;
    }
    async formatValue(newValue: any,oldValue: any,node: cc.Node,nodeIdx: number,watchPath: string){
      let val =  await super.formatValue(newValue,oldValue,this.node,0,watchPath)
      return val;
    }
    
    get _property(){
        return 'spriteFrame';
    }
}

class VMButtonEntity extends VMEntity{
    // @ts-ignore
    observerAttr: VMButtonAttr;
    isArray = false;
    onBind() {
        if(CC_EDITOR){ return; }
        this.node.on(cc.Node.EventType.TOUCH_END,this.onBtnClick,this);
    }
    onUnBind() {
        if(CC_EDITOR){ return; }
        this.node && this.node.off(cc.Node.EventType.TOUCH_END,this.onBtnClick,this);
    }
    onValueInit() {
        if(CC_EDITOR){ return; }
        let _watchPath = this.observerAttr.watchPath;
        if(!Array.isArray(_watchPath)){
            _watchPath = [_watchPath];
        }else{
            this.isArray = true;
        }
        let max = _watchPath.length;
        for (let i = 0; i < max; i++) {
            let val = VM.getValue(_watchPath[i], null);
            this.templateValuesCache[i] = val;
        }
    }
    onStart() {
        if(CC_EDITOR){ return; }
        
    }

    onBtnClick(){
        if(CC_EDITOR){ return; }
        let oldValue;        
        let _watchPath = this.observerAttr.watchPath;
        let isArray = this.isArray;
        if(isArray){
            oldValue = [...this.templateValuesCache];
        }else{
            oldValue = this.templateValuesCache[0];
        }

        let newValue =  this.observerAttr.operation({
            currentValue: oldValue,
            watchPath: _watchPath
        });

        if(isArray){
            if(!Array.isArray(newValue)){
                console.warn(`VMFactory->VMButtonEntity [ ${this.node.name} ] operation  returned value must be array !!`);                
                return;
            }
            let maxj = newValue.length;
            if(_watchPath.length != maxj){
                console.warn(`VMFactory->VMButtonEntity [ ${this.node.name} ] operation  returned value array length must == watchPath.length , now it's not  [${maxj}]:[${_watchPath.length}]`);                
                return;
            }
            for (let j = 0; j < maxj; j++) {
                this.setValue(_watchPath[j], newValue[j],oldValue[j],j);
            }
        }else{
            this.setValue(_watchPath as string, newValue,oldValue,0);
        }
    }

    setValue(watchPath: string,newValue: any,oldValue: any,index){
        if(typeof newValue == 'number'){
            if(typeof this.observerAttr.min != 'undefined'){
                newValue = Math.max(newValue,this.val(this.observerAttr.min));
            }
            if(typeof this.observerAttr.max != 'undefined'){
                newValue = Math.min(newValue,this.val(this.observerAttr.max));
            }
        }else{
            if(typeof this.observerAttr.min != 'undefined' || typeof this.observerAttr.max != 'undefined'){
                console.warn(`VMFactory->VMButtonEntity [ ${this.node.name} ] watchPath [${watchPath}] is not number, [min] or [max] unjoined operation !`); 
            }
        }

        if(oldValue != newValue){
            this.templateValuesCache[index] = newValue;
            VM.setValue(watchPath as string, newValue);
        }        
    }

    private val(param){
        if(typeof param == 'number'){
            return param;
        }else if(typeof param == 'function'){
            return param();
        }
    }
    protected onValueChanged(newValue: any, oldValue: any, pathArr: readonly string[]) {
        if(CC_EDITOR){ return; }
        // 更新缓存值
        let _watchPath = this.observerAttr.watchPath;
        let isArray = this.isArray;
        if(isArray){    
            _watchPath = _watchPath as [];
            let path = pathArr.join('.');
            //寻找缓存位置
            let index = _watchPath.findIndex(v => v === path);

            if (index >= 0) {
                //如果是所属的路径，就可以替换文本了
                this.templateValuesCache[index] = newValue; //缓存值
            }
        }else{            
            this.templateValuesCache[0] = newValue; //缓存值
        }
    }
    onCheckProperty(): boolean {
        return true;
    }
}


class VMEventEntity extends VMCustomEntity{
    // @ts-ignore
    observerAttr: VMEventAttr;
    onBind() {
        if(CC_EDITOR){ return; }
     
    }
    onUnBind() {
        if(CC_EDITOR){ return; }
     
    }
    
    onValueInit() {
        if(CC_EDITOR){ return; }
        let _watchPath = this.observerAttr.watchPath;
        if(Array.isArray(_watchPath)){
            let max = _watchPath.length;
            for (let i = 0; i < max; i++) {
                let val = VM.getValue(_watchPath[i],null);
                this.templateValuesCache[i] = val;
            }
            this._updateValue(this.templateValuesCache,null,_watchPath);
        }else{
            let val = VM.getValue(_watchPath as string);
            this._updateValue(val,null,_watchPath);
        }
    }
    onStart() {
        if(CC_EDITOR){ return; }
        
    }
    
    protected onValueChanged(newValue: any, oldValue: any, pathArr: readonly string[]) {
        if(CC_EDITOR){ return; }
        let path = pathArr.join('.');
        let _watchPath = this.observerAttr.watchPath;
        if(Array.isArray(_watchPath)){
            let _oldValue = [...this.templateValuesCache];
            //寻找缓存位置
            let index = _watchPath.findIndex(v => v === path);
            if (index >= 0) {
                //如果是所属的路径，就可以替换文本了
                this.templateValuesCache[index] = newValue; //缓存值
            }
            this._updateValue(this.templateValuesCache,_oldValue,_watchPath); // 重新解析
        }else{
            this._updateValue(newValue,oldValue,path);
        }
    }
    _updateValue(newValue,oldValue,watchPath){
        let _onChangeEvent = this.observerAttr.onChangeEvent || this.observerAttr.formator;
        if(!_onChangeEvent){
            console.warn(`VMFactory->VMEventEntity [${this.node.name}] have not onChangeEvent, emit event fail !`);            
            return;
        }
        _onChangeEvent.call(this.controllerUserComponent,{
            entity: this,
            newValue,
            oldValue,
            node: this.node,
            nodeIdx :0,
            watchPath,
        });
    }
    onCheckProperty(): boolean {
        return true;
    }

}


class VMChildrenEntity extends VMCustomEntity{
    // @ts-ignore
    observerAttr: VMChildAttr; 
    
    seekNodeByName(root: cc.Node, name: string): cc.Node {
        if (!root)
            return null;

        if (root.name == name)
            return root;
        let arrayRootChildren = root.children;
        let length = arrayRootChildren.length;
        for (let i = 0; i < length; i++) {
            let child = arrayRootChildren[i];
            let res = this.seekNodeByName(child, name);
            if (res != null)
                return res;
        }
        return null;
    }

    _updateValue(newValue,oldValue,watchPath){
        let _onChangeEvent = this.observerAttr.formator;
        if(!_onChangeEvent){
            console.warn(`VMFactory->VMEventEntity [${this.node.name}] have not onChangeEvent, emit event fail !`);            
            return;
        }
        let childNode = this.seekNodeByName(this.node,this.observerAttr.children);
        _onChangeEvent.call(this.controllerUserComponent,{
            childNode,
            entity: this,
            newValue,
            oldValue,
            node: this.node,
            nodeIdx :0,
            watchPath,
        });
        // _onChangeEvent({
        //     newValue,
        //     oldValue,
        //     node: this.node,
        //     nodeIdx :0,
        //     watchPath
        // });
    }
    onCheckProperty(): boolean {
        return true;
    }
}


export class VMFatory{

    public static register(type: string,listenerClass){
        if(!type){
            throw new Error('VMFatory register [type] is null');
            return;
        }
        producers[type] = listenerClass;
    }

    public static getVMEntity(type: string){
        if(type in producers){
            return producers[type];
        }
        return null
    }

}

let producers = {
    'cc.Label': VMLabelEntity,
    'cc.RichText': VMLabelEntity,
    'cc.EditBox': VMLabelEntity,
    'cc.Node': VMNodeEntity,
    'cc.ProgressBar': VMProgressEntity,
    'cc.Slider': VMProgressEntity,
    'cc.Button': VMButtonEntity,
    'cc.Sprite': VMSpriteEntity,
    'vm.Custom': VMCustomEntity,
    'vm.Event': VMEventEntity,
    'vm.Children':VMChildrenEntity,
}
