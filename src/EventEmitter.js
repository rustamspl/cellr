import {
    Class
} from './js/Object';
var EventEmitter = Class({}, function() {
    return {
        _constructor: function() {
            this._cbs = {};
        },
        emit: function(evt) {
            if (!evt.type) {
                evt = {
                    type: evt
                }
            }
            var handlers = this._cbs[evt.type];
            if (!handlers) return;
            var callbacks = handlers.cbs;
            if (!callbacks.length) return;
            var ctx = handlers.ctx;
            for (var i = 0, l = callbacks.length; i < l; i++) {
                callbacks[i].call(ctx[i], evt);
            }
        },
        on: function(evt, cb, ctx) {
            var callbacks = this._cbs;
            var h = (callbacks[evt] = callbacks[evt] || {
                cbs: [],
                ctx: []
            });
            h.cbs.push(cb);
            h.ctx.push(ctx || this);
        },
        off: function(evt, cb, ctx) {
            var handlers = this._cbs[evt];
            if (!handlers) return;
            var cbs = handlers.cbs;
            var ctxs = handlers.ctx;
            var ind = cbs.indexOf(cb);
            if (ind > -1 && ctxs[ind] === ctx) {
                cbs.splice(ind, 1);
                ctxs.splice(ind, 1);
            }
        }
    };
});
export default EventEmitter;