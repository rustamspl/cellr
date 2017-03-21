import {
    Class
} from './js/Object';
var EventEmitter = Class(Object.create(null), function() {
    return {
        _constructor: function() {
            this._cbs = Object.create(null);
        },
        emit: function(evt) {
            if (!evt.type) {
                evt = {
                    type: evt
                };
            }
            var callbacks = this._cbs[evt.type];
            if (!callbacks) {
                return;
            };
            for (var i = callbacks.length - 1; i >= 0; i--) {
                if (!(callbacks[i](evt))) {
                    callbacks.splice(i, 1);
                }
            }
        },
        on: function(evt, cb) {
            var callbacks = this._cbs;
            var h = (callbacks[evt] = callbacks[evt] || []);
            h.push(cb);
        },
        off: function(evt, cb) {
            var cbs = this._cbs[evt];
            if (!cbs) {
                return;
            };
            var ind = cbs.indexOf(cb);
            if (ind > -1) {
                cbs.splice(ind, 1);
            }
        }
    };
});
export default EventEmitter;