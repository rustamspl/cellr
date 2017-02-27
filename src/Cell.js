import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var lastCell = null,
        MAX = (Number.MAX_SAFE_INTEGER || 0x1fffffffffffff) - 1,
        g = {
            plan: Object.create(null)
        },
        planRunning = false,
        planBegin = MAX,
        planEnd = -1,
        seq = 0;

    function planRun() {
        planRunning = true;
        var plan = g.plan;
        for (var i = planBegin; i <= planEnd; i++) {
            var q = plan[i];
            for (var j in q) {
                q[j].calc();
            }
        }
        g.plan = Object.create(null);
        planBegin = MAX;
        planEnd = -1;
        planRunning = false;
    }
    //---------------------
    return {
        _constructor: function(v) {
            _super.call(this);
            this.id = ++seq;
            this.forwards = Object.create(null);
            this.backwards = Object.create(null);
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
                var newBackwards = Object.create(null);
                this.backwards = newBackwards;
                //}
                var savedCell = lastCell;
                lastCell = this;
                var val = this._calc();
                lastCell = savedCell;
                //  if(!planRunning)
                for (var i in oldBackwards) {
                    if (!(i in newBackwards)) {
                        delete oldBackwards[i].forwards[this.id];
                    }
                }
                this.planLevel = -1;
                this.set(val);
            }
        },
        get: function() {
            var savedCell = lastCell;
            if (savedCell) {
                this.forwards[savedCell.id] = savedCell;
                savedCell.backwards[this.id] = this;
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
                var fw = this.forwards;
                for (var i in fw) {
                    fw[i]._addToPlan();
                }
            }
        },
        _addToPlan: function() {
            var level = this.level;
            var oldLevel = this.planLevel;
            var plan = g.plan;
            if (oldLevel == level) return;
            if (oldLevel > level) {
                var old = plan[oldLevel];
                if (old) {
                    delete old[this.id];
                }
            }
            var pLevel = plan[level]
            if (!pLevel) {
                pLevel = Object.create(null);
                plan[level] = pLevel;
            }
            pLevel[this.id] = this;
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