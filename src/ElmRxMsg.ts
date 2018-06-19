export type ElmRxMsgCtor<T extends string, TPayload> = {
    new(payload: TPayload): ElmRxMsg<T, TPayload>;
}

export abstract class ElmRxMsg<T extends string, TPayload> {
    type: T;
    payload: TPayload;
}

export const msgOf = <T extends string>(type: T) => <TPayload>(): ElmRxMsgCtor<T, TPayload> => {
    return class {
        readonly type = type;
        static readonly type;
        constructor(public payload: TPayload) {
        }
    }
}
