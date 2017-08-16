(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../jsqc"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var QC = require("../jsqc");
    var TR = QC.TestRunner.Default;
    var ShortTR = new QC.TestRunner({ maxSuccesses: 10, maxDiscards: 10 });
    var Gen = QC.Gen;
    var Stream = QC.StateStream;
    var StdRandGen = QC.StdRandGen;
    function qc(assert, gens, body) {
        TR.testRun(Gen.forAllNoShrink(gens, body), assert.ok.bind(assert));
    }
    QUnit.module('RandGen');
    QUnit.test('random calls differ', function (assert) {
        var rng = new QC.RandGen(new Uint32Array(10));
        assert.notEqual(rng.randomUint(), rng.randomUint());
    });
    QUnit.module('Stream');
    QUnit.test('toArray o fromArray', function (assert) {
        qc(assert, [Gen.genInt.arrayOf().resized(5)], function (xs) {
            assert.deepEqual(Stream.fromArray(xs).toArray(), xs);
            return true;
        });
    });
    QUnit.test('concat two', function (assert) {
        qc(assert, [Gen.genInt.arrayOf().resized(5), Gen.genInt.arrayOf().resized(5)], function (x, y) {
            var ss = Stream.fromArray([Stream.fromArray(x), Stream.fromArray(y)]);
            assert.deepEqual(Stream.flatten(ss).toArray(), x.concat(y));
            return true;
        });
    });
    QUnit.test('concat unit', function (assert) {
        qc(assert, [Gen.genInt.arrayOf().resized(5)], function (x) {
            var leftUnit = Stream.flatten(Stream.fromArray([Stream.Empty, Stream.fromArray(x)]));
            var rightUnit = Stream.flatten(Stream.fromArray([Stream.fromArray(x), Stream.Empty]));
            assert.deepEqual(leftUnit.toArray(), x) && assert.deepEqual(rightUnit.toArray(), x);
            return true;
        });
    });
    QUnit.module('Gen');
    QUnit.test('typeof genBool is boolean', function (assert) {
        assert.equal(typeof Gen.genBool.generate(StdRandGen, 100)[0], 'boolean');
    });
    QUnit.test('shrinkArray', function (assert) {
        assert.deepEqual(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray(), [[false, true], [false, false], [true, false]]);
    });
    QUnit.test('unit tests are a special case of QC tests: shrinkArray part deux', function (assert) {
        qc(assert, [], function () {
            assert.deepEqual(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray(), [[false, true], [false, false], [true, false]]);
            return true;
        });
    });
    QUnit.test('chooseInt(lo,hi) between lo and hi', function (assert) {
        qc(assert, [Gen.genInt, Gen.genInt], function (a, b) {
            var x = 0;
            if (a < b) {
                x = Gen.chooseInt(a, b).generate(StdRandGen, 100)[0];
                return a <= x && x <= b;
            }
            else {
                x = Gen.chooseInt(b, a).generate(StdRandGen, 100)[0];
                return b <= x && x <= a;
            }
        });
    });
    QUnit.module('TestRunner');
    QUnit.test('passing test', function (assert) {
        TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function (x, y) {
            return x === x;
        }), function (b, s) { assert.ok(b && s.indexOf('Passed') === 0, s); });
    });
    QUnit.test('proved test', function (assert) {
        TR.testRun(Gen.forAllNoShrink([], function () {
            return true;
        }), function (b, s) { assert.ok(b && s.indexOf('Proved') === 0, s); });
    });
    QUnit.test('failing test', function (assert) {
        TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function (x, y) {
            return x === y;
        }), function (b, s) { assert.ok(!b && s.indexOf('Failed') === 0, s); });
    });
    QUnit.test('exception test', function (assert) {
        TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function (x, y) {
            throw "foo";
        }), function (b, s) { assert.ok(!b && s.indexOf('Exception') === 0, s); });
    });
    QUnit.test('give up test', function (assert) {
        TR.testRun(Gen.forAllNoShrink([Gen.genBool.suchThat(function (b) { return false; }), Gen.genBool], function (x, y) {
            return x === x;
        }), function (b, s) { assert.ok(!b && s.indexOf('Undecided') === 0, s); });
    });
    QUnit.test('async test', function (assert) {
        var done = assert.async();
        ShortTR.testRunAsync(function (c) {
            return Gen.forAllNoShrinkAsync([Gen.genBool, Gen.genBool], function (k) { return function (x, y) {
                window.setTimeout(function () { k(x === x); }, 0);
            }; }, c);
        }, function (b, s) { assert.ok(b, s); done(); });
    });
});
