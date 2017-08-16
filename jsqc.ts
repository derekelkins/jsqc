/**
Javascript QuickCheck v. 0.1.0 (beta)
Copyright (c) 2017, Derek Elkins.  See LICENSE.

TODO: Implement something like ScalaCheck's Command framework.
TODO: Implement shrinking.
TODO: Implement function generators.
TODO: Implement exhaustive checking for small domains.
TODO: Make elements, nonEmptyArrayOf, etc. select uniformly. Doing rand()%n is not uniform unless n is a power of two.

@module jsqc
@main jsqc
*/

type Maybe<A> = A | null;

const setImmediate: (f: (...args: Array<any>) => void) => void = window.setImmediate || ((f: (...args: Array<any>) => void) => { window.setTimeout(f, 0); });

/**
A splittable random number generator.

This is ChaCha/8.

@class RandGen
@constructor
*/
export class RandGen {
    private input: Uint32Array;
    private workingSpace: Uint32Array;
    private offset: number;
    constructor(seed: Uint32Array /* Uint32Array(10) */) {
        this.input = new Uint32Array(16);
        this.input[ 0] = 0x61707865; this.input[ 1] = 0x3320646e; this.input[ 2] = 0x79622d32; this.input[ 3] = 0x6b206574;
        this.input[ 4] =    seed[0]; this.input[ 5] =    seed[1]; this.input[ 6] =    seed[2]; this.input[ 7] =    seed[3];
        this.input[ 8] =    seed[4]; this.input[ 9] =    seed[5]; this.input[10] =    seed[6]; this.input[11] =    seed[7];
        this.input[12] =          0; this.input[13] =          0; this.input[14] =    seed[8]; this.input[15] =    seed[9];
        this.workingSpace = new Uint32Array(16);
        this.offset = 16;
    }

    getSeed(): Uint32Array {
        const s = new Uint32Array(10);
        s[0] = this.input[ 4]; s[1] = this.input[ 5];
        s[2] = this.input[ 6]; s[3] = this.input[ 7];
        s[4] = this.input[ 8]; s[5] = this.input[ 9];
        s[6] = this.input[10]; s[7] = this.input[11];
        s[8] = this.input[14]; s[9] = this.input[15];
        return s;
    }

    // TODO: Inline.
    // Does the wrong thing when n = 0 or n >= 32 which doesn't matter here.
    private static rol(x: number, n: number): number {
        return (x << n) ^ (x >>> (32-n));
    }

    private static twoRounds(x: Uint32Array) {
        // Column-wise round
        x[ 0] += x[ 4]; x[12] = RandGen.rol(x[ 0] ^ x[12], 16);
        x[ 8] += x[12]; x[ 4] = RandGen.rol(x[ 8] ^ x[ 4], 12);
        x[ 0] += x[ 4]; x[12] = RandGen.rol(x[ 0] ^ x[12], 8);
        x[ 8] += x[12]; x[ 4] = RandGen.rol(x[ 8] ^ x[ 4], 7);

        x[ 1] += x[ 5]; x[13] = RandGen.rol(x[ 1] ^ x[13], 16);
        x[ 9] += x[13]; x[ 5] = RandGen.rol(x[ 9] ^ x[ 5], 12);
        x[ 1] += x[ 5]; x[13] = RandGen.rol(x[ 1] ^ x[13], 8);
        x[ 9] += x[13]; x[ 5] = RandGen.rol(x[ 9] ^ x[ 5], 7);

        x[ 2] += x[ 6]; x[14] = RandGen.rol(x[ 2] ^ x[14], 16);
        x[10] += x[14]; x[ 6] = RandGen.rol(x[10] ^ x[ 6], 12);
        x[ 2] += x[ 6]; x[14] = RandGen.rol(x[ 2] ^ x[14], 8);
        x[10] += x[14]; x[ 6] = RandGen.rol(x[10] ^ x[ 6], 7);

        x[ 3] += x[ 7]; x[15] = RandGen.rol(x[ 3] ^ x[15], 16);
        x[11] += x[15]; x[ 7] = RandGen.rol(x[11] ^ x[ 7], 12);
        x[ 3] += x[ 7]; x[15] = RandGen.rol(x[ 3] ^ x[15], 8);
        x[11] += x[15]; x[ 7] = RandGen.rol(x[11] ^ x[ 7], 7);

        // Diagonal-wise round
        x[ 0] += x[ 5]; x[15] = RandGen.rol(x[ 0] ^ x[15], 16);
        x[10] += x[15]; x[ 5] = RandGen.rol(x[10] ^ x[ 5], 12);
        x[ 0] += x[ 5]; x[15] = RandGen.rol(x[ 0] ^ x[15], 8);
        x[10] += x[15]; x[ 5] = RandGen.rol(x[10] ^ x[ 5], 7);

        x[ 1] += x[ 6]; x[12] = RandGen.rol(x[ 1] ^ x[12], 16);
        x[11] += x[12]; x[ 6] = RandGen.rol(x[11] ^ x[ 6], 12);
        x[ 1] += x[ 6]; x[12] = RandGen.rol(x[ 1] ^ x[12], 8);
        x[11] += x[12]; x[ 6] = RandGen.rol(x[11] ^ x[ 6], 7);

        x[ 2] += x[ 7]; x[13] = RandGen.rol(x[ 2] ^ x[13], 16);
        x[ 8] += x[13]; x[ 7] = RandGen.rol(x[ 8] ^ x[ 7], 12);
        x[ 2] += x[ 7]; x[13] = RandGen.rol(x[ 2] ^ x[13], 8);
        x[ 8] += x[13]; x[ 7] = RandGen.rol(x[ 8] ^ x[ 7], 7);

        x[ 3] += x[ 4]; x[14] = RandGen.rol(x[ 3] ^ x[14], 16);
        x[ 9] += x[14]; x[ 4] = RandGen.rol(x[ 9] ^ x[ 4], 12);
        x[ 3] += x[ 4]; x[14] = RandGen.rol(x[ 3] ^ x[14], 8);
        x[ 9] += x[14]; x[ 4] = RandGen.rol(x[ 9] ^ x[ 4], 7);
    }

    step() {
        var x = this.workingSpace;
        x.set(this.input);

        RandGen.twoRounds(x);
        RandGen.twoRounds(x);
        RandGen.twoRounds(x);
        RandGen.twoRounds(x);

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
    }

    /**
    Produces a random Uint32 between [0, 2^32-1] and moves to the next state.

    @method randomUint
    @return {Uint32} [0, 2^32-1]
    */
    randomUint(): number {
        if(this.offset >= 16) {
            this.offset = 0;
            this.step();
        }
        return this.workingSpace[this.offset++]>>>0;
    }

    /**
    Produces a random Int32 between [-2^31, 2^31-1] and moves to the next state.

    @method randomInt
    @return {Int32} [-2^31, 2^31-1]
    */
    randomInt(): number {
        if(this.offset >= 16) {
            this.offset = 0;
            this.step();
        }
        return this.workingSpace[this.offset++]>>0;
    }

    /**
    Produces a random Float between [0, 1] and moves to the next state.

    @method randomClosed
    @return {Float} [0, 1]
    */
    randomClosed(): number {
        if(this.offset >= 16) {
            this.offset = 0;
            this.step();
        }
        return (this.workingSpace[this.offset++]>>>0)*2.3283064370807974e-10;
    }

    /**
    Produces a random Float between [0, 1) and moves to the next state.

    @method random
    @return {Float} [0, 1)
    */
    random(): number {
        if(this.offset >= 16) {
            this.offset = 0;
            this.step();
        }
        return (this.workingSpace[this.offset++]>>>0)*2.3283064365386963e-10;
    }

    /**

    @method split
    @param tweak {Uint} A tweak.
    @return {RandGen} A derived but independent random number generator.
    */
    split(tweak: number): RandGen {
        var rng = new RandGen(this.input);
        rng.input[15] = tweak>>>0;
        return rng;
    }
}

export let StdRandGen = new RandGen(new Uint32Array([new Date().getTime()>>>0,new Date().getFullYear()>>>0,0,0,0,0,0,0,0,0]));

interface Stream<A> {
    isEmpty(): boolean;
    head(): A;
    tail(): Stream<A>;
    toArray(): Array<A>;
}

/**
Coalgebraic streams.

@class Stream[A]
@param seed {S} An initial state
@param step {S &rarr; [] | [A, S]} Take in a state a produce a result and a new state, or no result signaling the end.
@constructor
*/
export class StateStream<A, S> implements Stream<A> {
    private _isEmpty: boolean;
    private _head: A;
    private _tail: StateStream<A, S>;
    private seed?: S;
    private step?: (x: S) => Maybe<[A, S]>;

    constructor(seed: S, step: (x: S) => Maybe<[A, S]>) {
        this.seed = seed;
        this.step = step;
    }

    /**
    True if the stream is empty.

    @method isEmpty
    @return Bool
    */
    isEmpty(): boolean {
        if(this._isEmpty === undefined) {
            this._step();
        }
        return this._isEmpty;
    }

    /**
    First element in a non-empty stream.

    @method head
    @return A
    */
    head(): A {
        if(this._isEmpty) throw 'Stream.head of empty stream.';
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
    tail(): StateStream<A, S> {
        if(this._isEmpty) throw 'Stream.tail of empty stream.';
        if(this._tail === undefined) {
            this._step();
        }
        return this._tail;
    }

    private _step() {
        var x = (<(x: S) => Maybe<[A, S]>>this.step)(<S>this.seed);
        if(x === null) {
            this._isEmpty = true;
        } else {
            this._isEmpty = false;
            this._head = x[0];
            this._tail = new StateStream<A, S>(x[1], <(x: S) => Maybe<[A, S]>>this.step);
            this.step = undefined;
            this.seed = undefined;
        }
    }

    /**
    Make an array from a (finite) stream.

    @method toArray
    @return {[A]} An array of the elements of the stream.
    */
    toArray(): Array<A> {
        let result = [];
        let s: StateStream<A, S> = this;
        while(!s.isEmpty()) {
            result.push(s.head());
            s = s.tail();
        }
        return result;
    }

    /**
    Flatten a stream of streams into a stream.

    @method flatten
    @static
    @param {Stream[Stream[A]]} ss
    @return {Stream[A]}
    */
    static flatten<A>(ss: Stream<Stream<A>>): Stream<A> {
        return new StateStream([StateStream.Empty, ss], st => {
            var s = st[0], ss = st[1];
            while(s.isEmpty() && !ss.isEmpty()) {
                s = ss.head();
                ss = ss.tail();
            }
            if(s.isEmpty()) return null;
            return [s.head(), [s.tail(), ss]];
        });
    }


    /**
    The empty stream.

    @property Empty
    @static
    @type Stream[A]
    */
    static Empty: Stream<any> = new StateStream<any,null>(null, () => null);

    /**
    Make a stream from an array.

    @method fromArray
    @static
    @param xs {[A]} An array of elements.
    @return {Stream[A]} A stream of the elements.
    */
    static fromArray<A>(xs: Array<A>): Stream<A> {
        return new StateStream(0, (i: number) => {
            if(i >= xs.length) return null;
            return [xs[i], i+1];
        });
    }

    /**
    Add an element to the beginning of the stream.

    @method cons
    @static
    @chainable
    @param x {A} An element.
    @param xs {Stream[A]} The rest of the stream.
    @return {Stream[A]} A stream starting with x and preceding with xs.
    */
    static cons<A>(x: A, xs: Stream<A>): Stream<A> {
        return new StateStream(null, (s: Stream<A> | null) => {
            if(s === null) return [x, xs];
            return s.isEmpty() ? null : [s.head(), s.tail()];
        });
    }

    /**
    Make a singleton stream.

    @method singleton
    @static
    @param x {A} A value.
    @return {Stream[A]} A one element stream.
    */
    static singleton<A>(x: A): Stream<A> {
        return new StateStream(true, (b: boolean) => b ? [x, false] : null);
    }
}

type SubGen<A> = Gen<A> | ((rng: RandGen, size: number, catchExceptions: boolean) => Maybe<[A]>);

/**
Produces a Gen[A] which is a function from (RNG, Int, Bool) &rarr; Maybe[A]
where Maybe[A] = null | [A].

@class Gen[A] 
@param generator {(RNG, Int, Bool) &rarr; Maybe[A]} The actual value generator.
@param [label=''] {String} A label.
@param [predicate] {[A] &rarr; Bool} A filtering predicate.
@param [shrinker] {A &rarr; Stream[A]} A value shrinker.
@return {Gen[A]}
*/
export class Gen<A> {
    private readonly underlyingGenerator: (rng: RandGen, size: number, catchExceptions: boolean) => Maybe<[A]>;
    private label: string;
    private predicate?: (xs: A) => boolean;
    private shrinker?: (x: A) => Stream<A>;

    // TODO: These are a bit hacky and used by TestRunner stuff
    args: Array<any> = [];
    private independent: boolean = false;

    constructor(generator: SubGen<A>, label = '', predicate?: (x: A) => boolean, shrinker?: (x: A) => Stream<A>) {
        if(generator instanceof Gen) {
            if(predicate === undefined) {
                this.underlyingGenerator = generator.underlyingGenerator;
                this.predicate = generator.predicate;
            } else {
                if(generator.predicate === undefined) {
                    this.underlyingGenerator = (rng: RandGen, size: number, catchExceptions: boolean) => {
                        const ma = generator.generate(rng,size,catchExceptions);
                        return ma === null || predicate(ma[0]) ? ma : null;
                    };
                    this.predicate = predicate;
                } else {
                    const p = (x: A) => predicate(x) && (<(x: A) => boolean>generator.predicate)(x);
                    this.underlyingGenerator = (rng: RandGen, size: number, catchExceptions: boolean) => { 
                        const ma = generator.generate(rng, size, catchExceptions);
                        return ma === null || p(ma[0]) ? ma : null;
                    };
                    this.predicate = p;
                }
            }
        } else {
            if(predicate === undefined) {
                this.underlyingGenerator = generator;
            } else {
                this.underlyingGenerator = (rng: RandGen, size: number, catchExceptions: boolean) => {
                    const ma = generator(rng,size,catchExceptions);
                    return ma === null || predicate(ma[0]) ? ma : null;
                };
            }
        }
        this.label = label;
        this.shrinker = shrinker || Gen.shrinkNothing;
    }

    generate(rng: RandGen, size: number, catchExceptions = true): Maybe<[A]> {
        return this.underlyingGenerator(rng, size, catchExceptions);
    }

    /**
    Labels a generator.

    @method withLabel
    @chainable
    @param label {String} A label.
    @return {Gen[A]}
    */
    withLabel(label?: string) {
        this.label = label || '';
        return this;
    }

    /**
    Overrides the shrinker on this generator.

    @method withShrinker
    @chainable
    @param shrinker {A &rarr; Stream[A]} A shrinker.
    @return {Gen[A]}
    */
    withShrinker(shrinker?: (x: A) => Stream<A>) {
        this.shrinker = shrinker || Gen.shrinkNothing;
        return this;
    }

    toString(): string {
        return 'Gen('+this.label+')';
    }

    /**
    Return a new generator with a specified size parameter.

    @method resized
    @chainable
    @param size {Int} A new size for the generator.
    */
    resized(size: number): Gen<A> {
        const self = this;
        return new Gen((rng, oldSize, catchExceptions) => self.generate(rng, Math.min(oldSize, size), catchExceptions), '', this.predicate, this.shrinker);
    }

    /**
    Returns a modified generator given a tweak.  Using the same tweak on the same
    starting generator in the same state will produce the same result.  Using the same tweak on different
    generators or the same generator in different states will produce independent generators.

    @method variant
    @chainable
    @param tweak {Uint32} There are no restrictions on this to achieve an independent generator.
    @return {Gen[A]} A new independent random number generator.
    */
    variant(tweak: number): Gen<A> {
        const self = this
        return new Gen((rng, size, catchExceptions) => self.generate(rng.split(tweak), size, catchExceptions), '', this.predicate, this.shrinker);
    }

    /**
    Turn a Gen[A] into a Gen[B] given a function A &rarr; B.

    @method map
    @chainable
    @param f {A &rarr; B}
    @return {Gen[B]}
    */
    map<B>(f: (x: A) => B): Gen<B> {
        const self = this;
        const gen = new Gen((rng, size, catchExceptions) => {
            const ma = self.generate(rng, size, catchExceptions);
            return ma === null ? null : [f(ma[0])]; 
        }, this.label);
        if(this.independent) gen.independent = this.independent;
        return gen;
    }

    /**
    Turn a Gen[A] into a Gen[B] given a function A &rarr; Gen[B].

    @method concatMap
    @chainable
    @param f {A &rarr; Gen[B]}
    @return {Gen[B]} 
    */
    concatMap<B>(f: (x: A) => Gen<B>): Gen<B> {
        const self = this;
        return new Gen((rng, size, catchExceptions) => { 
            const ma = self.generate(rng, size, catchExceptions);
            return ma === null ? null : f(ma[0]).generate(rng, size, catchExceptions); 
        });
    }

    /**
    Return a new generator that filters it's output with the given predicate.

    @method suchThat
    @chainable
    @param p {A &rarr; Bool}
    @return {Gen[A]} Filtered version of the input.
    */
    suchThat(p: (x: A) => boolean): Gen<A> {
        return new Gen(this, this.label, p, this.shrinker);
    }

    /**
    Return a generator that returns an array of a random length greater than 0.

    @method nonEmptyArrayOf
    @chainable
    @return {Gen[[A]]} A generator of randomly sized, non-empty arrays.
    */
    nonEmptyArrayOf(): Gen<Array<A>> {
        const self = this;
        return new Gen((rng, size, catchExceptions) => {
            const n = 1 + (rng.randomUint() % size);
            const xs = new Array<A>(n);
            for(let i = 0; i < n; i++) {
                const ma = self.generate(rng, size, catchExceptions);
                if(ma === null) return null;
                xs[i] = ma[0];
            }
            return [xs];
        });
    }

    /**
    Return a generator that returns an array of a random length.

    @method arrayOf
    @chainable
    @return {Gen[[A]]} A generator of randomly sized arrays.
    */
    arrayOf(): Gen<Array<A>> {
        const self = this;
        return new Gen((rng, size, catchExceptions) => {
            const n = rng.randomUint() % (size+1);
            const xs = new Array<A>(n);
            for(let i = 0; i < n; i++) {
                const ma = self.generate(rng, size, catchExceptions);
                if(ma === null) return null;
                xs[i] = ma[0];
            }
            return [xs];
        });
    }

    /**
    Return a generator that returns an array of a given length.

    @method arrayOfSize
    @chainable
    @param n {Int} Size of the array.
    @return {Gen[[A]]} A generator of size n arrays.
    */
    arrayOfSize(n: number): Gen<Array<A>> {
        const self = this;
        return new Gen((rng, size, catchExceptions) => {
            const xs = new Array(n);
            for(let i = 0; i < n; i++) {
                const ma = self.generate(rng, size, catchExceptions);
                if(ma === null) return null;
                xs[i] = ma[0];
            }
            return [xs];
        });
    }

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
    mixWith(gen: Gen<A>, weight: number): Gen<A> {
        const self = this;
        return new Gen((rng, size, catchExceptions) => {
            if(rng.random() < weight) {
                return self.generate(rng, size, catchExceptions);
            } else {
                return gen.generate(rng, size, catchExceptions);
            }
        });
    }

    /**
    Convert a proposition, a Gen[Bool], into a property.

    @method asProperty
    @chainable
    @return {Gen[Result]} A property.
    */
    asProperty(): Gen<Result> {
        const self = this;
        return new Gen((rng, size, catchExceptions) => {
            if(catchExceptions) {
                try {
                    let result = self.generate (rng, size, true);
                    if(result === null) return [Result.Undecided];
                    if(result[0]) return [self.independent ? Result.Proved : Result.Passed]; else return [Result.Failed];
                } catch(e) {
                    return [Result.Exception(e)];
                }
            } else {
                let result = self.generate (rng, size, false);
                if(result === null) return [Result.Undecided];
                if(result[0]) return [self.independent ? Result.Proved : Result.Passed]; else return [Result.Failed];
            }
        });
    }

    /**
    @method combine
    @param that {Gen[B]} Another generator.
    @param f {(A, B) &rarr; C} A combining function.
    @return {Gen[C]} f(this, that) conceptually.
    */
    combine<B,C>(that: Gen<B>, f: (a: A, b: B) => C): Gen<C> {
        return this.concatMap(a => that.map(b => f(a, b)));
    }

    /**
    @method or
    */
    or(that: Gen<A>): Gen<A> {
        return this.combine(that, (a, b) => a || b);
    }

    /**
    @method and
    */
    and(that: Gen<A>): Gen<A> {
        return this.combine(that, (a, b) => a && b);
    }

    /**
    @method iff
    */
    iff(that: Gen<A>): Gen<boolean> {
        return this.combine(that, (a, b) => !!a === !!b);
    }

    /**
    @method implies
    */
    implies<B>(that: Gen<B>): Gen<boolean> {
        return this.combine(that, (a, b) => a ? !!b : true);
    }

    /**
    @method not
    */
    not(): Gen<boolean> {
        return this.map(a => !a);
    }
    /**
    @method equals
    */
    equals(that: Gen<A>): Gen<boolean> {
        return this.combine(that, (a, b) => a === b);
    }

    /**
    @method doesNotEqual
    */
    doesNotEqual(that: Gen<A>): Gen<boolean> {
        return this.combine(that, (a, b) => a !== b);
    }

    /**
    Produces a proposition that a generator will produce an exception.

    @method throwsException
    @chainable
    @return {Gen[Bool]} Return true if this throws an exception, false otherwise.
    */
    throwsException(): Gen<boolean> {
        const self = this;
        return new Gen((rng, size) => {
            try {
                self.generate(rng, size, false);
                return [false];
            } catch(e) {
                return [true];
            }
        });
    }

    /**
    @method withArgs
    @private
    @chainable
    @param args {[any]}
    @return {Gen[Result]}
    */
    withArgs(args: Array<any>): Gen<A> {
        this.args = args;
        return this;
    }

    /**
    @method all
    @static
    @param [gens]* {Gen[Bool]}
    */
    static all(...gens: Array<Gen<boolean>>): Gen<boolean> {
        if(gens.length === 0) return Gen.value(true);
        return Gen.sequence(gens).map(bs => {
            for(let i = 0; i < bs.length; i++) {
                if(!bs[i]) return false;
            }
            return true;
        });
    }

    /**
    @method any
    @static
    @param [gens]* {Gen[Bool]}
    */
    static any(...gens: Array<Gen<boolean>>): Gen<boolean> {
        return Gen.sequence(gens).map(bs => {
            for(let i = 0; i < bs.length; i++) {
                if(bs[i]) return true;
            }
            return false;
        });
    }

    /**
    Return a generator of arrays from an array of generators.

    @method sequence
    @static
    @chainable
    @params gens {[Gen[A]]} An array of generators.
    @return {Gen[[A]]} A generator of arrays.
    */
    static sequence<A>(gens: Array<Gen<A>>): Gen<Array<A>> {
        return new Gen((rng, size, catchExceptions) => {
            const xs = new Array<A>(gens.length);
            for(let i = 0; i < gens.length; i++) {
                const ma = gens[i].generate(rng, size, catchExceptions);
                if(ma === null) return null;
                xs[i] = ma[0];
            }
            return [xs];
        });
    }

    /**
    @method forAllNoShrink
    @static
    @param gens {[Gen[any]]} Domain of quantification.
    @param p {(...any) &rarr; Bool} A predicate.
    @result {Gen[Result]}
    */
    static forAllNoShrink(gens: Array<Gen<any>>, p: (...xs: Array<any>) => boolean): Gen<Result> {
        if(gens.length === 0) return Gen.value(p()).asProperty();
        const prop: Gen<Result> = Gen.sequence(gens).map(args => {
            prop.withArgs(args);
            return p.apply(p, args);
        }).asProperty().map(Result.provedToPassed);
        return prop;
    }

    /**
    @method forAllNoShrinkAsync
    @static
    @param gens {[Gen[any]]} Domain of quantification.
    @param p {(Bool &rarr; void) &rarr; (...any) &rarr; void} A predicate.
    @param k {Result &rarr; void} Callback.
    @result {Gen[void]}
    */
    static forAllNoShrinkAsync(gens: Array<any>, p: (cb: (b: boolean) => void) => (...args: Array<any>) => void, k: (result: Result) => void) {
        const p2 = p(b => k(b ? Result.Passed : Result.Failed));
        if(gens.length === 0) return Gen.value(p2()).asProperty();
        const prop = Gen.sequence(gens).map(function(args) {
            prop.withArgs(args);
            p2.apply(p2, args);
        });
        return prop;
    }

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
    static frequency<A>(gens: Array<[number, Gen<A>]>): Gen<A> {
        let total = 0;
        for(let i = 0; i < gens.length; i++) total += gens[i][0];
        if(total === 0) throw 'Gen.frequency: no chance of anything happening';
        return new Gen((rng, size, catchExceptions) => {
            let k = rng.randomUint() % total;
            for(let j = 0; j < gens.length; j++) {
                if(k < gens[j][0]) return gens[j][1].generate(rng, size, catchExceptions);
                k -= gens[j][0];
            }
            throw 'Gen.frequency: Should never get here.';
        });
    }

    /**
    Return one of a specified list of values.

    @method elements
    @static
    @chainable
    @param xs {[A]} A non-empty array of elements.
    @return {Gen[A]} A generator that randomly returns one of the given elements.
    */
    static elements<A>(xs: Array<A>): Gen<A> {
        if(xs.length === 1) {
            return Gen.value(xs[0]);
        } else {
            return new Gen(rng => [xs[rng.randomUint()%xs.length]]);
        }
    }

    /**
    Return a generator that chooses a value from one of the specified list of generators randomly.

    @method oneOf
    @static
    @chainable
    @param gens {[Gen[A]]} A non-empty array of generators.
    @return {Gen[A]} A generator that returns a random element of a randomly chosen input generator.
    */
    static oneOf<A>(gens: Array<Gen<A>>): Gen<A> {
        return new Gen((rng, size /* TODO */, catchExceptions) => gens[rng.randomUint() % gens.length].generate(rng, size, catchExceptions));
    }

    /**
    Return a generator that always returns the same value.

    @method value
    @static
    @chainable
    @param a {A}
    @return {Gen[A]} A constant generator.
    */
    static value<A>(a: A): Gen<A> {
       const gen = new Gen(() => [a]); 
       gen.independent = true;
       return gen;
    }

    /**
    Construct a generator that depends on the size parameter.

    @method sized
    @static
    @chainable
    @param g {Int &rarr; Gen[A]} 
    @return {Gen[A]}
    */
    static sized<A>(g: (size: number) => Gen<A>): Gen<A> {
        return new Gen((rng, size, catchExceptions) => g(size).generate(rng, size, catchExceptions));
    }

    /**
    Generate a random Int in the specified range inclusive.

    @method chooseInt
    @static
    @chainable
    @param lo {Int}
    @param hi {Int}
    @return {Gen[Int]}
    */
    static chooseInt(lo: number, hi: number): Gen<number> {
        if(lo >= hi) throw 'Gen.chooseInt: Invalid range.';
        const m = hi - lo + 1;
        return new Gen(rng => [lo + rng.randomUint()%m], undefined, undefined, Gen.shrinkInt); 
    }

    /**
    Generate a random Float in the specified range not including the end point.

    @method chooseFloat
    @static
    @chainable
    @param lo {Float}
    @param hi {Float}
    @return {Gen[Float]}
    */
    static chooseFloat(lo: number, hi: number): Gen<number> {
        if(lo >= hi) throw 'Gen.chooseFloat: Invalid range.';
        const w = hi - lo;
        return new Gen(rng => [rng.random()*w], undefined, undefined, Gen.shrinkFloat);
    }

    /**
    The trivial shrinker.

    @method shrinkNothing
    @static
    @param {A} any
    @return {Stream[A]} Always the empty stream.
    */
    static shrinkNothing<A>(a: A): Stream<A> {
        return StateStream.Empty;
    }

    /**
    Bool shrinker.

    @method shrinkBool
    @static
    @param {Bool} A boolean.
    @return {Stream[Bool]}
    */
    static shrinkBool(b: boolean): Stream<boolean> {
        return b ? StateStream.singleton(!b) : StateStream.Empty;
    }

    /**
    Int shrinker:

    @method shrinkInt
    @static
    @param {Int} A number.
    @return {Stream[Int]} 
    */
    static shrinkInt(n: number): Stream<number> {
        if(n === 0) return StateStream.Empty;
        const tail = new StateStream(n, k => {
            if(k === -1 || k === 1) return null;
            return [n - (k>>1), k>>1];
        });
        return StateStream.cons(0, n < 0 ? StateStream.cons(-n, tail) : tail);
    }

    /**
    Float shrinker.

    @method shrinkFloat
    @static
    @param {Float} A number.
    @return {Stream[Float]}
    */
    static shrinkFloat(n: number): Stream<number> {
        if(n === 0) return StateStream.Empty;
        const rn = Math.floor(n);
        const tail = n === rn ? StateStream.Empty : StateStream.singleton(rn);
        return StateStream.cons(0, n < 0 ? StateStream.cons(-n, tail) : tail);
    }

    /**
    Array shrinker.

    @method shrinkArray
    @static
    @param shrinker {A &rarr; Stream[A]} A shrinker for the elements.
    @return {[A] &rarr; Stream[[A]]} A shrinker of arrays of elements.
    */
    static shrinkArray<A>(shrinker: (x: A) => Stream<A>): (xs: Array<A>) => Stream<Array<A>> {
        const shrink = (xs: Array<A>, j = 0): Stream<Array<A>> => {
            if(xs.length === j) return StateStream.Empty;
            return StateStream.flatten(new StateStream<Stream<Array<A>>, [number, Stream<A>]>([j, shrinker(xs[j])], s => {
                let [i, strm] = s;
                while(strm.isEmpty() && i < xs.length) {
                    i++;
                    strm = shrinker(xs[i]);
                }
                if(i === xs.length) return null;
                const tmp = xs.slice(0);
                tmp[i] = strm.head();
                return [StateStream.cons(tmp, shrink(tmp, i+1)), [i, strm.tail()]];
            }));
        };
        return <(xs: Array<A>) => Stream<Array<A>>>shrink;
    }

    /**
    @property genUndefined
    @static
    @type Gen[undefined]
    */
    static genUndefined = Gen.value(undefined);

    /**
    @property genNull
    @static
    @type Gen[null]
    */
    static genNull = Gen.value(null);

    /**
    @property genNaN
    @static
    @type Gen[Float]
    */
    static genNaN = Gen.value(0/0);

    /**
    @property genBool
    @static
    @type Gen[Bool]
    */
    static genBool = new Gen(rng => [!!(rng.randomUint() & 1)], undefined, undefined, Gen.shrinkBool);

    /**
    Uniformly generates a 32-bit integer.

    See {{#crossLink "Gen/genIntSpecial"}}{{/crossLink}} for specific corner cases and 
    {{#crossLink "Gen/genIntMixed"}}{{/crossLink}} for a mixture emphasizing corner cases.

    @property genInt
    @static
    @type Gen[Int]
    */
    static genInt = new Gen(rng => [rng.randomInt()], undefined, undefined, Gen.shrinkInt);

    /**
    Generate a selection of corner cases.  Currently, 0, 1, -1, 2^31-1, -2^31.

    @property genIntSpecial
    @static
    @type Gen[Int]
    */
    static genIntSpecial = Gen.elements([0, 1, -1, Math.pow(2,31)-1, -Math.pow(2,31)]);

    /**
    Generate a mixture that slightly emphasizes corner cases.

    @property genIntMix
    @static
    @type Gen[Int]
    */
    static genIntMix = Gen.genInt.mixWith(Gen.genIntSpecial, 0.95).withShrinker(Gen.shrinkInt);

    /**
    Uniformly generates a 32-bit unsigned integer.

    See {{#crossLink "Gen/genUintSpecial"}}{{/crossLink}} for specific corner cases and 
    {{#crossLink "Gen/genUintMixed"}}{{/crossLink}} for a mixture emphasizing corner cases.

    @property genUint
    @static
    @type Gen[Uint]
    */
    static genUint = new Gen(rng => [rng.randomUint()], undefined, undefined, Gen.shrinkInt);

    /**
    Generate a selection of corner cases.  Currently, 0, 1, -1, 2^32-1.

    @property genUintSpecial
    @static
    @type Gen[Uint]
    */
    static genUintSpecial = Gen.elements([0, 1, -1, Math.pow(2,32)-1]);

    /**
    Generate a mixture that slightly emphasizes corner cases.

    @property genUintMix
    @static
    @type Gen[Uint]
    */
    static genUintMix = Gen.genUint.mixWith(Gen.genUintSpecial, 0.95).withShrinker(Gen.shrinkInt);

    /**
    Size scaled floats.  Typically {{#crossLink "Gen/chooseFloat"}}{{/crossLink}} will be preferable.
    Only produces "well-behaved" floats.  See {{#crossLink "Gen/genFloatSpecial"}}{{/crossLink}}
    or {{#crossLink "Gen/genFloatMix"}}{{/crossLink}} for more hostile tests.

    Use {{#crossLink "Gen/suchThat"}}{{/crossLink}} to exclude 0 and such.

    @property genFloat
    @static
    @type Gen[Float]
    */
    static genFloat = new Gen((rng, size) => [2*(rng.random()-0.5)*size], undefined, undefined, Gen.shrinkFloat);

    /**
    Selected floating point corner cases.  Currently, 0, -0, 1, -1, Infinity, -Infinity, NaN.

    @property genFloatSpecial
    @static
    @type Gen[Float]
    */
    static genFloatSpecial = Gen.elements([0, -0, 1, -1, 1/0, -1/0, 0/0]);

    /**
    Currently, a 1% mixture of genFloatSpecial into genFloat.

    @property genFloatMix
    @static
    @type Gen[Float]
    */
    static genFloatMix = Gen.genFloat.mixWith(Gen.genFloatSpecial, 0.99);
}

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
export class Result {
    constructor(readonly type: string, readonly isSuccess = false, readonly exception?: any) { }

    toString(): string {
        return this.type + (this.exception ? ': ' + this.exception.toString() : '');
    }

    /**
    @method and
    @chainable
    @param that {Result}
    @return {Result}
    */
    and(that: Result): Result {
        if(this.type === 'Exception') return this;
        if(that.type === 'Exception') return that;

        if(this === Result.Proved) return that;
        if(that === Result.Proved) return this;
        if(this === Result.Passed) return that;
        if(that === Result.Passed) return this;

        if(this === Result.Failed) return this;
        if(that === Result.Failed) return that;
        return this; // Undecided
    }

    /**
    @method or
    @chainable
    @param that {Result}
    @return {Result}
    */
    or(that: Result): Result {
        if(this.type === 'Exception') return this;
        if(that.type === 'Exception') return that;

        if(this === Result.Proved) return this;
        if(that === Result.Proved) return that;
        if(this === Result.Passed) return this;
        if(that === Result.Passed) return that;

        if(this === Result.Failed) return that;
        if(that === Result.Failed) return this;
        return this; // Undecided
    }

    /**
    @method implies
    @chainable
    @param that {Result}
    @return {Result}
    */
    implies(that: Result): Result {
        if(this.type === 'Exception') return this;
        if(that.type === 'Exception') return that;

        if(this === Result.Proved) return that;
        if(this === Result.Passed && that.isSuccess) return this;
        if(this === Result.Failed) return Result.Undecided; // TODO: Could this be Proved?
        if(this === Result.Undecided) return this;

        throw 'Result.implies: Should never get here.'
    }

    /**
    Sometimes we need to weaken proof.

    @method provedToPassed
    @static
    @private
    @return {Result} this unless this is Result.Proved, then Result.Passed.
    */
    static provedToPassed(result: Result): Result {
        if(result === Result.Proved) return Result.Passed;
        return result;
    }

    /**
    A test succeeded.

    @property Passed
    @static
    @type {Result}
    */
    static Passed = new Result('Passed', true);

    /**
    A test has been proven correct and no further trials are needed.

    @property Proved
    @static
    @type {Result}
    */
    static Proved = new Result('Proved', true);

    /**
    A test failed.

    @property Failed
    @static
    @type {Result}
    */
    static Failed = new Result('Failed');

    /**
    A test's preconditions were unable to be satisfied.

    @property Undecided
    @static
    @type {Result}
    */
    static Undecided = new Result('Undecided');

    /**
    A test threw an exception.

    @method Exception
    @static
    @param exception {Exception}
    @return {Result}
    */
    static Exception(exception: any): Result {
        return new Result('Exception', false, exception);
    }
}

/**
@class TestRunner
@constructor
*/
export class TestRunner {
    private readonly rng: RandGen;
    private readonly maxDiscards: number;
    private readonly maxSuccesses: number;
    private readonly maxShrinks: number;
    private readonly initialSize: number;
    private readonly stringify: (x: any) => string;
    private readonly catchExceptions: boolean;

    constructor(options: {rng?: RandGen, maxDiscards?: number, maxSuccesses?: number, maxShrinks?: number, initialSize?: number, stringify?: (x: any) => string, catchExceptions?: boolean}) {
        this.rng = options.rng === undefined ? StdRandGen : options.rng;
        this.maxDiscards = options.maxDiscards === undefined ? 100 : options.maxDiscards;
        this.maxSuccesses = options.maxSuccesses === undefined ? 1000 : options.maxSuccesses;
        this.maxShrinks = options.maxShrinks === undefined ? 100 : options.maxShrinks;
        this.initialSize = options.initialSize === undefined ? 100 : options.initialSize;
        this.stringify = options.stringify === undefined ? JSON.stringify : options.stringify;
        this.catchExceptions = options.catchExceptions === undefined ? true : options.catchExceptions;
    }

    /**
    Test a property once.

    @method test
    @param prop {Gen[Result]} Property to test.
    @return {Result} For now.
    */
    test(prop: Gen<Result>): Result {
        const result = prop.generate(this.rng, this.initialSize, this.catchExceptions);
        if(result === null) throw 'TestRunner.test: Should never get here.';
        return result[0];
    }

    /**
    Test a property once asynchronously.

    @method testAsync
    @param prop {(Result &rarr; void) &rarr; Gen[void]} Property to test.
    @param k {Result &rarr; void} Callback.
    */
    testAsync(prop: (cb: ((r: Result) => void)) => Gen<any>, k: (r: Result) => void): void {
        prop(k).generate(this.rng, this.initialSize, this.catchExceptions);
    }

    /**
    @method check
    @param prop {Gen[Result]} Property to test.
    @return {Object} For now.
    */
    check(prop: Gen<Result>): {result: Result, args: Array<any>, successes: number, discards: number} {
        let discards = 0;
        let successes = 0;
        // let shrinks = 0;
        let result = Result.Exception("Didn't run"); 
        // let shrunkenResult;
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
    }

    /**
    @method checkAsync
    @param prop {(Result &rarr; void) &rarr; Gen[void]} Property to test.
    @param k {Object &rarr; void}
    */
    checkAsync(prop: (cb: (r: Result) => void) => Gen<any>, k: (x: {result: Result, args: Array<any>, successes: number, discards: number}) => void): void {
        const self = this;
        let discards = 0;
        let successes = 0;
        // let shrinks = 0;
        let pargs: Array<any> = [];
        const cont = (res: Result) => {
            const keepGoing = successes < (self.maxSuccesses-1) && discards < (self.maxDiscards-1);
            if(res === Result.Passed) {
                successes++;
                if(keepGoing) setImmediate(() => self.testAsync(prop, cont));
                else k({ result: res, args: pargs, successes: successes, discards: discards });
            } else if(res === Result.Undecided) {
                discards++;
                if(keepGoing) setImmediate(() => self.testAsync(prop, cont));
                else k({ result: res, args: pargs, successes: successes, discards: discards });
            } else if(res === Result.Proved) {
                successes++;
                k({ result: res, args: pargs, successes: successes, discards: discards });
            } else if(res === Result.Failed) {
                /*
                while(shrinks++ < self.maxShrinks && shrunkenResult !== Result.Failed) {
                    

                }
                */
                k({ result: res, args: pargs, successes: successes, discards: discards });
            } else {
                k({ result: res, args: pargs, successes: successes, discards: discards });
            }
        };                   

        const gen = prop(cont);
        pargs = gen.args;
        gen.generate(this.rng, this.initialSize, this.catchExceptions);
    }

    /**
    @method testRun
    @param prop {Gen[Result]} Property to test.
    @param asserter {(Bool, String) &rarr; void} Assert function.
    */
    testRun(prop: Gen<Result>, asserter: (b: boolean, s: string) => void): void {
        const r = this.check(prop);
        let msg = r.result.type + ' after '+r.successes+' successes and '+r.discards+' discards.';
        if(r.result === Result.Failed || r.result.type === 'Exception') {
            msg += '\n\tWith arguments: '+this.stringify(r.args);
        }
        if(r.result.type === 'Exception') {
            msg += '\n\tThrowing: '+r.result.exception.toString();
        }

        asserter(r.result.isSuccess, msg);
    }

    /**
    @method testRunAsync
    @param prop {(Result &rarr; void) &rarr; Gen[void]} Property to test.
    @param asserter {(Bool, String) &rarr; void} Assert function.
    */
    testRunAsync(prop: (cb: (r: Result) => void) => Gen<any>, asserter: (b: boolean, s: string) => void): void {
        const self = this;
        this.checkAsync(prop, r => {
            let msg = r.result.type + ' after '+r.successes+' successes and '+r.discards+' discards.';
            if(r.result === Result.Failed || r.result.type === 'Exception') {
                msg += '\n\tWith arguments: '+self.stringify(r.args);
            }
            if(r.result.type === 'Exception') {
                msg += '\n\tThrowing: '+r.result.exception.toString();
            }
            asserter(r.result.isSuccess, msg);
        });        
    }

    /**
    A TestRunner instance with the default configuration.
    @property Default
    @static
    @type TestRunner
    */
    static Default = new TestRunner({});
}    
