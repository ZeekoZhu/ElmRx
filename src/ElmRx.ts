import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { tap, scan } from 'rxjs/operators';

export type ElmRxUpdateResult<TState, TMsgType> = TState | [TState, TMsgType[]];
export type ElmRxPattern<TMsg, TState, TMsgType> =
    [new (...args: any[]) => TMsg, (acc: TState, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TState, TMsgType>];

export class ElmArch<TModel, TMsgType> {
    private readonly $msg = new Subject<TMsgType>();
    /**
     * Pattern matching syntax
     * @template TMsg
     * @param {new (...args: any[]) => TMsg} type constructor of Msg
     * @param {(acc: TModel, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TModel, TMsgType>} reducer method to compute new state
     * @returns {ElmRxPattern<TMsg, TModel, TMsgType>}
     * @memberof ElmArch
     */
    caseOf<TMsg>(
        type: new (...args: any[]) => TMsg,
        reducer: (acc: TModel, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TModel, TMsgType>)
        : ElmRxPattern<TMsg, TModel, TMsgType> {
        return [type, reducer];
    }
    /**
     * Generate a result of a new state with a sets of msgs, these msgs will be published after new state is published
     * @param {TModel} newModel
     * @param {...TMsgType[]} msgs
     * @returns {ElmRxUpdateResult<TModel, TMsgType>}
     * @memberof ElmArch
     */
    nextWithCmds(newModel: TModel, ...msgs: TMsgType[]): ElmRxUpdateResult<TModel, TMsgType> {
        if (arguments.length === 1) {
            return newModel;
        } else {
            return [newModel, msgs];
        }
    }
    matchWith<TMsg>($msg: Subject<TMsgType>, patterns: ElmRxPattern<TMsg, TModel, TMsgType>[]) {
        return (acc: ElmRxUpdateResult<TModel, TMsgType>, msg: TMsg) => {
            const model = acc instanceof Array ? acc[0] : acc;
            for (const it of patterns) {
                if (msg instanceof it[0]) {
                    return it[1](model, msg, $msg);
                }
            }
            throw new Error('Invalid Message Type');
        };
    }

    begin(initState: TModel, patterns: ElmRxPattern<any, TModel, TMsgType>[], debug = false) {
        const $res = new BehaviorSubject<TModel>(initState);
        this.$msg.pipe(
            tap(m => {
                if (debug) {
                    console.log('%cMessage', 'color:blue', m);
                }
            }),
            scan(this.matchWith(this.$msg, patterns), initState),
            tap((result: ElmRxUpdateResult<TModel, TMsgType>) => {
                if (debug) {
                    if (result instanceof Array) {
                        console.log('%cState %O %cCmds %O', 'color:green', result[0], 'color:darkcyan', result[1]);
                    } else {
                        console.log('%cState', 'color:green', result);
                    }
                }
            })
        )
            .subscribe((updateResult: ElmRxUpdateResult<TModel, TMsgType>) => {
                if (updateResult instanceof Array) {
                    const [model, msgs] = updateResult;
                    $res.next(model);
                    msgs.forEach(m => this.$msg.next(m));
                } else {
                    $res.next(updateResult);
                }
            });
        return $res;
    }

    send(msg: TMsgType) {
        this.$msg.next(msg);
    }
}

export abstract class ElmArchService<TModel, TMsgType> {
    public model$: Observable<TModel>;
    protected readonly arch = new ElmArch<TModel, TMsgType>();
    abstract update(): ElmRxPattern<any, TModel, TMsgType>[];
    protected abstract initModel(): TModel;
    public get model() {
        return (this.model$ as BehaviorSubject<TModel>).value;
    }


    send(msg: TMsgType) {
        this.arch.send(msg);
    }

    constructor(debug = false) {
        this.model$ = this.arch.begin(this.initModel(), this.update(), debug);
    }
}
