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
        calcLevel = MAX1,
        planRunning = false

    function getFirstPlanLevel() {
        for (var i in g.plan) return i;
        return MAX2;
    }

    function planRun() {
        //console.log('aaa',console.trace());
        planRunning = true
        var plan = g.plan;
        for (var i; i = getFirstPlanLevel(), i < MAX2; delete plan[i]) {
            //  console.log('aaa',i);
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
          //   console.log('calc',this.sta);
            if (this._calc) {
                //    console.log('calc',this.level);
                this.sta = 1;
                var oldBackwards = this.backwards;
                this.backwards = {};
                var savedCell = prevCell;
                calcLevel = savedCell ? this.level : calcLevel - 1;
                prevCell = this;
                var v = this._calc();
                var newBackwards = this.backwards,
                    thisId = this.id;
                for (var i in oldBackwards)
                    if (!newBackwards[i]) delete oldBackwards[i].forwards[thisId];
                prevCell = savedCell;
                ++calcLevel;
                this.set(v);
            };
        },
        get: function() {
            var lastAtom = prevCell;
            if (lastAtom) {
                if (!(lastAtom.id in this.forwards)) {
                    this.forwards[lastAtom.id] = lastAtom;
                    lastAtom.backwards[this.id] = this;
                }
                console.log('calc1',  calcLevel,'|le:',lastAtom.level,this.level,'|id:',lastAtom.id,this.id);
                if ( this.level>=lastAtom.level) {
                    this.level = lastAtom.level-1;
                    console.log('calc2',  calcLevel,'|le:',lastAtom.level,this.level,'|id:',lastAtom.id,this.id);
                }
                if ( this.level>= calcLevel) {
                    this.level = calcLevel-1;
                    console.log('calc3',  calcLevel,'|le:',lastAtom.level,this.level,'|id:',lastAtom.id,this.id);
                }
            }
            if (planLevel < (this.level - 1) && !planRunning) {
                //     console.log('planLevel',planLevel,this.level);
                planRun();
            }
            if (this.sta == 0) {
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
            //console.log('zzz');
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
    }
});
//------------------------------------------------
export default Cell;