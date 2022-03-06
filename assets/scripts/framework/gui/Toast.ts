
enum Gravity {
    DEFAULT = 999,
    CENTER = 0,
    // LEFT = 1,
    // RIGHT = 2,
    TOP = 3,
    BOTTOM = 4,
    // TOP_LEFT = 5,
    // TOP_RIGHT = 6,
    // BOTTOM_LEFT = 7,
    // BOTTOM_RIGHT = 8,
}


//规则：如果 要显示的提示和正在显示的提示一致，则直接对当前显示的提示重复出现动作，
//      否则新创建一条提示，当前提示向上移动一个位置

export class Toast {
    
    public static LENGTH_LONG = 3;
    public static LENGTH_SHORT = 1.5;
    public static LENGTH_DEFAULT = 1.5;
    public static Gravity = Gravity;

    private static PREFAB_PATH = "framework/toast/Toast";

    private prefab: cc.Prefab = null;
    private gravity: Gravity = Gravity.CENTER;
    private toastArray: Array<cc.Node> = [];


    public show4I18N(key:string,duration: number = 1.5,gravity: Gravity = 999){
        throw new Error("Toast.show4I18N Method not implemented.");
    }

    public show(text: string,duration: number = 1.5,gravity: Gravity = 999){        
        let self = this;
       
        if(!self.prefab){//预制体存在
            cc.resources.load(Toast.PREFAB_PATH,cc.Prefab,function(err,prefab: cc.Prefab){
                if(err){
                    console.error('lgToast-> ',JSON.stringify(err) || err);
                    return;
                }
                self.prefab = prefab;
                self.show(text,duration,gravity);
            });
            return;
        }
        if(gravity == Gravity.DEFAULT){
            gravity = Gravity.CENTER;
        }
        self.gravity = gravity;

        let scene = cc.director.getScene();
        let canvas = scene.getComponentInChildren(cc.Canvas);
        var width = canvas.node.width;
        var height = canvas.node.height;

        let toast = cc.instantiate(self.prefab);
        let text_label = toast.getChildByName("text").getComponent(cc.Label);
        text_label.string = text;
        // toast.width = text_label.node.width + 50;
        // @ts-ignore
        text_label._forceUpdateRenderData();
        if (text_label.node.width > width / 3*2) {
            text_label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
            text_label.node.width = width / 3*2;            
            text_label.lineHeight = 48;
            //@ts-ignore
            text_label._forceUpdateRenderData();
        }

        
        toast.width = text_label.node.width + 60;
        toast.height = text_label.node.height + 60;



        toast.parent = scene;

        switch (gravity) {
            case Gravity.BOTTOM:
                toast.x = width*0.5;
                toast.y = height*0.2;
                break;
            case Gravity.CENTER:
                toast.x = width*0.5;
                toast.y = height*0.5;
                break;
                
            case Gravity.TOP:
                toast.x = width*0.5;
                toast.y = height*0.8;
                break;
            default:
                break;
        }

        toast.attr({
            gravity: self.gravity,
            text: text,
            duration: duration,
            bourn: toast.y,
        });
        let toastArray = self.toastArray;
        let space = 5;

        self.toastArray.push(toast);
        // 做位置的排列，这里测试位置没问题，如果显示位置不正确，是因为两个 toast 出现的时间间隔太短，暂时没有好的处理方法
        for (let j = toastArray.length - 1; j > 0; j--) {
            const node = toastArray[j];
            const node2 = toastArray[j-1];
            // @ts-ignore
            node2.bourn = node.bourn + (node2.height + node.height)/2 + space;
        }
        
        for (let i = 0; i < toastArray.length - 1; i++) {
            const child = toastArray[i];
            // @ts-ignore
            cc.tween(child).to(0.1,{y: child.bourn}).start();
        }

        toast.scale = 0.6;
        toast.opacity = 160;

        cc.tween(toast).parallel(
            cc.tween(toast).to(0.1,{opacity: 255}),
            cc.tween(toast).to(0.2,{scale: 1},{easing: cc.easing.bounceOut}),
            cc.tween(toast).delay(duration),
            ).parallel(
                cc.tween(toast).by(0.3,{y: 100}),
                cc.tween(toast).to(0.3,{opacity: 0}),
            )
            .call(()=>{
                self.toastArray.remove(toast);
                toast.destroyAllChildren();
                toast.destroy();
            })
            .start();
    }


    private static instance: Toast = null;
    public static getInstance(): Toast {
        if (!this.instance) {
            this.instance = new Toast();
        }
        return this.instance;
    }
}
