import { BehaviorSubject, Subject } from 'rxjs';
import { scan, tap } from 'rxjs/operators';

export type ElmRxUpdateResult<TState, TMsgType> = TState | [TState, TMsgType[]] | ElmRxCmd<TState, TMsgType>;
export type ElmRxPattern<TMsg, TState, TMsgType> =
    [new (...args: any[]) => TMsg, (acc: TState, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TState, TMsgType>];
export type ElmRxCmd<TState, TMsgType> = [TState, Promise<TMsgType>];
export class ElmArch<TModel, TMsgType> {
    private readonly $msg = new Subject<TMsgType>();
    private $model: BehaviorSubject<TModel>;
    private accumulator: (acc: ElmRxUpdateResult<TModel, TMsgType>, msg: any) => ElmRxUpdateResult<TModel, TMsgType>;
    /**
     * Pattern matching syntax
     * @template TMsg
     * @param {new (...args: any[]) => TMsg} type constructor of Msg
     * @param {(acc: TModel, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TModel, TMsgType>} reducer method to compute new state
     * @returns {ElmRxPattern<TMsg, TModel, TMsgType>}
     * @memberof ElmArch
     */
    caseOf = <TMsg>(
        type: new (...args: any[]) => TMsg,
        reducer: (acc: TModel, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TModel, TMsgType>)
        : ElmRxPattern<TMsg, TModel, TMsgType> => {
        return [type, reducer];
    }
    /**
     * ***Deprecated: Use sendAsync instead*** Generate a result of a new state with a sets of msgs, these msgs will be published after new state is published
     * @param {TModel} newModel
     * @param {...TMsgType[]} msgs
     * @returns {ElmRxUpdateResult<TModel, TMsgType>}
     * @memberof ElmArch
     */
    nextWithCmds = (newModel: TModel, ...msgs: TMsgType[]): ElmRxUpdateResult<TModel, TMsgType> => {
        if (msgs === undefined || msgs === null) {
            return newModel;
        } else {
            return [newModel, msgs];
        }
    }

    /**
     * ***Deprecated: Use sendAsync instead*** Generate a result of a new state with a sets of msgs, these msgs will be published after new state is published
     * @param {TModel} newModel
     * @param {...TMsgType[]} msgs
     * @returns {ElmRxUpdateResult<TModel, TMsgType>}
     * @memberof ElmArch
     */
    nextWith = (newModel: TModel, msgs?: TMsgType[] | Promise<TMsgType>): ElmRxUpdateResult<TModel, TMsgType> => {
        if (msgs === undefined || msgs === null) {
            return newModel;
        } else {
            return [newModel, msgs as any];
        }
    }

    private matchWith = <TMsg>($msg: Subject<TMsgType>, patterns: ElmRxPattern<TMsg, TModel, TMsgType>[]) => {
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

    begin = (initState: TModel, patterns: ElmRxPattern<any, TModel, TMsgType>[], debug = false) => {
        this.$model = new BehaviorSubject<TModel>(initState);
        this.accumulator = this.matchWith(this.$msg, patterns);
        this.$msg.pipe(
            tap(m => {
                if (debug) {
                    console.log('%cMessage', 'color:blue', m);
                }
            }),
            scan(this.accumulator, initState),
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
                    this.$model.next(model);
                    if (msgs instanceof Array) {
                        msgs.forEach(m => this.$msg.next(m));
                    } else {
                        msgs.then(m => this.$msg.next(m));
                    }
                } else {
                    this.$model.next(updateResult);
                }
            });
        return this.$model;
    }

    stop = () => {
        this.$msg.complete();
        this.$model.complete();
    }

    compute = (model: TModel, msg: TMsgType) => {
        return this.accumulator(model, msg);
    }

    /**
     * Dispatch a new msg synchronously
     * 
     * @param {TMsgType} msg 
     * @memberof ElmArch
     */
    send(msg: TMsgType) {
        this.$msg.next(msg);
    }

    /**
     * Dispatch a new msg when you are in update methods
     * 
     * @deprecated
     * @param {TMsgType} msg 
     * @memberof ElmArch
     */
    sendAsync(msg: TMsgType) {
        Promise.resolve().then(() => this.send(msg));
    }
}
