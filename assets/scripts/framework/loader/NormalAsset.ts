import { BundleAsset } from "./BundleAsset";
import { ResItem } from "./ResItem";

 
export class NormalAsset extends ResItem {
    private asset : cc.Asset;
    private bundle : BundleAsset;
 
    constructor( path : string, asset : cc.Asset, bundle : BundleAsset){
        super(path);
        this.bundle = bundle;
        bundle.addRef();
        asset.addRef();
        this.asset = asset;
    }
 
    public getAsset() : cc.Asset{
        return this.asset;
    }
 
    protected destroy(){
        
        this.asset.decRef();
        this.bundle.decRef();
    }
}