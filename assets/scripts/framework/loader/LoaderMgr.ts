import { AssetLoader } from "./AssetLoader";

export class LoaderMgr{
    readonly KEY_UI = "UI";
    readonly KEY_SHARE = "share";

    private loaders: Map<string,AssetLoader> = new Map();
    public get share(): AssetLoader {
        return AssetLoader.getInstance();
    }

    /**
     * 可以从外部传入自定义的 loader
     * @param key 
     * @param loader 
     */
    public set(key: Constructor | string,loader: AssetLoader){
        if(key === this.KEY_SHARE){
            console.warn(`LoaderMgr-> 不能对 share loader 进行替换`);
            return;
        }
        if(typeof key !== 'string'){
            key = cc.js.getClassName(key);
        }
        if(this.loaders.has(key)){
            console.warn(`LoaderMgr-> 已经存在同名 Loader`);
        }
        this.loaders.set(key,loader);
    }

    /**
     * 获取 loader ，如果不存在则创建一个
     * @param key 
     * @returns 
     */
    public get(key: Constructor | string){
        if(CC_EDITOR){
            return;
        }
        if(typeof key !== 'string'){
            key = cc.js.getClassName(key);
        }
        if(key === this.KEY_SHARE){
            return this.share;
        }
        if(this.loaders.has(key)){
            return this.loaders.get(key);
        }

        let loader = new AssetLoader();
        this.loaders.set(key,loader);
        return loader;
    }

    /**
     * 释放 loader 中所有的资源，并删除 loader
     * @param key 
     */
    public releaseLoader(key: Constructor | string){
        if(typeof key !== 'string'){
            key = cc.js.getClassName(key);
        }
        if(this.loaders.has(key)){
            let loader: AssetLoader = this.loaders.get(key);
            loader.releaseAll();
            this.loaders.delete(key);
        }else{
            cc.log(`LoaderMgr-> [ ${key} ] 不存在！`);
        }
    }
    
    
    private static _instance:LoaderMgr = null
    public static getInstance(): LoaderMgr{
        if(!this._instance){
            this._instance = new LoaderMgr();
        }
        return this._instance;
    }
}

export let loaderMgr = LoaderMgr.getInstance();