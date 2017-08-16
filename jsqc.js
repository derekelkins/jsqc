var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var setImmediate = window.setImmediate || (function (f) { window.setTimeout(f, 0); });
    var RandGen = (function () {
        function RandGen(seed) {
            this.input = new Uint32Array(16);
            this.input[0] = 0x61707865;
            this.input[1] = 0x3320646e;
            this.input[2] = 0x79622d32;
            this.input[3] = 0x6b206574;
            this.input[4] = seed[0];
            this.input[5] = seed[1];
            this.input[6] = seed[2];
            this.input[7] = seed[3];
            this.input[8] = seed[4];
            this.input[9] = seed[5];
            this.input[10] = seed[6];
            this.input[11] = seed[7];
            this.input[12] = 0;
            this.input[13] = 0;
            this.input[14] = seed[8];
            this.input[15] = seed[9];
            this.workingSpace = new Uint32Array(16);
            this.offset = 16;
        }
        RandGen.prototype.getSeed = function () {
            var s = new Uint32Array(10);
            s[0] = this.input[4];
            s[1] = this.input[5];
            s[2] = this.input[6];
            s[3] = this.input[7];
            s[4] = this.input[8];
            s[5] = this.input[9];
            s[6] = this.input[10];
            s[7] = this.input[11];
            s[8] = this.input[14];
            s[9] = this.input[15];
            return s;
        };
        RandGen.rol = function (x, n) {
            return (x << n) ^ (x >>> (32 - n));
        };
        RandGen.twoRounds = function (x) {
            x[0] += x[4];
            x[12] = RandGen.rol(x[0] ^ x[12], 16);
            x[8] += x[12];
            x[4] = RandGen.rol(x[8] ^ x[4], 12);
            x[0] += x[4];
            x[12] = RandGen.rol(x[0] ^ x[12], 8);
            x[8] += x[12];
            x[4] = RandGen.rol(x[8] ^ x[4], 7);
            x[1] += x[5];
            x[13] = RandGen.rol(x[1] ^ x[13], 16);
            x[9] += x[13];
            x[5] = RandGen.rol(x[9] ^ x[5], 12);
            x[1] += x[5];
            x[13] = RandGen.rol(x[1] ^ x[13], 8);
            x[9] += x[13];
            x[5] = RandGen.rol(x[9] ^ x[5], 7);
            x[2] += x[6];
            x[14] = RandGen.rol(x[2] ^ x[14], 16);
            x[10] += x[14];
            x[6] = RandGen.rol(x[10] ^ x[6], 12);
            x[2] += x[6];
            x[14] = RandGen.rol(x[2] ^ x[14], 8);
            x[10] += x[14];
            x[6] = RandGen.rol(x[10] ^ x[6], 7);
            x[3] += x[7];
            x[15] = RandGen.rol(x[3] ^ x[15], 16);
            x[11] += x[15];
            x[7] = RandGen.rol(x[11] ^ x[7], 12);
            x[3] += x[7];
            x[15] = RandGen.rol(x[3] ^ x[15], 8);
            x[11] += x[15];
            x[7] = RandGen.rol(x[11] ^ x[7], 7);
            x[0] += x[5];
            x[15] = RandGen.rol(x[0] ^ x[15], 16);
            x[10] += x[15];
            x[5] = RandGen.rol(x[10] ^ x[5], 12);
            x[0] += x[5];
            x[15] = RandGen.rol(x[0] ^ x[15], 8);
            x[10] += x[15];
            x[5] = RandGen.rol(x[10] ^ x[5], 7);
            x[1] += x[6];
            x[12] = RandGen.rol(x[1] ^ x[12], 16);
            x[11] += x[12];
            x[6] = RandGen.rol(x[11] ^ x[6], 12);
            x[1] += x[6];
            x[12] = RandGen.rol(x[1] ^ x[12], 8);
            x[11] += x[12];
            x[6] = RandGen.rol(x[11] ^ x[6], 7);
            x[2] += x[7];
            x[13] = RandGen.rol(x[2] ^ x[13], 16);
            x[8] += x[13];
            x[7] = RandGen.rol(x[8] ^ x[7], 12);
            x[2] += x[7];
            x[13] = RandGen.rol(x[2] ^ x[13], 8);
            x[8] += x[13];
            x[7] = RandGen.rol(x[8] ^ x[7], 7);
            x[3] += x[4];
            x[14] = RandGen.rol(x[3] ^ x[14], 16);
            x[9] += x[14];
            x[4] = RandGen.rol(x[9] ^ x[4], 12);
            x[3] += x[4];
            x[14] = RandGen.rol(x[3] ^ x[14], 8);
            x[9] += x[14];
            x[4] = RandGen.rol(x[9] ^ x[4], 7);
        };
        RandGen.prototype.step = function () {
            var x = this.workingSpace;
            x.set(this.input);
            RandGen.twoRounds(x);
            RandGen.twoRounds(x);
            RandGen.twoRounds(x);
            RandGen.twoRounds(x);
            x[0] += this.input[0];
            x[1] += this.input[1];
            x[2] += this.input[2];
            x[3] += this.input[3];
            x[4] += this.input[4];
            x[5] += this.input[5];
            x[6] += this.input[6];
            x[7] += this.input[7];
            x[8] += this.input[8];
            x[9] += this.input[9];
            x[10] += this.input[10];
            x[11] += this.input[11];
            x[12] += this.input[12];
            x[13] += this.input[13];
            x[14] += this.input[14];
            x[15] += this.input[15];
            this.input[8] = (this.input[8] + 1) >>> 0;
            this.input[9] += 1 >>> this.input[8];
        };
        RandGen.prototype.randomUint = function () {
            if (this.offset >= 16) {
                this.offset = 0;
                this.step();
            }
            return this.workingSpace[this.offset++] >>> 0;
        };
        RandGen.prototype.randomInt = function () {
            if (this.offset >= 16) {
                this.offset = 0;
                this.step();
            }
            return this.workingSpace[this.offset++] >> 0;
        };
        RandGen.prototype.randomClosed = function () {
            if (this.offset >= 16) {
                this.offset = 0;
                this.step();
            }
            return (this.workingSpace[this.offset++] >>> 0) * 2.3283064370807974e-10;
        };
        RandGen.prototype.random = function () {
            if (this.offset >= 16) {
                this.offset = 0;
                this.step();
            }
            return (this.workingSpace[this.offset++] >>> 0) * 2.3283064365386963e-10;
        };
        RandGen.prototype.split = function (tweak) {
            var rng = new RandGen(this.input);
            rng.input[15] = tweak >>> 0;
            return rng;
        };
        return RandGen;
    }());
    exports.RandGen = RandGen;
    exports.StdRandGen = new RandGen(new Uint32Array([new Date().getTime() >>> 0, new Date().getFullYear() >>> 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    var StateStream = (function () {
        function StateStream(seed, step) {
            this.seed = seed;
            this.step = step;
        }
        StateStream.prototype.isEmpty = function () {
            if (this._isEmpty === undefined) {
                this._step();
            }
            return this._isEmpty;
        };
        StateStream.prototype.head = function () {
            if (this._isEmpty)
                throw 'Stream.head of empty stream.';
            if (this._head === undefined) {
                this._step();
            }
            return this._head;
        };
        StateStream.prototype.tail = function () {
            if (this._isEmpty)
                throw 'Stream.tail of empty stream.';
            if (this._tail === undefined) {
                this._step();
            }
            return this._tail;
        };
        StateStream.prototype._step = function () {
            var x = this.step(this.seed);
            if (x === null) {
                this._isEmpty = true;
            }
            else {
                this._isEmpty = false;
                this._head = x[0];
                this._tail = new StateStream(x[1], this.step);
                this.step = undefined;
                this.seed = undefined;
            }
        };
        StateStream.prototype.toArray = function () {
            var result = [];
            var s = this;
            while (!s.isEmpty()) {
                result.push(s.head());
                s = s.tail();
            }
            return result;
        };
        StateStream.flatten = function (ss) {
            return new StateStream([StateStream.Empty, ss], function (st) {
                var s = st[0], ss = st[1];
                while (s.isEmpty() && !ss.isEmpty()) {
                    s = ss.head();
                    ss = ss.tail();
                }
                if (s.isEmpty())
                    return null;
                return [s.head(), [s.tail(), ss]];
            });
        };
        StateStream.fromArray = function (xs) {
            return new StateStream(0, function (i) {
                if (i >= xs.length)
                    return null;
                return [xs[i], i + 1];
            });
        };
        StateStream.cons = function (x, xs) {
            return new StateStream(null, function (s) {
                if (s === null)
                    return [x, xs];
                return s.isEmpty() ? null : [s.head(), s.tail()];
            });
        };
        StateStream.singleton = function (x) {
            return new StateStream(true, function (b) { return b ? [x, false] : null; });
        };
        StateStream.Empty = new StateStream(null, function () { return null; });
        return StateStream;
    }());
    exports.StateStream = StateStream;
    var Gen = (function () {
        function Gen(generator, label, predicate, shrinker) {
            if (label === void 0) { label = ''; }
            this.args = [];
            this.independent = false;
            if (generator instanceof Gen) {
                if (predicate === undefined) {
                    this.underlyingGenerator = generator.underlyingGenerator;
                    this.predicate = generator.predicate;
                }
                else {
                    if (generator.predicate === undefined) {
                        this.underlyingGenerator = function (rng, size, catchExceptions) {
                            var ma = generator.generate(rng, size, catchExceptions);
                            return ma === null || predicate(ma[0]) ? ma : null;
                        };
                        this.predicate = predicate;
                    }
                    else {
                        var p_1 = function (x) { return predicate(x) && generator.predicate(x); };
                        this.underlyingGenerator = function (rng, size, catchExceptions) {
                            var ma = generator.generate(rng, size, catchExceptions);
                            return ma === null || p_1(ma[0]) ? ma : null;
                        };
                        this.predicate = p_1;
                    }
                }
            }
            else {
                if (predicate === undefined) {
                    this.underlyingGenerator = generator;
                }
                else {
                    this.underlyingGenerator = function (rng, size, catchExceptions) {
                        var ma = generator(rng, size, catchExceptions);
                        return ma === null || predicate(ma[0]) ? ma : null;
                    };
                }
            }
            this.label = label;
            this.shrinker = shrinker || Gen.shrinkNothing;
        }
        Gen.prototype.generate = function (rng, size, catchExceptions) {
            if (catchExceptions === void 0) { catchExceptions = true; }
            return this.underlyingGenerator(rng, size, catchExceptions);
        };
        Gen.prototype.withLabel = function (label) {
            this.label = label || '';
            return this;
        };
        Gen.prototype.withShrinker = function (shrinker) {
            this.shrinker = shrinker || Gen.shrinkNothing;
            return this;
        };
        Gen.prototype.toString = function () {
            return 'Gen(' + this.label + ')';
        };
        Gen.prototype.resized = function (size) {
            var self = this;
            return new Gen(function (rng, oldSize, catchExceptions) { return self.generate(rng, Math.min(oldSize, size), catchExceptions); }, '', this.predicate, this.shrinker);
        };
        Gen.prototype.variant = function (tweak) {
            var self = this;
            return new Gen(function (rng, size, catchExceptions) { return self.generate(rng.split(tweak), size, catchExceptions); }, '', this.predicate, this.shrinker);
        };
        Gen.prototype.map = function (f) {
            var self = this;
            var gen = new Gen(function (rng, size, catchExceptions) {
                var ma = self.generate(rng, size, catchExceptions);
                return ma === null ? null : [f(ma[0])];
            }, this.label);
            if (this.independent)
                gen.independent = this.independent;
            return gen;
        };
        Gen.prototype.concatMap = function (f) {
            var self = this;
            return new Gen(function (rng, size, catchExceptions) {
                var ma = self.generate(rng, size, catchExceptions);
                return ma === null ? null : f(ma[0]).generate(rng, size, catchExceptions);
            });
        };
        Gen.prototype.suchThat = function (p) {
            return new Gen(this, this.label, p, this.shrinker);
        };
        Gen.prototype.nonEmptyArrayOf = function () {
            var self = this;
            return new Gen(function (rng, size, catchExceptions) {
                var n = 1 + (rng.randomUint() % size);
                var xs = new Array(n);
                for (var i = 0; i < n; i++) {
                    var ma = self.generate(rng, size, catchExceptions);
                    if (ma === null)
                        return null;
                    xs[i] = ma[0];
                }
                return [xs];
            });
        };
        Gen.prototype.arrayOf = function () {
            var self = this;
            return new Gen(function (rng, size, catchExceptions) {
                var n = rng.randomUint() % (size + 1);
                var xs = new Array(n);
                for (var i = 0; i < n; i++) {
                    var ma = self.generate(rng, size, catchExceptions);
                    if (ma === null)
                        return null;
                    xs[i] = ma[0];
                }
                return [xs];
            });
        };
        Gen.prototype.arrayOfSize = function (n) {
            var self = this;
            return new Gen(function (rng, size, catchExceptions) {
                var xs = new Array(n);
                for (var i = 0; i < n; i++) {
                    var ma = self.generate(rng, size, catchExceptions);
                    if (ma === null)
                        return null;
                    xs[i] = ma[0];
                }
                return [xs];
            });
        };
        Gen.prototype.mixWith = function (gen, weight) {
            var self = this;
            return new Gen(function (rng, size, catchExceptions) {
                if (rng.random() < weight) {
                    return self.generate(rng, size, catchExceptions);
                }
                else {
                    return gen.generate(rng, size, catchExceptions);
                }
            });
        };
        Gen.prototype.asProperty = function () {
            var self = this;
            return new Gen(function (rng, size, catchExceptions) {
                if (catchExceptions) {
                    try {
                        var result = self.generate(rng, size, true);
                        if (result === null)
                            return [Result.Undecided];
                        if (result[0])
                            return [self.independent ? Result.Proved : Result.Passed];
                        else
                            return [Result.Failed];
                    }
                    catch (e) {
                        return [Result.Exception(e)];
                    }
                }
                else {
                    var result = self.generate(rng, size, false);
                    if (result === null)
                        return [Result.Undecided];
                    if (result[0])
                        return [self.independent ? Result.Proved : Result.Passed];
                    else
                        return [Result.Failed];
                }
            });
        };
        Gen.prototype.combine = function (that, f) {
            return this.concatMap(function (a) { return that.map(function (b) { return f(a, b); }); });
        };
        Gen.prototype.or = function (that) {
            return this.combine(that, function (a, b) { return a || b; });
        };
        Gen.prototype.and = function (that) {
            return this.combine(that, function (a, b) { return a && b; });
        };
        Gen.prototype.iff = function (that) {
            return this.combine(that, function (a, b) { return !!a === !!b; });
        };
        Gen.prototype.implies = function (that) {
            return this.combine(that, function (a, b) { return a ? !!b : true; });
        };
        Gen.prototype.not = function () {
            return this.map(function (a) { return !a; });
        };
        Gen.prototype.equals = function (that) {
            return this.combine(that, function (a, b) { return a === b; });
        };
        Gen.prototype.doesNotEqual = function (that) {
            return this.combine(that, function (a, b) { return a !== b; });
        };
        Gen.prototype.throwsException = function () {
            var self = this;
            return new Gen(function (rng, size) {
                try {
                    self.generate(rng, size, false);
                    return [false];
                }
                catch (e) {
                    return [true];
                }
            });
        };
        Gen.prototype.withArgs = function (args) {
            this.args = args;
            return this;
        };
        Gen.all = function () {
            var gens = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                gens[_i] = arguments[_i];
            }
            if (gens.length === 0)
                return Gen.value(true);
            return Gen.sequence(gens).map(function (bs) {
                for (var i = 0; i < bs.length; i++) {
                    if (!bs[i])
                        return false;
                }
                return true;
            });
        };
        Gen.any = function () {
            var gens = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                gens[_i] = arguments[_i];
            }
            return Gen.sequence(gens).map(function (bs) {
                for (var i = 0; i < bs.length; i++) {
                    if (bs[i])
                        return true;
                }
                return false;
            });
        };
        Gen.sequence = function (gens) {
            return new Gen(function (rng, size, catchExceptions) {
                var xs = new Array(gens.length);
                for (var i = 0; i < gens.length; i++) {
                    var ma = gens[i].generate(rng, size, catchExceptions);
                    if (ma === null)
                        return null;
                    xs[i] = ma[0];
                }
                return [xs];
            });
        };
        Gen.forAllNoShrink = function (gens, p) {
            if (gens.length === 0)
                return Gen.value(p()).asProperty();
            var prop = Gen.sequence(gens).map(function (args) {
                prop.withArgs(args);
                return p.apply(p, args);
            }).asProperty().map(Result.provedToPassed);
            return prop;
        };
        Gen.forAllNoShrinkAsync = function (gens, p, k) {
            var p2 = p(function (b) { return k(b ? Result.Passed : Result.Failed); });
            if (gens.length === 0)
                return Gen.value(p2()).asProperty();
            var prop = Gen.sequence(gens).map(function (args) {
                prop.withArgs(args);
                p2.apply(p2, args);
            });
            return prop;
        };
        Gen.frequency = function (gens) {
            var total = 0;
            for (var i = 0; i < gens.length; i++)
                total += gens[i][0];
            if (total === 0)
                throw 'Gen.frequency: no chance of anything happening';
            return new Gen(function (rng, size, catchExceptions) {
                var k = rng.randomUint() % total;
                for (var j = 0; j < gens.length; j++) {
                    if (k < gens[j][0])
                        return gens[j][1].generate(rng, size, catchExceptions);
                    k -= gens[j][0];
                }
                throw 'Gen.frequency: Should never get here.';
            });
        };
        Gen.elements = function (xs) {
            if (xs.length === 1) {
                return Gen.value(xs[0]);
            }
            else {
                return new Gen(function (rng) { return [xs[rng.randomUint() % xs.length]]; });
            }
        };
        Gen.oneOf = function (gens) {
            return new Gen(function (rng, size, catchExceptions) { return gens[rng.randomUint() % gens.length].generate(rng, size, catchExceptions); });
        };
        Gen.value = function (a) {
            var gen = new Gen(function () { return [a]; });
            gen.independent = true;
            return gen;
        };
        Gen.sized = function (g) {
            return new Gen(function (rng, size, catchExceptions) { return g(size).generate(rng, size, catchExceptions); });
        };
        Gen.chooseInt = function (lo, hi) {
            if (lo >= hi)
                throw 'Gen.chooseInt: Invalid range.';
            var m = hi - lo + 1;
            return new Gen(function (rng) { return [lo + rng.randomUint() % m]; }, undefined, undefined, Gen.shrinkInt);
        };
        Gen.chooseFloat = function (lo, hi) {
            if (lo >= hi)
                throw 'Gen.chooseFloat: Invalid range.';
            var w = hi - lo;
            return new Gen(function (rng) { return [rng.random() * w]; }, undefined, undefined, Gen.shrinkFloat);
        };
        Gen.shrinkNothing = function (a) {
            return StateStream.Empty;
        };
        Gen.shrinkBool = function (b) {
            return b ? StateStream.singleton(!b) : StateStream.Empty;
        };
        Gen.shrinkInt = function (n) {
            if (n === 0)
                return StateStream.Empty;
            var tail = new StateStream(n, function (k) {
                if (k === -1 || k === 1)
                    return null;
                return [n - (k >> 1), k >> 1];
            });
            return StateStream.cons(0, n < 0 ? StateStream.cons(-n, tail) : tail);
        };
        Gen.shrinkFloat = function (n) {
            if (n === 0)
                return StateStream.Empty;
            var rn = Math.floor(n);
            var tail = n === rn ? StateStream.Empty : StateStream.singleton(rn);
            return StateStream.cons(0, n < 0 ? StateStream.cons(-n, tail) : tail);
        };
        Gen.shrinkArray = function (shrinker) {
            var shrink = function (xs, j) {
                if (j === void 0) { j = 0; }
                if (xs.length === j)
                    return StateStream.Empty;
                return StateStream.flatten(new StateStream([j, shrinker(xs[j])], function (s) {
                    var _a = __read(s, 2), i = _a[0], strm = _a[1];
                    while (strm.isEmpty() && i < xs.length) {
                        i++;
                        strm = shrinker(xs[i]);
                    }
                    if (i === xs.length)
                        return null;
                    var tmp = xs.slice(0);
                    tmp[i] = strm.head();
                    return [StateStream.cons(tmp, shrink(tmp, i + 1)), [i, strm.tail()]];
                }));
            };
            return shrink;
        };
        Gen.genUndefined = Gen.value(undefined);
        Gen.genNull = Gen.value(null);
        Gen.genNaN = Gen.value(0 / 0);
        Gen.genBool = new Gen(function (rng) { return [!!(rng.randomUint() & 1)]; }, undefined, undefined, Gen.shrinkBool);
        Gen.genInt = new Gen(function (rng) { return [rng.randomInt()]; }, undefined, undefined, Gen.shrinkInt);
        Gen.genIntSpecial = Gen.elements([0, 1, -1, Math.pow(2, 31) - 1, -Math.pow(2, 31)]);
        Gen.genIntMix = Gen.genInt.mixWith(Gen.genIntSpecial, 0.95).withShrinker(Gen.shrinkInt);
        Gen.genUint = new Gen(function (rng) { return [rng.randomUint()]; }, undefined, undefined, Gen.shrinkInt);
        Gen.genUintSpecial = Gen.elements([0, 1, -1, Math.pow(2, 32) - 1]);
        Gen.genUintMix = Gen.genUint.mixWith(Gen.genUintSpecial, 0.95).withShrinker(Gen.shrinkInt);
        Gen.genFloat = new Gen(function (rng, size) { return [2 * (rng.random() - 0.5) * size]; }, undefined, undefined, Gen.shrinkFloat);
        Gen.genFloatSpecial = Gen.elements([0, -0, 1, -1, 1 / 0, -1 / 0, 0 / 0]);
        Gen.genFloatMix = Gen.genFloat.mixWith(Gen.genFloatSpecial, 0.99);
        return Gen;
    }());
    exports.Gen = Gen;
    var Result = (function () {
        function Result(type, isSuccess, exception) {
            if (isSuccess === void 0) { isSuccess = false; }
            this.type = type;
            this.isSuccess = isSuccess;
            this.exception = exception;
        }
        Result.prototype.toString = function () {
            return this.type + (this.exception ? ': ' + this.exception.toString() : '');
        };
        Result.prototype.and = function (that) {
            if (this.type === 'Exception')
                return this;
            if (that.type === 'Exception')
                return that;
            if (this === Result.Proved)
                return that;
            if (that === Result.Proved)
                return this;
            if (this === Result.Passed)
                return that;
            if (that === Result.Passed)
                return this;
            if (this === Result.Failed)
                return this;
            if (that === Result.Failed)
                return that;
            return this;
        };
        Result.prototype.or = function (that) {
            if (this.type === 'Exception')
                return this;
            if (that.type === 'Exception')
                return that;
            if (this === Result.Proved)
                return this;
            if (that === Result.Proved)
                return that;
            if (this === Result.Passed)
                return this;
            if (that === Result.Passed)
                return that;
            if (this === Result.Failed)
                return that;
            if (that === Result.Failed)
                return this;
            return this;
        };
        Result.prototype.implies = function (that) {
            if (this.type === 'Exception')
                return this;
            if (that.type === 'Exception')
                return that;
            if (this === Result.Proved)
                return that;
            if (this === Result.Passed && that.isSuccess)
                return this;
            if (this === Result.Failed)
                return Result.Undecided;
            if (this === Result.Undecided)
                return this;
            throw 'Result.implies: Should never get here.';
        };
        Result.provedToPassed = function (result) {
            if (result === Result.Proved)
                return Result.Passed;
            return result;
        };
        Result.Exception = function (exception) {
            return new Result('Exception', false, exception);
        };
        Result.Passed = new Result('Passed', true);
        Result.Proved = new Result('Proved', true);
        Result.Failed = new Result('Failed');
        Result.Undecided = new Result('Undecided');
        return Result;
    }());
    exports.Result = Result;
    var TestRunner = (function () {
        function TestRunner(options) {
            this.rng = options.rng === undefined ? exports.StdRandGen : options.rng;
            this.maxDiscards = options.maxDiscards === undefined ? 100 : options.maxDiscards;
            this.maxSuccesses = options.maxSuccesses === undefined ? 1000 : options.maxSuccesses;
            this.maxShrinks = options.maxShrinks === undefined ? 100 : options.maxShrinks;
            this.initialSize = options.initialSize === undefined ? 100 : options.initialSize;
            this.stringify = options.stringify === undefined ? JSON.stringify : options.stringify;
            this.catchExceptions = options.catchExceptions === undefined ? true : options.catchExceptions;
        }
        TestRunner.prototype.test = function (prop) {
            var result = prop.generate(this.rng, this.initialSize, this.catchExceptions);
            if (result === null)
                throw 'TestRunner.test: Should never get here.';
            return result[0];
        };
        TestRunner.prototype.testAsync = function (prop, k) {
            prop(k).generate(this.rng, this.initialSize, this.catchExceptions);
        };
        TestRunner.prototype.check = function (prop) {
            var discards = 0;
            var successes = 0;
            var result = Result.Exception("Didn't run");
            while (successes < this.maxSuccesses && discards < this.maxDiscards) {
                result = this.test(prop);
                if (result === Result.Passed) {
                    successes++;
                }
                else if (result === Result.Undecided) {
                    discards++;
                }
                else if (result === Result.Proved) {
                    successes++;
                    break;
                }
                else if (result === Result.Failed) {
                    break;
                }
                else {
                    break;
                }
            }
            ;
            return { result: result, args: prop.args, successes: successes, discards: discards };
        };
        TestRunner.prototype.checkAsync = function (prop, k) {
            var self = this;
            var discards = 0;
            var successes = 0;
            var pargs = [];
            var cont = function (res) {
                var keepGoing = successes < (self.maxSuccesses - 1) && discards < (self.maxDiscards - 1);
                if (res === Result.Passed) {
                    successes++;
                    if (keepGoing)
                        setImmediate(function () { return self.testAsync(prop, cont); });
                    else
                        k({ result: res, args: pargs, successes: successes, discards: discards });
                }
                else if (res === Result.Undecided) {
                    discards++;
                    if (keepGoing)
                        setImmediate(function () { return self.testAsync(prop, cont); });
                    else
                        k({ result: res, args: pargs, successes: successes, discards: discards });
                }
                else if (res === Result.Proved) {
                    successes++;
                    k({ result: res, args: pargs, successes: successes, discards: discards });
                }
                else if (res === Result.Failed) {
                    k({ result: res, args: pargs, successes: successes, discards: discards });
                }
                else {
                    k({ result: res, args: pargs, successes: successes, discards: discards });
                }
            };
            var gen = prop(cont);
            pargs = gen.args;
            gen.generate(this.rng, this.initialSize, this.catchExceptions);
        };
        TestRunner.prototype.testRun = function (prop, asserter) {
            var r = this.check(prop);
            var msg = r.result.type + ' after ' + r.successes + ' successes and ' + r.discards + ' discards.';
            if (r.result === Result.Failed || r.result.type === 'Exception') {
                msg += '\n\tWith arguments: ' + this.stringify(r.args);
            }
            if (r.result.type === 'Exception') {
                msg += '\n\tThrowing: ' + r.result.exception.toString();
            }
            asserter(r.result.isSuccess, msg);
        };
        TestRunner.prototype.testRunAsync = function (prop, asserter) {
            var self = this;
            this.checkAsync(prop, function (r) {
                var msg = r.result.type + ' after ' + r.successes + ' successes and ' + r.discards + ' discards.';
                if (r.result === Result.Failed || r.result.type === 'Exception') {
                    msg += '\n\tWith arguments: ' + self.stringify(r.args);
                }
                if (r.result.type === 'Exception') {
                    msg += '\n\tThrowing: ' + r.result.exception.toString();
                }
                asserter(r.result.isSuccess, msg);
            });
        };
        TestRunner.Default = new TestRunner({});
        return TestRunner;
    }());
    exports.TestRunner = TestRunner;
});
