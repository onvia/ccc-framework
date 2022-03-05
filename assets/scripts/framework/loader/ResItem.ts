
 declare global{
    type AssetType = typeof cc.Asset;
    type Bundle = cc.AssetManager.Bundle;
 }
 
export abstract class ResItem {
    private refCount = 0;
    private path : string;
 
    constructor( path : string ){
        this.path = path;
    }
 
    public getPath() : string{
        return this.path;
    }
 
    public getRefCount() : number{
        return this.refCount;
    }
 
    public addRef(){
        this.refCount++;
    }
 
    public decRef(){
        this.refCount--;
        if(this.refCount <= 0){
            this.destroy();
        }
    }
 
    protected abstract destroy();
}