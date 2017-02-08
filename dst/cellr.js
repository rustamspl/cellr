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
    var calcStack = [],
        seq = 0,
        g = {
            Plan: {},
            Levels: {}
        },
        PlanLevel = -1,
        doingPlan = false;

    function doPlan() {
        // if(doingPlan) return
        doingPlan = true;
        var Plan = g.Plan;
        var Levels = g.Levels;
        for (var i in Plan) {
            var q = Plan[i];
            for (var j in q) {
                q[j].calc();
            }
        }
        g.Plan = {};
        g.Levels = {};
        PlanLevel = -1,
            doingPlan = false;
    }
    return {
        _constructor: function(v) {
            _super.call(this);
            this.id = ++seq;
            this.forwards = {};
            this.backwards = {};
            if (typeof v == 'function') {
                this._calc = v;
                this.sta = 0; //0:not assigned, 1:assigned, 2: calc
                this.level = 1;
            } else {
                this.value = v;
                this.sta = 1;
                this.level = -1;
            }
        },
        get: function() {
            var lastAtom, last = calcStack.length - 1;
            if (last >= 0) {
                lastAtom = calcStack[last];
                if (!(lastAtom.id in this.forwards)) {
                    this.forwards[lastAtom.id] = lastAtom;
                    lastAtom.backwards[this.id] = this;
                }
            }
            switch (this.sta) {
                case 2:
                    throw new Error('circular dependence');
                case 0:
                    this.calc();
            }
            if (lastAtom && lastAtom.level <= this.level) {
                lastAtom.level = this.level + 1;
            }
            if (PlanLevel != -1 && !doingPlan) {
                doPlan();
            }
            return this.value;
        },
        set: function(v) {
            var needUpdate = !(this.value == v);
            this.value = v;
            this.sta = 1;
            if (needUpdate) {
                for (var i in this.forwards) {
                    this.forwards[i]._addToPlan();
                }
                // this.emit('change', v);
            }
        },
        calc: function() {
            if (this._calc) {
                this.sta = 2;
                var oldBackwards = this.backwards;
                this.backwards = {};
                calcStack.push(this);
                var v = this._calc();
                var newBackwards = this.backwards,
                    thisId = this.id;
                for (var i in oldBackwards)
                    if (!newBackwards[i]) delete oldBackwards[i].forwards[thisId];
                calcStack.pop();
                this.set(v);
            }
        },
        _addToPlan: function() {
            var level = this.level;
            var thisId = this.id;
            var Plan = g.Plan;
            var Levels = g.Levels;
            var planLevel = Plan[level] || (Plan[level] = {});
            if (!planLevel[thisId]) {
                if (thisId in Levels) {
                    var oldLevel = Levels[thisId];
                    if (oldLevel <= level) {
                        return;
                    } else {
                        delete Plan[Levels[thisId]][thisId];
                    }
                }
                planLevel[thisId] = this;
                Levels[thisId] = level;
            }
            if (PlanLevel == -1 || PlanLevel > level) {
                planLevel = level;
            }
        }
    }
});

var cellr = {
    Cell: Cell
};

return cellr;

})));
