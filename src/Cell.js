import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
import Map from './JS/Map';
import Set from './JS/Set';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var lastCell = null,
        MAX = 1000000000,
        plan = new Map(),
        planRunning = false,
        planBegin = MAX,
        seq = 0,
        planEnd = -1;

    function planRun() {
        incCnt('r.planRun');
        planRunning = true
        for (var i = planBegin; i <= planEnd; i++) {
            var q = plan.get(i);
            for (var c, it = q.values(); c = it.next().value;) {
                for (var cf, it1 = c.forwards.values(); cf = it1.next().value;) {
                    cf.calc();
                }
            }
        }
        plan.clear();
        planBegin = MAX;
        planEnd = -1;
        planRunning = false;
    }
    //---------------------
    return {
        _constructor: function(v) {
            incCnt('r._constructor');
            _super.call(this);
            this._id = ++seq;
            this.forwards = new Set();
            this.backwards = new Set();
            this.oldLevel = -1;
            if (typeof v == 'function') {
                this._calc = v;
                this.sta = 0 // 0:not set,1:calc 2:set
            } else {
                this._val = v;
                this.sta = 2
            }
            this.level = 0;
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
                for (var v, it = oldBackwards.values(); v = it.next().value;) {
                    if (!newBackwards.has(v)) v.forwards.delete(this);
                }
                lastCell = savedCell;
                this.set(val);
            };
        },
        get: function() {
            incCnt('r.get');
            var savedCell = lastCell;
            if (savedCell) {
                if (!this.forwards.has(savedCell)) {
                    this.forwards.add(savedCell);
                    savedCell.backwards.add(this);
                }
            }
            if (this.sta == 0) {
                this.calc();
            }
            if (planBegin <= this.level && !planRunning) {
                //console.log('!!planBegin', planBegin, this.level);
                planRun();
            }
            if (savedCell) {
                // console.log('savedCell');
                if (savedCell.level <= this.level) {
                    savedCell._setLevel(this.level + 1);
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
            this.sta = 2
            if (needUpdate) {
                this._addToPlan();
            }
        },
        _addToPlan: function() {
            incCnt('r._addToPlan');
            this._setLevel(this.level)
        },
        _setLevel: function(level) {
            var oldLevel = this.level;
            incCnt('r._setLevel');
            this.level = level;
            var pLevel = plan.get(level)
            if (!pLevel) {
                pLevel = new Set();
                plan.set(level, pLevel);
            }
            if (level < planBegin) {
                planBegin = level;
            }
            if (level > planEnd) {
                planEnd = level;
            }
            var old = plan.get(oldLevel);
            if (old) {
                old.delete(this);
            }
            pLevel.add(this);
        }
    }
});
//------------------------------------------------
export default Cell;