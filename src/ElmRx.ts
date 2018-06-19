import { BehaviorSubject, Subject } from 'rxjs';
import { scan, tap } from 'rxjs/operators';
import { ElmRxMsg } from './ElmRxMsg';

export type ElmRxUpdateResult<TModel> = TModel | [TModel, ElmRxMsg<string, any>] | ElmRxCmd<TModel>;
export type ElmRxCmd<TState> = [TState, Promise<ElmRxMsg<string, any>>];

export class ElmArch<TModel, TMsgUnion extends ElmRxMsg<string, any>> {
    private readonly $msg = new Subject<TMsgUnion>();
    private $model: BehaviorSubject<TModel>;
    private accumulator: (acc: ElmRxUpdateResult<TModel>, msg: TMsgUnion) => ElmRxUpdateResult<TModel>;

    begin = (initState: TModel, update: (model: TModel, msg: TMsgUnion) => ElmRxUpdateResult<TModel>, debug = false) => {
        this.accumulator = (acc: ElmRxUpdateResult<TModel>, msg: TMsgUnion) => {
            if (this.isSyncCmd(acc) || this.isAsyncCmd(acc)) {
                return update(acc[0], msg);
            }
            return update(acc, msg);
        }
        return this.start(initState, debug);
    }

    private start = (initState: TModel, debug = false) => {
        this.$model = new BehaviorSubject<TModel>(initState);
        this.$msg.pipe(
            tap(m => {
                if (debug) {
                    console.log('%cMessage', 'color:blue', m);
                }
            }),
            scan(this.accumulator, initState),
            tap((result: ElmRxUpdateResult<TModel>) => {
                if (debug) {
                    if (result instanceof Array) {
                        console.log('%cState %O %cCmds %O', 'color:green', result[0], 'color:darkcyan', result[1]);
                    } else {
                        console.log('%cState', 'color:green', result);
                    }
                }
            })
        )
            .subscribe((updateResult: ElmRxUpdateResult<TModel>) => {
                if (this.isAsyncCmd(updateResult)) {
                    const [model, msg] = updateResult;
                    this.$model.next(model);
                    msg.then(m => this.$msg.next(m as TMsgUnion));
                } else if (this.isSyncCmd(updateResult)) {
                    const [model, msg] = updateResult;
                    this.$model.next(model);
                    this.$msg.next(msg as TMsgUnion);
                } else {
                    this.$model.next(updateResult);
                }
            });
        return this.$model;
    }

    isSyncCmd = (result: ElmRxUpdateResult<TModel>): result is [TModel, ElmRxMsg<string, any>] => {
        return result[1] !== undefined && result[1].type !== undefined
    }

    isAsyncCmd = (result: ElmRxUpdateResult<TModel>): result is [TModel, Promise<ElmRxMsg<string, any>>] => {
        return result[1] !== undefined && result[1].then !== undefined;
    }

    stop = () => {
        this.$msg.complete();
        this.$model.complete();
    }

    /**
     * Dispatch a new msg synchronously
     * 
     * @param {TMsgUnion} msg 
     * @memberof ElmArch
     */
    send(msg: TMsgUnion) {
        this.$msg.next(msg);
    }
}
