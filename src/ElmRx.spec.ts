import { ElmArch, ElmRxUpdateResult } from './ElmRx';
import { msgOf, ElmRxMsg } from './ElmRxMsg';

function assertNever(x: never): never {
    throw new Error("Unexpected object: " + x);
}



class MsgA extends msgOf('A')<number>() { }

class MsgB extends msgOf('B')<string>() { }

class MsgC extends msgOf('C')<boolean>() { }

class MsgD extends msgOf('D')<{ foo: number }>() { }

type Msg = MsgA | MsgB | MsgC | MsgD;

interface TestModel {
    a: number;
    b: string;
    c: boolean;
    d: number;
}

const initModel: TestModel = {
    a: 0,
    b: '',
    c: false,
    d: 0
}

describe('sequence test', function () {
    beforeEach(function () {
        const testArch = new ElmArch<TestModel, Msg>();
        this.testArch = testArch;
        const update = (model: TestModel, msg: Msg): ElmRxUpdateResult<TestModel> => {
            switch (msg.type) {
                case 'A':
                    return { ...model, a: msg.payload };
                case 'B':
                    const newModel = { ...model, b: msg.payload };
                    if (isNaN(+msg.payload) === false) {
                        return [newModel, new MsgA(+msg.payload)]
                    }
                    return newModel;
                case 'C':
                    return [{ ...model, c: msg.payload }, Promise.resolve(new MsgB('promise'))];
                case 'D':
                    return update({ ...model, d: msg.payload.foo }, new MsgA(2333));
                default:
                    return assertNever(msg);
            }
        }
        this.$app = testArch.begin(initModel, update, false);
        this.models = [];
        this.$app.subscribe(m => {
            this.models.push(m);
        });
    });

    it('should have one initial state', function () {
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
            expect(this.models[1].b).toBe('2333');
            expect(this.models[2].a).toBe(2333);
            done();
        }, 10);
    });

    it('should have 3 messages init, C(false) and B(promise)', function (done) {
        this.testArch.send(new MsgC(true));
        setTimeout(() => {
            expect(this.models[1].c).toBe(true);
            expect(this.models[2].b).toBe('promise');
            done();
        }, 10);
    });

    it('should have 2 messages init, D({foo:111})', function (done) {
        this.testArch.send(new MsgD({ foo: 111 }));
        setTimeout(() => {
            expect(this.models[1].d).toBe(111);
            expect(this.models[1].a).toBe(2333);
            done();
        }, 10);
    })
});
