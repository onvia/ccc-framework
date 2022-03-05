import { AssetLoader } from "./AssetLoader";

export class LoaderMgr{
    
    private loaders: Map<string,AssetLoader> = new Map();
    public get share(): AssetLoader {
        return AssetLoader.getInstance();
    }

    public get(key: Constructor | string){
        if(typeof key !== 'string'){
            key = cc.js.getClassName(key);
        }
        if(this.loaders.has(key)){
            return this.loaders.get(key);
        }

        let loader = new AssetLoader();
        this.loaders.set(key,loader);
        return loader;
    }

    public release(key: Constructor | string){
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