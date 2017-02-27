import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
import Map from './JS/Map';
import Set from './JS/Set';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var lastCell = null,
        MAX = (Number.MAX_SAFE_INTEGER || 0x1fffffffffffff) - 1,
        plan = new Map(),
        planRunning = false,
        planBegin = MAX,
        planEnd = -1,
        seq = 0;

    function planRun() {
        planRunning = true;
        for (var i = planBegin; i <= planEnd; i++) {
            var q = plan.get(i);
            for (var c, it = q.values(); c = it.next().value;) {
                c.calc();
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
            _super.call(this);
            this._id = ++seq;
            this.forwards = new Set();
            this.backwards = new Set();
            this.level = 0;
            this.planLevel = -1;
            if (typeof v == 'function') {
                this._calc = v;
                this.sta = 0 // 0:not set,1:calc 2:set                
            } else {
                this._val = v;
                this.sta = 2
            }
        },
        calc: function() {
            if (this._calc) {
                if (this.sta == 1) {
                    throw new Error('circular');
                }
                this.sta = 1;
                //  if(!planRunning){
                var oldBackwards = this.backwards;
                var newBackwards = new Set();
                this.backwards = newBackwards;
                //}
                var savedCell = lastCell;
                lastCell = this;
                var val = this._calc();
                lastCell = savedCell;
                //  if(!planRunning)
                for (var v, it = oldBackwards.values(); v = it.next().value;) {
                    if (!newBackwards.has(v)) {
                        v.forwards.delete(this);
                    }
                }
                this.planLevel = -1;
                this.set(val);
            }
        },
        get: function() {
            var savedCell = lastCell;
            if (savedCell) {
                this.forwards.add(savedCell);
                savedCell.backwards.add(this);
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
            this.sta = 2
            if (needUpdate) {
                for (var v, it = this.forwards.values(); v = it.next().value;) {
                    v._addToPlan();
                }
            }
        },
        _addToPlan: function() {
            var level = this.level;
            var oldLevel = this.planLevel;
            if (oldLevel == level) return;
            if (oldLevel > level) {
                var old = plan.get(oldLevel);
                if (old) {
                    old.delete(this);
                }
            }
            var pLevel = plan.get(level)
            if (!pLevel) {
                pLevel = new Set();
                plan.set(level, pLevel);
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
    }
});
//------------------------------------------------
export default Cell;