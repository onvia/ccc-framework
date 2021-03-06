const DEFAULT_EVENT_NAMES = [
    '_onTouchStart',
    '_onTouchMove',
    '_onTouchEnd',
    '_onTouchCancel',
];


export class UIBind {
    private _prefix = '_';
    private _plugins = [];
    public registerPlugin(plugins) {
        if(CC_EDITOR){
            return;
        }
        if (!Array.isArray(plugins)) {
            plugins = new Array(plugins);
        }

        plugins.forEach((plugin) => {
            //插件能不重复
            let findPlugin = this._plugins.some(item => item.name === plugin.name || item === plugin);
            if (findPlugin) {
                return;
            }

            //执行插件注册事件
            this._plugins.push(plugin);
            if (plugin.onRegister) {
                plugin.onRegister();
            }
        });

        cc.log('UIBind-> ', this._plugins);
    }
    /**
     * 移除插件
     * @param plugin 
     */
    public removePlugin(plugin){
        plugin.onRemove();
        let findPlugin = this._plugins.some(item => item.name === plugin.name || item === plugin);
        this._plugins.remove(findPlugin);

    }
    /**
     * 获取组件名字
     * @param {cc.Component} component 
     */
    private _getComponentName(component: cc.Component) {
        return component.name.match(/<.*>$/)[0].slice(1, -1);
    }
    
    public bindButton(component: cc.Component){
        let root = component.node;
        this._bindButton(root,component);
    }
    private _bindButton(node: cc.Node,target: cc.Component){
        node.children.forEach((child) => {
            let name = child.name;
            if (!node[name]) {
                //绑定非前缀子节点
                node[name] = child;
                this._bindButtonEvent(child, target);
            }
            this._bindButton(child, target);
        });
    }
    private _bindButtonEvent(node: cc.Node, target: cc.Component){        
        let clickEvent = node.name.replace('btn','onClick');
        const tempEvent = target[clickEvent];
        let button = node.getComponent(cc.Button);
        if(button instanceof cc.Toggle){
            return false;
        }
        if(!tempEvent || !button || typeof tempEvent != 'function'){
            return false;
        }

        if(button.clickEvents.length){
            for (let j = 0; j < button.clickEvents.length; j++) {
                const _event = button.clickEvents[j];
                let comp = this._getComponentName(target);
                if(_event.handler == clickEvent){
                    // 已经绑定了事件
                    return true;
                }
            }
        }
        
        node.on(cc.Node.EventType.TOUCH_END,(event)=>{
            //被禁用的node 节点不响应事件
            let eventNode = event.target;
            if (button.interactable === false || eventNode.active === false) {
                return;
            }

            let eventResult = tempEvent.call(target, eventNode, event);
                
            // @ts-ignore
            node._touchListener.setSwallowTouches(true);
            
            event.stopPropagation();
            //检查button组件是否有事件处理函数，有则执行插件事件处理
            if (tempEvent || button.clickEvents.length) {
                this._afterHandleEventByPlugins(eventNode, event, !!tempEvent, eventResult);
            }
        });
        return true;
    }

    public bind(component: cc.Component, options = null) {
        this.bindComponent(component, options);
    }
    /**
     * 绑定组件
     * @param {cc.Component} component  要绑定的组件 
     * @param {Object} options          绑定选项
     */
    public bindComponent(component: cc.Component, options = null) {
        let root = component.node;
        //绑定根节点触摸事件
        this._bindTouchEvent(root, component, DEFAULT_EVENT_NAMES);
        //绑定所有组件子节点
        this._bindNode(component.node, component);
    }

    /**
     * 编写子节点到 target 对象
     * @param node
     * @param target
     */
    public bindNode(node, target, options = null) {
        //初始选项
        target.$options = options || {};
        //检查属性收集器
        if (target.$collector) {
            //重复绑定，退出
            if (target.$collector.node === node) {
                return;
            }
            //更换绑定，删除之前绑定的节点
            delete target.$collector.node;

            //遍历收集器上的属性名，删除绑定属性
            Object.keys(target.$collector).forEach((key) => {
                delete target[key];
            });
        }



        //初始化收集器
        target.$collector = {
            node
        };
        //遍历根节点上的组件并绑定到target
        node._components.forEach((component) => {
            let name = this._getComponentName(component);
            name = `$${name}`;
            target[name] = component;
            target.$collector[name] = component;
        });

        //开始绑定节点
        this._bindStartByPlugins(node, target);
        this._bindNode(node, target);
        this._bindEndByPlugins(node, target);
    }

    /**
     * 执行插件onBindStart事件
     * @param {cc.Node} node 
     * @param {Object} target 
     */
    private _bindStartByPlugins(node, target) {
        this._plugins.forEach((plugin) => {
            if (plugin.onBindStart) {
                plugin.onBindStart(node, target);
            }
        });
    }

    /**
     * 执行插件onBindEnd事件
     * @param {cc.Node} node 
     * @param {Object} target 
     */
    private _bindEndByPlugins(node, target) {
        this._plugins.forEach((plugin) => {
            if (plugin.onBindEnd) {
                plugin.onBindEnd(node, target);
            }
        });
    }

    /**
     * 递归绑定节点
     * @param {cc.Node} nodeObject 
     * @param {Object} target 
     */
    private _bindNode(nodeObject, target) {
        let self = this;
        const node = nodeObject;

        //绑定组件到自身node节点上
        if (node.name[0] === this._prefix) {
            node._components.forEach((component) => {
                let name = this._getComponentName(component);
                name = `$${name}`;
                if (this[name]) {
                    cc.warn(`${name} property is already exists`);
                    return;
                }

                node[name] = component;
                //检查组件 onBind 函数,通知组件,target 对象在绑定自己
                if (self.isFunction(component.onBind)) {
                    component.onBind(target);
                }
            });
        }

        //执行插件
        let bool = this._checkNodeByPlugins(node, target);
        if (!bool) {
            return;
        }

        node.children.forEach((child) => {
            let name = child.name;
            if (name[0] === this._prefix) {
                let index = name.indexOf('$');

                //检查控件别名
                if (index !== -1) {
                    child.$eventName = name.substr(0, index);
                    child.$ = name.substr(index + 1);
                    name = child.$eventName + child.$[0].toUpperCase() + child.$.substr(1);
                    if (!CC_EDITOR) {
                        child.name = name;
                    }
                }

                if (target[name]) {
                    cc.warn(`${target.name}.${name} property is already exists`);
                    return;
                }

                // this._bindTouchEvent(child, target); //注释掉这里是防止多次注册触摸事件
                target[name] = child;

                //保存绑定的指针
                if (target.$collector) {
                    target.$collector[name] = child;
                }
            }
            // if (!node[name]) {
                //绑定非前缀子节点
            !node[name] && (node[name] = child);

            this._bindTouchEvent(child, target); //nice 添加
            // }

            this._bindNode(child, target);
        });
    }

    /**
     * 绑定触摸事件
     * @param {cc.Node} node 
     * @param {String} event 
     */
    private _getTouchEventName(node,isBtn, event = null) {
        let name = node.$eventName || node.name;
        if (name) {
            
            if(isBtn){

                name = name[3].toUpperCase() + name.slice(3 + 1);
            }else{
                name = name[this._prefix.length].toUpperCase() + name.slice(this._prefix.length + 1);
            }
        }

        if (event) {
            return `_on${name}${event}`;
        }

        return [
            `_on${name}TouchStart`,
            `_on${name}TouchMove`,
            `_on${name}TouchEnd`,
            `_on${name}TouchCancel`,
        ];
    }

    /**
     * 绑定事件
     * @param {cc.Node} node
     */
    private _bindTouchEvent(node: cc.Node, target: cc.Component, defaultNames = null) {
        // 按钮 只绑定 抬起事件
        let isBtn = !!node.getComponent(cc.Button);
        if(isBtn){
            let binded = this._bindButtonEvent(node,target);
            if(binded){
                return;
            }
        }else{
            
            if (node.name[0] !== this._prefix) {
                return;
            }
        }
        //todo: EditBox 组件不能注册触摸事件,在原生上会导致不能被输入
        if (node.getComponent(cc.EditBox)) {
            return;
        }

        const eventNames = defaultNames || this._getTouchEventName(node,isBtn);
        const eventTypes = [
            cc.Node.EventType.TOUCH_START,
            cc.Node.EventType.TOUCH_MOVE,
            cc.Node.EventType.TOUCH_END,
            cc.Node.EventType.TOUCH_CANCEL,
        ];

        eventNames.forEach((eventName, index) => {
            const tempEvent = target[eventName];
            if (!tempEvent) {

                return;
            }

            node.on(eventTypes[index], (event) => {
                //被禁用的node 节点不响应事件
                let eventNode = event.target;
                if (eventNode.interactable === false || eventNode.active === false) {
                    return;
                }

                //检查button组件是否有事件处理函数，有则执行插件事件处理
                const button = eventNode.getComponent(cc.Button);

                if (!button || !button.interactable) { //nice 添加

                    return;
                }
                const eventFunc = target[eventName];
                if (eventFunc || button.clickEvents.length) {
                    this._beforeHandleEventByPlugins(eventNode, event, !!eventFunc);
                }

                //执行事件函数，获取返回值
                let eventResult;
                if (eventFunc) {
                    eventResult = eventFunc.call(target, eventNode, event);
                    //如果是触摸开始事件，返回fasle，使用节点可穿透
                    if (event.type === cc.Node.EventType.TOUCH_START && eventResult === false) {
                        eventNode._touchListener.setSwallowTouches(false);
                    } else {
                        // @ts-ignore
                        node._touchListener.setSwallowTouches(true);
                        
                        event.stopPropagation();
                    }
                }

                //检查button组件是否有事件处理函数，有则执行插件事件处理
                if (eventFunc || button.clickEvents.length) {
                    this._afterHandleEventByPlugins(eventNode, event, !!eventFunc, eventResult);
                }
            });
        });

        //绑定长按事件
        this._bindTouchLongEvent(node, target);
    }

    /**
     * 绑定长按事件
     * @param {cc.Node} node
     */
    private _bindTouchLongEvent(nodeObject, target) {

        const node = nodeObject;
        const eventName = this._getTouchEventName(node, 'TouchLong') as string;
        const touchLong = target[eventName];
        if (!this.isFunction(touchLong)) {
            return;
        }

        node._touchLongTimer = null;
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (node._touchLongTimer) {
                clearTimeout(node._touchLongTimer);
                node._touchLongTimer = 0;
                delete node.interactable;
            }
        });

        node.on(cc.Node.EventType.TOUCH_START, (event) => {
            node._touchLongTimer = setTimeout(() => {
                //准备触发touchLong事件
                node.interactable = !!touchLong.call(target, node, event);
                node._touchLongTimer = 0;
            }, node.touchLongTime || 1000);
        });
    }


    /**
     * 拿所有插件去检查node 节点, onCheckNode返回为 false 的,此节点将不被绑定
     * @param node
     * @param target
     * @returns {boolean}
     * @private
     */
    private _checkNodeByPlugins(node, target) {
        const plugin = this._plugins.some((item) => {
            if (item.onCheckNode) {
                return item.onCheckNode(node, target) === false;
            }
            return false;
        });

        return !plugin;
    }

    /**
     * 插件响应节点触摸前事件
     * @param node
     * @param event
     * @private
     */
    private _beforeHandleEventByPlugins(node, event, hasEventFunc) {
        this._plugins.forEach((item) => {
            if (item.onBeforeHandleEvent) {
                item.onBeforeHandleEvent(node, event, hasEventFunc);
            }
        });
    }

    /**
     * 插件响应节点触摸后事件
     * @param node
     * @param event
     * @private
     */
    private _afterHandleEventByPlugins(node, event, hasEventFunc, eventResult) {
        this._plugins.forEach((item) => {
            if (item.onAfterHandleEvent) {
                item.onAfterHandleEvent(node, event, hasEventFunc, eventResult);
            }
        });
    }

    public isFunction(value) {

        return typeof value === 'function';
    }

    private static instance: UIBind = null;
    public static getInstance(): UIBind {
        if (!this.instance) {
            this.instance = new UIBind();
        }
        return this.instance;
    }
}



export class UIBindPluginBase {
    name: any = "";
    constructor() {}
    public init() {
        cc.log('UIBind-> ', name);
    }
    public onRegister() {

    }
    public onBindStart(node, target) {

    }
    public onBindEnd(node, target) {

    }
    public onRemove(){

    }
    public onCheckNode(node, target) {

    }
    public onAfterHandleEvent(node, event, hasEventFunc, eventResult) {

    }
    public onBeforeHandleEvent(node, event, hasEventFunc) {

    }
}