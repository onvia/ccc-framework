
export class Touch {

    private static instance: Touch = null;
    public static getInstance(): Touch {
        if (!this.instance) {
            this.instance = new Touch();
        }
        return this.instance;
    }
    
    on(target: ITouch,node?:cc.Node){
        if(typeof node == "undefined"){
            //@ts-ignore
            node = target.node;
        }        
        node.on(cc.Node.EventType.TOUCH_START,target.onTouchBegan,target);
        node.on(cc.Node.EventType.TOUCH_MOVE,target.onTouchMoved,target);
        node.on(cc.Node.EventType.TOUCH_END,target.onTouchEnded,target);
        node.on(cc.Node.EventType.TOUCH_CANCEL,target.onTouchCancel,target);
    }

    off(target: ITouch,node?:cc.Node){
        if(typeof node == "undefined"){
            //@ts-ignore
            node = target.node;
        }
                
        node.off(cc.Node.EventType.TOUCH_START,target.onTouchBegan,target);
        node.off(cc.Node.EventType.TOUCH_MOVE,target.onTouchMoved,target);
        node.off(cc.Node.EventType.TOUCH_END,target.onTouchEnded,target);
        node.off(cc.Node.EventType.TOUCH_CANCEL,target.onTouchCancel,target);        
    }
}
