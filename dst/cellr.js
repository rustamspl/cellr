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

//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var lastCell = null,
        seq = 0,
        MAX = 1000,
        g = {
            plan: {},
            levels: {}
        },
        planRunning = false,
        planLevel = MAX;
    window.r2g = g;

    function getFirst(map) {
        for (var i in map) return i;
        return -1;
    }

    function planRun() {
        // console.log('planRun');
        planRunning = true;
        var plan = g.plan;
        for (var i; i = getFirst(plan), i >= 0; delete plan[i]) {
            //console.log('plan i=', i);
            var q = plan[i];
            for (var j in q) {
                var c = q[j];
                if (c.sta == 0) {
                    c.calc();
                }
                var fw = c.forwards;
                for (var i in fw) {
                    fw[i].calc();
                }
            }
        }
        g.plan = {};
        g.levels = {};
        planRunning = false;
    }
    return {
        _constructor: function(v) {
            _super.call(this);
            this.id = ++seq;
            this.forwards = {};
            this.backwards = {};
            if (typeof v == 'function') {
                this._calc = v;
                this.sta = 0; // 0:not set,1:calc 2:set
                this.level = 1;
            } else {
                this.value = v;
                this.sta = 2;
                this.level = 0;
            }
        },
        calc: function() {
            if (this._calc) {
                this.sta = 1;
                var savedCell = lastCell;
                lastCell = this;
                var oldBackwards = this.backwards;
                this.backwards = {};
                var v = this._calc();
                var newBackwards = this.backwards,
                    thisId = this.id;
                for (var i in oldBackwards)
                    if (!newBackwards[i]) delete oldBackwards[i].forwards[thisId];
                lastCell = savedCell;
                this.set(v);
            }
        },
        get: function() {
            var savedCell = lastCell;
            if (savedCell) {
                if (!(savedCell.id in this.forwards)) {
                    this.forwards[savedCell.id] = savedCell;
                    savedCell.backwards[this.id] = this;
                }
            }
            if (this.sta == 0) {
                this._addToPlan();
            }
            if (planLevel <= this.level && !planRunning) {
                //console.log('!!planLevel', planLevel, this.level);
                planRun();
            }
            if (savedCell) {
                // console.log('savedCell');
                if (savedCell.level <= this.level) {                 
                    savedCell._setLevel(this.level + 1);
                }
            }
            //console.log('get()=', this.value);
            return this.value;
        },
        set: function(v) {
            var needUpdate = !(this.value == v);
            this.value = v;
            this.sta = 2;
            if (needUpdate) {
                this._addToPlan();
            }
        },
        _addToPlan: function() {
            var level = this.level;
            this._setLevel(level);
            if (planLevel > level) {
                planLevel = level;
            }
        },
        _setLevel: function(level) {
            this.level=level;
            // if(level==0)
            // console.log(this.id,'_setLevel',level,console.trace());
            var thisId = this.id;
            var plan = g.plan;
            var levels = g.levels;
            var pLevel = plan[level] || (plan[level] = {});
            if (!pLevel[thisId]) {
                if (thisId in levels) {
                    var oldLevel = levels[thisId];
                    delete plan[oldLevel][thisId];
                }
                pLevel[thisId] = this;
                levels[thisId] = level;
            }
        }
    }
});

var cellr = {
    Cell: Cell
};

return cellr;

})));
