/**
Unit tests.

Copyright (c) 2017, Derek Elkins.  See LICENSE.
@module test
*/
import * as QC from "../jsqc" 

const TR = QC.TestRunner.Default;
const ShortTR = new QC.TestRunner({ maxSuccesses: 10, maxDiscards: 10 });
const Gen = QC.Gen;
const Stream = QC.StateStream;
const StdRandGen = QC.StdRandGen;

function qc(assert: {ok: (b: boolean, s: string) => void }, gens: Array<QC.Gen<any>>, body: (...xs: Array<any>) => boolean) {
    TR.testRun(Gen.forAllNoShrink(gens, body), assert.ok.bind(assert));
}

QUnit.module('RandGen');

QUnit.test('random calls differ', assert => {
    const rng = new QC.RandGen(new Uint32Array(10));
    assert.notEqual(rng.randomUint(), rng.randomUint());
});

QUnit.module('Stream');

QUnit.test('toArray o fromArray', assert => {
    qc(assert, [Gen.genInt.arrayOf().resized(5)], xs => {
        assert.deepEqual(Stream.fromArray(xs).toArray(), xs);
        return true;
    });
});

QUnit.test('concat two', assert => {
    qc(assert, [Gen.genInt.arrayOf().resized(5), Gen.genInt.arrayOf().resized(5)], (x, y) => {
        const ss = Stream.fromArray([Stream.fromArray(x), Stream.fromArray(y)]);
        assert.deepEqual(Stream.flatten(ss).toArray(), x.concat(y));
        return true;
    });
});

QUnit.test('concat unit', assert => {
    qc(assert, [Gen.genInt.arrayOf().resized(5)], x => {
        const leftUnit = Stream.flatten(Stream.fromArray([Stream.Empty, Stream.fromArray(x)]));
        const rightUnit = Stream.flatten(Stream.fromArray([Stream.fromArray(x), Stream.Empty]));
        assert.deepEqual(leftUnit.toArray(), x) && assert.deepEqual(rightUnit.toArray(), x);
        return true;
    });
});

QUnit.module('Gen');

QUnit.test('typeof genBool is boolean', assert => {
    assert.equal(typeof (<[any]>Gen.genBool.generate(StdRandGen, 100))[0], 'boolean');
});

QUnit.test('shrinkArray', assert => {
    // Note that the order of the results doesn't particularly matter, so this
    // test over-specifies the result.
    assert.deepEqual(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray(),
        [[false, true],[false,false],[true,false]]);
});

QUnit.test('unit tests are a special case of QC tests: shrinkArray part deux', assert => {
    qc(assert, [], () => {
        assert.deepEqual(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray()
                    ,[[false, true],[false,false],[true,false]]);
        return true;
    });
});

QUnit.test('chooseInt(lo,hi) between lo and hi', assert => {
    qc(assert, [Gen.genInt, Gen.genInt], (a, b) => {
        let x = 0;
        if(a < b) {
            x = (<[number]>Gen.chooseInt(a, b).generate(StdRandGen, 100))[0];
            return a <= x && x <= b;
        } else {
            x = (<[number]>Gen.chooseInt(b, a).generate(StdRandGen, 100))[0];
            return b <= x && x <= a;
        }
    });
});

QUnit.module('TestRunner');

QUnit.test('passing test', assert => {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], (x, y) => {
        return x === x;
    }), (b, s) => { assert.ok(b && s.indexOf('Passed') === 0, s) });
});

QUnit.test('proved test', assert => {
    TR.testRun(Gen.forAllNoShrink([], () => {
        return true;
    }), (b, s) => { assert.ok(b && s.indexOf('Proved') === 0, s) });
});

QUnit.test('failing test', assert => {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], (x, y) => {
        return x === y;
    }), (b, s) => { assert.ok(!b && s.indexOf('Failed') === 0, s); });
});

QUnit.test('exception test', assert => {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], (x, y) => {
        throw "foo";
    }), (b, s) => { assert.ok(!b && s.indexOf('Exception') === 0, s); });
});

QUnit.test('give up test', assert => {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool.suchThat(b => false), Gen.genBool], (x, y) => {
        return x === x;
    }), (b, s) => { assert.ok(!b && s.indexOf('Undecided') === 0, s); });
});

QUnit.test('async test', assert => {
    const done = assert.async();
    ShortTR.testRunAsync(c =>
        Gen.forAllNoShrinkAsync([Gen.genBool, Gen.genBool], k => (x,y) => {
            window.setTimeout(() => { k(x === x); }, 0);
        }, c),
    (b, s) => { assert.ok(b, s); done(); });
});
