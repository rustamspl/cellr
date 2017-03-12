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

var EventEmitter = Class({}, function() {
    return {
        _constructor: function() {
            this._cbs = {};
        },
        emit: function(evt) {
            if (!evt.type) {
                evt = {
                    type: evt
                };
            }
            var handlers = this._cbs[evt.type];
            if (!handlers) {
                return;
            }
            var callbacks = handlers.cbs;
            if (!callbacks.length) {
                return;
            }
            var ctx = handlers.ctx;
            for (var i = 0, l = callbacks.length; i < l; i++) {
                callbacks[i].call(ctx[i], evt);
            }
        },
        on: function(evt, cb, ctx) {
            var callbacks = this._cbs;
            var h = (callbacks[evt] = callbacks[evt] || {
                cbs: [],
                ctx: []
            });
            h.cbs.push(cb);
            h.ctx.push(ctx || this);
        },
        off: function(evt, cb, ctx) {
            var handlers = this._cbs[evt];
            if (!handlers) {
                return;
            }
            var cbs = handlers.cbs;
            var ctxs = handlers.ctx;
            var ind = cbs.indexOf(cb);
            if (ind > -1 && ctxs[ind] === ctx) {
                cbs.splice(ind, 1);
                ctxs.splice(ind, 1);
            }
        }
    };
});

var global = Function('return this;')();

/**
 * @typesign (cb: ());
 */
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
var evtOff = EventEmitterProto.off;
var evtEmit = EventEmitterProto.emit;
var MAX = Number.MAX_SAFE_INTEGER || 0x1fffffffffffff;
//var errorIndexCounter = 0;
var pushingIndexCounter = 0;
var G = {
    relPl: {}
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
var Cell = Class(EventEmitter, function(_super) {
    return {
        _constructor: function(value, opts) {
            _super.call(this);
            if (!opts) {
                opts = {};
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
                    value.on('change', this._onValCh, this);
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
        _onValCh: function _onValCh(evt) {
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
                oldValue.off('change', this._onValCh, this);
            }
            if (value instanceof EventEmitter) {
                value.on('change', this._onValCh, this);
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
var appendChild = document.appendChild;
var addEventListener = document.addEventListener;

function _defaultFactory(data) {
    return new Node({
        data: data
    })
}

function _handleCellData(evt) {
    this.el.innerHTML = evt.value;
}

function _handleObsListData(evt) {
    var el = this.el;
    switch (evt.method) {
        case 'change':
            for (var i = 0, l = evt.oldValue.length; i < l; i++) {
                el.removeChild(el.firstChild);
            }
            var val = evt.value;
            for (var i = 0, l = val.length; i < l; i++) {
                var newNode = this._factory(val[i]);
                el.appendChild(newNode.el);
            }
            return;
        case 'set':
            var newNode = this._factory(evt.value);
            if (evt.oldLength == 0) {
                el.appendChild(newNode.el);
            } else {
                el.replaceChild(newNode.el, el.childNodes[evt.index]);
            }
            return;
        case 'insert':
            var newNode = this._factory(evt.value);
            if (evt.oldLength <= evt.index) {
                el.appendChild(newNode.el);
            } else {
                el.insertBefore(newNode.el, el.childNodes[evt.index]);
            }
            return;
        case 'remove':
            el.removeChild(el.childNodes[evt.index]);
            return;
    }
}

function _handleObsMapAttrs(evt) {
    var el = this.el;
    switch (evt.method) {
        case 'change':
            var oldValue = evt.oldValue;
            var attrs = evt.value;
            for (var k in oldValue) {
                if (!(k in value)) {
                    this._setAttr(k);
                }
            }
            for (var k in attrs) {
                this._setAttr(k, attrs[k]);
            }
            return;
        case 'set':
            this._setAttr(evt.key, evt.value);
            return;
    }
}
var Node = Class$1({}, function(_super) {
    return {
        _constructor: function(opts) {
            var opts = opts || {};
            var el = this.el = createElement(opts.tag || 'div');
            var data = opts.data;
            if (data instanceof ObsList) {
                this._factory = opts.factory || _defaultFactory;
                data.on('change', _handleObsListData, this);
            } else if (data instanceof Cell) {
                data.on('change', _handleCellData, this);
                el.innerHTML = data.get();
            } else if (data) {
                el.innerHTML = data;
            }
            var attrs = opts.attrs || {};
            if (attrs instanceof ObsMap) {
                attrs.on('change', _handleObsMapAttrs, this);
            } else {
                for (var k in attrs) {
                    this._setAttr(k, attrs[k]);
                }
            }
        },
        _setAttr: function(k, v) {
            if (v instanceof Cell) {
                v.on('change', function(evt) {
                    this._setAttrVal(k, evt.value);
                }, this);
                this._setAttrVal(k, v.get());
            } else {
                this._setAttrVal(k, v);
            }
        },
        _setAttrVal: function(k, v) {
            if (k == 'value') {
                this.el.value = v;
                return;
            }
            if (!v) {
                this.el.removeAttribute(k);
                return;
            }
            this.el.setAttribute(k, v);
        }
    };
});

//-------------------------
// var ed = new Cell();
// var ed2 = new Cell();
// var press = new Cell();
// var txt = new Cell(function() {
//     return ' pos:' + (pos.get() || 'rr') + ' press:' + (press.get() || 'zzz');
// });
// var txt2 = new Cell(function() {
//     return 'ed:' + ed.get() + ' txt2:' + txt.get() + ' double:' + (pos.get() * 2);
// });
// var txt3 = new Cell(function() {
//     return 'ed2:' + ed2.get() + ' txt2at:' + txt2.get();
// });
//-------------------------
//-------------------------
addEventListener.call(document, 'DOMContentLoaded', function() {
    var bodyAppend = appendChild.bind(document.body);
    var pos = new Cell();

    var attrs=new ObsMap();

    var view = new Node({
        data: pos,
        attrs:attrs
    });
    bodyAppend(view.el);
    var a = new ObsList();
    //------
    var btnAdd = createElement('button');
    btnAdd.innerHTML = 'btnAdd';
    bodyAppend(btnAdd);
    btnAdd.onclick = function() {
        var r = Math.random();
        var c = new Cell(function() {
            return r + ':' + pos.get();
        });
        a.push(c);
    };
    //------
    var btnRemove = createElement('button');
    btnRemove.innerHTML = 'btnRemove';
    bodyAppend(btnRemove);
    btnRemove.onclick = function() {
        a.remove(0);
    };
    //-----
    //------
    var btnRemove1 = createElement('button');
    btnRemove1.innerHTML = 'btnZZZ';
    bodyAppend(btnRemove1);
    btnRemove1.onclick = function() {
        a.change([456, 678, 446]);
    };
    //-----
    var view2 = new Node({
        data: a,
        factory: function(val) {
            return new Node({
                tag: 'input',
                attrs: {
                    value: val
                }
            });
        }
    });
    bodyAppend(view2.el);
    addEventListener.call(document, 'mousemove', function(evt) {
        //div.innerHTML = evt.x + ':' + evt.y;
        pos.set(evt.x);
        attrs.set('class','cl'+evt.y);
    });
    // 
    // 
    // var div3 = createElement('div');
    // bodyAppend(div3);
    // var div4 = createElement('div');
    // bodyAppend(div4);
    // div4.className = 'zzzz';
    // var ted = createElement('input');
    // bodyAppend.call(div4, ted);
    // ted.onkeyup = function() {
    //     ed.set(ted.value);
    // };
    // var ted2 = createElement('input');
    // bodyAppend(ted2);
    // ted2.onkeyup = function() {
    //     ed2.set(ted2.value);
    // };
    // txt.on('change', function() {
    //     div.innerHTML = txt.get();
    // });
    // txt2.on('change', function() {
    //     div2.innerHTML = txt2.get();
    // });
    // txt3.on('change', function() {
    //     div3.innerHTML = txt3.get();
    // });
    // addEventListener.call(document, 'mousemove', function(evt) {
    //     //div.innerHTML = evt.x + ':' + evt.y;
    //     pos.set(evt.x);
    // });
    // addEventListener.call(document, 'mousedown', function() {
    //     press.set('KU');
    //     ///div2.innerHTML = 'down';
    // });
    // addEventListener.call(document, 'mouseup', function() {
    //     //div2.innerHTML = 'up2';
    //     press.set('UPpp');
    // });
});

}());
