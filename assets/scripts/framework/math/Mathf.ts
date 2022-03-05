export class Mathf{
    private seed = 51;
    
    public setRandomSeed(seed){
        this.seed = seed;
    }
    public seedRandom(max = 1, min = 0) {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        let rnd = this.seed / 233280.0;
        return min + rnd * (max - min);
    }

    
    public randomInt(min: number, max?: number) {
        switch (arguments.length) {
            case 1:
                return parseInt((Math.random() * (min + 1)) + "", 10);
            case 2:
                return parseInt((Math.random() * (max - min + 1) + min) + "", 10);
            default:
                return 0;
        }
    }
    
    public randomFloat(min: number, max?: number) {
        switch (arguments.length) {
            case 1:
                return Math.random() * (min + 1);
            case 2:
                return Math.random() * (max - min) + min;
            default:
                return 0;
        }
    }

    public  uuid() {
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    /** 计算数据大小 */
    public  mbStringLength(s)   {
        var totalLength = 0;
        var i;
        var charCode;
        for (i = 0; i < s.length; i++) {
            charCode = s.charCodeAt(i);
            if (charCode < 0x007f) {
            totalLength = totalLength + 1;
            } else if ((0x0080 <= charCode) && (charCode <= 0x07ff)) {
            totalLength += 2;
            } else if ((0x0800 <= charCode) && (charCode <= 0xffff)) {
            totalLength += 3;
            }
        }
        return totalLength;
    }  

    private static _instance:Mathf = null
    public static getInstance(): Mathf{
        if(!this._instance){
            this._instance = new Mathf();
        }
        return this._instance;
    }
}