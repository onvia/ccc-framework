
type Constructor<T = unknown> = new (...args: any[]) => T;

type Opts<T> =  { [Key in keyof T]?: Key };
type K2V<B> = Opts<B>[keyof B];
interface IKey {
    onKeyBack(event: cc.Event.EventKeyboard);
    onKeyUp(event: cc.Event.EventKeyboard);
    onKeyDown(event: cc.Event.EventKeyboard);
    onKeyDuration?(keycode: any,dt: number);
    onKeyCombination?(ctrlKey: number,mainKey: number);
}

interface ITouch {
    onTouchBegan(event: cc.Event.EventTouch);
    onTouchMoved(event: cc.Event.EventTouch);
    onTouchEnded(event: cc.Event.EventTouch);
    onTouchCancel(event: cc.Event.EventTouch);
}

declare namespace cc {

    /**
     * 资源库类
     */
    export class AssetLibrary {

        static loadAsset(uuid: string, callback: (err, result) => void, options?: { existingAsset?: any });

        static queryAssetInfo(uuid: string, callback: (err, result) => void);

        static getAssetByUuid(uuid: string);

    }

    // 这里使用 interface 进行扩展，如果使用 class 则会与现有的 d.ts 有冲突
    export interface Node{
        draggable: boolean;
    }
    
	export namespace Node {
		/** !#en The event type supported by Node
		!#zh Node 支持的拖拽事件 */
		export class DragEvent {
            static DRAG_START: string;
            static DRAG_MOVE: string;
            static DRAG_END: string;
            static DROP: string;
        }
    }
}