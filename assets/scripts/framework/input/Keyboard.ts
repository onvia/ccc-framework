
export class Keyboard {
    private keyBordHandler: IKey [] = [];
    private _downKeyList = [];
    private static _keyboard: Keyboard = null;
    private _ctrlKeys = [cc.macro.KEY.ctrl,cc.macro.KEY.shift,cc.macro.KEY.alt];

    // 是否启用组合键
    public enableCombination = false;

    constructor(){
        cc.game.on(cc.game.EVENT_HIDE,()=>{
            this._downKeyList.length = 0;
        });
    }
    public static getInstance() : Keyboard {
        if(!this._keyboard){
            this._keyboard = new Keyboard();
        }
        return this._keyboard;
    }
    
    on(target: IKey) {
        this._KeyBordEvent(true);
        this.keyBordHandler.push(target);
    }
    off(target: IKey) {

        var index = this.keyBordHandler.indexOf(target);
        if (index > -1) {
            this.keyBordHandler.splice(index, 1);
        }
        this._KeyBordEvent(false);
    }
    private _KeyBordEvent(on) {
        const eventTypes = [
            cc.SystemEvent.EventType.KEY_DOWN,
            cc.SystemEvent.EventType.KEY_UP,
        ];

        const eventfuncs = [
            this._onKeyDown,
            this._onKeyUp,
        ];

        if (this.keyBordHandler.length === 0 && on) { //只注册一次事件
            eventfuncs.forEach((eventfunc, index) => {
                cc.systemEvent.on(eventTypes[index], eventfunc, this);
            });
        }

        if (this.keyBordHandler.length === 0 && !on) { //反注册
            eventfuncs.forEach((eventfunc, index) => {
                cc.systemEvent.off(eventTypes[index], eventfunc, this);
            });
        }

    }
    private _onKeyDown(event) {
        if (this._downKeyList.indexOf(event.keyCode) === -1) {
            this._downKeyList.push(event.keyCode);
        }

        if(this.enableCombination){
            // 检查组合键
            for (let i = 0; i < this._ctrlKeys.length; i++) {
                const ctrlKey = this._ctrlKeys[i];
                if(ctrlKey === event.keyCode){
                    continue;
                }
                // 有摁下的 控制键
                if (this._downKeyList.indexOf(ctrlKey) !== -1) {
                    

                    this.keyBordHandler.forEach((target, index) => {
                        const temponKeyCombination = target.onKeyCombination;
                        if (temponKeyCombination) {
                            temponKeyCombination.call(target, ctrlKey,event.keyCode);
                        }
                    });
                    return;
                }
            }
        }

        this.keyBordHandler.forEach((target, index) => {
            const temponKeyDown = target.onKeyDown;
            if (temponKeyDown) {
                temponKeyDown.call(target, event);
            }

            if (event.keyCode === cc.macro.KEY.escape) {
                const temponKeyBack = target.onKeyBack;
                if (!temponKeyBack) {
                    return;
                }
                temponKeyBack.call(target, event);
            }
        });
    }

    private _onKeyUp(event) {
        var index = this._downKeyList.indexOf(event.keyCode);
        if (index != -1) {               
            if (index > -1) {
                this._downKeyList.splice(index, 1);
            }
        }
        this.keyBordHandler.forEach((target, index) => {
            const temponKeyUp = target.onKeyUp;
            if (temponKeyUp) {
                temponKeyUp.call(target, event);
            }
        });
    };
    
    public tick(dt){
        let self = this;
        if (self._downKeyList.length <= 0) {
            return;
        }
        self._downKeyList.forEach(keycode => {
            self.keyBordHandler.forEach((target, index) => {
                const onKeyDuration = target.onKeyDuration;
                if (onKeyDuration) {
                    onKeyDuration.call(target, keycode, dt);
                }
            });
        });
    }

}
