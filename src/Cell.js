import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var calcStack = [],
        seq = 0,
        g = {
            plan: {},
            levels: {}
        },
        planned = false,
        planLevel = -1,
        planRunning = false

    function getFirstPlanLevel() {
        for (var i in g.plan) return i;
        return -1;
    }

    function planRun(level) {
        //console.log('planRun', level);
        planRunning = true
        var plan = g.plan;
        for (var i; i = getFirstPlanLevel(), i != -1; delete plan[i]) {
            if (i > level && level >= 0) break;
            var q = plan[i];
            for (var j in q) {
                q[j].calc();
            }
        }
        g.plan = {};
        g.levels = {};
        planned = false;
        planLevel = -1;
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
            if (!planned && !planRunning) {
                planRun(this.level);
            }
            // console.log('get', this.id, this.level);
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
            };
        },
        _addToPlan: function() {
            var level = this.level;
            var thisId = this.id;
            var plan = g.plan;
            var levels = g.levels;
            var pLevel = plan[level] || (plan[level] = {})
            if (!pLevel[thisId]) {
                if (thisId in levels) {
                    var oldLevel = levels[thisId];
                    if (oldLevel <= level) {
                        return;
                    } else {
                        delete plan[levels[thisId]][thisId];
                    }
                }
                pLevel[thisId] = this
                levels[thisId] = level
            }
            if (planLevel == -1 || planLevel > level) {
                planLevel = level
            }
        }
    }
});
//------------------------------------------------
export default Cell;