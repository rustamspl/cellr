(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.cellr = factory());
}(this, (function () { 'use strict';

//-------------

//-------------

//-------------
function extend(dst, src) {
    for (var i in src)
        if (src.hasOwnProperty(i)) dst[i] = src[i];
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

var EventEmitter = Class({}, function(_super) {
    return {
        _constructor: function() {
            this._cbs = {};
        },
        emit: function(evt) {
            var callbacks = this._cbs[evt];
            if (!(callbacks && callbacks.length)) return;
            var args = [];
            for (var i = 1, l = arguments.length; i < l; i++) {
                args.push(arguments[i]);
            }
            for (var i = 0, l = callbacks.length; i < l; i++) {
                callbacks[i].apply(this, args);
            }
        },
        on: function(evt, cb) {
            var callbacks = this._cbs;
            callbacks[evt] = callbacks[evt] || [];
            callbacks[evt].push(cb);
        }
    };
});

//------------------------------------------------
var Atom = Class(EventEmitter, function(_super) {
    var lastAtom = null,
        g = {
            pl: {}
        },
        planRunning = false,
        planBegin = 1,
        planEnd = -1,
        seq = 0;
    //-------
    function planRun() {
        planRunning = true;
        var plan = g.pl;
        for (var i = planBegin; i <= planEnd; i++) {
            var q = plan[i];
            for (var j = 0, l = q.length; j < l; j++) {
                q[j].calc();
            }
        }
        g.pl = {};
        planBegin = 1;
        planEnd = -1;
        planRunning = false;
    }
    //---------------------
    //---------------------
    return {
        _constructor: function(v) {
            _super.call(this);
            this.fw = [];
            this.bw = [];
            this.lv = 0;
            this.pl = -1;
            if (typeof v == 'function') {
                this._c = v;
                this.st = 0; // 0:not set,1:calc 2:set                
            } else {
                this._v = v;
                this.st = 2;
            }
        },
        calc: function() {
            if (this._c) {
                if (this.st == 1) {
                    throw new Error('circular');
                }
                this.st = 1;
                var oldBackwards = this.bw;
                var newBackwards = [];
                this.bw = newBackwards;
                var savedAtom = lastAtom;
                lastAtom = this;
                var val = this._c();
                lastAtom = savedAtom;
                for (var i = 0, l = oldBackwards.length; i < l; i++) {
                    var b = oldBackwards[i];
                    if (newBackwards.indexOf(b) != -1) {
                        var fw = b.fw;
                        var index = fw.indexOf(this);
                        index > -1 && fw.splice(index, 1);
                    }
                }
                this.pl = -1;
                this.set(val);
            }
        },
        get: function() {
            var savedAtom = lastAtom;
            if (savedAtom) {
                this.fw.push(savedAtom);
                savedAtom.bw.push(this);
            }
            if (this.st == 0) {
                this._plan();
            }
            if (planBegin <= this.lv && !planRunning) {
                planRun();
            }
            if (savedAtom) {
                if (savedAtom.lv <= this.lv) {
                    savedAtom.lv = this.lv + 1;
                }
            }
            return this._v;
        },
        set: function(v) {
            var needUpdate = !(this._v == v);
            this._v = v;
            this.st = 2;
            if (needUpdate) {
                var fw = this.fw;
                for (var i = 0, l = fw.length; i < l; i++) {
                    fw[i]._plan();
                }
            }
        },
        _plan: function() {
            var lv = this.lv;
            var oldLevel = this.pl;
            if (oldLevel == lv) return;
            var plan = g.pl;
            if (oldLevel > lv) {
                var old = plan[oldLevel];
                if (old) {
                    var index = old.indexOf(this);
                    index > -1 && old.splice(index, 1);
                }
            }
            var pLevel = plan[lv];
            if (!pLevel) {
                pLevel = [];
                plan[lv] = pLevel;
            }
            pLevel.push(this);
            this.pl = lv;
            if (lv < planBegin) {
                planBegin = lv;
            }
            if (lv > planEnd) {
                planEnd = lv;
            }
        }
    }
});

var cellr = {
    Cell: Atom
};

return cellr;

})));
