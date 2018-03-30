import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { tap, scan } from 'rxjs/operators';

export type ElmRxUpdateResult<TState, TMsgType> = TState | [TState, TMsgType[]];
export type ElmRxPattern<TMsg, TState, TMsgType> =
    [new (...args: any[]) => TMsg, (acc: TState, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TState, TMsgType>];

export class ElmArch<TState, TMsgType> {
    private readonly $msg = new Subject<TMsgType>();
    /**
     * Pattern matching syntax
     * @template TMsg
     * @param {new (...args: any[]) => TMsg} type constructor of Msg
     * @param {(acc: TState, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TState, TMsgType>} reducer method to compute new state
     * @returns {ElmRxPattern<TMsg, TState, TMsgType>}
     * @memberof ElmArch
     */
    caseOf<TMsg>(
        type: new (...args: any[]) => TMsg,
        reducer: (acc: TState, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TState, TMsgType>)
        : ElmRxPattern<TMsg, TState, TMsgType> {
        return [type, reducer];
    }
    /**
     * Generate a result of a new state with a sets of msgs, these msgs will be published after new state is published
     * @param {TState} newState
     * @param {...TMsgType[]} msgs
     * @returns {ElmRxUpdateResult<TState, TMsgType>}
     * @memberof ElmArch
     */
    nextWithCmds(newState: TState, ...msgs: TMsgType[]): ElmRxUpdateResult<TState, TMsgType> {
        if (arguments.length === 1) {
            return newState;
        } else {
            return [newState, msgs];
        }
    }
    matchWith<TMsg>($msg: Subject<TMsgType>, patterns: ElmRxPattern<TMsg, TState, TMsgType>[]) {
        return (acc: ElmRxUpdateResult<TState, TMsgType>, msg: TMsg) => {
            const state = acc instanceof Array ? acc[0] : acc;
            for (const it of patterns) {
                if (msg instanceof it[0]) {
                    return it[1](state, msg, $msg);
                }
            }
            throw new Error('Invalid Message Type');
        };
    }

    begin(initState: TState, patterns: ElmRxPattern<any, TState, TMsgType>[], debug = false) {
        const $res = new BehaviorSubject<TState>(initState);
        this.$msg.pipe(
            tap(m => {
                if (debug) {
                    console.log('%cMessage', 'color:blue', m);
                }
            }),
            scan(this.matchWith(this.$msg, patterns), initState),
            tap((s: ElmRxUpdateResult<TState, TMsgType>) => {
                if (debug) {
                    if (s instanceof Array) {
                        console.log('%cState %O %cCmds %O', 'color:green', s[0], 'color:darkcyan', s[1]);
                    } else {
                        console.log('%cState', 'color:green', s);
                    }
                }
            })
        )
            .subscribe((s: ElmRxUpdateResult<TState, TMsgType>) => {
                if (s instanceof Array) {
                    const [state, msgs] = s;
                    $res.next(state);
                    msgs.forEach(m => this.$msg.next(m));
                } else {
                    $res.next(s);
                }
            });
        return $res;
    }

    send(msg: TMsgType) {
        this.$msg.next(msg);
    }
}

export abstract class ElmArchService<TModel, TMsgType> {
    public state$: Observable<TModel>;
    protected readonly arch = new ElmArch<TModel, TMsgType>();
    abstract update(): ElmRxPattern<any, TModel, TMsgType>[];
    protected abstract initState(): TModel;
    public get state() {
        return (this.state$ as BehaviorSubject<TModel>).value;
    }


    send(msg: TMsgType) {
        this.arch.send(msg);
    }

    constructor(debug = false) {
        this.state$ = this.arch.begin(this.initState(), this.update(), debug);
    }
}
