
declare global{
    interface IServices{
        
        startService<T extends IService>(service: T): T;

        stopService(service: IService | string | number): void;

        get<T extends IService>(service: Constructor<T> | string | number):T;

        has<T extends IService>(service: Constructor<T> | string | number): boolean;

        all(): IService[];
    }
}

export class Services implements IServices{
   
    private serviceArray: IService[] = [];
    private sid: number = 0;


    all(): IService[] {
        return this.serviceArray;
    }
    
    startService<T extends IService>(service: T): T{
        service.serviceId = ++this.sid;
        if(!service.name){
            throw new RangeError(
                `[Services] IService '${service}' not set name by @ecclass`
            )
        }
        service.services = this;
        service.onCreate();
        this.serviceArray.push(service);
        return service;
    }

    stopService(service: IService | string | number){
        let isNumber = typeof service === 'number';
        let isString = typeof service === 'string';
        let serviceArray = this.serviceArray;
        let services = serviceArray.filter((_service)=>{
            if(isNumber){
                return _service.serviceId === service;
            }else if(isString){
                return _service.name === service;
            }else{
                return _service === service;
            }
        });

        
        services.forEach((_service)=>{
            _service.onDispose();
            var index = serviceArray.indexOf(_service);
            if (index > -1) {
                serviceArray.splice(index, 1);
            }
            _service = null;
        });
    }

    get<T extends IService>(service: Constructor<T> | string | number): T{
        let isNumber = typeof service === 'number';
        let isString = typeof service === 'string';
        let serviceArray = this.serviceArray;
        let _service = serviceArray.find((_service)=>{
            if(isNumber){
                return _service.serviceId === service;
            }else if(isString){
                return _service.name === service;
            }else if(typeof service === 'function'){
                return _service.name === service.name;
            }
            
        });
        if(!_service){
            console.error(`Services->服务 [${service}] 不存在`);
        }
        return _service as T;
    }

    has<T extends IService>(service: Constructor<T> | string | number): boolean{
       return !!this.get(service);
    }

    private static instance: Services = null;
    public static getInstance(): Services {
        if (!this.instance) {
            this.instance = new Services();
        }
       return this.instance;
    }
}