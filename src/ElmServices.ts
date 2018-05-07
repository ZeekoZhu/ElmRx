import { Observable, BehaviorSubject } from "rxjs";
import { ElmArch, ElmRxPattern } from "./ElmRx";
/**
 * For Angular application, use this service to drive your components.
 * 
 * @export
 * @abstract
 * @class ElmArchService
 * @template TModel 
 * @template TMsgType 
 */
export abstract class ElmArchService<TModel, TMsgType> {
    public model$: Observable<TModel>;
    protected readonly arch = new ElmArch<TModel, TMsgType>();
    protected abstract update(): ElmRxPattern<any, TModel, TMsgType>[];
    protected abstract initModel(): TModel;
    public get model() {
        return (this.model$ as BehaviorSubject<TModel>).value;
    }


    send(msg: TMsgType) {
        this.arch.send(msg);
    }

    destroy() {
        this.arch.stop();
    }

    constructor(debug = false) {
        this.model$ = this.arch.begin(this.initModel(), this.update(), debug);
    }
}
