import EventEmitter from './EventEmitter';
import {
    is,
    Class
} from './JS/Object';
var ObsArray = Class(EventEmitter, function(_super) {
    return {
        _constructor: function(data) {
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
        }
    };
});
export default ObsArray;