import { AssetLoader } from "./AssetLoader";

/**
 * 对 AssetLoader 的一个扩展，增加 自动计算加载进度
 */

declare global{
    interface OnLoadingListener{
        onLoadingComplete();
    }
}

export class LoadingProcess extends AssetLoader{
    
    private _isLoading = true;
    private _visual_count = 0;
    private _complete_progress = 0;
    private _completed_count = 0;
    private _res_total_count = 0;

    private _tasks: Promise<void>[] = [];
    private duration: number = 2;

    private _onLoadingListener: OnLoadingListener;


    get taskCount(){
        return this._tasks.length;
    }

    get isLoading(){
        return this._isLoading;
    }

    

    public addTask(promise: Promise<any>){
        this._tasks.push(promise);
        promise.then((asset)=> {
            this.onComplete(null,asset);
        });
    }

    public async taskStart(onLoadingListener: OnLoadingListener,duration){
        this._onLoadingListener = onLoadingListener;
        this._isLoading = true;
        this.duration = duration;
        this._res_total_count = this._tasks.length;
        this._complete_progress = 0;
        this._completed_count = 0;
        await Promise.all(this._tasks);
        this._complete_progress = this._completed_count = this._res_total_count;
    }


    private onProgress(finish: number,total: number,item){
        if(!this._tasks.length){
            return;
        }
        this._complete_progress = Math.max(this._completed_count + finish/total,this._complete_progress);
    }
    
    private onComplete(error,assets){
        if(!this._tasks.length){
            return;
        }
        this._completed_count++;
    }

    public load<T extends cc.Asset>(paths: string, type: {prototype: T},_bundle?:  cc.AssetManager.Bundle | string): Promise<T>
    public load<T extends cc.Asset>(paths: string, type: {prototype: T},_onComplete?: CompleteFn,_bundle?:  cc.AssetManager.Bundle | string): Promise<T>
    public load<T extends cc.Asset>(paths: string, type: {prototype: T},_onProgress?: ProgressFn,_onComplete?: CompleteFn ,_bundle?:  cc.AssetManager.Bundle | string): Promise<T>
    public load<T extends cc.Asset>(paths: string, type: {prototype: T},_onProgress?: ProgressFn | CompleteFn | cc.AssetManager.Bundle | string,_onComplete?: CompleteFn | cc.AssetManager.Bundle | string,_bundle?:  cc.AssetManager.Bundle | string){
        let {onProgress,onComplete,bundle} = this.parsingLoadArgs(_onProgress,_onComplete,_bundle);
        _onProgress = (finish: number,total: number,item: cc.AssetManager.RequestItem)=>{
            this.onProgress(finish,total,item);
            onProgress?.(finish,total,item);
        }
        // 保留，否则会在父类里面解析错误
        _onComplete = async (error: Error, assets: any)=>{
            // this.onComplete(error,assets);
            onComplete?.(error,assets);
        }

        return super.load(paths,type,_onProgress,_onComplete,bundle);
    }

    public loadScene(sceneName: string,_bundle?:  cc.AssetManager.Bundle | string)
    public loadScene(sceneName: string,_onComplete?: CompleteFn ,_bundle?:  cc.AssetManager.Bundle | string)
    public loadScene(sceneName: string,_onProgress: ProgressFn,_onComplete?: CompleteFn,_bundle?:  cc.AssetManager.Bundle | string)
    public loadScene(sceneName: string,_onProgress: ProgressFn | CompleteFn | cc.AssetManager.Bundle | string,_onComplete?: CompleteFn | cc.AssetManager.Bundle | string,_bundle?:  cc.AssetManager.Bundle | string){
        let {onProgress,onComplete,bundle} = this.parsingLoadArgs(_onProgress,_onComplete,_bundle);
        _onProgress = (finish: number,total: number,item: cc.AssetManager.RequestItem)=>{
            this.onProgress(finish,total,item);
            onProgress?.(finish,total,item);
        }
        // 保留，否则会在父类里面解析错误
        _onComplete = async (error: Error, assets: any)=>{                                                                                                                                                               
            // await this.onComplete(error,assets);
            onComplete?.(error,assets);
        }
        return super.loadScene(sceneName,_onProgress,_onComplete,bundle);
    }


    
    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_bundle?: cc.AssetManager.Bundle | string): Promise<T[]>
    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_onComplete?: CompleteFn,_bundle?: cc.AssetManager.Bundle | string): Promise<T[]>  
    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_onProgress?: ProgressFn,_onComplete?: CompleteFn ,_bundle?:  cc.AssetManager.Bundle | string): Promise<T[]>
    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_onProgress?: ProgressFn | CompleteFn | cc.AssetManager.Bundle | string,_onComplete?: CompleteFn | cc.AssetManager.Bundle | string,_bundle?:  cc.AssetManager.Bundle | string): Promise<T[]>{
        
        let {onProgress,onComplete,bundle} = this.parsingLoadArgs(_onProgress,_onComplete,_bundle);

        _onProgress = (finish: number,total: number,item: cc.AssetManager.RequestItem)=>{
            this.onProgress(finish,total,item);
            onProgress?.(finish,total,item);
        }
        // 保留，否则会在父类里面解析错误
        _onComplete = async (error: Error, assets: any)=>{
            // await this.onComplete(error,assets);
            onComplete?.(error,assets);
        }

        return super.loadDir(dir,type,_onProgress,_onComplete,bundle);
    }

    public step (dt) {
        if (this._isLoading) {
            let unit = this.duration / dt;
            let rdt = this._res_total_count / unit;

            this._visual_count += rdt;
            this._visual_count = Math.min(this._visual_count, this._complete_progress);


            if (this._visual_count >= this._res_total_count) {
                this._isLoading = false;

                this._onLoadingListener?.onLoadingComplete();
                this._tasks.length = 0;
            }
        }

        let progress = this._visual_count * 1.0 / this._res_total_count;
        if(isNaN(progress)){
            progress = 0;
        }
        return progress;
    }
    


    dispose(){
        this._visual_count = 0;
        this._isLoading = false;
        this._tasks.length = 0;

        this._isLoading = true;
        this._visual_count = 0;
        this._complete_progress = 0;
        this._completed_count = 0;
        this._res_total_count = 0;
        this._onLoadingListener = null;
    }
}