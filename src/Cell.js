import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
//------------------------------------------------
var Cell = Class(EventEmitter, function(_super) {
    var calcStack = [],
        seq = 0;
    return {
        _constructor: function(v) {
            _super.call(this);
            this.id = ++seq;
            this.forwards = {};
            this.backwards = {};
            if (typeof v == 'function') {
                this._calc = v;
                this.sta = 0; //0:not assigned, 1:assigned, 2: calc
            } else {
                this.value = v;
                this.sta = 1;
            }
        },
        get: function() {
            var last = calcStack.length - 1;
            if (last >= 0) {
                var lastAtom = calcStack[last];
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
            return this.value;
        },
        set: function(v) {
            var needUpdate = !(this.value == v);
            this.value = v;
            this.sta = 1;
            if (needUpdate) {
                for (var i in this.forwards) {
                    this.forwards[i].calc();
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
                var newBackwards = this.backwards,
                    thisId = this.id;
                for (var i in oldBackwards)
                    if (!newBackwards[i]) delete oldBackwards[i].forwards[thisId];
                var v = this._calc();
                calcStack.pop();
                this.set(v);
            };
        }
    }
});
//------------------------------------------------
export default Cell;