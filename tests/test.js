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
var equiv = QUnit.equiv;

function qc(gens, body) {
    TR.testRun(Gen.forAllNoShrink(gens, body), ok);
}

module('RandGen');

test('random calls differ', function() {
    var rng = new QC.RandGen(new (Uint32Array || Array)(10));
    notEqual(rng.randomUint(), rng.randomUint());
});

module('Stream');

test('toArray o fromArray', function() {
    qc([Gen.genInt.arrayOf().resized(5)], function(xs) {
        return equiv(Stream.fromArray(xs).toArray(), xs);
    });
});

test('concat two', function() {
    qc([Gen.genInt.arrayOf().resized(5), Gen.genInt.arrayOf().resized(5)], function(x, y) {
        var ss = Stream.fromArray([Stream.fromArray(x), Stream.fromArray(y)]);
        return equiv(ss.flatten().toArray(), x.concat(y));
    });
});

test('concat unit', function() {
    qc([Gen.genInt.arrayOf().resized(5)], function(x) {
        var  leftUnit = Stream.fromArray([Stream.Empty, Stream.fromArray(x)]).flatten();
        var rightUnit = Stream.fromArray([Stream.fromArray(x), Stream.Empty]).flatten();
        return equiv(leftUnit.toArray(), x) && equiv(rightUnit.toArray(), x);
    });
});

module('Gen');

test('typeof genBool is boolean', function() {
    equal(typeof Gen.genBool(QC.StdRandGen, 100)[0], 'boolean');
});

test('shrinkArray', function() {
    // Note that the order of the results doesn't particularly matter, so this
    // test over-specifies the result.
    deepEqual(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray(),
        [[false, true],[false,false],[true,false]]);
});

test('unit tests are a special case of QC tests: shrinkArray part deux', function() {
    qc([], function() {
        return equiv(Gen.shrinkArray(Gen.shrinkBool)([true, true]).toArray()
                    ,[[false, true],[false,false],[true,false]]);
    });
});

test('chooseInt(lo,hi) between lo and hi', function() {
    qc([Gen.genInt, Gen.genInt], function(a, b) {
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

module('TestRunner');

test('passing test', function() {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function(x, y) {
        return x === x;
    }), function(b, s) { ok(b && s.indexOf('Passed') === 0, s) });
});

test('proved test', function() {
    TR.testRun(Gen.forAllNoShrink([], function() {
        return true;
    }), function(b, s) { ok(b && s.indexOf('Proved') === 0, s) });
});

test('failing test', function() {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function(x, y) {
        return x === y;
    }), function(b, s) { ok(!b && s.indexOf('Failed') === 0, s); });
});

test('exception test', function() {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool, Gen.genBool], function(x, y) {
        throw "foo";
    }), function(b, s) { ok(!b && s.indexOf('Exception') === 0, s); });
});

test('give up test', function() {
    TR.testRun(Gen.forAllNoShrink([Gen.genBool.suchThat(function(b) { return false; }), Gen.genBool], function(x, y) {
        return x === x;
    }), function(b, s) { ok(!b && s.indexOf('Undecided') === 0, s); });
});

asyncTest('async test', function() {
    ShortTR.testRunAsync(function(c) { 
        return Gen.forAllNoShrinkAsync([Gen.genBool, Gen.genBool], function(k) { return function(x,y) {
            window.setTimeout(function() { k(x === x); }, 0);
        }; }, c)
    }, function(b, s) { ok(b, s); start(); });
});

});
