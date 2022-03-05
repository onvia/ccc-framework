declare global{
    interface IService{
        services: IServices;
        name: string;
        serviceId: number;
        onCreate();
        onDispose();
        stopSelf();
    }
}

export class Service<Options = any> implements IService{
    
    services: IServices;

    serviceId: number;
     /**
     * 返回类名
     */
    get name(): string {
        return this.constructor.name;
    }
    options: Options = null;

    constructor(options?: Options){
        this.options = options;
        var scheduler = cc.director.getScheduler();
        scheduler.enableForTarget(this);
    }
    
    onCreate(){
    }

    onDispose(){

    }

    stopSelf() {
        this.services.stopService(this);
    }


    
    schedule (callback, interval, repeat, delay?) {
        interval = interval || 0;
        repeat = isNaN(repeat) ? cc.macro.REPEAT_FOREVER : repeat;
        delay = delay || 0;

        var scheduler = cc.director.getScheduler();
        var paused = scheduler.isTargetPaused(this);
        scheduler.schedule(callback, this, interval, repeat, delay, paused);
    }
    scheduleOnce (callback, delay?) {
        this.schedule(callback, 0, 0, delay);
    }

    unschedule (callback_fn) {
        if (!callback_fn){
            return;
        }
        cc.director.getScheduler().unschedule(callback_fn, this);
    }
    unscheduleAllCallbacks(){
        cc.director.getScheduler().unscheduleAllForTarget(this);
    }
}