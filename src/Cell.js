import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var MAX2 = 1000, //Number.MAX_SAFE_INTEGER || 0x1fffffffffffff,
        MAX1 = MAX2 - 1,
        prevCell = null,
        seq = 0,
        g = {
            plan: {},
            levels: {}
        },
        planLevel = MAX2,
        planRunning = false

    function getFirstPlanLevel() {
        for (var i in g.plan) return i;
        return MAX2;
    }

    function planRun() {
        planRunning = true
        var plan = g.plan;
        for (var i; i = getFirstPlanLevel(), i < MAX2; delete plan[i]) {
            //if (i > level && level >= 0) break;
            var q = plan[i];
            for (var j in q) {
                var fw = q[j].forwards;
                for (var i in fw) {
                    fw[i].calc();
                }
            }
        }
        g.plan = {};
        g.levels = {};
        planLevel = MAX2;
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
                this.level = MAX1;
                this.sta = 0 // 0:not set,1:calc 2:set
            } else {
                this.value = v;
                this.level = 0;
                this.sta = 2
            }
        },
        calc: function() {
            if (this._calc) {
                this.sta = 1;
                var oldBackwards = this.backwards;
                this.backwards = {};
                var savedCell = prevCell;
                prevCell = this;
                var v = this._calc();
                var newBackwards = this.backwards,
                    thisId = this.id;
                for (var i in oldBackwards)
                    if (!newBackwards[i]) delete oldBackwards[i].forwards[thisId];
                prevCell = savedCell;
                this.set(v);
              
            };
        },
        get: function() {
            if (planLevel < this.level && !planRunning) {
                planRun();
            }
            if (this.sta = 0) {
                this.calc()
            }
            return this.value;
        },
        set: function(v) {
            var needUpdate = !(this.value == v);
            this.value = v;
            this.sta = 2
            if (needUpdate) {
                this._addToPlan();
            }
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
                        delete plan[oldLevel][thisId];
                    }
                }
                pLevel[thisId] = this
                levels[thisId] = level
            }
            if (planLevel > level) {
                planLevel = level
            }
        }
        // get: function() {
        //     if (this.active) {
        //         throw new Error('circular dependence');
        //     }
        //     var lastAtom = prevCell;
        //     if (lastAtom) {
        //         if (!(lastAtom.id in this.forwards)) {
        //             this.forwards[lastAtom.id] = lastAtom;
        //             lastAtom.backwards[this.id] = this;
        //         }
        //         if (this.level >= lastAtom.level) {
        //             this.level = lastAtom.level - 1;
        //         }
        //     }
        //     if (planned && !planRunning) {
        //         planRun(this.level);
        //     }
        //     // console.log('get', this.id, this.level);
        //     return this.value;
        // },
        // set: function(v) {
        //     var needUpdate = !(this.value == v);
        //     this.value = v;
        //     this.sta = 1;
        //     if (needUpdate) {
        //         // for (var i in this.forwards) {
        //         //     this.forwards[i]._addToPlan();
        //         // }
        //         this._addToPlan();
        //         this.emit('change', v);
        //     }
        // },
        // calc: function() {
        //     if (this._calc) {
        //         this.active = true;
        //         var oldBackwards = this.backwards;
        //         this.backwards = {};
        //         var lastAtom = prevCell;
        //         prevCell = this;
        //         var v = this._calc();
        //         var newBackwards = this.backwards,
        //             thisId = this.id;
        //         for (var i in oldBackwards)
        //             if (!newBackwards[i]) delete oldBackwards[i].forwards[thisId];
        //         prevCell = lastAtom;
        //         this.set(v);
        //         this.active = false;
        //     };
        // },
        // _addToPlan: function() {
        //     var level = this.level;
        //     var thisId = this.id;
        //     var plan = g.plan;
        //     var levels = g.levels;
        //     var pLevel = plan[level] || (plan[level] = {})
        //     if (!pLevel[thisId]) {
        //         if (thisId in levels) {
        //             var oldLevel = levels[thisId];
        //             if (oldLevel >= level) {
        //                 return;
        //             } else {
        //                 delete plan[levels[thisId]][thisId];
        //             }
        //         }
        //         pLevel[thisId] = this
        //         levels[thisId] = level
        //     }
        //     if (planLevel > level) {
        //         planLevel = level
        //     }
        //     planned = true
        // }
    }
});
//------------------------------------------------
export default Cell;