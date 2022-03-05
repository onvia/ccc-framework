import Polyglot = require('./polyglot');
declare global{
    type FontPack = {
        font: string,
        type?: typeof cc.Font | typeof cc.TTFFont;
        bundle?: string;
    }
}

let data = {};
let polyglot = new Polyglot({phrases: data, allowMissing: true});
class I18N extends cc.EventTarget{
    readonly EVENT_UPDATE_I18N = 'EVENT_UPDATE_I18N';
    language = "zh";
    enable = false;
    fontMap: Record<string,FontPack> = {};

    init(language?){
        this.enable = true;
        this.updateI18N(language);        
    }
    
    updateI18N(language?){
        this.language = language? language:this.language;
        this._updateI18N(polyglot,this.language);
        this.emit(this.EVENT_UPDATE_I18N);
        
    }

    _updateI18N(_polyglot: Polyglot,language?){
        // @ts-ignore
        let { data } = require(language); 
        if(data){
            _polyglot.replace(data);
        }
    }

    t(key,opt?){
        let text = polyglot.t(key, opt);
        return text;
    }
    
    t2(key,...params){
        let text = i18n.t(key);        
        if (typeof params != 'undefined') {
            text = text.format.apply(text, params);
        }
        return text;
    }
    getFontPack(){
        return this.fontMap[this.language];
    }
    setText(node: cc.Node,key: string,...params){
        let label = node.getComponent('LocalizedLabel');
        if(!label){
            label = node.addComponent('LocalizedLabel')           
        }
        label.local(key,params);
    }

    setSpriteFrame(node: cc.Node,key: string){
        let sprite = node.getComponent('LocalizedSprite');        
        if(!sprite){
            sprite = node.addComponent('LocalizedSprite')
        }

        sprite.local(key);
    }


    private static instance: I18N = null;
    public static getInstance(): I18N {
        if (!this.instance) {
            this.instance = new I18N();
        }
       return this.instance;
    }
}
export let i18n = I18N.getInstance();


if(CC_EDITOR && i18n.enable){
    i18n.init(cc.sys.language);
}
