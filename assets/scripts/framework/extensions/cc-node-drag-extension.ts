
let _DragEvent = {
    DRAG_START: "drag_start",
    DRAG_MOVE: "drag_move",
    DRAG_END: "drag_end",
    DROP: "drop",
}

cc.js.mixin(cc.Node,{
    DragEvent: _DragEvent
});

//----------------   cc.Node 添加 拖拽属性 ----------------

cc.js.mixin(cc.Node.prototype,{
    _draggable: false,
    _dragging: false,
    _dragTesting: false,
    _dragStartPoint: null,
    initDrag: function(){
        if(this._draggable){
            this.on(cc.Node.EventType.TOUCH_START,this.onTouchBegin_0,this);
            this.on(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove_0,this);
            this.on(cc.Node.EventType.TOUCH_END,this.onTouchEnd_0,this);
            this.on(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel_0,this);
        }else{
            this.off(cc.Node.EventType.TOUCH_START,this.onTouchBegin_0,this);
            this.off(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove_0,this);
            this.off(cc.Node.EventType.TOUCH_END,this.onTouchEnd_0,this);
            this.off(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel_0,this);
        }
    },
    onTouchBegin_0: function(event){
        if (this._dragStartPoint == null){
            this._dragStartPoint = new cc.Vec2();
        }
        
        let pos = event.getLocation();
        this._dragStartPoint.set(pos);
        this._dragTesting = true;
    },
    onTouchMove_0: function(event){
        if (!this._dragging && this._draggable && this._dragTesting) {
            var sensitivity = 10;
            let pos = event.getLocation();
            if (Math.abs(this._dragStartPoint.x - pos.x) < sensitivity
                && Math.abs(this._dragStartPoint.y - pos.y) < sensitivity){                 
                return;
            }
            
            this._dragging = true;
            this._dragTesting = false;
            this.emit(cc.Node.DragEvent.DRAG_START, event);
        }


        if(this._dragging){            
            let delta = event.getDelta();
            this.x += delta.x;
            this.y += delta.y;

            this.emit(cc.Node.DragEvent.DRAG_MOVE, event);
        }
    },
        
    onTouchEnd_0:function(event){
        if (this._dragging) {
            this._dragging = false;
            this.emit(cc.Node.DragEvent.DRAG_END, event);
        }
    },

    onTouchCancel_0: function(event){
        if (this._dragging) {
            this._dragging = false;
            this.emit(cc.Node.DragEvent.DRAG_END, event);
        }
    },
    //
    startDrag: function(){
        //此节点是否在场景中激活
        if(!this.activeInHierarchy){
            return;
        }
        this.dragBegin();
    },

    dragBegin: function(){
        this._dragging = true;
        this._dragTesting = true;
        this.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove_0, this);
        this.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd_0, this);
        this.on(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel_0,this);
    },
    dragEnd: function () {
        if (this._dragging) {
            this._dragTesting = false;
            this._dragging = false;
        }
    },

    //停止拖拽
    stopDrag: function(){
        this.dragEnd();
    },
});

//如果 node 设置 node.draggable = true, 则启用 拖拽
Object.defineProperty(cc.Node.prototype, "draggable", {
    get: function () {
        return this._draggable;
    },
    set: function (value) {
        if (this._draggable != value) {
            this._draggable = value;
            this.initDrag();
        }
    },
    enumerable: true,
    configurable: true
});

//----------------   cc.Node 添加 拖拽属性 ---------------- end

