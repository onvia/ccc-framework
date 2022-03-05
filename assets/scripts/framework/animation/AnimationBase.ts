import { AnimationType } from "./AnimationType";



const {ccclass,inspector, property} = cc._decorator;

@ccclass
//@inspector("packages://autoproperty/inspector.js")
export default abstract class AnimationBase extends cc.Component {
    
    animationType: AnimationType;
    
    // 当前动画名字
    animationName: string;

    fullpath;
    

    // onLoad () {}

    start () {

    }



    abstract play(name: string,loop?: boolean,timescale?: number);
    abstract playOnce(name: string,timescale?: number);

    abstract stop(name?: string);
    
    abstract stopAll();
    
    public setCompleteListener(listener){

    }


    /**
     * 加载资源
     * @param fullpath 
     */
    abstract loadResource(fullpath: string,bundle?: cc.AssetManager.Bundle): Promise<AnimationBase>;

    /**
     * 获取当前正在播放的动画名称
     */
    abstract getCurrentAnimation(): string;
    // update (dt) {}
}
