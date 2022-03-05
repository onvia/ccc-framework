
const {ccclass, property} = cc._decorator;

@ccclass
export abstract class VMI18NLabelAdapter extends cc.Component {

    vmLabelEntity: any;

    /** 获取 key */ 
    abstract getKey();

    /** 获取本地化 原始文本 */
    abstract getLocalizedOriginText();

    
    protected onUpdateOriginText(){
        this.vmLabelEntity && this.vmLabelEntity.changeOriginText(this.getLocalizedOriginText());
    }

    public abstract updateParamsByLabelEntity(params: any[]);
}
