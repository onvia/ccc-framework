
// 多语言 图片 也要配置 在多语言Excel 里面，只用写 在 R.image 里面的 key 就行

import { engine } from "../Engine";
import { i18n } from "./i18n";

const {ccclass, property,executeInEditMode, menu,disallowMultiple,requireComponent} = cc._decorator;
@ccclass
@menu('本地化语言/LocalizedSprite')
@executeInEditMode
@disallowMultiple
@requireComponent(cc.Sprite)
export default class LocalizedSprite extends cc.Component {

    
    sprite: cc.Sprite = null;
    @property()
    _key = '';
    @property()
    set key(value){
        this._key = value;
        this.updateSprite();
    };

    get key(){
        return this._key;
    }

    @property({
        displayName: 'Asset Bundle'
    })
    bundle = '';
   
    _localizedString = '';
    @property()
    get localizedString(){
        let text = i18n.t(this.key);
        if(CC_EDITOR){
            if(this._localizedString != text){
                this._localizedString = text;            
                this._updateSprite(text);
            }
        }
        return text;
    };


    onLoad () {
        this.sprite = this.node.getComponent(cc.Sprite);
    }

    
    onEnable(){        
        i18n.on(i18n.EVENT_UPDATE_I18N,this.updateSprite,this);
    }
    
    onDisable(){
        i18n.targetOff(this);
    }
    
    
    local(key){
        this.key = key;
    }
    updateSprite(){
        let text = i18n.t(this.key);
        this._updateSprite(text);
    }

    private _updateSprite(text){

        cc.log('LocalizedSprite-> updateSprite');
        
        
        if(!this.key || this.key == ''){
            this.sprite.spriteFrame = null;
            return;
        }     
        // @ts-ignore
        let { R } = require('R');
        if(!R || !R.image){
            return;
        }
        let path = R.image[text];
        if(!path){
            cc.warn(`LocalizedSprite-> file is not in R.ts: ${text}`);    
            return;
        }
        cc.log('LocalizedSprite-> updateSprite ',path);
        if(CC_EDITOR){
            engine.loader.loadResInEditor(path,cc.SpriteFrame,(err,spriteFrame)=>{
                if(err){
                    cc.warn(`LocalizedSprite-> spriteFrame load error, path: ${path}`);                
                }
                this.sprite.spriteFrame = spriteFrame;
            });
        }else{            
            engine.loader.load(path,cc.SpriteFrame,(err,spriteFrame)=>{
                if(!err){
                    this.sprite.spriteFrame = spriteFrame;
                }
            },this.bundle);
            
        }
    }
        
}
