import { i18n } from "./i18n";
import { VMI18NLabelAdapter } from "../vm/i18n/VMI18NLabelAdapter";
import { engine } from "../Engine";

const {ccclass, property,executeInEditMode, disallowMultiple,menu} = cc._decorator;

@ccclass
@menu('本地化语言/LocalizedLabel')
@executeInEditMode
@disallowMultiple
export default class LocalizedLabel extends VMI18NLabelAdapter {
    
    label: cc.Label | cc.RichText = null;
    @property()
    _key = '';
    @property()
    set key(value){
        this._key = value;
        this.updateLabel();
    }

    get key(){
        return this._key;
    }


    _localizedString = '';
    @property()
    get localizedString(){
        let text = this.getLocalizedOriginText();
        let params = this.params;        
        if (params && params.length>0) {
            text = text.format.apply(text, params);
        }

        if(CC_EDITOR){
            if(this._localizedString != text){
                this._localizedString = text;            
                this.label && (this.label.string = this._localizedString);
            }
        }
        return text;
    };

    @property([cc.String])
    params: string[] = [];


    font: string;


    lazyInit(){
        if(this.label){
            return;
        }
        this.label = this.node.getComponent(cc.Label);
        if(!this.label){
            this.label = this.node.getComponent(cc.RichText);
        }
    }
    onLoad () {
        this.lazyInit();
        this.updateLabel();
    }

    start () {

    }
    
    onEnable(){
        // this.updateLabel();
        i18n.on(i18n.EVENT_UPDATE_I18N,this.updateLabel,this);
    }
    
    onDisable(){
        i18n.targetOff(this);
    }
    
    local(key: string,... params){
        this.params = params;
        this.key = key;
    }
    setParams(... params){
        this.params = params;
        this.updateLabel(false);
    }
    updateLabel (b = true) {
        this.lazyInit();
        if (typeof this.localizedString == 'undefined') {
            
        } else{
            
            this.label && (this.label.string = this.localizedString);
	        b && this.onUpdateOriginText();
        }
        this.updateFont();
    }

    forceUpdateRenderData(){
        this.lazyInit();
        this.label && (this.label.string = '');
        this.updateLabel();
        // @ts-ignore
        this.label._forceUpdateRenderData && this.label._forceUpdateRenderData();
    }

    getKey() {
       return this.key;
    }
    getLocalizedOriginText() {
        let text = this._key ? i18n.t(this._key) : '';
        return text;
    }
    updateParamsByLabelEntity(params: any[]){
        this.params = [... params];
    }
    async updateFont(){
        let pack = i18n.getFontPack();
        if(!pack){
            return;
        }
        if(this.font === pack.font){
            return;
        }
        this.font = pack.font;
        let font = await engine.loader.load(pack.font,pack.type,null,pack.bundle || cc.resources);
        this.label.font = font;
    }
}
