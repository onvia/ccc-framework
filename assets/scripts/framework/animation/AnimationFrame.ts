import { engine } from "../Engine";
import AnimationBase from "./AnimationBase";
import { AnimationType } from "./AnimationType";

const {ccclass,inspector,requireComponent,disallowMultiple ,menu, property,executeInEditMode} = cc._decorator;

function stringToArr(string: string){
    
    var reg = new RegExp("\{|\}", "g");
    string = string.replace(reg,'')
    let strs = string.split(",");
    return strs;
}

function stringToVec2(string: string,out?: cc.Vec2){
    if(!out){
        out = cc.v2();
    }

    let strs = stringToArr(string);
    out.x = parseFloat(strs[0]);
    out.y = parseFloat(strs[1]);        
    return out;
}
function stringToRect(string: string,out?: cc.Rect){
    if(!out){
        out = cc.rect();
    }
    let strs = stringToArr(string);
    out.x = parseFloat(strs[0]);
    out.y = parseFloat(strs[1]);   
    out.width = parseFloat(strs[2]);
    out.height = parseFloat(strs[3]);      
    return out;
}

type Runnable = ()=> void;

@ccclass
@requireComponent(cc.Sprite)
@menu("自定义UI/AnimationFrame")
@disallowMultiple()
// @executeInEditMode()
//@inspector("packages://autoproperty/inspector.js")
export default class AnimationFrame extends AnimationBase {

    animationType: AnimationType = AnimationType.Frame;

    sprite: cc.Sprite = null;
    animation: cc.Animation = null;

    private animations = {};
    private animationClips = {};


    @property(cc.JsonAsset)
    public jsonAsset: cc.JsonAsset = null;

    @property(cc.Texture2D)
    public texture2d: cc.Texture2D = null;

    @property({displayName: '帧速率-帧/每秒'})
    framePerSeconds = 30;
    @property()
    loop = true;
    @property()
    playOnLoad = true;

    private _onPlayEvent: Runnable = ()=>{};
    private _onFinishEvent: Runnable = ()=>{};

    _init = false;

    onLoad(){
        this.lazyInit();
    }

    start () {
        
    }
    
    //创建动作
    createAnimation(name: string, defaultClip?: string, frame_time?: number) {
        
        let node = this.node;
        let self = this;

        let animation = node.getComponent(cc.Animation);
        !animation && (animation = node.addComponent(cc.Animation));
        let sprite = node.getComponent(cc.Sprite);
        !sprite && (sprite = node.addComponent(cc.Sprite));

        let iAnimation = self.animations[name] as IAnimation;
        if (!iAnimation) {
            cc.error(`AnimationFrame-> ${name} no anim`);
            return;
        }
        for (const clipName in iAnimation.clips) {
            if (defaultClip == "" || defaultClip == undefined) { //如果没有默认动画则使用第一个动画，防止没有默认动画
                defaultClip = clipName;
            }
            let clip = self.createClip(name, clipName, frame_time || 1/iAnimation.frame_time);

            clip.wrapMode = cc.WrapMode.Loop; // 播放模式
            clip.speed = 1; // 播放速度控制

            animation.addClip(clip);
        }
        if(this.playOnLoad){
            this.play(defaultClip,this.loop);
        }
        // animation.play(defaultClip);
    }

    //创建动画片段
    createClip(name, clipName, frame_time?: number) {
        let self = this;
        let clip = null;
        if (self.animationClips[name] && self.animationClips[name][clipName]) {
            clip = self.animationClips[name][clipName];
        } else {
            let iAnimation = self.animations[name] as IAnimation;
            if(!iAnimation){

                cc.error(`AnimationFrame->createClip: ${name} is not in animations`);                
                return null;
            }
            let frames = iAnimation.getClip(clipName);
            if(!frames){
                cc.error(`AnimationFrame-> createClip: ${name} ${clipName} is null`);
                return null;
            }
            clip = cc.AnimationClip.createWithSpriteFrames(frames, frame_time || 1/iAnimation.frame_time);

            //缓存 Clip
            if (!self.animationClips[name]) {
                self.animationClips[name] = {};
            }
            self.animationClips[name][clipName] = clip;
            // cc.log(`AnimationFrame-> createClip: ${name} ${clipName}`);

            clip.name = clipName;
        }
        return clip;
    }

    public play(name,loop: boolean = true,timescale = 1) {
        this.lazyInit();
        let animation = this.animation;
        if(name === null || name === undefined){
            let clips = animation.getClips();
            let clip = clips.length > 0 && clips[0];
            name = clip.name;
        }
        this.animationName = name;
        let state = animation.play(name);
        if(state){
            state.wrapMode = loop? cc.WrapMode.Loop : cc.WrapMode.Normal;
            state.speed = timescale;
        }
    }

    public playOnce(name,timescale = 1) {
        this.play(name,false,timescale);
    }
    
    public setStartListener(listener: Runnable){
        this._onPlayEvent = listener;
    }

    /**
     * 动画播放一次循环结束后的事件监听
     * @param listener 
     */
    public setCompleteListener(listener: Runnable){
        this._onFinishEvent = listener;
    }
    
    //设置播放速度
    public setSpeed(speed) {
        let animation = this.animation;
        if (animation && animation.currentClip) {
            let animname = animation.currentClip.name;
            let state = animation.getAnimationState(animname);
            state.speed = speed;
        }
    }

    public pause() {
        let animation = this.animation;
        if (animation && animation.currentClip) {
            let animname = animation.currentClip.name;
            animation.pause(animname);
        }
    }

    public resume() {
        let animation = this.animation;
        if (animation && animation.currentClip) {
            let animname = animation.currentClip.name;
            animation.resume(animname);
        }
    }

    public stop() {
        let animation = this.animation;
        if (animation && animation.currentClip) {
            let animname = animation.currentClip.name;
            animation.stop(animname);
        }
    }

    public stopAll() {
        this.stop();
    }
    public getCurrentAnimation(): string {
        return this.animationName;
    }

    
    protected onPlay(){
        this._onPlayEvent && this._onPlayEvent();
    }
    protected onFinished(){
        this._onFinishEvent && this._onFinishEvent();
    }
    

    // loadResource(fullpath: string,bundle?: cc.AssetManager.Bundle): Promise<AnimationBase> {
    //     this.lazyInit();
    //     let _sprite = this.sprite;
    //     return new Promise((resolve,reject)=>{
    //         lg.loader.loadRes(fullpath,cc.SpriteFrame,(err,spriteFrame)=>{
    //             if(err){
    //                 console.log(`AnimationFrame->loadResource error:`,err); 
    //                 reject(err);                                    
    //                 return;
    //             }
    //             _sprite.spriteFrame = spriteFrame;
    //             resolve(spriteFrame);
    //         },bundle);
    //     });
    // }
    
    async loadResource(dataPath:string ,bundle?: cc.AssetManager.Bundle | string)
    async loadResource(dataPath:string ,imgPath?:string | cc.AssetManager.Bundle,bundle?: cc.AssetManager.Bundle | string): Promise<AnimationFrame> {
        let self = this;
        // if(imgPath !== undefined && bundle === undefined){
        //     bundle = imgPath;
        //     imgPath = null;
        // }
        // if(!imgPath){
        //     if(!dataPath){
        //         console.log(`AnimationFrame-> `);
                
        //     }
        //     imgPath = dataPath.replace('.json','.png');
        // }
        // let p1 = engine.loader.getRes(dataPath,cc.JsonAsset,null,bundle)
        // let p2 = lg.loader.loadRes(imgPath as string,cc.Texture2D,null,bundle);

        // let result = await Promise.all([p1,p2]);
        // if(this.jsonAsset === result[0]){
        //     return Promise.resolve(self);  
        // }
        // let name = self.parseData(result[0] && result[0].json,result[1]);
        // this.createAnimation(name,null,this.framePerSeconds);
        return Promise.resolve(self);
    }

    private parseData(data,texture){
        let self = this;
        if(data.name in self.animations){
            // cc.error(`AnimationFrame->parseData ${data.name} already in the list`);   
            return data.name;         
        }

        let iAnimation = new IAnimation(data.name,data.frame_time,data.textureFileName);
        self.animations[data.name] = iAnimation;
        //动作
        let clips = data.anims;
        for (const clipname in clips) {            
            let clip = [];
            //动作的每一帧
            const frames = clips[clipname];
            for (let i = 0,length = frames.length; i < length; i++) {
                const frame = frames[i];
                let rect = stringToRect(frame.textureRect)
                let rotated = frame.textureRotated;
                let offset = stringToVec2(frame.spriteOffset);
                let originalSize = stringToVec2(frame.spriteSourceSize);
                let spriteFrame = new cc.SpriteFrame(texture,rect,rotated,offset,cc.size(originalSize.x,originalSize.y));
                clip.push(spriteFrame);
            }
            iAnimation.pushClip(clipname,clip);
        }
        return data.name;       
    }
    

    private lazyInit(){
        if(this._init){
            return;
        }
        this._init = true;
        !this.sprite && (this.sprite = this.node.getComponent(cc.Sprite));
        !this.animation && (this.animation = this.node.getComponent(cc.Animation))
        !this.animation && (this.animation = this.node.addComponent(cc.Animation));

        if(this.jsonAsset && this.texture2d){
            let name = this.parseData(this.jsonAsset.json,this.texture2d);
            this.createAnimation(name,null,this.framePerSeconds);
        }
        
        this.animation.on(cc.Animation.EventType.PLAY,      this.onPlay,        this);
        this.animation.on(cc.Animation.EventType.FINISHED,  this.onFinished,    this);
    }

    static createNodeByAsset(jsonAsset: cc.JsonAsset,texture2d: cc.Texture2D,framePerSeconds?: number){
        let node = new cc.Node();
        let frame = node.addComponent(AnimationFrame);
        frame.framePerSeconds = framePerSeconds || 30;
        frame.jsonAsset = jsonAsset;
        frame.texture2d = texture2d;
        frame.lazyInit();
        node.name = "AnimationFrame";
        return node;
    }
    
    static createNodeByAssetPath(dataPath:string ,bundle?: cc.AssetManager.Bundle | string){
        let node = new cc.Node();
        let frame = node.addComponent(AnimationFrame);
        frame.loadResource(dataPath,bundle);
        node.name = "AnimationFrame";
        return node;
    }
}


class IAnimation{
    name = ''
    frame_time = 0;
    clips = {};
    textureFileName = ''

    constructor(name,frame_time,textureFileName){
        this.name = name;
        this.frame_time = frame_time;
        this.textureFileName = textureFileName;
    }
    pushClip(name,clip){
        this.clips[name] = clip;
    }

    getClip(name){
        return this.clips[name];
    }

}