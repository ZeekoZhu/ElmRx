import { ElmArch } from './ElmRx';
import { ExpandOperator } from 'rxjs/internal/operators/expand';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

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
        const testArch = new ElmArch<TestModel, Msg>();
        this.testArch = testArch;
        const update = () => {
            const caseOf = testArch.caseOf;
            return [
                caseOf(MsgA, (model, msg) => {
                    return { ...model, a: msg.payload };
                }),
                caseOf(MsgB, (model, msg) => {
                    if (+msg.payload !== NaN) {
                        testArch.sendAsync(new MsgA(+msg.payload));
                    }
                    return { ...model, b: msg.payload };
                }),
                caseOf(MsgC, (model, msg) => {
                    return { ...model, c: msg.payload };
                })
            ];
        }
        this.$app = this.testArch.begin(initModel, update(), true);
        this.models = [];
        this.$app.subscribe(m => {
            this.models.push(m);
        });
    });

    it('should have one state', function () {
        expect(this.models[0]).toBe(initModel);
    });

    it('should have changed model.a', function (done) {
        this.testArch.send(new MsgA(2333));
        setTimeout(() => {
            expect(this.models[1].a).toBe(2333);
            done();
        }, 10);
    });

    it('should have 3 messages init, B and A', function (done) {
        this.testArch.send(new MsgB('2333'));
        setTimeout(() => {
            console.log(this.models);
            expect(this.models[1].b).toBe('2333');
            expect(this.models[2].a).toBe(2333);
            done();
        }, 10);
    })
});
