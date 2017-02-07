import {
    Class
} from './JS/Object';

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
export default EventEmitter;