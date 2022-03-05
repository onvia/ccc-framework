
import AnimationBase from "./AnimationBase";
import { AnimationType } from "./AnimationType";

const {ccclass,inspector,requireComponent,disallowMultiple, menu, property} = cc._decorator;

@ccclass
@requireComponent(sp.Skeleton)
@menu("自定义UI/AnimationSkeleton")
@disallowMultiple()
//@inspector("packages://autoproperty/inspector.js")
export default class AnimationSkeleton extends AnimationBase {
   
    @property({tooltip: '混合时间'})
    mixTime = 0.2;

    animationType: AnimationType = AnimationType.Spine;
    private _skeleton: sp.Skeleton;
    public get skeleton(): sp.Skeleton {
        !this._skeleton && (this._skeleton = this.getComponent(sp.Skeleton));
        return this._skeleton;
    }
    public set skeleton(value: sp.Skeleton) {
        this._skeleton = value;
    }

    cacheOriginalSkins: Record<string,any> = {};

    curSkinTextures: Record<string,cc.Texture2D> = {};

    

    onLoad(){
        this._lazyInit();
    }
    private _lazyInit(){
        !this.skeleton && (this.skeleton = this.getComponent(sp.Skeleton));
    }
    start () {
        
    }
    isPlaying(animationName){
        return this.animationName == animationName;
    }
    /**
     * 
     * @param name 
     * @param loop 
     * @param force 当正在播放的动作与当前动作相同时，是否强制切换
     */
    play(name: string, loop: boolean = true) : sp.spine.TrackEntry{     
        this._lazyInit();
        this.animationName = name;        
        cc.log(`AnimationSkeleton-> play ${name}`);
        
        let curTrack = this.skeleton.setAnimation(0,name,loop);
        return curTrack;
    }
    stop(trackIndex?: any,mixDuration?: number) {
        this.animationName = '';
        if(trackIndex === undefined){
            trackIndex = 0;
        }
        if(mixDuration === undefined){
            mixDuration = 0;
        }

        let state = this.skeleton.getState();
        state.setEmptyAnimation(trackIndex,mixDuration)
        
    }
    setSkin(skinName){
        this._lazyInit();
        this.skeleton.setSkin(skinName);
    }
    stopAll(mixDuration = 0) {
        this.animationName = '';
        let state = this.skeleton.getState();
        state.setEmptyAnimations(mixDuration)
    }

    getCurrentAnimation(): string{
        return this.skeleton.animation;
    }

  
    playOnce(name,listener?,timescale = 1){
        cc.log(`AnimationSkeleton-> playOnce ${name}`);
        
        this.playRepeat(name,1,listener,timescale); 
    }
    /**
     * 重复播放
     * @param name 
     * @param count 
     * @param listener 
     * @param timescale 
     */
    playRepeat(name,count,listener?,timescale?){
        var self = this;
        var oldAnim = self.skeleton.animation;
        self.setTimeScale(timescale);
        var trackEntry = this.skeleton.setAnimation(0, name, count == 1 ? false : true);
        // 这里暂时注释掉，执行完之后返回值为 null
        // if(!trackEntry){
        //     cc.log("the trackEntry is null");
        //     listener(self,null);
        //     return 0;
        // }
        this.animationName = name;
        let loopCount = 0;
        self.skeleton.setTrackCompleteListener(trackEntry,(trackEntry) => {
            loopCount ++;
            var animationName = trackEntry.animation ? trackEntry.animation.name : "";
           if(count === loopCount){
            if (listener){
                listener(self,trackEntry);
            }else{
                self.play(oldAnim,true);
            }
           }
            // cc.log(`[track ${trackEntry.trackIndex}][animation ${animationName}] complete: ${loopCount}`);
        });
    }

    getSkeleton(){
        return this.skeleton;
    }

    /**
     * 设置时间系数
     * @param timeScale 
     */
    setTimeScale(timeScale: number){
        this._lazyInit();
        timeScale = typeof timeScale !== 'undefined' ?  timeScale : 1;
        this.skeleton.timeScale = timeScale;
    }
    getTimeScale(){
        return this.skeleton.timeScale;
    }

    mix(){
        this._lazyInit();
        // @ts-ignore
        let animations = this.skeleton.skeletonData._skeletonCache && this.skeleton.skeletonData._skeletonCache.animations;
        let names = [];
        if(animations){
            for (let i = 0; i < animations.length; i++) {
                const anim = animations[i];
                names.push(anim.name);
            }
        }
        // let keys = Object.keys(this.skeleton.skeletonData.skeletonJson.animations);
        let keys = names;
        for (let i = 0; i < keys.length; i++) {
            const key1 = keys[i];
            for (let j = 1; j < keys.length; j++) {
                const key2 = keys[j];
                this.setMix(key1,key2);
            }
        }
    }
    /**
     * 设置混合
     * @param anim1 
     * @param anim2 
     */
    setMix (anim1, anim2) {
        this._lazyInit();
        this.skeleton.setMix(anim1, anim2, this.mixTime);
        this.skeleton.setMix(anim2, anim1, this.mixTime);
    }

    // 获取当前皮肤纹理
    getCurSkinTexture(slotName: string){
        return this.curSkinTextures[slotName];
    }

    /** 根据插槽 局部换肤 */
    updatePartialSkin(texture: cc.Texture2D,slotName: string,offset?: cc.Vec2 | cc.Vec3){
        this._lazyInit();
        cc.log(`AnimationSkeleton->updatePartialSkin ${slotName}`);
        
        let skeleton = this.skeleton;
        if(cc.sys.isNative){

            // @ts-ignore
            let jsbTexture = new middleware.Texture2D();
            let texture2 = texture.getImpl();

            
            texture.setPremultiplyAlpha(false);
            this.curSkinTextures[slotName] = texture;         
            jsbTexture.setPixelsWide(texture.width);
            jsbTexture.setPixelsHigh(texture.height);
            jsbTexture.setNativeTexture(texture2);
            // @ts-ignore
            skeleton._nativeSkeleton.updateRegion(slotName, jsbTexture);
            // skeleton如果使用了缓存模式则需要刷新缓存
            skeleton.invalidAnimationCache();
            cc.log(`AnimationSkeleton-> 刷新缓存`);
            
            return;
        }
        texture.setPremultiplyAlpha(true);
        if(!slotName){
            return;
        }
        let slot: sp.spine.Slot = skeleton.findSlot(slotName);
        let attachment: sp.spine.RegionAttachment = slot && slot.getAttachment() as sp.spine.RegionAttachment;
        if (!slot || !attachment) {
            console.error(`AnimationSkeleton-> updatePartialSkin: ${slotName}`);
            
            return;
        }
       
        this.curSkinTextures[slotName] = texture;

        let originalRegion: sp.spine.TextureAtlasRegion = attachment.region as sp.spine.TextureAtlasRegion;
        !this.cacheOriginalSkins[slotName] && (this.cacheOriginalSkins[slotName] = originalRegion);

        // let region: sp.spine.TextureAtlasRegion = attachment.region as sp.spine.TextureAtlasRegion;
        // // @ts-ignore
        // let skeletonTexture = new sp.SkeletonTexture();
        // skeletonTexture.setRealTexture(texture);
    
        // region.u = 0;
        // region.v = 0;
        // region.u2 = 1;
        // region.v2 = 1;
        // region.width = texture.width;
        // region.height = texture.height;
        // region.originalWidth = texture.width;
        // region.originalHeight = texture.height;
        // region.rotate = false;
        // region.texture = skeletonTexture;
        // region.page = null;
        // attachment.width = region.width;
        // attachment.height = region.height;
        // attachment.setRegion(region);
    
        // mark: 不需要创建新的sp.spine.TextureAtlasRegion， 直接更新原attachment下的region即可。
        let region: sp.spine.TextureRegion = this.createRegion(texture);


        // @ts-ignore
        if(attachment.o_x === undefined || attachment.o_y === undefined){
            // @ts-ignore
            attachment.o_x = attachment.x,attachment.o_y = attachment.y;
        }

        // @ts-ignore
        attachment.x = attachment.o_x + (offset ? offset.x : 0);
        // @ts-ignore
        attachment.y = attachment.o_y + (offset ? offset.y : 0);


        attachment.setRegion(region);
        attachment.width = region.width;
        attachment.height = region.height;
        attachment.updateOffset();
        slot.setAttachment(attachment);
        // skeleton如果使用了缓存模式则需要刷新缓存
        skeleton.invalidAnimationCache();
    }

    private createRegion(texture: cc.Texture2D): sp.spine.TextureAtlasRegion {
        // @ts-ignore
        let skeletonTexture = new sp.SkeletonTexture();
        skeletonTexture.setRealTexture(texture);
        let page = new sp.spine.TextureAtlasPage();
        page.name = texture.name;
        page.uWrap = sp.spine.TextureWrap.ClampToEdge;
        page.vWrap = sp.spine.TextureWrap.ClampToEdge;
        page.texture = skeletonTexture;
        page.texture.setWraps(page.uWrap, page.vWrap);
        page.width = texture.width;
        page.height = texture.height;
        
        let region = new sp.spine.TextureAtlasRegion();
        region.page = page;
        region.width = texture.width;
        region.height = texture.height;
        region.originalWidth = texture.width;
        region.originalHeight = texture.height;
        
        region.rotate = false;
        region.u = 0;
        region.v = 0;
        region.u2 = 1;
        region.v2 = 1;
        region.texture = skeletonTexture;
        return region;
    }

    /** 还原皮肤 */
    reductionSkin(slotName: string){
        this._lazyInit();
        let skeleton = this.skeleton;
        
        if(cc.sys.isNative){
            // @ts-ignore
            // skeleton._nativeSkeleton.updateRegion(slotName, originalRegion);
            // skeleton如果使用了缓存模式则需要刷新缓存
            // skeleton._nativeSkeleton.reductionSkin(slotName);
            skeleton.invalidAnimationCache();
            cc.log(`AnimationSkeleton-> 刷新缓存`);
            return;
        }
        
        let originalRegion = this.cacheOriginalSkins[slotName];
        if(!originalRegion){
            cc.log(`AnimationSkeleton->原始皮肤不存在 无法还原`);
            return;
        }
        if(!slotName){
            return;
        }
        let slot: sp.spine.Slot = skeleton.findSlot(slotName);
        let attachment: sp.spine.RegionAttachment = slot.getAttachment() as sp.spine.RegionAttachment;
        if (!slot || !attachment) {
            console.error(`AnimationSkeleton->无法还原 : ${slotName}`);
            return;
        }

        attachment.setRegion(originalRegion);
        attachment.width = originalRegion.width;
        attachment.height = originalRegion.height;

        attachment.updateOffset();
        slot.setAttachment(attachment);
        // skeleton 如果使用了缓存模式则需要刷新缓存
        skeleton.invalidAnimationCache();
    }

    setStartListener(listener: Function){
        cc.isValid(this.skeleton) &&  this.skeleton.setStartListener(listener);
    }
    /**
     * 动画播放完后的事件监听
     * @param listener 
     */
    setEndListener(listener: Function){
        cc.isValid(this.skeleton) &&  this.skeleton.setEndListener(listener);
    }

    
    /**
     * 动画播放一次循环结束后的事件监听
     * @param listener 
     */
    setCompleteListener(listener: Function){
        let isValid = cc.isValid(this.skeleton);
        isValid && this.skeleton.setCompleteListener(listener);
    }
    /**
     * 帧事件的监听
     * @param listener 
     */
    setEventListener(listener: (trackEntry: sp.spine.TrackEntry,event: sp.spine.Event)=> void){
        if(cc.isValid(this.skeleton)){
            this.skeleton.setEventListener(listener);
        }
        
    }
    
    loadResource(fullpath: string,bundle?: cc.AssetManager.Bundle | string): Promise<AnimationSkeleton> {
        if(!fullpath){
            console.error(`AnimationSkeleton-> fullpath undefined`);
            return;
        }
        
        this._lazyInit();
        let self = this;
        if(self.fullpath == fullpath){
            cc.log(`AnimationSkeleton-> 加载的资源和当前资源相同，跳过加载！`);
            return Promise.resolve(self);
        }
        let _skeleton = this.skeleton;
        return new Promise((resolve,reject)=>{
            // lg.loader.loadRes(fullpath,sp.SkeletonData,(err,skeletonData)=>{
            //     if(err){
            //         reject(err);
            //         return;
            //     }
            //     self.fullpath = fullpath;
            //     _skeleton.skeletonData = skeletonData;

            //     // var spdata = skeletonData;//sp.Skeleton组件
            //     // var copy = new sp.SkeletonData()//拷贝一份纹理，避免重复纹理缓存
            //     // cc.js.mixin(copy,skeletonData);
            //     // @ts-ignore
            //     // copy._uuid = spdata._uuid+"_"+new Date().getTime()+"_copy";//增加一个时间戳 读取到毫秒应该不会重复吧？
            //     // var old = copy.name;
            //     // var newName = copy.name+'_copy'
            //     // copy.name = newName;
            //     // copy.atlasText = copy.atlasText.replace(old,newName)
            //     // // @ts-ignore
            //     // copy.textureNames[0] = newName+'.png'
            //     // // @ts-ignore
            //     // copy.init && copy.init()
                
                
            //     // var copy = new sp.SkeletonData()//拷贝一份纹理，避免重复纹理缓存
            //     // cc.js.mixin(copy,skeletonData);
            //     // skeletonData.skeletonJson && (copy.skeletonJson = JSON.parse(JSON.stringify(skeletonData.skeletonJson)));
            //     // _skeleton.skeletonData = copy;//重新设置一下数据
            //     resolve(self);
            // },bundle);
        });
    }
    
    logSlots(){
        console.log('skeletonCtrl-> skeletonJson:');        
        console.dir(this.skeleton.skeletonData.skeletonJson);

        
        console.log('skeletonCtrl-> skeletonJson.slots:');
        console.dir(this.skeleton.skeletonData.skeletonJson.slots);
    }

    logAnimations(){
        if(!CC_DEV){
            return [];
        }
        // @ts-ignore
        let animations = this.skeleton.skeletonData._skeletonCache && this.skeleton.skeletonData._skeletonCache.animations;
        let names = [];
        if(animations){
            for (let i = 0; i < animations.length; i++) {
                const anim = animations[i];
                names.push(anim.name);
            }
        }
        console.log(`AnimationSkeleton->animations ${JSON.stringify(names)}`);
        return names;
    }
}
