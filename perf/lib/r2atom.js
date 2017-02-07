this.r2Atom = (function() {
    'use strict';
    //-----------------------
    function extend(dst, src) {
        for (var i in src)
            if (src.hasOwnProperty(i)) dst[i] = src[i];
        return dst;
    }
    //-----------------------
    function Class(_super, _factory) {
        var _proto = _factory(_super);
        var _constructor = _proto._constructor;
        delete _proto._constructor;
        _constructor.prototype = _super.prototype ? extend(Object.create(_super.prototype), _proto) : _proto;
        return _constructor;
    }
    //-----------------------
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
    //-----------------------
    var Atom = Class(EventEmitter, function(_super) {
        var calcStack = [],
            seq = 0;
        return {
            _constructor: function(conf) {
                _super.apply(this, arguments);
                this.id = ++seq;
                this.forwards = {};
                this.backwards = {};
                this.conf = conf || {};
                this.sta = 0; //0:not assigned, 1:assigned, 2: calc
            },
            get: function() {
                var last = calcStack.length - 1;
                if (last >= 0) {
                    var lastAtom = calcStack[last];
                    this.forwards[lastAtom.id] = lastAtom;
                    lastAtom.backwards[this.id] = this;
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
                    this.emit('change', v);
                }
            },
            calc: function() {
                if (this.conf.calc) {
                    this.sta = 2;
                    var oldBackwards = this.backwards;
                    this.backwards = {};
                    calcStack.push(this);
                    var newBackwards = this.backwards,
                        thisId = this.id;
                    for (var i in oldBackwards)
                        if (!newBackwards[i]) delete oldBackwards[i].forwards[thisId];
                    var v = this.conf.calc();
                    calcStack.pop();
                    this.set(v);
                };
            }
        };
    });
    return Atom;
})();