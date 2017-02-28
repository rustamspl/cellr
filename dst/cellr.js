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

// import Map from './JS/Map';
// import Set from './JS/Set';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var lastCell = null,
        g = {
            plan: {}
        },
        planRunning = false,
        planBegin = 1,
        planEnd = -1,
        seq = 0;
    //-------
    function planRun() {
        planRunning = true;
        var plan = g.plan;
        for (var i = planBegin; i <= planEnd; i++) {
            var q = plan[i];
            for (var j = 0, l = q.length; j < l; j++) {
                q[j].calc();
            }
        }
        g.plan = {};
        planBegin = 1;
        planEnd = -1;
        planRunning = false;
    }
    //---------------------
    //---------------------
    return {
        _constructor: function(v) {
            _super.call(this);
            this._id = ++seq;
            this.forwards = [];
            this.backwards = [];
            this.level = 0;
            this.planLevel = -1;
            if (typeof v == 'function') {
                this._calc = v;
                this.sta = 0; // 0:not set,1:calc 2:set                
            } else {
                this._val = v;
                this.sta = 2;
            }
        },
        calc: function() {
            if (this._calc) {
                if (this.sta == 1) {
                    throw new Error('circular');
                }
                this.sta = 1;
                var oldBackwards = this.backwards;
                var newBackwards = [];
                this.backwards = newBackwards;
                var savedCell = lastCell;
                lastCell = this;
                var val = this._calc();
                lastCell = savedCell;
                for (var i = 0, l = oldBackwards.length; i < l; i++) {
                    var b = oldBackwards[i];
                    if (newBackwards.indexOf(b) != -1) {
                        var fw = b.forwards;
                        var index = fw.indexOf(this);
                        index > -1 && fw.splice(index, 1);
                    }
                }
                this.planLevel = -1;
                this.set(val);
            }
        },
        get: function() {
            var savedCell = lastCell;
            if (savedCell) {
                this.forwards.push(savedCell);
                savedCell.backwards.push(this);
            }
            if (this.sta == 0) {
                this._addToPlan();
            }
            if (planBegin <= this.level && !planRunning) {
                planRun();
            }
            if (savedCell) {
                if (savedCell.level <= this.level) {
                    savedCell.level = this.level + 1;
                }
            }
            return this._val;
        },
        set: function(v) {
            var needUpdate = !(this._val == v);
            this._val = v;
            this.sta = 2;
            if (needUpdate) {
                var fw = this.forwards;
                for (var i = 0, l = fw.length; i < l; i++) {
                    fw[i]._addToPlan();
                }
            }
        },
        _addToPlan: function() {
            var level = this.level;
            var oldLevel = this.planLevel;
            if (oldLevel == level) return;
            var plan = g.plan;
            if (oldLevel > level) {
                var old = plan[oldLevel];
                if (old) {
                    var index = old.indexOf(this);
                    index > -1 && old.splice(index, 1);
                }
            }
            var pLevel = plan[level];
            if (!pLevel) {
                pLevel = [];
                plan[level] = pLevel;
            }
            pLevel.push(this);
            this.planLevel = level;
            if (level < planBegin) {
                planBegin = level;
            }
            if (level > planEnd) {
                planEnd = level;
            }
        }
    }
});

var cellr = {
    Cell: Cell
};

return cellr;

})));
