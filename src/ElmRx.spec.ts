import { ElmArch } from './ElmRx';

class MsgA {
    constructor(public payload: number) { }
}

class MsgB {
    constructor(public payload: string) { }
}

class MsgC {
    constructor(public payload: boolean) { }
}

type Msg = MsgA | MsgB | MsgC;

interface TestModel {
    a: number;
    b: string;
    c: boolean;
}

const initModel: TestModel = {
    a: 0,
    b: '',
    c: false
}

describe('sequence test', function () {
    beforeEach(function () {
        this.testArch = new ElmArch<TestModel, Msg>();
        const update = () => {
            const caseOf = this.testArch.caseOf;
            return [
                caseOf(MsgA, (model, msg) => {
                    return { ...model, a: msg.payload };
                }),
                caseOf(MsgB, (model, msg) => {
                    return { ...model, b: msg.payload };
                }),
                caseOf(MsgC, (model, msg) => {
                    return { ...model, c: msg.payload };
                })
            ];
        }
        this.$app = this.testArch.begin(initModel, update());
        this.models = [];
        this.$app.subscribe(m => {
            this.models.push(m);
        });
    });

    it('should have one state', function () {
        expect(this.models.length).toBe(1);
    });

    it('should have changed model.a', function (done) {
        this.testArch.send(new MsgA(2333));
        setTimeout(() => {
            expect(this.$app.value.a).toBe(2333);
            done();
        }, 10);
    })
});
