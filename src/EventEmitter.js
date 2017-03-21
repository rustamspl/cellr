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
            var handlers = this._cbs[evt.type];
            if (!handlers) {
                return;
            };
            var callbacks = handlers.cbs;
            if (!callbacks.length) {
                return;
            };
            var ctx = handlers.ctx;
            for (var i = 0, l = callbacks.length; i < l; i++) {
                callbacks[i].call(ctx[i], evt);
            }
        },
        on: function(evt, cb, ctx) {
            if (!ctx) {
                throw new Error('Empty ctx');
            }
            var callbacks = this._cbs;
            var h = (callbacks[evt] = callbacks[evt] || {
                cbs: [],
                ctx: []
            });
            h.cbs.push(cb);
            h.ctx.push(ctx);
            ctx.addEmitter(this);
        },
        off: function(evt, cb, ctx) {
            var handlers = this._cbs[evt];
            if (!handlers) {
                return;
            };
            var cbs = handlers.cbs;
            var ctxs = handlers.ctx;
            var ind = cbs.indexOf(cb);
            if (ind > -1 && ctxs[ind] === ctx) {
                cbs.splice(ind, 1);
                ctxs.splice(ind, 1);
            }
        },
        offCtx: function(ctx) {
            var ind, allCbs = this._cbs;
            for (var evt in allCbs) {
                var handlers = allCbs[evt];
                var cbs = handlers.cbs;
                var ctxs = handlers.ctx;
                while ((ind = cbs.indexOf(ctx)) != -1) {
                    cbs.splice(ind, 1);
                    ctxs.splice(ind, 1);
                }
            }
        }
    };
});
export default EventEmitter;