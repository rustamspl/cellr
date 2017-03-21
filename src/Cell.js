import ErrorLogger from './ErrorLogger';
import EventEmitter from './EventEmitter';
import {
    is,
    Class
} from './js/Object';
import nextTick from './utils/nextTick';


var EventEmitterProto = EventEmitter.prototype;
var evtOn = EventEmitterProto.on;
var evtOff = EventEmitterProto.off;
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
var Cell = Class(EventEmitter, function(_super) {
    return {
        _constructor: function(value, opts) {
            _super.call(this);
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
                nextTick(rel);
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
export default Cell;
