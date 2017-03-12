import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
var ObsMap = Class(EventEmitter, function(_super) {
    return {
        _constructor: function(data) {
            _super.apply(this);
            this.change(data || {});
        },
        change: function(v) {
            var old = this.data;
            this.data = v;
            this.emit({
                type: 'change',
                method: 'change',
                value: v,
                oldValue: old
            })
        },
        set: function(k, v) {
            var old = this.data[k];
            this.data[k] = v;
            this.emit({
                type: 'change',
                method: 'set',
                key: k,
                value: v,
                oldValue: old
            })
        },
        remove: function(k) {
            var old = this.data[k];
            delete this.data[k];
            if (old.length) {
                this.emit({
                    type: 'change',
                    method: 'remove',
                    key: k,
                    oldValue: old[0]
                })
            }
        }
    };
});
export default ObsMap;