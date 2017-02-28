import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
//------------------------------------------------
var Atom = Class(EventEmitter, function(_super) {
    var lastAtom = null,
        G = {
            pl: {}
        },
        planRunning = false,
        MAX = 0x0fffffff,
        planBegin = MAX,
        planEnd = -1,
        seq = 0;
    //-------
    function planRun() {
        planRunning = true;
        var plan = G.pl;
        for (var i = planBegin; i <= planEnd; i++) {
            var q = plan[i];
            for (var j = 0, l = q.length; j < l; j++) {
                q[j].calc();
            }
        }
        G.pl = {};
        planBegin = MAX;
        planEnd = -1;
        planRunning = false;
    }
    //---------------------
    //---------------------
    return {
        _constructor: function(v) {
            _super.call(this);
            this.fw = [];
            this.bw = [];
            this.lv = 0;
            this.pl = -1;
            if (typeof v == 'function') {
                this._c = v;
                this.st = 0 // 0:not set,1:calc 2:set                
            } else {
                this._v = v;
                this.st = 2
            }
        },
        calc: function() {
       
            if (this._c) {
                if (this.st == 1) {
                    throw new Error('circular');
                }
                this.st = 1;
                var oldBackwards = this.bw;
                var newBackwards = [];
                this.bw = newBackwards;
                var savedAtom = lastAtom;
                lastAtom = this;
                var val = this._c();
                lastAtom = savedAtom;
                for (var i = 0, l = oldBackwards.length; i < l; i++) {
                    var b = oldBackwards[i];
                    if (newBackwards.indexOf(b) != -1) {
                        var fw = b.fw;
                        var index = fw.indexOf(this);
                        index > -1 && fw.splice(index, 1);
                    }
                }
                this.pl = -1;
                this.set(val);
            }
        },
        get: function() {
            var savedAtom = lastAtom;
            if (savedAtom) {
                savedAtom.bw.push(this);
                var forward = this.fw;
                if (forward.indexOf(savedAtom) == -1) forward.push(savedAtom);
            }
            if (this.st == 0) {
                this._plan();
            }
            if (planBegin <= this.lv && !planRunning) {
                planRun();
            }
            if (savedAtom) {
                if (savedAtom.lv <= this.lv) {
                    savedAtom.lv = this.lv + 1;
                }
            }
            return this._v;
        },
        set: function(v) {
            var needUpdate = !(this._v == v);
            this._v = v;
            this.st = 2
            if (needUpdate) {
                var fw = this.fw;
                for (var i = 0, l = fw.length; i < l; i++) {
                    fw[i]._plan();
                }
                this.emit('change');
            }
        },
        _plan: function() {
            var lv = this.lv;
            var oldLevel = this.pl;
            if (oldLevel == lv) return;
            var plan = G.pl;
            if (oldLevel > lv) {
                var old = plan[oldLevel];
                if (old) {
                    var index = old.indexOf(this);
                    index > -1 && old.splice(index, 1);
                }
            }
            var pLevel = plan[lv];
            if (!pLevel) {
                pLevel = [];
                plan[lv] = pLevel;
            }
            pLevel.push(this);
            this.pl = lv;
            if (lv < planBegin) {
                planBegin = lv;
            }
            if (lv > planEnd) {
                planEnd = lv;
            }
        }
    }
});
//------------------------------------------------
export default Atom;