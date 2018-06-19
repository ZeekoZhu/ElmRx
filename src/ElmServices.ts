import { Observable, BehaviorSubject } from "rxjs";
import { ElmArch, ElmRxUpdateResult } from "./ElmRx";
import { ElmRxMsg } from "./ElmRxMsg";
/**
 * For Angular application, use this service to drive your components.
 * 
 * @export
 * @abstract
 * @class ElmArchService
 * @template TModel 
 * @template TMsgType
 */
export abstract class ElmArchService<TModel, TMsgType extends ElmRxMsg<string, any>> {
    public model$: Observable<TModel>;
    protected readonly arch = new ElmArch<TModel, TMsgType>();
    protected abstract update(): (model: TModel, msg: TMsgType) => ElmRxUpdateResult<TModel>;
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
