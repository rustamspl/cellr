import EventEmitter from './EventEmitter';
import {
    is,
    Class
} from './JS/Object';
var ObsArray = Class(EventEmitter, function(_super) {
    return {
        _constructor: function(data) {
            _super.apply(this);
            this.data = data || [];
        },
        set: function(i, v) {
            var old = this._data[i];
            this.data[i] = v;
            this.emit({
                type: 'change',
                method: 'set',
                index: i,
                value: v,
                oldValue: v
            })
        },
        push: function(v) {
            this.data.push(v)
            this.emit({
                type: 'change',
                method: 'push',
                value: v
            })
        },
        remove: function(i) {
            var old = this.data.splice(i, 1);
            if (old.length) {
                this.emit({
                    type: 'change',
                    method: 'remove',
                    index: i,
                    oldValue: old[0]
                })
            }
        }
    };
});
export default ObsArray;