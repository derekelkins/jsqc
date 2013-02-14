'use strict';
/**
Javascript QuickCheck v. 0.0.1 (alpha)
Copyright (c) 2013, Derek Elkins.  See LICENSE.

TODO: Implement something like ScalaCheck's Command framework.
TODO: Implement shrinking.
TODO: Implement exhaustive checking for small domains.

@module jsqc
@main jsqc
*/
(function(factory) {
    if(typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if(typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') { 
        factory(module.exports || exports);
    } else {
        factory(window.jsqc = {});
    }
})(function(exports) {

function extend(o, proto) {
    for(var k in proto) {
        if(proto.hasOwnProperty(k)) {
            o[k] = proto[k];
        }
    }
    return o;
}

var set = window.Uint32Array ? function(x, y) { x.set(y); } : function(x, y) { for(var i = 0; i < y.length; i++) x[i] = y[i]; };
var Uint32Array = window.Uint32Array || Array;
var setImmediate = window.setImmediate || function(f) { window.setTimeout(f, 0); };

/**
A splittable random number generator.

This is ChaCha/8.

@class RandGen
@constructor
*/
function RandGen(seed /* Uint32Array(10) */) {
    this.input = new Uint32Array(16);
    this.input[ 0] = 0x61707865; this.input[ 1] = 0x3320646e; this.input[ 2] = 0x79622d32; this.input[ 3] = 0x6b206574;
    this.input[ 4] =    seed[0]; this.input[ 5] =    seed[1]; this.input[ 6] =    seed[2]; this.input[ 7] =    seed[3];
    this.input[ 8] =    seed[4]; this.input[ 9] =    seed[5]; this.input[10] =    seed[6]; this.input[11] =    seed[7];
    this.input[12] =          0; this.input[13] =          0; this.input[14] =    seed[8]; this.input[15] =    seed[9];
    this.workingSpace = new Uint32Array(16);
    this.offset = 16;
}
exports.RandGen = RandGen;

if(window.Uint32Array) {
    exports.StdRandGen = new RandGen(new Uint32Array([new Date().getTime()>>>0,new Date().getYear()>>>0,0,0,0,0,0,0,0,0]));
} else {
    exports.StdRandGen = new RandGen([new Date().getTime()>>>0,new Date().getYear()>>>0,0,0,0,0,0,0,0,0]);
}

// TODO: Inline.
// Does the wrong thing when n = 0 or n >= 32 which doesn't matter here.
function rol(x, n) {
    return (x << n) ^ (x >>> (32-n));
}

function twoRounds(x) {
    // Column-wise round
    x[ 0] += x[ 4]; x[12] = rol(x[ 0] ^ x[12], 16);
    x[ 8] += x[12]; x[ 4] = rol(x[ 8] ^ x[ 4], 12);
    x[ 0] += x[ 4]; x[12] = rol(x[ 0] ^ x[12], 8);
    x[ 8] += x[12]; x[ 4] = rol(x[ 8] ^ x[ 4], 7);

    x[ 1] += x[ 5]; x[13] = rol(x[ 1] ^ x[13], 16);
    x[ 9] += x[13]; x[ 5] = rol(x[ 9] ^ x[ 5], 12);
    x[ 1] += x[ 5]; x[13] = rol(x[ 1] ^ x[13], 8);
    x[ 9] += x[13]; x[ 5] = rol(x[ 9] ^ x[ 5], 7);

    x[ 2] += x[ 6]; x[14] = rol(x[ 2] ^ x[14], 16);
    x[10] += x[14]; x[ 6] = rol(x[10] ^ x[ 6], 12);
    x[ 2] += x[ 6]; x[14] = rol(x[ 2] ^ x[14], 8);
    x[10] += x[14]; x[ 6] = rol(x[10] ^ x[ 6], 7);

    x[ 3] += x[ 7]; x[15] = rol(x[ 3] ^ x[15], 16);
    x[11] += x[15]; x[ 7] = rol(x[11] ^ x[ 7], 12);
    x[ 3] += x[ 7]; x[15] = rol(x[ 3] ^ x[15], 8);
    x[11] += x[15]; x[ 7] = rol(x[11] ^ x[ 7], 7);

    // Diagonal-wise round
    x[ 0] += x[ 5]; x[15] = rol(x[ 0] ^ x[15], 16);
    x[10] += x[15]; x[ 5] = rol(x[10] ^ x[ 5], 12);
    x[ 0] += x[ 5]; x[15] = rol(x[ 0] ^ x[15], 8);
    x[10] += x[15]; x[ 5] = rol(x[10] ^ x[ 5], 7);

    x[ 1] += x[ 6]; x[12] = rol(x[ 1] ^ x[12], 16);
    x[11] += x[12]; x[ 6] = rol(x[11] ^ x[ 6], 12);
    x[ 1] += x[ 6]; x[12] = rol(x[ 1] ^ x[12], 8);
    x[11] += x[12]; x[ 6] = rol(x[11] ^ x[ 6], 7);

    x[ 2] += x[ 7]; x[13] = rol(x[ 2] ^ x[13], 16);
    x[ 8] += x[13]; x[ 7] = rol(x[ 8] ^ x[ 7], 12);
    x[ 2] += x[ 7]; x[13] = rol(x[ 2] ^ x[13], 8);
    x[ 8] += x[13]; x[ 7] = rol(x[ 8] ^ x[ 7], 7);

    x[ 3] += x[ 4]; x[14] = rol(x[ 3] ^ x[14], 16);
    x[ 9] += x[14]; x[ 4] = rol(x[ 9] ^ x[ 4], 12);
    x[ 3] += x[ 4]; x[14] = rol(x[ 3] ^ x[14], 8);
    x[ 9] += x[14]; x[ 4] = rol(x[ 9] ^ x[ 4], 7);
};

RandGen.prototype.step = function() {
    var x = this.workingSpace;
    set(x, this.input);

    twoRounds(x);
    twoRounds(x);
    twoRounds(x);
    twoRounds(x);

    x[ 0] += this.input[ 0];
    x[ 1] += this.input[ 1];
    x[ 2] += this.input[ 2];
    x[ 3] += this.input[ 3];
    x[ 4] += this.input[ 4];
    x[ 5] += this.input[ 5];
    x[ 6] += this.input[ 6];
    x[ 7] += this.input[ 7];
    x[ 8] += this.input[ 8];
    x[ 9] += this.input[ 9];
    x[10] += this.input[10];
    x[11] += this.input[11];
    x[12] += this.input[12];
    x[13] += this.input[13];
    x[14] += this.input[14];
    x[15] += this.input[15];

    // Increment per block (64-bytes).
    this.input[8] = (this.input[8]+1)>>>0;
    this.input[9] += 1 >>> this.input[8];
};

/**
Produces a random Uint32 between [0, 2^32-1] and moves to the next state.

@method randomUint
@return {Uint32} [0, 2^32-1]
*/
RandGen.prototype.randomUint = function() {
    if(this.offset >= 16) {
        this.offset = 0;
        this.step();
    }
    return this.workingSpace[this.offset++]>>>0;
};

/**
Produces a random Int32 between [-2^31, 2^31-1] and moves to the next state.

@method randomInt
@return {Int32} [-2^31, 2^31-1]
*/
RandGen.prototype.randomInt = function() {
    if(this.offset >= 16) {
        this.offset = 0;
        this.step();
    }
    return this.workingSpace[this.offset++]>>0;
};

/**
Produces a random Float between [0, 1] and moves to the next state.

@method randomClosed
@return {Float} [0, 1]
*/
RandGen.prototype.randomClosed = function() {
    if(this.offset >= 16) {
        this.offset = 0;
        this.step();
    }
    return (this.workingSpace[this.offset++]>>>0)*2.3283064370807974e-10;
};

/**
Produces a random Float between [0, 1) and moves to the next state.

@method random
@return {Float} [0, 1)
*/
RandGen.prototype.random = function() {
    if(this.offset >= 16) {
        this.offset = 0;
        this.step();
    }
    return (this.workingSpace[this.offset++]>>>0)*2.3283064365386963e-10;
};

/**

@method split
@param tweak {Uint} A tweak.
@return {RandGen} A derived but independent random number generator.
*/
RandGen.prototype.split = function(tweak) {
    var rng = new RandGen(this.input);
    rng.input[15] = tweak>>>0;
    return rng;
};

/**
Coalgebraic streams.

@class Stream[A]
@param seed {S} An initial state
@param step {S &rarr; [] | [A, S]} Take in a state a produce a result and a new state, or no result signaling the end.
@constructor
*/
function Stream(seed, step) {
    this.step = step;
    this.seed = seed;
}
exports.Stream = Stream;

/**
True if the stream is empty.

@method isEmpty
@return Bool
*/
Stream.prototype.isEmpty = function() {
    if(this._isEmpty === undefined) {
        this._step();
    }
    return this._isEmpty;
};

/**
First element in a non-empty stream.

@method head
@return A
*/
Stream.prototype.head = function() {
    if(this._isEmpty) throw "Stream.head of empty stream.";
    if(this._head === undefined) {
        this._step();
    }
    return this._head;
}

/**
Remainder of a non-empty stream.

@method tail
@chainable
@return {Stream[A]}
*/
Stream.prototype.tail = function() {
    if(this._isEmpty) throw "Stream.tail of empty stream.";
    if(this._tail === undefined) {
        this._step();
    }
    return this._tail;
};

Stream.prototype._step = function() {
    var x = this.step(this.seed);
    this._isEmpty = 0 === x.length;
    if(!this._isEmpty) {
        this._head = x[0];
        this._tail = new Stream(x[1], this.step);
        this.step = null;
        this.seed = null;
    }
};

/**
Make an array from a (finite) stream.

@method toArray
@return {[A]} An array of the elements of the stream.
*/
Stream.prototype.toArray = function() {
    var result = [];
    var s = this;
    while(!s.isEmpty()) {
        result.push(s.head());
        s = s.tail();
    }
    return result;
};

/**
Flatten a stream of streams into a stream.

@method flatten
@return {Stream[A]}
*/
Stream.prototype.flatten = function() {
    return new Stream([Stream.Empty, this], function(st) {
        var s = st[0], ss = st[1];
        while(s.isEmpty() && !ss.isEmpty()) {
            s = ss.head();
            ss = ss.tail();
        }
        if(s.isEmpty()) return [];
        return [s.head(), [s.tail(), ss]];
    });
};


/**
The empty stream.

@property Empty
@static
@type Stream[A]
*/
Stream.Empty = new Stream();
Stream.Empty._isEmpty = true;

/**
Make a stream from an array.

@method fromArray
@static
@param xs {[A]} An array of elements.
@return {Stream[A]} A stream of the elements.
*/
Stream.fromArray = function(xs) {
    return new Stream(0, function(i) {
        if(i >= xs.length) return [];
        return [xs[i], i+1];
    });
};

/**
Add an element to the beginning of the stream.

@method cons
@static
@chainable
@param x {A} An element.
@param xs {Stream[A]} The rest of the stream.
@return {Stream[A]} A stream starting with x and preceding with xs.
*/
Stream.cons = function(x, xs) {
    return new Stream(null, function(s) {
        if(s === null) return [x, xs];
        return s.isEmpty() ? [] : [s.head(), s.tail()];
    });
};

/**
Make a singleton stream.

@method singleton
@static
@param x {A} A value.
@return {Stream[A]} A one element stream.
*/
Stream.singleton = function(x) {
    return new Stream(true, function(b) {
        return b ? [x, false] : [];
    });
};

/**
Produces a Gen[A] which is a function from (RNG, Int) &rarr; Maybe[A]
where Maybe[A] = [] | [A].

Don't call with new.

@class Gen[A] 
@param generator {(RNG, Int) &rarr; Maybe[A]} The actual value generator.
@param [label=''] {String} A label.
@param [predicate] {[A] &rarr; Bool} A filtering predicate.
@param [shrinker] {A &rarr; Stream[A]} A value shrinker.
@return {Gen[A]}
*/
function Gen(generator, label, predicate, shrinker) {
    var result;
    var gen = generator.underlyingGenerator || generator;
    if(predicate == null) {
        result = function(rng, size) { return gen(rng, size); };
        result.predicate = generator.predicate;
    } else {
        var p = generator.predicate ? function(a) { return predicate(a) && generator.predicate(a); } : predicate;
        result = function(rng, size) { 
            var ma = gen(rng, size);
            return ma.length === 0 || p(ma[0]) ? ma : [];
        };
        result.predicate = p;
    }
    result.label = label || '';
    result.underlyingGenerator = gen;
    result.shrinker = shrinker || Gen.shrinkNothing;
    return extend(result, Gen.prototype);
}
exports.Gen = Gen;

/**
Labels a generator.

@method withLabel
@chainable
@param label {String} A label.
@return {Gen[A]}
*/
Gen.prototype.withLabel = function(label) {
    this.label = label || '';
    return this;
};

/**
Overrides the shrinker on this generator.

@method withShrinker
@chainable
@param shrinker {A &rarr; Stream[A]} A shrinker.
@return {Gen[A]}
*/
Gen.prototype.withShrinker = function(shrinker) {
    this.shrinker = shrinker || Gen.shrinkNothing;
    return this;
};

Gen.prototype.toString = function() {
    return 'Gen('+this.label+')';
};

/**
Return a new generator with a specified size parameter.

@method resize
@chainable
@param size {Int} A new size for the generator.
*/
Gen.prototype.resized = function(size) {
    var gen = this.underlyingGenerator;
    return Gen(function(rng, oldSize) { return gen(rng, Math.min(oldSize, size)); }, null, this.predicate, this.shrinker);
};

/**
Returns a modified generator given a tweak.  Using the same tweak on the same
starting generator in the same state will produce the same result.  Using the same tweak on different
generators or the same generator in different states will produce independent generators.

@method variant
@chainable
@param tweak {Uint32} There are no restrictions on this to achieve an independent generator.
@return {Gen[A]} A new independent random number generator.
*/
Gen.prototype.variant = function(tweak) {
    var gen = this.underlyingGenerator;
    return Gen(function(rng, size) { return gen(rng.split(tweak), size); }, null, this.predicate, this.shrinker);
};

/**
Turn a Gen[A] into a Gen[B] given a function A &rarr; B.

@method map
@chainable
@param f {A &rarr; B}
@return {Gen[B]}
*/
Gen.prototype.map = function(f) {
    var self = this;
    var gen = Gen(function(rng, size) { 
        var a = self(rng, size);
        return a.length === 0 ? [] : [f(a[0])]; 
    }, this.label);
    if(this.independent) gen.independent = this.independent;
    return gen;
};

/**
Turn a Gen[A] into a Gen[B] given a function A &rarr; Gen[B].

@method concatMap
@chainable
@param f {A &rarr; Gen[B]}
@return {Gen[B]} 
*/
Gen.prototype.concatMap = function(f) {
    var self = this;
    return Gen(function(rng, size) { 
        var a = self(rng, size);
        return a.length === 0 ? [] : f(a[0])(rng, size); 
    });
};

/**
Return a new generator that filters it's output with the given predicate.

@method suchThat
@chainable
@param p {A &rarr; Bool}
@return {Gen[A]} Filtered version of the input.
*/
Gen.prototype.suchThat = function(p) {
    return Gen(this, this.label, p, this.shrinker);
};

/**
Return a generator that returns an array of a random length greater than 0.

@method nonEmptyArrayOf
@chainable
@return {Gen[[A]]} A generator of randomly sized, non-empty arrays.
*/
Gen.prototype.nonEmptyArrayOf = function() {
    var self = this;
    return Gen(function(rng, size) {
        var n = 1 + (rng.randomUint() % size);
        var xs = new Array(n);
        for(var i = 0; i < n; i++) {
            var a = self(rng, size);
            if(a.length === 0) return [];
            xs[i] = a[0];
        }
        return [xs];
    });
};

/**
Return a generator that returns an array of a random length.

@method arrayOf
@chainable
@return {Gen[[A]]} A generator of randomly sized arrays.
*/
Gen.prototype.arrayOf = function() {
    var self = this;
    return Gen(function(rng, size) {
        var n = rng.randomUint() % (size+1);
        var xs = new Array(n);
        for(var i = 0; i < n; i++) {
            var a = self(rng, size);
            if(a.length === 0) return [];
            xs[i] = a[0];
        }
        return [xs];
    });
};

/**
Return a generator that returns an array of a given length.

@method arrayOfSize
@chainable
@param n {Int} Size of the array.
@return {Gen[[A]]} A generator of size n arrays.
*/
Gen.prototype.arrayOfSize = function(n) {
    var self = this;
    return Gen(function(rng, size) {
        var xs = new Array(n);
        for(var i = 0; i < n; i++) {
            var a = self(rng, size);
            if(a.length === 0) return [];
            xs[i] = a[0];
        }
        return [xs];
    });
};

/**
Combine two generators into one, prefering one depending on weight.  By default, there is a 50/50 split.

@method mixWith
@chainable
@param gen {Gen[A]} Another generator from which to choose values.
@param [weight=0.5] {Float} How much this generator should be preferred over the passed in one.
@return {Gen[A]} A generator that produces a mixture of values.

@example
    Gen.genUint.mixWith(Gen.genNull, 0.95); // Generate null 5% of the time.
*/
Gen.prototype.mixWith = function(gen, weight) {
    var self = this;
    return Gen(function(rng, size) {
        if(rng.random() < weight) {
            return self(rng, size);
        } else {
            return gen(rng, size);
        }
    });
};

/**
Convert a proposition, a Gen[Bool], into a property.

@method asProperty
@chainable
@return {Gen[Result]} A property.
*/
Gen.prototype.asProperty = function() {
    var self = this;
    return Gen(function(rng, size) {
        try {
            var result = self(rng, size);
            if(result.length === 0) return [Result.Undecided];
            if(result[0]) return [self.independent ? Result.Proved : Result.Passed]; else return [Result.Failed];
        } catch(e) {
            return [Result.Exception(e)];
        }
    });
};

/**
@method combine
@param that {Gen[B]} Another generator.
@param f {(A, B) &rarr; C} A combining function.
@return {Gen[C]} f(this, that) conceptually.
*/
Gen.prototype.combine = function(that, f) {
    return this.concatMap(function(a) { return that.map(function(b) { return [f(a, b)]; }); });
};

/**
@method or
*/
Gen.prototype.or = function(that) {
    return this.combine(that, function(a, b) { return a || b; });
};

/**
@method and
*/
Gen.prototype.and = function(that) {
    return this.combine(that, function(a, b) { return a && b; });
};

/**
@method iff
*/
Gen.prototype.iff = function(that) {
    return this.combine(that, function(a, b) { return !!a === !!b; });
};

/**
@method implies
*/
Gen.prototype.implies = function(that) {
    return this.combine(that, function(a, b) { return a ? !!b : true; });
};

/**
@method not
*/
Gen.prototype.not = function() {
    return this.map(function(a) { return !a; });
};
/**
@method equals
*/
Gen.prototype.equals = function(that) {
    return this.combine(that, function(a, b) { return a === b; });
};

/**
@method doesNotEqual
*/
Gen.prototype.doesNotEqual = function(that) {
    return this.combine(that, function(a, b) { return a !== b; });
};

/**
Produces a proposition that a generator will produce an exception.

@method throwsException
@chainable
@return {Gen[Bool]} Return true if this throws an exception, false otherwise.
*/
Gen.prototype.throwsException = function() {
    var self = this;
    return Gen(function(rng, size) {
        try {
            self(rng, size);
            return [false];
        } catch(e) {
            return [true];
        }
    });
};

/**
@method withArgs
@private
@chainable
@param args {[any]}
@return {Gen[Result]}
*/
Gen.prototype.withArgs = function(args) {
    this.args = args;
    return this;
};

/**
@method all
@static
@param [gens]* {Gen[Bool]}
*/
Gen.all = function() {
    if(arguments.length === 0) return Gen.value(true);
    return Gen.sequence(arguments).map(function(bs) {
        for(var i = 0; i < bs.length; i++) {
            if(!bs[i]) return false;
        }
        return true;
    });
};

/**
@method any
@static
@param [gens]* {Gen[Bool]}
*/
Gen.any = function() {
    return Gen.sequence(arguments).map(function(bs) {
        for(var i = 0; i < bs.length; i++) {
            if(bs[i]) return true;
        }
        return false;
    });
};

/**
Return a generator of arrays from an array of generators.

@method sequence
@static
@chainable
@params gens {[Gen[A]]} An array of generators.
@return {Gen[[A]]} A generator of arrays.
*/
Gen.sequence = function(gens) {
    return Gen(function(rng, size) {
        var xs = new Array(gens.length);
        for(var i = 0; i < gens.length; i++) {
            var a = gens[i](rng, size);
            if(a.length === 0) return [];
            xs[i] = a[0];
        }
        return [xs];
    });
};

/**
@method forAllNoShrink
@static
@param gens {[Gen[any]]} Domain of quantification.
@param p {(...any) &rarr; Bool} A predicate.
@result {Gen[Result]}
*/
Gen.forAllNoShrink = function(gens, p) {
    if(gens.length === 0) return Gen.value(p()).asProperty();
    var prop = Gen.sequence(gens).map(function(args) {
        prop.withArgs(args);
        return p.apply(p, args);
    }).asProperty().map(Result.provedToPassed);
    return prop;
};

/**
@method forAllNoShrinkAsync
@static
@param gens {[Gen[any]]} Domain of quantification.
@param p {(Bool &rarr; void) &rarr; (...any) &rarr; void} A predicate.
@param k {Result &rarr; void} Callback.
@result {Gen[void]}
*/
Gen.forAllNoShrinkAsync = function(gens, p, k) {
    if(gens.length === 0) return Gen.value(p()).asProperty();
    var p2 = p(function(b) { k(b ? Result.Passed : Result.Failed); });
    var prop = Gen.sequence(gens).map(function(args) {
        prop.withArgs(args);
        p2.apply(p2, args);
    });
    return prop;
};

/*
@method forAll
@static
@param gens {[Gen[any]]} Domain of quantification.
@param p {(...any) &rarr; Bool} A predicate.
@result {Gen[Result]}
Gen.forAll = function(gens, p) {
    if(gens.length === 0) return Gen.value(p()).asProperty();
    var shrinker = function(xs) {
        

    };
    var prop = Gen.sequence(gens).map(function(args) {
        prop.withArgs(args);
        if(p.apply(p, args)) return true;
        var shrinks = shrinker(args);
        while(!shrinks.isEmpty()) {
            var tmpArgs = shrinks.head();
            if(p.apply(p, tmpArgs)) {
                shrinks = shrinks.tail();
            } else {
                prop.withArgs(tmpArgs);
                return false;
            }
        };
        return false;
    }).asProperty().map(Result.provedToPassed);
    return prop;
};
*/

/**
Return a generator that chooses a value from the specified list of generators with a specified frequency.

@method frequency
@static
@chainable
@param gens {[[Int, Gen[A]]]} An array of two element arrays.
@return {Gen[A]} A generator that randomly chooses between the provided generators.
*/
Gen.frequency = function(gens) {
    var total = 0;
    for(var i = 0; i < gens.length; i++) total += gens[i][0];
    if(total === 0) throw "Gen.frequency: no chance of anything happening";
    return Gen(function(rng, size) {
        var k = rng.randomUint() % total;
        for(var j = 0; j < gens.length; j++) {
            if(k < gens[j][0]) return gens[j][1](rng, size);
            k -= gens[j][0];
        }
        throw "Gen.frequency: Should never get here.";
    });
};

/**
Return one of a specified list of values.

@method elements
@static
@chainable
@param xs {[A]} A non-empty array of elements.
@return {Gen[A]} A generator that randomly returns one of the given elements.
*/
Gen.elements = function(xs) {
    if(xs.length === 1) {
        return Gen.value(xs[0]);
    } else {
        return Gen(function(rng, _) { return [xs[rng.randomUint()%xs.length]]; });
    }
};

/**
Return a generator that chooses a value from one of the specified list of generators randomly.

@method oneOf
@static
@chainable
@param gens {[Gen[A]]} A non-empty array of generators.
@return {Gen[A]} A generator that returns a random element of a randomly chosen input generator.
*/
Gen.oneOf = function(gens) {
    return Gen(function(rng, _) { return gens[rng.randomUint()%gens.length](rng, size); });
};

/**
Return a generator that always returns the same value.

@method value
@static
@chainable
@param a {A}
@return {Gen[A]} A constant generator.
*/
Gen.value = function(a) {
   var gen = Gen(function() { return [a]; }); 
   gen.independent = true;
   return gen;
};

/**
Construct a generator that depends on the size parameter.

@method sized
@static
@chainable
@param g {Int &rarr; Gen[A]} 
@return {Gen[A]}
*/
Gen.sized = function(g) {
    return Gen(function(rng, size) { return g(size)(rng, size); }, null, null, g.shrinker);
};

/**
Generate a random Int in the specified range inclusive.

@method chooseInt
@static
@chainable
@param lo {Int}
@param hi {Int}
@return {Gen[Int]}
*/
Gen.chooseInt = function(lo, hi) {
    if(lo >= hi) throw "Gen.chooseInt: Invalid range.";
    var m = hi - lo + 1;
    return Gen(function(rng, _) { return [rng.randomInt()%m]; }, null, null, Gen.shrinkInt); 
};

/**
Generate a random Float in the specified range not including the end point.

@method chooseFloat
@static
@chainable
@param lo {Float}
@param hi {Float}
@return {Gen[Float]}
*/
Gen.chooseFloat = function(lo, hi) {
    if(lo >= hi) throw "Gen.chooseFloat: Invalid range.";
    var w = hi - lo;
    return Gen(function(rng, _) { return [rng.random()*w]; }, null, null, Gen.shrinkFloat);
};

/**
The trivial shrinker.

@method shrinkNothing
@static
@param {A} any
@return {Stream[A]} Always the empty stream.
*/
Gen.shrinkNothing = function() {
    return Stream.Empty;
};

/**
Bool shrinker.

@method shrinkBool
@static
@param {Bool} A boolean.
@return {Stream[Bool]}
*/
Gen.shrinkBool = function(b) {
    return b ? Stream.singleton(!b) : Stream.Empty;
};

/**
Int shrinker:

@method shrinkInt
@static
@param {Int} A number.
@return {Stream[Int]} 
*/
Gen.shrinkInt = function(n) {
    if(n === 0) return Stream.Empty;
    var tail = new Stream(n, function(k) {
        if(k === -1 || k === 1) return [];
        return [n - (k>>1), k>>1];
    });
    return Stream.cons(0, n < 0 ? Stream.cons(-n, tail) : tail);
};

/**
Float shrinker.

@method shrinkFloat
@static
@param {Float} A number.
@return {Stream[Float]}
*/
Gen.shrinkFloat = function(n) {
    if(n === 0) return Stream.Empty;
    var rn = Math.floor(n);
    var tail = n === rn ? Stream.Empty : Stream.singleton(rn);
    return Stream.cons(0, n < 0 ? Stream.cons(-n, tail) : tail);
};

/**
Array shrinker.

@method shrinkArray
@static
@param shrinker {A &rarr; Stream[A]} A shrinker for the elements.
@return {[A] &rarr; Stream[[A]]} A shrinker of arrays of elements.
*/
Gen.shrinkArray = function(shrinker) {
    var shrink = function(xs, init) {
        var j = init || 0;
        if(xs.length === j) return Stream.Empty;
        return new Stream([j, shrinker(xs[j])], function(s) {
            var i = s[0], strm = s[1];
            while(strm.isEmpty() && i < xs.length) {
                i++;
                strm = shrinker(xs[i]);
            }
            if(i === xs.length) return [];
            var tmp = xs.slice(0);
            tmp[i] = strm.head();
            return [Stream.cons(tmp, shrink(tmp, i+1)), [i, strm.tail()]];
        }).flatten();
    };
    return shrink;
};

/**
@property genUndefined
@static
@type Gen[undefined]
*/
Gen.genUndefined = Gen.value(undefined);

/**
@property genNull
@static
@type Gen[null]
*/
Gen.genNull = Gen.value(null);

/**
@property genNaN
@static
@type Gen[Float]
*/
Gen.genNaN = Gen.value(0/0);

/**
@property genBool
@static
@type Gen[Bool]
*/
Gen.genBool = Gen(function(rng, _) { return [!!(rng.randomUint() & 1)]; }, null, null, Gen.shrinkBool);

/**
Uniformly generates a 32-bit integer.

See {{#crossLink "Gen/genIntSpecial"}}{{/crossLink}} for specific corner cases and 
{{#crossLink "Gen/genIntMixed"}}{{/crossLink}} for a mixture emphasizing corner cases.

@property genInt
@static
@type Gen[Int]
*/
Gen.genInt = Gen(function(rng, _) { return [rng.randomInt()]; }, null, null, Gen.shrinkInt);

/**
Generate a selection of corner cases.  Currently, 0, 1, -1, 2^31-1, -2^31.

@property genIntSpecial
@static
@type Gen[Int]
*/
Gen.genIntSpecial = Gen.elements([0, 1, -1, Math.pow(2,31)-1, -Math.pow(2,31)]);

/**
Generate a mixture that slightly emphasizes corner cases.

@property genIntMix
@static
@type Gen[Int]
*/
Gen.genIntMix = Gen.genInt.mixWith(Gen.genIntSpecial, 0.95).withShrinker(Gen.shrinkInt);

/**
Uniformly generates a 32-bit unsigned integer.

See {{#crossLink "Gen/genUintSpecial"}}{{/crossLink}} for specific corner cases and 
{{#crossLink "Gen/genUintMixed"}}{{/crossLink}} for a mixture emphasizing corner cases.

@property genUint
@static
@type Gen[Uint]
*/
Gen.genUint = Gen(function(rng, _) { return [rng.randomUint()]; }, null, null, Gen.shrinkInt);

/**
Generate a selection of corner cases.  Currently, 0, 1, -1, 2^32-1.

@property genUintSpecial
@static
@type Gen[Uint]
*/
Gen.genUintSpecial = Gen.elements([0, 1, -1, Math.pow(2,32)-1]);

/**
Generate a mixture that slightly emphasizes corner cases.

@property genUintMix
@static
@type Gen[Uint]
*/
Gen.genUintMix = Gen.genUint.mixWith(Gen.genUintSpecial, 0.95).withShrinker(Gen.shrinkInt);

/**
Size scaled floats.  Typically {{#crossLink "Gen/chooseFloat"}}{{/crossLink}} will be preferable.
Only produces "well-behaved" floats.  See {{#crossLink "Gen/genFloatSpecial"}}{{/crossLink}}
or {{#crossLink "Gen/genFloatMix"}}{{/crossLink}} for more hostile tests.

Use {{#crossLink "Gen/suchThat"}}{{/crossLink}} to exclude 0 and such.

@property genFloat
@static
@type Gen[Float]
*/
Gen.genFloat = Gen(function(rng, size) { return [2*(rng.random()-0.5)*size]; }, null, null, Gen.shrinkFloat);

/**
Selected floating point corner cases.  Currently, 0, -0, 1, -1, Infinity, -Infinity, NaN.

@property genFloatSpecial
@static
@type Gen[Float]
*/
Gen.genFloatSpecial = Gen.elements([0, -0, 1, -1, 1/0, -1/0, 0/0]);

/**
Currently, a 1% mixture of genFloatSpecial into genFloat.

@property genFloatMix
@static
@type Gen[Float]
*/
Gen.genFloatMix = Gen.genFloat.mixWith(Gen.genFloatSpecial, 0.99);

/**
Result is either Passed, Proved, Failed, Exception, Undecided.  In the case of Exception, which
exception is also included.  

@class Result
@private
@constructor
@param type {String} The type of the result.  Used for display.
@param success {Bool} Whether this Result indicates success.
@param exception {Exception} An exception for the Exception type.
*/
function Result(type, success, exception) {
    this.type = type;
    this.isSuccess = success || false;
    this.exception = exception;
};

Result.prototype.toString = function() {
    return this.type + (this.exception ? ': ' + this.exception.toString() : '');
};

/**
@method and
@chainable
@param that {Result}
@return {Result}
*/
Result.prototype.and = function(that) {
    if(this.type === 'Exception') return this;
    if(that.type === 'Exception') return that;

    if(this === Result.Proved) return that;
    if(that === Result.Proved) return this;
    if(this === Result.Passed) return that;
    if(that === Result.Passed) return this;

    if(this === Result.Failed) return this;
    if(that === Result.Failed) return that;
    return this; // Undecided
};

/**
@method or
@chainable
@param that {Result}
@return {Result}
*/
Result.prototype.or = function(that) {
    if(this.type === 'Exception') return this;
    if(that.type === 'Exception') return that;

    if(this === Result.Proved) return this;
    if(that === Result.Proved) return that;
    if(this === Result.Passed) return this;
    if(that === Result.Passed) return that;

    if(this === Result.Failed) return that;
    if(that === Result.Failed) return this;
    return this; // Undecided
};

/**
@method implies
@chainable
@param that {Result}
@return {Result}
*/
Result.prototype.implies = function(that) {
    if(this.type === 'Exception') return this;
    if(that.type === 'Exception') return that;

    if(this === Result.Proved) return that;
    if(this === Result.Passed && that.isSuccess) return this;
    if(this === Result.Failed) return Result.Undecided; // TODO: Could this be Proved?
    if(this === Result.Undecided) return this;
};

/**
Sometimes we need to weaken proof.

@method provedToPassed
@static
@private
@return {Result} this unless this is Result.Proved, then Result.Passed.
*/
Result.provedToPassed = function(result) {
    if(result === Result.Proved) return Result.Passed;
    return result;
};

/**
A test succeeded.

@property Passed
@static
@type {Result}
*/
Result.Passed = new Result('Passed', true);

/**
A test has been proven correct and no further trials are needed.

@property Proved
@static
@type {Result}
*/
Result.Proved = new Result('Proved', true);

/**
A test failed.

@property Failed
@static
@type {Result}
*/
Result.Failed = new Result('Failed');

/**
A test's preconditions were unable to be satisfied.

@property Undecided
@static
@type {Result}
*/
Result.Undecided = new Result('Undecided');

/**
A test threw an exception.

@method Exception
@static
@param exception {Exception}
@return {Result}
*/
Result.Exception = function(exception) {
    return new Result('Exception', false, exception);
};

/**
@class TestRunner
@constructor
*/
function TestRunner(options) {
    this.rng = options.rng || exports.StdRandGen;
    this.maxDiscards = options.maxDiscards || 100;
    this.maxSuccesses = options.maxSuccesses || 1000;
    this.maxShrinks = options.maxShrinks || 100;
    this.initialSize = options.initialSize || 100;
    this.stringify = options.stringify || JSON.stringify;
};
exports.TestRunner = TestRunner;

/**
Test a property once.

@method test
@param prop {Gen[Result]} Property to test.
@return {Result} For now.
*/
TestRunner.prototype.test = function(prop) {
    return prop(this.rng, this.initialSize)[0];
};

/**
Test a property once asynchronously.

@method testAsync
@param prop {(Result &rarr; void) &rarr; Gen[void]} Property to test.
@param k {Result &rarr; void} Callback.
*/
TestRunner.prototype.testAsync = function(prop, k) {
    prop(k)(this.rng, this.initialSize);
};

/**
@method check
@param prop {Gen[Result]} Property to test.
@return {Object} For now.
*/
TestRunner.prototype.check = function(prop) {
    var discards = 0;
    var successes = 0;
    var shrinks = 0;
    var result, shrunkenResult;
    while(successes < this.maxSuccesses && discards < this.maxDiscards) {
        result = this.test(prop);
        if(result === Result.Passed) {
            successes++;
        } else if(result === Result.Undecided) {
            discards++;
        } else if(result === Result.Proved) {
            successes++;
            break;
        } else if(result === Result.Failed) {
            /*
            while(shrinks++ < this.maxShrinks && shrunkenResult !== Result.Failed) {
                

            }
            */
            break;
        } else {
            break;
        }
    };
    return { result: result, args: prop.args, successes: successes, discards: discards };
};

/**
@method checkAsync
@param prop {(Result &rarr; void) &rarr; Gen[void]} Property to test.
@param k {Object &rarr; void}
*/
TestRunner.prototype.checkAsync = function(prop, k) {
    var self = this;
    var discards = 0;
    var successes = 0;
    var shrinks = 0;
    var result, shrunkenResult;
    var cont = function(res) {
        var keepGoing = successes < (self.maxSuccesses-1) && discards < (self.maxDiscards-1);
        if(res === Result.Passed) {
            successes++;
            if(keepGoing) setImmediate(function() { self.testAsync(prop, cont); });
            else k({ result: res, args: prop.args, successes: successes, discards: discards });
        } else if(res === Result.Undecided) {
            discards++;
            if(keepGoing) setImmediate(function() { self.testAsync(prop, cont); });
            else k({ result: res, args: prop.args, successes: successes, discards: discards });
        } else if(res === Result.Proved) {
            successes++;
            k({ result: res, args: prop.args, successes: successes, discards: discards });
        } else if(res === Result.Failed) {
            /*
            while(shrinks++ < self.maxShrinks && shrunkenResult !== Result.Failed) {
                

            }
            */
            k({ result: res, args: prop.args, successes: successes, discards: discards });
        } else {
            k({ result: res, args: prop.args, successes: successes, discards: discards });
        }
    };                   
        
    this.testAsync(prop, cont);
};

/**
@method testRun
@param prop {Gen[Result]} Property to test.
@param asserter {(Bool, String) &rarr; void} Assert function.
*/
TestRunner.prototype.testRun = function(prop, asserter) {
    var r = this.check(prop);
    var msg = r.result.type + ' after '+r.successes+' successes and '+r.discards+' discards.';
    if(r.result === Result.Failed || r.result.type === 'Exception') {
        msg += '\n\tWith arguments: '+this.stringify(r.args);
    }
    if(r.result.type === 'Exception') {
        msg += '\n\tThrowing: '+r.result.exception.toString();
    }

    asserter(r.result.isSuccess, msg);
};

/**
@method testRunAsync
@param prop {(Result &rarr; void) &rarr; Gen[void]} Property to test.
@param asserter {(Bool, String) &rarr; void} Assert function.
*/
TestRunner.prototype.testRunAsync = function(prop, asserter) {
    var self = this;
    this.checkAsync(prop, function(r) {
        var msg = r.result.type + ' after '+r.successes+' successes and '+r.discards+' discards.';
        if(r.result === Result.Failed || r.result.type === 'Exception') {
            msg += '\n\tWith arguments: '+self.stringify(r.args);
        }
        if(r.result.type === 'Exception') {
            msg += '\n\tThrowing: '+r.result.exception.toString();
        }

        asserter(r.result.isSuccess, msg);
    });        
};

/**
A TestRunner instance with the default configuration.
@property Default
@static
@type TestRunner
*/
TestRunner.Default = new TestRunner({});

return exports;
});
