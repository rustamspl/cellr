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
import ObsMap from './ObsMap';

function _defaultFactory(data) {
    return new Node({
        data: data
    })
}

function _handleCellData(evt) {
    this.el.innerHTML = evt.value;
}

function _handleObsListData(evt) {
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

function _handleObsMapAttrs(evt) {
    var el = this.el;
    switch (evt.method) {
        case 'change':
            var oldValue = evt.oldValue;
            for (var k in oldValue) {
                el.removeAttribute(k);
            }
            var attrs = evt.value;
            for (var k in attrs) {
                this._setAttr(k, attrs[k]);
            }
            return;
        case 'set':
            this._setAttr(evt.key, evt.value);
            return;
        case 'remove':
            this.el.removeAttribute(evt.key);
            return;
    }
}
var Node = Class({}, function(_super) {
    return {
        _constructor: function(opts) {
            var opts = opts || {};
            var el = this.el = createElement(opts.tag || 'div');
            var data = opts.data;
            if (data instanceof ObsList) {
                this._factory = opts.factory || _defaultFactory;
                data.on('change', _handleObsListData, this);
            } else if (data instanceof Cell) {
                data.on('change', _handleCellData, this);
                el.innerHTML = data.get();
            } else if (data) {
                el.innerHTML = data;
            }
            var attrs = opts.attrs || {};
            if (attrs instanceof ObsMap) {
                attrs.on('change', _handleObsMapAttrs, this);
            } else {
                for (var k in attrs) {
                    this._setAttr(k, attrs[k]);
                }
            }
        },
        _setAttr: function(k, v) {
            if (v instanceof Cell) {
                v.on('change', function(evt) {
                    this._setAttrVal(k, evt.value);
                }, this);
                this._setAttrVal(k, v.get());
            } else {
                this._setAttrVal(k, v);
            }
        },
        _setAttrVal: function(k, v) {
            if (!v) {
                this.el.removeAttribute(k);
                return;
            }
            this.el.setAttribute(k, v);
        }
    };
});
export default Node;