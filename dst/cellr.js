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
            this._callbacks = {};
        },
        emit: function(evt) {
            var callbacks = this._callbacks[evt];
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
            var callbacks = this._callbacks;
            callbacks[evt] = callbacks[evt] || [];
            callbacks[evt].push(cb);
        }
    };
});

var global = Function('return this;')();

var Map = global.Map;

var Set = global.Set;

//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var lastCell = null,
        MAX = 1000000000,
        plan = new Map(),
        planRunning = false,
        planBegin = MAX,
        planEnd = -1,
        seq = 0;
    //----------
    function processPlanned(c) {
        c.calc();
    }
    //-------
    function fnAddToPlan(v) {
        v._addToPlan();
    }
    //-------
    function fn1(v) {
        if (!this.backwards.has(v)) v.forwards.delete(this);
    }

    function planRun() {
        incCnt('r.planRun');
        planRunning = true;
        console.log(planBegin, planEnd, plan);
        for (var i = planBegin; i <= planEnd; i++) {
            plan.get(i).forEach(processPlanned);
        }
        plan.clear();
        planBegin = MAX;
        planEnd = -1;
        planRunning = false;
    }
    //---------------------
    //---------------------
    return {
        _constructor: function(v) {
            incCnt('r._constructor');
            _super.call(this);
            this._id = ++seq;
            this.forwards = new Set();
            this.backwards = new Set();
            this.level = 0;
            if (typeof v == 'function') {
                this._calc = v;
                this.sta = 0; // 0:not set,1:calc 2:set                
            } else {
                this._val = v;
                this.sta = 2;
            }
        },
        calc: function() {
            incCnt('r.calc');
            if (this._calc) {
                this.sta = 1;
                var savedCell = lastCell;
                lastCell = this;
                var oldBackwards = this.backwards;
                this.backwards = new Set();
                var val = this._calc();
                var newBackwards = this.backwards;
                oldBackwards.forEach(fn1, this);
                lastCell = savedCell;
                this.set(val);
            }
            this.planLevel = -1;
        },
        get: function() {
            incCnt('r.get');
            var savedCell = lastCell;
            // if (savedCell) {
            // }
            if (this.sta == 0) {
                this._addToPlan();
            }
            if (planBegin <= this.level && !planRunning) {
                //console.log('!!planBegin', planBegin, this.level);
                planRun();
            }
            if (savedCell) {
                if (!this.forwards.has(savedCell)) {
                    this.forwards.add(savedCell);
                    savedCell.backwards.add(this);
                }
                if (savedCell.level <= this.level) {
                    savedCell.level = this.level + 1;
                    savedCell._addToPlan();
                }
            }
            //console.log('get()=', this.value);
            if (typeof this._val == 'undefined') {
                throw new Error('undefined val');
            }
            return this._val;
        },
        set: function(v) {
            incCnt('r.set');
            var needUpdate = !(this._val == v);
            this._val = v;
            this.sta = 2;
            if (needUpdate) {
                this.forwards.forEach(fnAddToPlan);
            }
        },
        _addToPlan: function() {
            var level = this.level;
            var pLevel = plan.get(level);
            if (!pLevel) {
                pLevel = new Set();
                plan.set(level, pLevel);
            }
            pLevel.add(this);
            var oldLevel = this.planLevel;
            if (oldLevel >= 0 && oldLevel != level) {
                var old = plan.get(oldLevel);
                if (old) {
                    old.delete(this);
                }
            }
            pLevel.add(this);
            this.planLevel = level;
            if (level < planBegin) {
                planBegin = level;
            }
            if (level > planEnd) {
                planEnd = level;
            }
        }
        // ,_setLevel: function(level) {
        //     var oldLevel = this.level;
        //     incCnt('r._setLevel');
        //     this.level = level;
        //     var pLevel = plan.get(level)
        //     if (!pLevel) {
        //         pLevel = new Set();
        //         plan.set(level, pLevel);
        //     }
        //     if (level < planBegin) {
        //         planBegin = level;
        //     }
        //     if (level > planEnd) {
        //         planEnd = level;
        //     }
        //     var old = plan.get(oldLevel);
        //     if (old) {
        //         old.delete(this);
        //     }
        //     pLevel.add(this);
        // }
    }
});

var cellr = {
    Cell: Cell
};

return cellr;

})));
