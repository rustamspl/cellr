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
    if (data instanceof Node) {
        return data;
    }
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
            } else if (data instanceof Node) {
                this._factory = opts.factory || _defaultFactory;
                this._childs.push(data);
                el.appendChild(data.el);
            } else if (data instanceof Array) {
                this._factory = opts.factory || _defaultFactory;
                for (var i = 0, l = data.length; i < l; i++) {
                    var newNode = this._factory(data[i]);
                    this._childs.push(newNode);
                    el.appendChild(newNode.el);
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
//============
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
var selectorCache = {};

function compileSelector(selector) {
    var match, tag = "div",
        classes = [],
        attrs = {};
    while (match = selectorParser.exec(selector)) {
        var type = match[1],
            value = match[2];
        if (type === "" && value !== "") tag = value;
        else if (type === "#") attrs.id = value;
        else if (type === ".") classes.push(value);
        else if (match[3][0] === "[") {
            var attrValue = match[6];
            if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\");
            if (match[4] === "class") classes.push(attrValue);
            else attrs[match[4]] = attrValue || true;
        }
    }
    if (classes.length > 0) attrs.className = classes.join(" ");
    return selectorCache[selector] = {
        tag: tag,
        attrs: attrs
    }
}
function m(selector, data, props, factory) {
    var cached = selectorCache[selector] || compileSelector(selector);
    return new Node({
        tag: cached.tag,
        attrs: cached.attrs,
        data: data,
        props: props,
        factory: factory
    });
}
//==========

(function(root) {
    if (root.Promise) return;
    var PromisePolyfill = function(executor) {
        if (!(this instanceof PromisePolyfill)) throw new Error("Promise must be called with `new`")
        if (typeof executor !== "function") throw new TypeError("executor must be a function")
        var self = this,
            resolvers = [],
            rejectors = [],
            resolveCurrent = handler(resolvers, true),
            rejectCurrent = handler(rejectors, false);
        var instance = self._instance = {
            resolvers: resolvers,
            rejectors: rejectors
        };
   
        function handler(list, shouldAbsorb) {
            return function execute(value) {
                var then;
                try {
                    if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof(then = value.then) === "function") {
                        if (value === self) throw new TypeError("Promise can't be resolved w/ itself")
                        executeOnce(then.bind(value));
                    } else {
                        nextTick$1(function() {
                            if (!shouldAbsorb && list.length === 0) console.error("Possible unhandled promise rejection:", value);
                            for (var i = 0; i < list.length; i++) list[i](value);
                            resolvers.length = 0, rejectors.length = 0;
                            instance.state = shouldAbsorb;
                            instance.retry = function() {
                                execute(value);
                            };
                        });
                    }
                } catch (e) {
                    rejectCurrent(e);
                }
            }
        }

        function executeOnce(then) {
            var runs = 0;

            function run(fn) {
                return function(value) {
                    if (runs++ > 0) return
                    fn(value);
                }
            }
            var onerror = run(rejectCurrent);
            try {
                then(run(resolveCurrent), onerror);
            } catch (e) {
                onerror(e);
            }
        }
        executeOnce(executor);
    };
    PromisePolyfill.prototype.then = function(onFulfilled, onRejection) {
        var self = this,
            instance = self._instance;

        function handle(callback, list, next, state) {
            list.push(function(value) {
                if (typeof callback !== "function") next(value);
                else try {
                    resolveNext(callback(value));
                } catch (e) {
                    if (rejectNext) rejectNext(e);
                }
            });
            if (typeof instance.retry === "function" && state === instance.state) instance.retry();
        }
        var resolveNext, rejectNext;
        var promise = new PromisePolyfill(function(resolve, reject) {
            resolveNext = resolve, rejectNext = reject;
        });
        handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false);
        return promise
    };
    PromisePolyfill.prototype.catch = function(onRejection) {
        return this.then(null, onRejection)
    };
    PromisePolyfill.resolve = function(value) {
        if (value instanceof PromisePolyfill) return value
        return new PromisePolyfill(function(resolve) {
            resolve(value);
        })
    };
    PromisePolyfill.reject = function(value) {
        return new PromisePolyfill(function(resolve, reject) {
            reject(value);
        })
    };
    PromisePolyfill.all = function(list) {
        return new PromisePolyfill(function(resolve, reject) {
            var total = list.length,
                count = 0,
                values = [];
            if (list.length === 0) resolve([]);
            else
                for (var i = 0; i < list.length; i++) {
                    (function(i) {
                        function consume(value) {
                            count++;
                            values[i] = value;
                            if (count === total) resolve(values);
                        }
                        if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
                            list[i].then(consume, reject);
                        } else consume(list[i]);
                    })(i);
                }
        })
    };
    PromisePolyfill.race = function(list) {
        return new PromisePolyfill(function(resolve, reject) {
            for (var i = 0; i < list.length; i++) {
                list[i].then(resolve, reject);
            }
        })
    };
    root.Promise = PromisePolyfill;
})(global);

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

   
    var container = m('', [
        m('button.zzz', 'btnAdd11', {
            onclick: function() {
                // var r = Math.random();
                var c = new Cell(function() {
                    return ttt.get() + ':' + pos.get();
                });
                a.push(c);
            }
        }),
        m('button', 'btnRemove11', {
            onclick: function() {
                a.remove(0);
            }
        }),
        m('button', 'btnZzzzz', {
            onclick: function() {
                a.change([456, 678, 446]);
            }
        }),
        m('', a, {}, function(val) {
            var n = m('input.inp221','', {
                value: ttt.get(),
                onkeydown: function() {
                    var _this = this;
                    setTimeout(function() {
                        ttt.set(_this.value);
                    }, 1);
                }
            });
            ttt.on('change', function(evt) {
                n.el.value = evt.value;
                return true;
            });
            return m('', [n, val]);
        })
    ]);
 
    document.body.appendChild(container.el);
    addEventListener.call(document, 'mousemove', function(evt) {
        pos.set(evt.clientX);
        attrs.set('class', 'cl' + evt.clientY);
    });
});

}());
