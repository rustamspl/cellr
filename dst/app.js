(function () {
'use strict';

var ErrorLogger = {
    log: function log() {}
};
if (console && console.log) {
    ErrorLogger.log = function() {
        console.log.apply(console, arguments);
    };
}

//-------------
var is = Object.is || function is(a, b) {
    if (a === 0 && b === 0) {
        return 1 / a == 1 / b;
    }
    return a === b || (a != a && b != b);
};
//-------------

//-------------
function extend(dst, src) {
    for (var i in src) {
        if (src.hasOwnProperty(i)) {
            dst[i] = src[i];
        }
    }
    return dst;
}
//-------------
function Class(_super, _factory) {
    var _proto = _factory(_super);
    var _constructor = _proto._constructor;
    delete _proto._constructor;
    _constructor.prototype = _super.prototype ? extend(Object.create(_super.prototype), _proto) : _proto;
    return _constructor;
}
//-------------

var EventEmitter = Class(Object.create(null), function() {
    return {
        _constructor: function() {
            this._cbs = Object.create(null);
        },
        emit: function(evt) {
            if (!evt.type) {
                evt = {
                    type: evt
                };
            }
            var callbacks = this._cbs[evt.type];
            if (!callbacks) {
                return;
            }          
            for (var i = callbacks.length - 1; i >= 0; i--) {
                if (!(callbacks[i](evt))) {
                    callbacks.splice(i, 1);
                }
            }
        },
        on: function(evt, cb) {
            var callbacks = this._cbs;
            var h = (callbacks[evt] = callbacks[evt] || []);
            h.push(cb);
        },
        off: function(evt, cb) {
            var cbs = this._cbs[evt];
            if (!cbs) {
                return;
            }
            var ind = cbs.indexOf(cb);
            if (ind > -1) {
                cbs.splice(ind, 1);
            }
        }
    };
});

var global = Function('return this;')();

var nextTick;
/* istanbul ignore next */
if (global.process && process.toString() == '[object process]' && process.nextTick) {
    nextTick = process.nextTick;
} else if (global.setImmediate) {
    nextTick = function nextTick(cb) {
        setImmediate(cb);
    };
} else if (global.Promise && Promise.toString().indexOf('[native code]') != -1) {
    var prm = Promise.resolve();
    nextTick = function nextTick(cb) {
        prm.then(function() {
            cb();
        });
    };
} else {
    var queue;
    global.addEventListener('message', function() {
        if (queue) {
            var track = queue;
            queue = null;
            for (var i = 0, l = track.length; i < l; i++) {
                try {
                    track[i]();
                } catch (err) {
                    global.console && global.console.log && global.console.log(err);
                }
            }
        }
    });
    nextTick = function nextTick(cb) {
        if (queue) {
            queue.push(cb);
        } else {
            queue = [cb];
            postMessage('__tic__', '*');
        }
    };
}
var nextTick$1 = nextTick;

var EventEmitterProto = EventEmitter.prototype;
var evtOn = EventEmitterProto.on;
//var evtOff = EventEmitterProto.off;
var evtEmit = EventEmitterProto.emit;
var MAX = Number.MAX_SAFE_INTEGER || 0x1fffffffffffff;
//var errorIndexCounter = 0;
var pushingIndexCounter = 0;
var G = {
    relPl: Object.create(null)
};
var relPlIndex = MAX;
var relPlToInd = -1;
var relPlned = false;
var curlyRel = false;
var curCell = null;
var error = {
    original: null
};
var relVer = 1;
var afterRelCallbacks;

function rel() {
    if (!relPlned) {
        return;
    }
    var relPl = G.relPl;
    relPlned = false;
    curlyRel = true;
    var queue = relPl[relPlIndex];
    for (;;) {
        var cell = queue && queue.shift();
        if (!cell) {
            if (relPlIndex == relPlToInd) {
                break;
            }
            queue = relPl[++relPlIndex];
            continue;
        }
        var level = cell._lev;
        var chEvt = cell._chEvt;
        if (!chEvt) {
            if (level > relPlIndex || cell._levInRel == -1) {
                if (!queue.length) {
                    if (relPlIndex == relPlToInd) {
                        break;
                    }
                    queue = relPl[++relPlIndex];
                }
                continue;
            }
            cell.clc();
            level = cell._lev;
            chEvt = cell._chEvt;
            if (level > relPlIndex) {
                if (!queue.length) {
                    queue = relPl[++relPlIndex];
                }
                continue;
            }
        }
        cell._levInRel = -1;
        if (chEvt) {
            var oldRelPlIndex = relPlIndex;
            cell._fixedValue = cell._val;
            cell._chEvt = null;
            evtEmit.call(cell, chEvt);
            var pushingIndex = cell._pushInd;
            var slaves = cell._fws;
            for (var i = 0, l = slaves.length; i < l; i++) {
                var slave = slaves[i];
                if (slave._lev <= level) {
                    slave._lev = level + 1;
                }
                if (pushingIndex >= slave._pushInd) {
                    slave._pushInd = pushingIndex;
                    slave._chEvt = null;
                    slave._addToRel();
                }
            }
            if (relPlIndex != oldRelPlIndex) {
                queue = relPl[relPlIndex];
                continue;
            }
        }
        if (!queue.length) {
            if (relPlIndex == relPlToInd) {
                break;
            }
            queue = relPl[++relPlIndex];
        }
    }
    relPlIndex = MAX;
    relPlToInd = -1;
    curlyRel = false;
    relVer++;
    if (afterRelCallbacks) {
        var callbacks = afterRelCallbacks;
        afterRelCallbacks = null;
        for (var j = 0, m = callbacks.length; j < m; j++) {
            callbacks[j]();
        }
    }
}

function onValCh(evt) {
    this._pushInd = ++pushingIndexCounter;
    if (this._chEvt) {
        evt.prev = this._chEvt;
        this._chEvt = evt;
        if (this._val === this._fixedValue) {
            this._canCancelCh = false;
        }
    } else {
        evt.prev = null;
        this._chEvt = evt;
        this._canCancelCh = false;
        this._addToRel();
    }
    return true;
}
var Cell = Class(EventEmitter, function(_super) {
    return {
        _constructor: function(value, opts) {
            _super.call(this);
            this._onValCh = onValCh.bind(this);
            if (!opts) {
                opts = Object.create(null);
            }
            this.owner = opts.owner || this;
            this._clc = typeof value == 'function' ? value : null;
            this._validate = opts.validate || null;
            if (this._clc) {
                this._fixedValue = this._val = undefined;
            } else {
                if (this._validate) {
                    this._validate(value, undefined);
                }
                this._fixedValue = this._val = value;
                if (value instanceof EventEmitter) {
                    value.on('change', this._onValCh);
                }
            }
            this._error = null;
            this._inited = false;
            this._curlyClcing = false;
            this._active = false;
            this._hasFols = false;
            this._pushInd = 0;
            this._ver = 0;
            this._bws = undefined;
            this._fws = [];
            this._lev = 0;
            this._levInRel = -1;
            this._status = null;
            this._chEvt = null;
            this._canCancelCh = true;
            this._lastErrEvt = null;
        },
        on: function on(type, listener, context) {
            if (relPlned) {
                rel();
            }
            this._act();
            evtOn.call(this, type, listener, arguments.length >= 3 ? context : this.owner);
            this._hasFols = true;
            return this;
        },
        off: function off() {
            if (relPlned) {
                rel();
            }
            evtOff.apply(this, arguments);
            if (!this._fws.length && !this._cbs.change && !this._cbs.error && this._hasFols) {
                this._hasFols = false;
                this._deact();
            }
            return this;
        },
        _regSl: function _regSl(slave) {
            this._act();
            this._fws.push(slave);
            this._hasFols = true;
        },
        _unregSl: function _unregSl(slave) {
            this._fws.splice(this._fws.indexOf(slave), 1);
            if (!this._fws.length && !this._cbs.change && !this._cbs.error) {
                this._hasFols = false;
                this._deact();
            }
        },
        _act: function _act() {
            if (!this._clc || this._active || this._bws === null) {
                return;
            }
            var bws = this._bws;
            if (this._ver < relVer) {
                var value = this._tryClc();
                if (bws || this._bws || !this._inited) {
                    if (value === error) {
                        this._fail(error.original);
                    } else {
                        this._push(value, false, false);
                    }
                }
                bws = this._bws;
            }
            if (bws) {
                var i = bws.length;
                do {
                    bws[--i]._regSl(this);
                } while (i);
                this._active = true;
            }
        },
        _deact: function _deact() {
            if (!this._active) {
                return;
            }
            var bws = this._bws;
            var i = bws.length;
            do {
                bws[--i]._unregSl(this);
            } while (i);
            if (this._levInRel != -1 && !this._chEvt) {
                this._levInRel = -1;
            }
            this._active = false;
        },
        _addToRel: function _addToRel() {
            var level = this._lev;
            if (level <= this._levInRel) {
                return;
            }
            var queue;
            var relPl = G.relPl;
            (relPl[level] || (relPl[level] = (queue = []), queue)).push(this);
            if (relPlIndex > level) {
                relPlIndex = level;
            }
            if (relPlToInd < level) {
                relPlToInd = level;
            }
            this._levInRel = level;
            if (!relPlned && !curlyRel) {
                relPlned = true;
                nextTick$1(rel);
            }
        },
        get: function get() {
            if (relPlned && this._clc) {
                rel();
            }
            if (this._clc && !this._active && this._ver < relVer && this._bws !== null) {
                var oldBws = this._bws;
                var value = this._tryClc();
                var bws = this._bws;
                if (oldBws || bws || !this._inited) {
                    if (bws && this._hasFols) {
                        var i = bws.length;
                        do {
                            bws[--i]._regSl(this);
                        } while (i);
                        this._active = true;
                    }
                    if (value === error) {
                        this._fail(error.original);
                    } else {
                        this._push(value, false, false);
                    }
                }
            }
            if (curCell) {
                var curCellBws = curCell._bws;
                var level = this._lev;
                if (curCellBws) {
                    if (curCellBws.indexOf(this) == -1) {
                        curCellBws.push(this);
                        if (curCell._lev <= level) {
                            curCell._lev = level + 1;
                        }
                    }
                } else {
                    curCell._bws = [this];
                    curCell._lev = level + 1;
                }
            }
            return this._val;
        },
        clc: function clc() {
            if (!this._clc) {
                return false;
            }
            if (relPlned) {
                rel();
            }
            var hasFollowers = this._hasFols;
            var oldBws;
            var oldLevel;
            if (hasFollowers) {
                oldBws = this._bws;
                oldLevel = this._lev;
            }
            var value = this._tryClc();
            if (hasFollowers) {
                var bws = this._bws;
                var newBwsCount = 0;
                if (bws) {
                    var i = bws.length;
                    do {
                        var bw = bws[--i];
                        if (!oldBws || oldBws.indexOf(bw) == -1) {
                            bw._regSl(this);
                            newBwsCount++;
                        }
                    } while (i);
                }
                if (oldBws && (bws ? bws.length - newBwsCount : 0) < oldBws.length) {
                    for (var j = oldBws.length; j;) {
                        var oldBws = oldBws[--j];
                        if (!bws || bws.indexOf(oldBws) == -1) {
                            oldBws._unregSl(this);
                        }
                    }
                }
                this._active = !!(bws && bws.length);
                if (curlyRel && this._lev > oldLevel) {
                    this._addToRel();
                    return false;
                }
            }
            if (value === error) {
                this._fail(error.original);
                return true;
            }
            return this._push(value, false, true);
        },
        _tryClc: function _tryClc() {
            if (this._curlyClcing) {
                throw new TypeError('Circular deps');
            }
            var prevCell = curCell;
            curCell = this;
            this._curlyClcing = true;
            this._bws = null;
            this._lev = 0;
            try {
                return this._clc();
            } catch (err) {
                error.original = err;
                return error;
            } finally {
                curCell = prevCell;
                this._ver = relVer + curlyRel;
                this._curlyClcing = false;
            }
        },
        set: function set(value) {
            var oldValue = this._val;
            if (this._validate) {
                this._validate(value, oldValue);
            }
            this.push(value);
            return this;
        },
        push: function push(value) {
            this._push(value, true, false);
            return this;
        },
        _push: function _push(value, external, clcing) {
            this._inited = true;
            var oldValue = this._val;
            if (external && curlyRel && this._hasFols) {
                if (is(value, oldValue)) {
                    this._setError(null);
                    return false;
                }
                var cell = this;
                (afterRelCallbacks || (afterRelCallbacks = [])).push(function() {
                    cell._push(value, true, false);
                });
                return true;
            }
            if (external || !curlyRel && clcing) {
                this._pushInd = ++pushingIndexCounter;
            }
            this._setError(null);
            if (is(value, oldValue)) {
                return false;
            }
            this._val = value;
            if (oldValue instanceof EventEmitter) {
                oldValue.off('change', this._onValCh);
            }
            if (value instanceof EventEmitter) {
                value.on('change', this._onValCh);
            }
            if (this._hasFols) {
                if (this._chEvt) {
                    if (is(value, this._fixedValue) && this._canCancelCh) {
                        this._levInRel = -1;
                        this._chEvt = null;
                    } else {
                        this._chEvt = {
                            target: this,
                            type: 'change',
                            oldValue: oldValue,
                            value: value,
                            prev: this._chEvt
                        };
                    }
                } else {
                    this._chEvt = {
                        target: this,
                        type: 'change',
                        oldValue: oldValue,
                        value: value,
                        prev: null
                    };
                    this._canCancelCh = true;
                    this._addToRel();
                }
            } else {
                if (external || !curlyRel && clcing) {
                    relVer++;
                }
                this._fixedValue = value;
                this._ver = relVer + curlyRel;
            }
            return true;
        },
        _fail: function _fail(err) {
            ErrorLogger.log(err);
            if (!(err instanceof Error)) {
                err = new Error(String(err));
            }
            this._setError(err);
        },
        _setError: function _setError(err) {
            if (!err && !this._error) {
                return;
            }
            this._error = err;
            if (err) {
                this._hErrEvt({
                    type: 'error',
                    error: err
                });
            }
        },
        _hErrEvt: function _hErrEvt(evt) {
            if (this._lastErrEvt === evt) {
                return;
            }
            this._lastErrEvt = evt;
            evtEmit.call(this, evt);
            var slaves = this._fws;
            for (var i = 0, l = slaves.length; i < l; i++) {
                slaves[i]._hErrEvt(evt);
            }
        }
    };
});

(function(root) {
    if (root.Promise) return;
    // Store setTimeout reference so promise-polyfill will be unaffected by
    // other code modifying setTimeout (like sinon.useFakeTimers())
    var setTimeoutFunc = setTimeout;

    function noop() {}
    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function() {
            fn.apply(thisArg, arguments);
        };
    }

    function Promise(fn) {
        if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
        if (typeof fn !== 'function') throw new TypeError('not a function');
        this._state = 0;
        this._handled = false;
        this._value = undefined;
        this._deferreds = [];
        doResolve(fn, this);
    }

    function handle(self, deferred) {
        while (self._state === 3) {
            self = self._value;
        }
        if (self._state === 0) {
            self._deferreds.push(deferred);
            return;
        }
        self._handled = true;
        Promise._immediateFn(function() {
            var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
                return;
            }
            var ret;
            try {
                ret = cb(self._value);
            } catch (e) {
                reject(deferred.promise, e);
                return;
            }
            resolve(deferred.promise, ret);
        });
    }

    function resolve(self, newValue) {
        try {
            // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                var then = newValue.then;
                if (newValue instanceof Promise) {
                    self._state = 3;
                    self._value = newValue;
                    finale(self);
                    return;
                } else if (typeof then === 'function') {
                    doResolve(bind(then, newValue), self);
                    return;
                }
            }
            self._state = 1;
            self._value = newValue;
            finale(self);
        } catch (e) {
            reject(self, e);
        }
    }

    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        finale(self);
    }

    function finale(self) {
        if (self._state === 2 && self._deferreds.length === 0) {
            Promise._immediateFn(function() {
                if (!self._handled) {
                    Promise._unhandledRejectionFn(self._value);
                }
            });
        }
        for (var i = 0, len = self._deferreds.length; i < len; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }

    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.promise = promise;
    }
    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, self) {
        var done = false;
        try {
            fn(function(value) {
                if (done) return;
                done = true;
                resolve(self, value);
            }, function(reason) {
                if (done) return;
                done = true;
                reject(self, reason);
            });
        } catch (ex) {
            if (done) return;
            done = true;
            reject(self, ex);
        }
    }
    Promise.prototype['catch'] = function(onRejected) {
        return this.then(null, onRejected);
    };
    Promise.prototype.then = function(onFulfilled, onRejected) {
        var prom = new(this.constructor)(noop);
        handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    };
    Promise.all = function(arr) {
        var args = Array.prototype.slice.call(arr);
        return new Promise(function(resolve, reject) {
            if (args.length === 0) return resolve([]);
            var remaining = args.length;

            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(val, function(val) {
                                res(i, val);
                            }, reject);
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                } catch (ex) {
                    reject(ex);
                }
            }
            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };
    Promise.resolve = function(value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
            return value;
        }
        return new Promise(function(resolve) {
            resolve(value);
        });
    };
    Promise.reject = function(value) {
        return new Promise(function(resolve, reject) {
            reject(value);
        });
    };
    Promise.race = function(values) {
        return new Promise(function(resolve, reject) {
            for (var i = 0, len = values.length; i < len; i++) {
                values[i].then(resolve, reject);
            }
        });
    };
    // Use polyfill for setImmediate for performance gains
    Promise._immediateFn = (typeof setImmediate === 'function' && function(fn) {
        setImmediate(fn);
    }) || function(fn) {
        setTimeoutFunc(fn, 0);
    };
    Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
        if (typeof console !== 'undefined' && console) {
            console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
        }
    };
    /**
     * Set the immediate function to execute callbacks
     * @param fn {function} Function to execute
     * @deprecated
     */
    Promise._setImmediateFn = function _setImmediateFn(fn) {
        Promise._immediateFn = fn;
    };
    /**
     * Change the function to execute on unhandled rejection
     * @param {function} fn Function to execute on unhandled rejection
     * @deprecated
     */
    Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
        Promise._unhandledRejectionFn = fn;
    };
    root.Promise = Promise;
})(global);
var Promise$1 = global.Promise;

(function(self) {
    'use strict';
    if (self.fetch) {
        return
    }
    var support = {
        searchParams: 'URLSearchParams' in self,
        iterable: 'Symbol' in self && 'iterator' in Symbol,
        blob: 'FileReader' in self && 'Blob' in self && (function() {
            try {
                new Blob();
                return true
            } catch (e) {
                return false
            }
        })(),
        formData: 'FormData' in self,
        arrayBuffer: 'ArrayBuffer' in self
    };
    if (support.arrayBuffer) {
        var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];
        var isDataView = function(obj) {
            return obj && DataView.prototype.isPrototypeOf(obj)
        };
        var isArrayBufferView = ArrayBuffer.isView || function(obj) {
            return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
        };
    }

    function normalizeName(name) {
        if (typeof name !== 'string') {
            name = String(name);
        }
        if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
            throw new TypeError('Invalid character in header field name')
        }
        return name.toLowerCase()
    }

    function normalizeValue(value) {
        if (typeof value !== 'string') {
            value = String(value);
        }
        return value
    }
    // Build a destructive iterator for the value list
    function iteratorFor(items) {
        var iterator = {
            next: function() {
                var value = items.shift();
                return {
                    done: value === undefined,
                    value: value
                }
            }
        };
        if (support.iterable) {
            iterator[Symbol.iterator] = function() {
                return iterator
            };
        }
        return iterator
    }

    function Headers(headers) {
        this.map = {};
        if (headers instanceof Headers) {
            headers.forEach(function(value, name) {
                this.append(name, value);
            }, this);
        } else if (Array.isArray(headers)) {
            headers.forEach(function(header) {
                this.append(header[0], header[1]);
            }, this);
        } else if (headers) {
            Object.getOwnPropertyNames(headers).forEach(function(name) {
                this.append(name, headers[name]);
            }, this);
        }
    }
    Headers.prototype.append = function(name, value) {
        name = normalizeName(name);
        value = normalizeValue(value);
        var oldValue = this.map[name];
        this.map[name] = oldValue ? oldValue + ',' + value : value;
    };
    Headers.prototype['delete'] = function(name) {
        delete this.map[normalizeName(name)];
    };
    Headers.prototype.get = function(name) {
        name = normalizeName(name);
        return this.has(name) ? this.map[name] : null
    };
    Headers.prototype.has = function(name) {
        return this.map.hasOwnProperty(normalizeName(name))
    };
    Headers.prototype.set = function(name, value) {
        this.map[normalizeName(name)] = normalizeValue(value);
    };
    Headers.prototype.forEach = function(callback, thisArg) {
        for (var name in this.map) {
            if (this.map.hasOwnProperty(name)) {
                callback.call(thisArg, this.map[name], name, this);
            }
        }
    };
    Headers.prototype.keys = function() {
        var items = [];
        this.forEach(function(value, name) {
            items.push(name);
        });
        return iteratorFor(items)
    };
    Headers.prototype.values = function() {
        var items = [];
        this.forEach(function(value) {
            items.push(value);
        });
        return iteratorFor(items)
    };
    Headers.prototype.entries = function() {
        var items = [];
        this.forEach(function(value, name) {
            items.push([name, value]);
        });
        return iteratorFor(items)
    };
    if (support.iterable) {
        Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
    }

    function consumed(body) {
        if (body.bodyUsed) {
            return Promise$1.reject(new TypeError('Already read'))
        }
        body.bodyUsed = true;
    }

    function fileReaderReady(reader) {
        return new Promise$1(function(resolve, reject) {
            reader.onload = function() {
                resolve(reader.result);
            };
            reader.onerror = function() {
                reject(reader.error);
            };
        })
    }

    function readBlobAsArrayBuffer(blob) {
        var reader = new FileReader();
        var promise = fileReaderReady(reader);
        reader.readAsArrayBuffer(blob);
        return promise
    }

    function readBlobAsText(blob) {
        var reader = new FileReader();
        var promise = fileReaderReady(reader);
        reader.readAsText(blob);
        return promise
    }

    function readArrayBufferAsText(buf) {
        var view = new Uint8Array(buf);
        var chars = new Array(view.length);
        for (var i = 0; i < view.length; i++) {
            chars[i] = String.fromCharCode(view[i]);
        }
        return chars.join('')
    }

    function bufferClone(buf) {
        if (buf.slice) {
            return buf.slice(0)
        } else {
            var view = new Uint8Array(buf.byteLength);
            view.set(new Uint8Array(buf));
            return view.buffer
        }
    }

    function Body() {
        this.bodyUsed = false;
        this._initBody = function(body) {
            this._bodyInit = body;
            if (!body) {
                this._bodyText = '';
            } else if (typeof body === 'string') {
                this._bodyText = body;
            } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
                this._bodyBlob = body;
            } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
                this._bodyFormData = body;
            } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                this._bodyText = body.toString();
            } else if (support.arrayBuffer && support.blob && isDataView(body)) {
                this._bodyArrayBuffer = bufferClone(body.buffer);
                // IE 10-11 can't handle a DataView body.
                this._bodyInit = new Blob([this._bodyArrayBuffer]);
            } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
                this._bodyArrayBuffer = bufferClone(body);
            } else {
                throw new Error('unsupported BodyInit type')
            }
            if (!this.headers.get('content-type')) {
                if (typeof body === 'string') {
                    this.headers.set('content-type', 'text/plain;charset=UTF-8');
                } else if (this._bodyBlob && this._bodyBlob.type) {
                    this.headers.set('content-type', this._bodyBlob.type);
                } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                    this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
                }
            }
        };
        if (support.blob) {
            this.blob = function() {
                var rejected = consumed(this);
                if (rejected) {
                    return rejected
                }
                if (this._bodyBlob) {
                    return Promise$1.resolve(this._bodyBlob)
                } else if (this._bodyArrayBuffer) {
                    return Promise$1.resolve(new Blob([this._bodyArrayBuffer]))
                } else if (this._bodyFormData) {
                    throw new Error('could not read FormData body as blob')
                } else {
                    return Promise$1.resolve(new Blob([this._bodyText]))
                }
            };
            this.arrayBuffer = function() {
                if (this._bodyArrayBuffer) {
                    return consumed(this) || Promise$1.resolve(this._bodyArrayBuffer)
                } else {
                    return this.blob().then(readBlobAsArrayBuffer)
                }
            };
        }
        this.text = function() {
            var rejected = consumed(this);
            if (rejected) {
                return rejected
            }
            if (this._bodyBlob) {
                return readBlobAsText(this._bodyBlob)
            } else if (this._bodyArrayBuffer) {
                return Promise$1.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
            } else if (this._bodyFormData) {
                throw new Error('could not read FormData body as text')
            } else {
                return Promise$1.resolve(this._bodyText)
            }
        };
        if (support.formData) {
            this.formData = function() {
                return this.text().then(decode)
            };
        }
        this.json = function() {
            return this.text().then(JSON.parse)
        };
        return this
    }
    // HTTP methods whose capitalization should be normalized
    var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

    function normalizeMethod(method) {
        var upcased = method.toUpperCase();
        return (methods.indexOf(upcased) > -1) ? upcased : method
    }

    function Request(input, options) {
        options = options || {};
        var body = options.body;
        if (input instanceof Request) {
            if (input.bodyUsed) {
                throw new TypeError('Already read')
            }
            this.url = input.url;
            this.credentials = input.credentials;
            if (!options.headers) {
                this.headers = new Headers(input.headers);
            }
            this.method = input.method;
            this.mode = input.mode;
            if (!body && input._bodyInit != null) {
                body = input._bodyInit;
                input.bodyUsed = true;
            }
        } else {
            this.url = String(input);
        }
        this.credentials = options.credentials || this.credentials || 'omit';
        if (options.headers || !this.headers) {
            this.headers = new Headers(options.headers);
        }
        this.method = normalizeMethod(options.method || this.method || 'GET');
        this.mode = options.mode || this.mode || null;
        this.referrer = null;
        if ((this.method === 'GET' || this.method === 'HEAD') && body) {
            throw new TypeError('Body not allowed for GET or HEAD requests')
        }
        this._initBody(body);
    }
    Request.prototype.clone = function() {
        return new Request(this, {
            body: this._bodyInit
        })
    };

    function decode(body) {
        var form = new FormData();
        body.trim().split('&').forEach(function(bytes) {
            if (bytes) {
                var split = bytes.split('=');
                var name = split.shift().replace(/\+/g, ' ');
                var value = split.join('=').replace(/\+/g, ' ');
                form.append(decodeURIComponent(name), decodeURIComponent(value));
            }
        });
        return form
    }

    function parseHeaders(rawHeaders) {
        var headers = new Headers();
        rawHeaders.split(/\r?\n/).forEach(function(line) {
            var parts = line.split(':');
            var key = parts.shift().trim();
            if (key) {
                var value = parts.join(':').trim();
                headers.append(key, value);
            }
        });
        return headers
    }
    Body.call(Request.prototype);

    function Response(bodyInit, options) {
        if (!options) {
            options = {};
        }
        this.type = 'default';
        this.status = 'status' in options ? options.status : 200;
        this.ok = this.status >= 200 && this.status < 300;
        this.statusText = 'statusText' in options ? options.statusText : 'OK';
        this.headers = new Headers(options.headers);
        this.url = options.url || '';
        this._initBody(bodyInit);
    }
    Body.call(Response.prototype);
    Response.prototype.clone = function() {
        return new Response(this._bodyInit, {
            status: this.status,
            statusText: this.statusText,
            headers: new Headers(this.headers),
            url: this.url
        })
    };
    Response.error = function() {
        var response = new Response(null, {
            status: 0,
            statusText: ''
        });
        response.type = 'error';
        return response
    };
    var redirectStatuses = [301, 302, 303, 307, 308];
    Response.redirect = function(url, status) {
        if (redirectStatuses.indexOf(status) === -1) {
            throw new RangeError('Invalid status code')
        }
        return new Response(null, {
            status: status,
            headers: {
                location: url
            }
        })
    };
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
    self.fetch = function(input, init) {
        return new Promise$1(function(resolve, reject) {
            var request = new Request(input, init);
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var options = {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: parseHeaders(xhr.getAllResponseHeaders() || '')
                };
                options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
                var body = 'response' in xhr ? xhr.response : xhr.responseText;
                resolve(new Response(body, options));
            };
            xhr.onerror = function() {
                reject(new TypeError('Network request failed'));
            };
            xhr.ontimeout = function() {
                reject(new TypeError('Network request failed'));
            };
            xhr.open(request.method, request.url, true);
            if (request.credentials === 'include') {
                xhr.withCredentials = true;
            }
            if ('responseType' in xhr && support.blob) {
                xhr.responseType = 'blob';
            }
            request.headers.forEach(function(value, name) {
                xhr.setRequestHeader(name, value);
            });
            xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
        })
    };
    self.fetch.polyfill = true;
})(global);

//-------------

//-------------

//-------------
function extend$1(dst, src) {
    for (var i in src) {
        if (src.hasOwnProperty(i)) {
            dst[i] = src[i];
        }
    }
    return dst;
}
//-------------
function Class$1(_super, _factory) {
    var _proto = _factory(_super);
    var _constructor = _proto._constructor;
    delete _proto._constructor;
    _constructor.prototype = _super.prototype ? extend$1(Object.create(_super.prototype), _proto) : _proto;
    return _constructor;
}
//-------------

var ObsList = Class$1(EventEmitter, function(_super) {
    return {
        _constructor: function(data) {
            _super.apply(this);
            this.change(data || []);
        },
        change: function(v) {
            var old = this.data;
            this.data = v;
            this.emit({
                type: 'change',
                method: 'change',
                value: v,
                oldValue: old
            });
        },
        set: function(i, v) {
            var old = this.data[i];
            var oldLength = this.data.length;
            this.data[i] = v;
            this.emit({
                type: 'change',
                method: 'set',
                index: i,
                value: v,
                oldValue: old,
                oldLength: oldLength
            });
        },
        insert: function(i, v) {
            var oldLength = this.data.length;
            this.data.splice(i, 0, v);
            this.emit({
                type: 'change',
                method: 'insert',
                index: i,
                value: v,
                oldLength: oldLength
            });
        },
        remove: function(i) {
            var old = this.data.splice(i, 1);
            if (old.length) {
                this.emit({
                    type: 'change',
                    method: 'remove',
                    index: i,
                    oldValue: old[0]
                });
            }
        },
        push: function(v) {
            this.insert(this.data.length, v);
        }
    };
});

var ObsMap = Class$1(EventEmitter, function(_super) {
    return {
        _constructor: function(data) {
            _super.apply(this);
            this.change(data || {});
        },
        change: function(v) {
            var old = this.data;
            this.data = v;
            this.emit({
                type: 'change',
                method: 'change',
                value: v,
                oldValue: old
            });
        },
        set: function(k, v) {
            var old = this.data[k];
            this.data[k] = v;
            this.emit({
                type: 'change',
                method: 'set',
                key: k,
                value: v,
                oldValue: old
            });
        }
    };
});

var document = global.document;
var createElement = document.createElement.bind(document);

var addEventListener = document.addEventListener;

function _defaultFactory(data) {
    return new Node({
        data: data
    })
}

function handleCellData(evt) {
    if (!this.active) return;
    this.el.innerHTML = evt.value;
    return true;
}

function handleObsListData(evt) {
    if (!this.active) return;
    var el = this.el;
    var childs = this._childs;
    switch (evt.method) {
        case 'change':
            for (var i = 0, l = evt.oldValue.length; i < l; i++) {
                el.removeChild(el.firstChild);
                childs[i].deactivate();
            }
            var val = evt.value;
            for (var i = 0, l = val.length; i < l; i++) {
                var newNode = this._factory(val[i]);
                el.appendChild(newNode.el);
                childs.push(newNode);
            }
            break;
        case 'set':
            var newNode = this._factory(evt.value);
            if (evt.oldLength == 0) {
                el.appendChild(newNode.el);
                childs.push(newNode);
            } else {
                var i = evt.index;
                childs[i].deactivate();
                el.replaceChild(newNode.el, el.childNodes[i]);
                childs[i] = newNode;
            }
            break;
        case 'insert':
            var newNode = this._factory(evt.value);
            if (evt.oldLength <= evt.index) {
                el.appendChild(newNode.el);
                childs.push(newNode);
            } else {
                var i = evt.index;
                el.insertBefore(newNode.el, el.childNodes[i]);
                childs.splice(i, 0, newNode);
            }
            break;
        case 'remove':
            var i = evt.index;
            el.removeChild(el.childNodes[evt.index]);
            childs[i].deactivate();
            childs.splice(i, 1);
            break;
    }
    return true;
}
//==============================================
function handleObsMapSetter(setter, evt) {
    if (!this.active) return;
    var el = this.el;
    switch (evt.method) {
        case 'change':
            var oldValue = evt.oldValue;
            var attrs = evt.value;
            for (var k in oldValue) {
                if (!(k in value)) {
                    setter(k);
                }
            }
            for (var k in attrs) {
                setter(k, attrs[k]);
            }
            break;
        case 'set':
            setter(evt.key, evt.value);
            break;
    }
    return true;
}
var setPropFns = {};

function setPropFactory(t) {
    var setter = '_set' + t + 'Val';
    return setPropFns[t] || (setPropFns[t] = function(k, v) {
        var mapD = this._mapd || (this._mapd = {});
        var mapData = mapD[t] || (mapD[t] = {
            cbs: {},
            cls: {}
        });
        var cbs = mapData.cbs;
        var cb = cbs[k] || (cbs[k] = (function(evt) {
            if (!this.active) return;
            this[setter](k, evt.value);
            return true;
        }).bind(this));
        var cls = mapData.cls;
        if (k in cls) {
            cls[k].off(cb);
            delete cls[k];
        }
        if (v instanceof Cell) {
            v.on('change', cb);
            this[setter](k, v.get());
            cls[k] = v;
        } else {
            this[setter](k, v);
        }
    });
}
var bindMapFns = {};

function bindMapFactory(name) {
    var setProp = setPropFactory(name);
    return bindMapFns[name] || (bindMapFns[name] = function(map) {
        if (!map) return;
        var _setProp = setProp.bind(this);
        if (map instanceof ObsMap) {
            var _handleObsMapAttrs = handleObsMapSetter.bind(this, _setProp);
            map.on('change', _handleObsMapAttrs);
        } else {
            for (var k in map) {
                _setProp(k, map[k]);
            }
        }
    })
}
var Node = Class$1(Object.create(null), function(_super) {
    return {
        _constructor: function(opts) {
            var opts = opts || Object.create(null);
            var el = this.el = createElement(opts.tag || 'div');
            var data = opts.data;
            this._childs = [];
            this.active = true;
            if (data instanceof ObsList) {
                this._factory = opts.factory || _defaultFactory;
                var _handleObsListData = handleObsListData.bind(this);
                data.on('change', _handleObsListData);
            } else if (data instanceof Array) {
                this._childs = data;
                for (var i = 0, l = data.length; i < l; i++) {
                    el.appendChild(data[i].el);
                }
            } else if (data instanceof Cell) {
                var _handleCellData = handleCellData.bind(this);
                data.on('change', _handleCellData, this);
                el.innerHTML = data.get();
            } else if (data) {
                el.innerHTML = data;
            }
            bindMapFactory('Attr').call(this, opts.attrs);
            bindMapFactory('Prop').call(this, opts.props);
            bindMapFactory('Style').call(this, opts.style);
        },
        _setAttrVal: function(k, v) {
            if (!v) {
                this.el.removeAttribute(k);
                return;
            }
            this.el.setAttribute(k, v);
        },
        _setPropVal: function(k, v) {
            this.el[k] = v;
        },
        _setStyleVal: function(k, v) {
            this.el.style[k] = v;
        },
        deactivate: function() {
            var childs = this._childs;
            for (var i = 0, l = childs.length; i < l; i++) {
                childs[i].deactivate();
            }
            this._childs = [];
            this.active = false;
        }
    };
});

//-------------------------
addEventListener.call(document, 'DOMContentLoaded', function() {
    var pos = new Cell();
    var ttt = new Cell('z');
    var attrs = new ObsMap();
    var view = new Node({
        data: pos,
        attrs: attrs
    });
    var a = new ObsList();
    //------
    //------
    var container = new Node({
        data: [
            view,
            new Node({
                tag: 'button',
                data: 'btnAdd11',
                props: {
                    onclick: function() {
                        // var r = Math.random();
                        var c = new Cell(function() {
                            return ttt.get() + ':' + pos.get();
                        });
                        a.push(c);
                    }
                }
            }),
            new Node({
                tag: 'button',
                data: 'btnRemove11',
                props: {
                    onclick: function() {
                        a.remove(0);
                    }
                }
            }),
            new Node({
                tag: 'button',
                data: 'btnZZZ11',
                props: {
                    onclick: function() {
                        a.change([456, 678, 446]);
                    }
                }
            }),
            new Node({
                data: a,
                factory: function(val) {
                    var n = new Node({
                        tag: 'input',
                        attrs: {
                            'class': 'inp221'
                        },
                        props: {
                            value: ttt.get(),
                            onkeyup: function() {
                                ttt.set(this.value);
                            },
                            onchange: function() {
                                ttt.set(this.value);
                            }
                        }
                    });
                    ttt.on('change', function(evt) {
                        n.el.value = evt.value;
                        return true;
                    });
                    return n;
                }
            })
        ]
    });
    document.body.appendChild(container.el);
    addEventListener.call(document, 'mousemove', function(evt) {
        pos.set(evt.x);
        attrs.set('class', 'cl' + evt.y);
    });
});

}());
