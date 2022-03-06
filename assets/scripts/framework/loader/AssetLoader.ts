import { BundleAsset } from "./BundleAsset";
import { NormalAsset } from "./NormalAsset";

declare global{

    type LoadBundleAssetCompleteFunc = (err: Error | null, bundle : BundleAsset | null) => void;

    type ProgressFn = (finish: number,total: number,item: cc.AssetManager.RequestItem)=> void;
    type CompleteFn = (error: Error, assets: any) => void;
    type PreLoadCompleteFn = (error: Error) => void;

    interface LoaderPlugin{
        name: string;
        onLoadComplete(path: string, asset: cc.Asset,bundle: cc.AssetManager.Bundle);
        onLoadDirComplete(path: string, assets: cc.Asset[],bundle: cc.AssetManager.Bundle);
        onLoadSceneComplete(sceneName: string,scene: cc.SceneAsset,bundle: cc.AssetManager.Bundle);
        onRelease(path: string, asset: cc.Asset);
    }
}


class Cache{
    // 考虑到 相同路径不同类型的资源，所以这里使用数组形式
    map :Map<string,Array<NormalAsset>>;
    constructor(){
        this.map = new Map();
    }
    set(path,asset: NormalAsset){
        let has = this.map.has(path);
        let assets: NormalAsset [] = null;
        if(has){
            assets = this.map.get(path);
        }else{
            assets = [];
            this.map.set(path,assets);
        }
        assets.push(asset);
    }
    get(path,type: {prototype: cc.Asset}): NormalAsset {
        let has = this.map.has(path);
        if(has){
            let assets = this.map.get(path);
            let typeName = cc.js.getClassName(type)
            for (let i = 0; i < assets.length; i++) {
                const asset = assets[i];
                let assetClassName = cc.js.getClassName(asset.getAsset());
                if(assetClassName == typeName){
                    return asset;
                }
            }
        }
        return null;
    }

    delete(path: string, type: {prototype: cc.Asset}){
        let has = this.map.has(path);
        if(has){
            let assets = this.map.get(path);
            let typeName = cc.js.getClassName(type)
            for (let i = 0; i < assets.length; i++) {
                const asset = assets[i];
                let assetClassName = cc.js.getClassName(asset.getAsset());
                if(assetClassName == typeName){
                    assets.splice(i,1);
                    if(!assets.length){
                        this.map.delete(path);
                    }
                    return asset;
                }
            }
        }
        return null;
    }

    forEach(callbackfn: (value: NormalAsset, key: string, map: Cache) => void, thisArg?: any){
        this.map.forEach((arr,key)=>{
            for (let i = 0; i < arr.length; i++) {
                const asset = arr[i];
                callbackfn(asset,key,this);
            }
        },thisArg);
    }

    clear(){
        this.map.clear();
    }
    
}


export class AssetLoader{
    protected static loadedBundles:  Map<string, BundleAsset> = new Map();
    protected static bundleVersions : Map<string, string> = null!;
    
    public static getBundleVersions( bundleName : string) : string | undefined{
        if(this.bundleVersions == null) return null;
        return this.bundleVersions.get(bundleName);
    }
    
    //删除bundle
    public static removeBundle( nameOrUrl : string ){
        let asset = this.loadedBundles.get(nameOrUrl);
        if(asset){
            this.loadedBundles.delete(nameOrUrl);
            if(nameOrUrl != cc.resources.name)
                cc.assetManager.removeBundle(asset.getBundle());
        }
    }

     /**
     * 加载 Bundle
     * @param bundleName 
     */
    public static loadBundle(bundleName: string | Bundle,onComplete?: LoadBundleAssetCompleteFunc): Promise<BundleAsset>{
        return new Promise<BundleAsset>((resolve, reject) => {
            if(!bundleName){
                bundleName = cc.resources.name;
            }

            if(bundleName instanceof cc.AssetManager.Bundle){
                bundleName = bundleName.name;
            }
            let bundle = this.loadedBundles.get(bundleName);
            if(bundle){
                onComplete?.(null,bundle);
                resolve(bundle);
            }else{
                if(bundleName == cc.resources.name){
                    bundle = new BundleAsset(bundleName, cc.resources);
                    this.loadedBundles.set(bundleName, bundle);
                    onComplete?.(null, bundle);
                    resolve(bundle);
                }else{                
                    let options : any = {}
                    // if(onprogress){
                    //     options.onFileProgress = (loaded: number, total: number)=>{
                    //         onprogress(loaded/total);
                    //     }
                    // }
                    let version = this.getBundleVersions(bundleName)
                    if(version){
                        options.version = version;
                    }

                    cc.assetManager.loadBundle(bundleName, options, (err: Error | null, data: Bundle)=>{
                        if(err == null){
                            bundle = new BundleAsset(bundleName as string, data);
                            this.loadedBundles.set(bundleName as string, bundle);
                            onComplete?.(null, bundle);
                            resolve(bundle);
                        }else{
                            onComplete?.(err, null);
                            reject(err);
                        }
                    });
                }
            }
        })
    }

    public removeBundle( nameOrUrl : string ){
        return AssetLoader.removeBundle(nameOrUrl);
    }

    public loadBundle(bundleName: string | Bundle,onComplete?: LoadBundleAssetCompleteFunc): Promise<BundleAsset>{
        return AssetLoader.loadBundle(bundleName,onComplete);
    }

    
    protected plugins: LoaderPlugin[] = [];

    protected cache : Cache = new Cache();

    public registerPlugin(plugins: LoaderPlugin | LoaderPlugin[]){
        if(CC_EDITOR){
            return;
        }
        if (!Array.isArray(plugins)) {
            plugins = new Array(plugins);
        }

        plugins.forEach((plugin) => {
            //插件能不重复
            let findPlugin = this.plugins.some(item => item.name === plugin.name || item === plugin);
            if (findPlugin) {
                return;
            }
            this.plugins.push(plugin);
        });
    }

    private onLoadComplete(path: string, asset: cc.Asset,bundle: cc.AssetManager.Bundle){
        this.plugins.forEach((plugin)=>{
            plugin.onLoadComplete(path, asset,bundle);
        });
    }

    private onLoadDirComplete(path: string, assets: cc.Asset[],bundle: cc.AssetManager.Bundle){
        this.plugins.forEach((plugin)=>{
            plugin.onLoadDirComplete(path, assets,bundle);
        });
    }

    private onRelease(path: string, asset: cc.Asset){
        this.plugins.forEach((plugin)=>{
            plugin.onRelease(path, asset);
        });
    }

    private onLoadSceneComplete(sceneName: string,scene: cc.SceneAsset,bundle: cc.AssetManager.Bundle){
        this.plugins.forEach((plugin)=>{
            plugin.onLoadSceneComplete(sceneName, scene,bundle);
        });
    }
 
    // 先对包装层资源进行计数 --
    public releaseAsset( path : string, type: {prototype: cc.Asset}){
        let asset = this.cache.get(path,type);
        if(asset){
            asset.decRef();
            if(asset.getRefCount() <= 0){
                let asset = this.cache.delete(path,type);
                this.onRelease(asset.getPath(),asset.getAsset());
            }
        }
    }

    // 直接释放引用资源，不对包装层做判断
    public releaseAll(){
        this.cache?.forEach((asset : NormalAsset)=>{
            asset.getAsset().decRef();
            this.onRelease(asset.getPath(),asset.getAsset());
        });
        this.cache?.clear();
    }


    // 是否已经加载
    public hasRes(path: string, type:{prototype: cc.Asset},bundle?:  cc.AssetManager.Bundle | string){
        return !!this.getRes(path,type,bundle);
    }

    // 获取已加载的资源
    public getRes(path: string, type: {prototype: cc.Asset},bundle?:  cc.AssetManager.Bundle | string){
        if(!bundle){
            bundle = cc.resources.name;
        }else if(bundle instanceof cc.AssetManager.Bundle){
            bundle = bundle.name;
        }

        let bundleAsset = AssetLoader.loadedBundles.get(bundle);
        if(!bundleAsset){
            return null;
        }
        let u_path = this.jointKey(bundleAsset.getPath(),path);
        let asset = this.cache.get(u_path,type);
        return asset;
    }


    public load<T extends cc.Asset>(path: string, type: {prototype: T},_bundle?:  cc.AssetManager.Bundle | string): Promise<T>
    public load<T extends cc.Asset>(path: string, type: {prototype: T},_onComplete?: CompleteFn,_bundle?:  cc.AssetManager.Bundle | string): Promise<T>
    public load<T extends cc.Asset>(path: string, type: {prototype: T},_onProgress?: ProgressFn,_onComplete?: CompleteFn ,_bundle?:  cc.AssetManager.Bundle | string): Promise<T>
    public load<T extends cc.Asset>(path: string, type: {prototype: T},_onProgress?: ProgressFn | CompleteFn | cc.AssetManager.Bundle | string,_onComplete?: CompleteFn | cc.AssetManager.Bundle | string,_bundle?:  cc.AssetManager.Bundle | string): Promise<T>{
        
        return new Promise<T>(async (resolve,reject)=>{
            let obj = this.parsingLoadArgs(_onProgress,_onComplete,_bundle);
            let {onProgress,onComplete,bundle} = obj;
            let bundleAsset = await this.loadBundle(bundle);


            let u_path = this.jointKey(bundleAsset.getPath(),path);
            let asset = this.cache.get(u_path,type);
            if(asset){
                asset.addRef();
                let _asset: cc.Asset = asset.getAsset();
                onComplete?.(null, _asset);
                resolve(<T>_asset);
                return;
            }

            bundleAsset.getBundle().load(path,type as any,(finish: number,total: number,item)=>{
                // this.onProgress(finish,total,item);
                onProgress?.(finish,total,item);
            },async (error: Error, assets: T)=>{
                if(error){
                    reject(error);
                }else{

                    let asset = new NormalAsset(path, assets, bundleAsset);
                    asset.addRef();
                    this.cache.set(u_path, asset);
                    
                    this.onLoadComplete(path,assets,bundleAsset.getBundle());
                    // await this.onComplete(error,assets);
                    await onComplete?.(error,assets);
                    resolve(assets);
                }
            });
        });
    }

    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_bundle?: cc.AssetManager.Bundle | string): Promise<T[]>
    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_onComplete?: CompleteFn,_bundle?: cc.AssetManager.Bundle | string): Promise<T[]>  
    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_onProgress?: ProgressFn,_onComplete?: CompleteFn ,_bundle?:  cc.AssetManager.Bundle | string): Promise<T[]>
    public loadDir<T extends cc.Asset>(dir: string, type: {prototype: T},_onProgress?: ProgressFn | CompleteFn | cc.AssetManager.Bundle | string,_onComplete?: CompleteFn | cc.AssetManager.Bundle | string,_bundle?:  cc.AssetManager.Bundle | string): Promise<T[]>{

        return new Promise<T[]>(async (resolve,reject)=>{
            
            let {onProgress,onComplete,bundle} = this.parsingLoadArgs(_onProgress,_onComplete,_bundle);

            let bundleAsset = await this.loadBundle(bundle);
            bundleAsset.getBundle().loadDir(dir,type as any,(finish: number,total: number,item: cc.AssetManager.RequestItem)=>{
                // this.onProgress(finish,total,item);
                onProgress?.(finish,total,item);
            },async (error: Error,assets: Array<T>)=>{
                assets.forEach((asset)=>{
                    // @ts-ignore
                    let info = bundleAsset.getBundle().getAssetInfo(asset._uuid);
                    let path = info.path;
                    let u_path = this.jointKey(bundleAsset.getPath(),path);
                    let noramlAsset = this.cache.get(u_path,type);
                    if(!noramlAsset){
                        noramlAsset = new NormalAsset(path, asset, bundleAsset);
                        this.cache.set(u_path, noramlAsset);
                    }                
                    noramlAsset.addRef();
                });

                this.onLoadDirComplete(dir,assets,bundleAsset.getBundle());
                // await this.onComplete(error,assets);
                await onComplete?.(error,assets);
                resolve(assets);
            });
        });
    }

    

    public loadScene(sceneName: string,_bundle?:  cc.AssetManager.Bundle | string)
    public loadScene(sceneName: string,_onComplete?: CompleteFn ,_bundle?:  cc.AssetManager.Bundle | string)
    public loadScene(sceneName: string,_onProgress: ProgressFn,_onComplete?: CompleteFn,_bundle?:  cc.AssetManager.Bundle | string)
    public loadScene(sceneName: string,_onProgress: ProgressFn | CompleteFn | cc.AssetManager.Bundle | string,_onComplete?: CompleteFn | cc.AssetManager.Bundle | string,_bundle?:  cc.AssetManager.Bundle | string){
        return new Promise<cc.SceneAsset>(async (resolve,reject)=>{
            let {onProgress,onComplete,bundle} = this.parsingLoadArgs(_onProgress,_onComplete,_bundle);
            if(!bundle){
                bundle = cc.assetManager.bundles.find((bundle)=> {
                    return !!bundle.getSceneInfo(sceneName);
                });
            }
            let bundleAsset = await this.loadBundle(bundle);
            // 加载 场景资源
            bundleAsset.getBundle().loadScene(sceneName,(finish: number,total: number,item: cc.AssetManager.RequestItem)=>{
                onProgress?.(finish,total,item);
            },async (error: Error, assets: cc.SceneAsset)=>{
                // await this.onComplete(error,assets);
                
                this.onLoadSceneComplete(sceneName,assets,bundleAsset.getBundle());
                await onComplete?.(error,assets);
                if(error){
                    reject(error);
                }else{
                    resolve(assets);
                }
            });
        });
    }

    
    preloadScene(sceneName: string, bundle?:  cc.AssetManager.Bundle | string)
    preloadScene(sceneName: string, onComplete?: PreLoadCompleteFn, bundle?:  cc.AssetManager.Bundle | string)
    preloadScene(sceneName: string, options?: Record<string, any>, bundle?:  cc.AssetManager.Bundle | string)
    preloadScene(sceneName: string, options?: Record<string, any>, onComplete?: PreLoadCompleteFn, bundle?:  cc.AssetManager.Bundle | string)
    preloadScene(sceneName: string, onProgress?:  ProgressFn, onComplete?: PreLoadCompleteFn, bundle?:  cc.AssetManager.Bundle | string)
    preloadScene(sceneName: string, _options?: Record<string, any> | ProgressFn | cc.AssetManager.Bundle | string, _onProgress?: ProgressFn | PreLoadCompleteFn | cc.AssetManager.Bundle | string, _onComplete?: PreLoadCompleteFn | cc.AssetManager.Bundle | string, _bundle?:  cc.AssetManager.Bundle | string){
   
        return new Promise<void>(async (resolve,reject)=>{
            let { options, onProgress, onComplete, bundle } = this.parseParameters(_options,_onProgress,_onComplete,_bundle);
            if(!bundle){
                bundle = cc.assetManager.bundles.find((bundle)=> {
                    return !!bundle.getSceneInfo(sceneName);
                });
            }
            let bundleAsset = await this.loadBundle(bundle);
            // 加载 场景资源
            bundleAsset.getBundle().preloadScene(sceneName,options,(finish: number,total: number,item: cc.AssetManager.RequestItem)=>{
                onProgress?.(finish,total,item);
            },async (error: Error)=>{
                // await this.onComplete(error,assets);
                await onComplete?.();
                if(error){
                    reject(error);
                }else{
                    resolve();
                }
            });
        });

    }



    protected jointKey(bundle: string,path){
        let u_path = `${bundle}#${path}`;     
        return u_path;
    }

    protected parsingLoadArgs(... args){
        let onProgress: ProgressFn,onComplete: CompleteFn,bundle: string | Bundle;
        let _onProgress = args[0];
        let _onComplete = args[1];
        let _bundle = args[2];

        if(_onProgress && _onComplete && _bundle){
            onProgress = _onProgress;
            onComplete = _onComplete;
            bundle = _bundle;
        }else{
            if(typeof _onProgress === 'function'){
                if(typeof _onComplete === 'function'){
                    onProgress = _onProgress;
                    onComplete = _onComplete;
                }else if(typeof _onComplete === 'undefined'){
                    onComplete = _onProgress;
                }else{
                    onComplete = _onProgress;
                    bundle = _onComplete;
                }
            }else{
                bundle = _onProgress;
            }
        }
        let obj = {onProgress,onComplete,bundle};
        return obj;
    }

    parseParameters (options, onProgress, onComplete, bundle) {
     
        if(typeof onComplete === 'function'){
        }else if(typeof onComplete === 'string' || onComplete instanceof cc.AssetManager.Bundle){
            bundle = onComplete;
            onComplete = onProgress;
            onProgress = null
        }else if(!onComplete){
            if(typeof onProgress === 'function'){
                onComplete = onProgress;
                onProgress = null
            }else if(typeof onProgress === 'string' || onProgress instanceof cc.AssetManager.Bundle){
                bundle = onProgress;
                onProgress = null;
            }else if(!onProgress){
               if(typeof options === 'function'){
                onComplete = options;
                options = null;
               }else if(typeof options === 'string' ||  options instanceof cc.AssetManager.Bundle){
                bundle = options;
                options = null;
               }
            }
        }

        options = options || Object.create(null);
        return { options, onProgress, onComplete, bundle };
    }
    isNull(object){
        return object === null || object === undefined;
    }

    isObject(object){
        return Object.prototype.toString.call(object) === '[object Object]'
    }


    /**
     * 在编辑器中加载资源
     */
     loadResInEditor(path, type, callback) {
        let self = this;
        if (CC_EDITOR) {
            self.getUUIDFromMeta(path, type, function (uuid) {
                cc.loader.load({
                    uuid: uuid
                }, callback);
            });
        }
    }

     /*
    编辑器获取读取meta文件获取 uuid
    */
    getUUIDFromMeta(filepath, type, callback) {
        if (CC_EDITOR) {
            // @ts-ignore
            var path = require('path');
            // @ts-ignore
            var fs = require('fs');
            // @ts-ignore
            let projectPath = Editor.Project.path || Editor.projectPath;

            let exts = {};
            // @ts-ignore
            exts[cc.Prefab] = "prefab";
            // @ts-ignore
            exts[cc.JsonAsset] = "json";
            // @ts-ignore
            exts[cc.SpriteFrame] = "png";


            let absolutePath = path.join(projectPath, "assets", "resources", `${filepath}.${exts[type]}.meta`);
            // cc.log('绝对路径', absolutePath);
            if(!fs.existsSync(absolutePath)){
                cc.warn(`[${absolutePath}]file is not exist `);
                return;
            }

            fs.readFile(absolutePath, function (err, data) {
                if (err) {
                    cc.warn("parse uuid error = ", err || err.message);
                    return;
                }
                let dataStr = data.toString();
                let json = JSON.parse(dataStr);
                // cc.log("读取文件: ", dataStr);

                if (type === cc.SpriteFrame) {
                    let filearr = filepath.split("/");
                    let filename = filearr[filearr.length - 1];
                    let uuid = json.subMetas[filename].uuid;
                    // cc.log("filename: ", filename);
                    // cc.log("lgUtils-> uuid: ", uuid);
                    callback(uuid);
                } else {
                    let uuid = json.uuid;
                    // cc.log('lgUtils-> uuid: ', uuid);
                    callback(uuid);
                }
            });
        }
    }
   



    private static _instance:AssetLoader = null
    public static getInstance(): AssetLoader{
        if(!this._instance){
            this._instance = new AssetLoader();
        }
        return this._instance;
    }
}

export const loader = AssetLoader.getInstance();