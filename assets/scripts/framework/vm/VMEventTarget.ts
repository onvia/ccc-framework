
class VMEventTarget extends cc.EventTarget{

    public log(){
        console.log('VMEventTarget-> ');        
    }


    private static instance: VMEventTarget = null;
    public static getInstance(): VMEventTarget {
        if (!this.instance) {
            this.instance = new VMEventTarget();
        }
       return this.instance;
    }
}

export let vmevent = VMEventTarget.getInstance();