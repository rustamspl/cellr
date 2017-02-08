import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var calcStack = [],
        seq = 0,
        g = {
            Plan: {},
            Levels: {}
        },
        PlanLevel = -1,
        doingPlan = false

    function doPlan() {
        // if(doingPlan) return
        doingPlan = true
        var Plan = g.Plan;
        //var Levels = g.Levels;
        for (var i in Plan) {
            var q = Plan[i];
            for (var j in q) {
                q[j].calc();
            }
        }
        g.Plan = {};
        g.Levels = {};
        PlanLevel = -1;
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
            };
        },
        _addToPlan: function() {
            var level = this.level;
            var thisId = this.id;
            var Plan = g.Plan;
            var Levels = g.Levels;
            var planLevel = Plan[level] || (Plan[level] = {})
            if (!planLevel[thisId]) {
                if (thisId in Levels) {
                    var oldLevel = Levels[thisId];
                    if (oldLevel <= level) {
                        return;
                    } else {
                        delete Plan[Levels[thisId]][thisId];
                    }
                }
                planLevel[thisId] = this
                Levels[thisId] = level
            }
            if (PlanLevel == -1 || PlanLevel > level) {
                planLevel = level
            }
        }
    }
});
//------------------------------------------------
export default Cell;