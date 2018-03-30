"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BehaviorSubject_1 = require("rxjs/BehaviorSubject");
var Subject_1 = require("rxjs/Subject");
var operators_1 = require("rxjs/operators");
var ElmArch = /** @class */ (function () {
    function ElmArch() {
        this.$msg = new Subject_1.Subject();
    }
    /**
     * Pattern matching syntax
     * @template TMsg
     * @param {new (...args: any[]) => TMsg} type constructor of Msg
     * @param {(acc: TModel, msg: TMsg, $msg: Subject<TMsgType>) => ElmRxUpdateResult<TModel, TMsgType>} reducer method to compute new state
     * @returns {ElmRxPattern<TMsg, TModel, TMsgType>}
     * @memberof ElmArch
     */
    ElmArch.prototype.caseOf = function (type, reducer) {
        return [type, reducer];
    };
    /**
     * Generate a result of a new state with a sets of msgs, these msgs will be published after new state is published
     * @param {TModel} newModel
     * @param {...TMsgType[]} msgs
     * @returns {ElmRxUpdateResult<TModel, TMsgType>}
     * @memberof ElmArch
     */
    ElmArch.prototype.nextWithCmds = function (newModel) {
        var msgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            msgs[_i - 1] = arguments[_i];
        }
        if (arguments.length === 1) {
            return newModel;
        }
        else {
            return [newModel, msgs];
        }
    };
    ElmArch.prototype.matchWith = function ($msg, patterns) {
        return function (acc, msg) {
            var model = acc instanceof Array ? acc[0] : acc;
            for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
                var it = patterns_1[_i];
                if (msg instanceof it[0]) {
                    return it[1](model, msg, $msg);
                }
            }
            throw new Error('Invalid Message Type');
        };
    };
    ElmArch.prototype.begin = function (initState, patterns, debug) {
        var _this = this;
        if (debug === void 0) { debug = false; }
        var $res = new BehaviorSubject_1.BehaviorSubject(initState);
        this.$msg.pipe(operators_1.tap(function (m) {
            if (debug) {
                console.log('%cMessage', 'color:blue', m);
            }
        }), operators_1.scan(this.matchWith(this.$msg, patterns), initState), operators_1.tap(function (result) {
            if (debug) {
                if (result instanceof Array) {
                    console.log('%cState %O %cCmds %O', 'color:green', result[0], 'color:darkcyan', result[1]);
                }
                else {
                    console.log('%cState', 'color:green', result);
                }
            }
        }))
            .subscribe(function (updateResult) {
            if (updateResult instanceof Array) {
                var model = updateResult[0], msgs = updateResult[1];
                $res.next(model);
                msgs.forEach(function (m) { return _this.$msg.next(m); });
            }
            else {
                $res.next(updateResult);
            }
        });
        return $res;
    };
    ElmArch.prototype.send = function (msg) {
        this.$msg.next(msg);
    };
    return ElmArch;
}());
exports.ElmArch = ElmArch;
var ElmArchService = /** @class */ (function () {
    function ElmArchService(debug) {
        if (debug === void 0) { debug = false; }
        this.arch = new ElmArch();
        this.model$ = this.arch.begin(this.initModel(), this.update(), debug);
    }
    Object.defineProperty(ElmArchService.prototype, "model", {
        get: function () {
            return this.model$.value;
        },
        enumerable: true,
        configurable: true
    });
    ElmArchService.prototype.send = function (msg) {
        this.arch.send(msg);
    };
    return ElmArchService;
}());
exports.ElmArchService = ElmArchService;
