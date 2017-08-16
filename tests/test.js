'use strict';
/**
Unit tests.

Copyright (c) 2013, Derek Elkins.  See LICENSE.
@module test
*/
(function(factory) {
    if(typeof define === 'function' && define.amd) {
        define(['jsqc'], factory);
    } else if(typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') { 
        factory(require('jsqc'));
    } else {
        factory(window.jsqc);
    }
})(function(QC) {

var TR = QC.TestRunner.Default;
var ShortTR = new QC.TestRunner({ maxSuccesses: 10, maxDiscards: 10 });
var Gen = QC.Gen;
var Stream = QC.Stream;

function qc(assert, gens, body) {
    TR.testRun(Gen.forAllNoShrink(gens, body), assert.ok.bind(assert));
}

QUnit.module('RandGen');

QUnit.test('random calls differ', function(assert) {
    var rng = new QC.RandGen(new (Uint32Array || Array)(10));
    assert.notEqual(rng.randomUint(), rng.randomUint());
});

QUnit.module('Stream');

QUnit.test('toArray o fromArray', function(assert) {
    qc(assert, [Gen.genInt.arrayOf().resized(5)], function(xs) {
        assert.deepEqual(Stream.fromArray(xs).toArray(), xs);
        return true;
    });
});

QUnit.test('concat two', function(assert) {
    qc(assert, [Gen.genInt.arrayOf().resized(5), Gen.genInt.arrayOf().resized(5)], function(x, y) {
        var ss = Stream.fromArray([Stream.fromArray(x), Stream.fromArray(y)]);
        assert.deepEqual(ss.flatten().toArray(), x.concat(y));
        return true;
    });
});

QUnit.test('concat unit', function(assert) {
    qc(assert, [Gen.genInt.arrayOf().resized(5)], function(x) {
        var  leftUnit = Stream.fromArray([Stream.Empty, Stream.fromArray(x)]).flatten();
        var rightUnit = Stream.fromArray([Stream.fromArray(x), Stream.Empty]).flatten();
        assert.deepEqual(leftUnit.toArray(), x) && assert.deepEqual(rightUnit.toArray(), x);
        return true;
    });
});

QUnit.module('Gen');

QUnit.test('typeof genBool is boolean', function(assert) {
    assert.equal(typeof Gen.genBool(QC.StdRandGen, 100)[0], 'boolean');
});

QUnit.test('shrinkArray', function(assert) {
    // Note that the order of the results doesn't particularly matter, so this
    // test over-specifies the result.
    assert.deepEqual(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray(),
        [[false, true],[false,false],[true,false]]);
});

QUnit.test('unit tests are a special case of QC tests: shrinkArray part deux', function(assert) {
    qc(assert, [], function() {
        assert.deepEqual(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray()
                    ,[[false, true],[false,false],[true,false]]);
        return true;
    });
});

QUnit.test('chooseInt(lo,hi) between lo and hi', function(assert) {
    qc(assert, [Gen.genInt, Gen.genInt], function(a, b) {
        var x = 0;
        if(a < b) {
            x = Gen.chooseInt(a, b)(QC.StdRandGen, 100);
            return a <= x && x <= b;
        } else {
            x = Gen.chooseInt(b, a)(QC.StdRandGen, 100);
            return b <= x && x <= a;
        }
    });
});

QUnit.module('TestRunner');

QUnit.test('passing test', function(assert) {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function(x, y) {
        return x === x;
    }), function(b, s) { assert.ok(b && s.indexOf('Passed') === 0, s) });
});

QUnit.test('proved test', function(assert) {
    TR.testRun(Gen.forAllNoShrink([], function() {
        return true;
    }), function(b, s) { assert.ok(b && s.indexOf('Proved') === 0, s) });
});

QUnit.test('failing test', function(assert) {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function(x, y) {
        return x === y;
    }), function(b, s) { assert.ok(!b && s.indexOf('Failed') === 0, s); });
});

QUnit.test('exception test', function(assert) {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function(x, y) {
        throw "foo";
    }), function(b, s) { assert.ok(!b && s.indexOf('Exception') === 0, s); });
});

QUnit.test('give up test', function(assert) {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool.suchThat(function(b) { return false; }), Gen.genBool], function(x, y) {
        return x === x;
    }), function(b, s) { assert.ok(!b && s.indexOf('Undecided') === 0, s); });
});

QUnit.test('async test', function(assert) {
    var done = assert.async();
    ShortTR.testRunAsync(function(c) { 
        return Gen.forAllNoShrinkAsync([Gen.genBool, Gen.genBool], function(k) { return function(x,y) {
            window.setTimeout(function() { k(x === x); }, 0);
        }; }, c)
    }, function(b, s) { assert.ok(b, s); done(); });
});

});
