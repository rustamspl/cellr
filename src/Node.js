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
import ObsList from './ObsList';

function defaultFactory(data) {
    return new Node({
        data: data
    })
}
var Node = Class({}, function(_super) {
    return {
        _constructor: function(opts) {
            var opts = opts || {};
            var el = this.el = createElement(opts.tag || 'div');
            var data = opts.data || '';
            if (data instanceof ObsList) {
                this._factory = opts.factory || defaultFactory;
                data.on('change', this._handleObsList, this);
            } else if (data instanceof Cell) {
                data.on('change', this._handleCell, this);
                el.innerHTML = data.get();
            } else {
                el.innerHTML = data;
            }
        },
        _handleCell: function(evt) {
            this.el.innerHTML = evt.value;
        },
        _handleObsList: function(evt) {
            var el = this.el;
            switch (evt.method) {
                case 'change':
                    for (var i = 0, l = evt.oldValue.length; i < l; i++) {
                        el.removeChild(el.firstChild);
                    }
                    var val = evt.value;
                    for (var i = 0, l = val.length; i < l; i++) {
                        var newNode = this._factory(val[i]);
                        el.appendChild(newNode.el);
                    }
                    return;
                case 'set':
                    var newNode = this._factory(evt.value);
                    if (evt.oldLength == 0) {
                        el.appendChild(newNode.el);
                    } else {
                        el.replaceChild(newNode.el, el.childNodes[evt.index]);
                    }
                    return;
                case 'insert':
                    var newNode = this._factory(evt.value);
                    if (evt.oldLength <= evt.index) {
                        el.appendChild(newNode.el);
                    } else {
                        el.insertBefore(newNode.el, el.childNodes[evt.index]);
                    }
                    return;
                case 'remove':
                    el.removeChild(el.childNodes[evt.index]);
                    return;
            }
        }
    };
});
export default Node;