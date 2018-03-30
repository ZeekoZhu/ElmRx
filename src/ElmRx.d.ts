import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
export declare type ElmRxUpdateResult<TState, TMsgType> = TState | [TState, TMsgType[]];
export declare type ElmRxPattern<TMsg, TState, TMsgType> = [new (...args: any[]) => TMsg, (acc: TState, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TState, TMsgType>];
export declare class ElmArch<TModel, TMsgType> {
    private readonly $msg;
    /**
     * Pattern matching syntax
     * @template TMsg
     * @param {new (...args: any[]) => TMsg} type constructor of Msg
     * @param {(acc: TModel, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TModel, TMsgType>} reducer method to compute new state
     * @returns {ElmRxPattern<TMsg, TModel, TMsgType>}
     * @memberof ElmArch
     */
    caseOf<TMsg>(type: new (...args: any[]) => TMsg, reducer: (acc: TModel, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TModel, TMsgType>): ElmRxPattern<TMsg, TModel, TMsgType>;
    /**
     * Generate a result of a new state with a sets of msgs, these msgs will be published after new state is published
     * @param {TModel} newModel
     * @param {...TMsgType[]} msgs
     * @returns {ElmRxUpdateResult<TModel, TMsgType>}
     * @memberof ElmArch
     */
    nextWithCmds(newModel: TModel, ...msgs: TMsgType[]): ElmRxUpdateResult<TModel, TMsgType>;
    matchWith<TMsg>($msg: Subject<TMsgType>, patterns: ElmRxPattern<TMsg, TModel, TMsgType>[]): (acc: ElmRxUpdateResult<TModel, TMsgType>, msg: TMsg) => ElmRxUpdateResult<TModel, TMsgType>;
    begin(initState: TModel, patterns: ElmRxPattern<any, TModel, TMsgType>[], debug?: boolean): BehaviorSubject<TModel>;
    send(msg: TMsgType): void;
}
export declare abstract class ElmArchService<TModel, TMsgType> {
    model$: Observable<TModel>;
    protected readonly arch: ElmArch<TModel, TMsgType>;
    abstract update(): ElmRxPattern<any, TModel, TMsgType>[];
    protected abstract initModel(): TModel;
    readonly model: TModel;
    send(msg: TMsgType): void;
    constructor(debug?: boolean);
}
