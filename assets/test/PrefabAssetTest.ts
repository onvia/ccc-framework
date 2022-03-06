
const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class PrefabAssetTest extends cc.Component {

    prefab: cc.Prefab = null;

    
    start () {
      
    }

    
    spriteFrame: cc.SpriteFrame;
    
    // 加载预制体
    onClickLoadPrefab(){
        cc.resources.load("prefabs/gold",cc.Prefab,(err,asset: cc.Prefab)=>{
            if(err){
                return;
            }
            this.prefab = asset;
            let node = asset.data;
            let icon = node.getChildByName("icon");
            let sprite = icon.getComponent(cc.Sprite);
            this.spriteFrame = sprite.spriteFrame;
            this.logCount("预制体加载完成");
        },);
    }

    // 单独加载资源
    // texture/gold
    onClickLoadSpriteFrame(){
        cc.resources.load("texture/gold",cc.SpriteFrame,(err,spriteFrame: cc.SpriteFrame)=>{
            if(err){
                return;
            }
            this.spriteFrame = spriteFrame;
            this.logCount("单独加载资源");
        },);
    }
    // 释放预制体
    onClickReleasePrefab(){
        this.prefab.decRef();
        this.logCount("释放预制体");
        this.scheduleOnce(()=>{
            this.logCount("延迟查看计数");
        });
    }
    // 单独释放资源
    onClickReleaseSpriteFrame(){
        this.spriteFrame.decRef();
        this.logCount("单独释放资源");
    }
    // 输出计数
    logCount(tag: string){
        console.log(`PrefabAssetTest->${tag}, 资源计数： ${this.spriteFrame?.refCount}, 预制体计数：${this.prefab.refCount}`);
        
    }

    // 动态加载的预制体 引用资源会自动计数，预制体本身不会计数
    // 动态加载的资源不会自动计数
    // cc.instantiate(prefab) 不会增加计数

}
