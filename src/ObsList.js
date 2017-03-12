import EventEmitter from './EventEmitter';
import {
    Class
} from './JS/Object';
var ObsList = Class(EventEmitter, function(_super) {
    return {
        _constructor: function(data) {
            _super.apply(this);
            this.change(data || []);
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
        set: function(i, v) {
            var old = this.data[i];
            var oldLength = this.data.length;
            this.data[i] = v;
            this.emit({
                type: 'change',
                method: 'set',
                index: i,
                value: v,
                oldValue: old,
                oldLength: oldLength
            })
        },
        insert: function(i, v) {
            var oldLength = this.data.length;
            this.data.splice(i, 0, v)
            this.emit({
                type: 'change',
                method: 'insert',
                index: i,
                value: v,
                oldLength: oldLength
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
        },
        push: function(v) {
            this.insert(this.data.length, v);
        }
    };
});
export default ObsList;