import {
    is,
    Class
} from './JS/Object';
import {
    createElement,
    appendChild,
    addEventListener,
    document
} from './utils/doc';
import Cell from './Cell';
import ObsArray from './ObsArray';
var View = Class({}, function(_super) {
    return {
        _constructor: function(opts) {
            var opts = opts || {};
            var el = this.el = createElement(opts.tag || 'div');
            var value = opts.val || '';
            var view = this;
            if (value instanceof ObsArray) {
                value.on('change', function(evt) {
                    switch (evt.method) {
                        case 'push':
                            var newView = new View({
                                val: evt.value
                            });
                            el.appendChild(newView.el);
                            return;
                        case 'remove':
                            el.removeChild(el.childNodes[evt.index]);
                            return;
                    }
                });
            } else if (value instanceof Cell) {
                value.on('change', function(evt) {
                    el.innerHTML = evt.value;
                });
                el.innerHTML = value.get();
            } else {
                el.innerHTML = value;
            }
        }
    };
});
export default View;