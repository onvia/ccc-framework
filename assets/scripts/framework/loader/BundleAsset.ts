import { AssetLoader } from "./AssetLoader";
import { ResItem } from "./ResItem";

 

export class BundleAsset extends ResItem{
    private bundle : Bundle;
    
    constructor( nameOrUrl : string, bundle : Bundle){
        super(nameOrUrl);
        this.bundle = bundle;
    }
 
    public getBundle() : Bundle{
        return this.bundle;
    }
 
    protected destroy(){
        AssetLoader.removeBundle(this.getPath());
    }
}
