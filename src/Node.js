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

function handleCellData(evt) {
    if (!this.active) return;
    this.el.innerHTML = evt.value;
    return true;
}

function handleObsListData(evt) {
    if (!this.active) return;
    var el = this.el;
    var childs = this._childs;
    switch (evt.method) {
        case 'change':
            for (var i = 0, l = evt.oldValue.length; i < l; i++) {
                el.removeChild(el.firstChild);
                childs[i].deactivate();
            }
            var val = evt.value;
            for (var i = 0, l = val.length; i < l; i++) {
                var newNode = this._factory(val[i]);
                el.appendChild(newNode.el);
                childs.push(newNode);
            }
            break;
        case 'set':
            var newNode = this._factory(evt.value);
            if (evt.oldLength == 0) {
                el.appendChild(newNode.el);
                childs.push(newNode);
            } else {
                var i = evt.index;
                childs[i].deactivate();
                el.replaceChild(newNode.el, el.childNodes[i]);
                childs[i] = newNode;
            }
            break;
        case 'insert':
            var newNode = this._factory(evt.value);
            if (evt.oldLength <= evt.index) {
                el.appendChild(newNode.el);
                childs.push(newNode);
            } else {
                var i = evt.index;
                el.insertBefore(newNode.el, el.childNodes[i]);
                childs.splice(i, 0, newNode);
            }
            break;
        case 'remove':
            var i = evt.index;
            el.removeChild(el.childNodes[evt.index]);
            childs[i].deactivate();
            childs.splice(i, 1);
            break;
    }
    return true;
}

function handleObsMapAttrs(evt) {
    if (!this.active) return;
    var el = this.el;
    switch (evt.method) {
        case 'change':
            var oldValue = evt.oldValue;
            var attrs = evt.value;
            for (var k in oldValue) {
                if (!(k in value)) {
                    this._setAttr(k);
                }
            }
            for (var k in attrs) {
                this._setAttr(k, attrs[k]);
            }
            break;
        case 'set':
            this._setAttr(evt.key, evt.value);
            break;
    }
    return true;
}
var Node = Class(Object.create(null), function(_super) {
    return {
        _constructor: function(opts) {
            var opts = opts || Object.create(null);
            var el = this.el = createElement(opts.tag || 'div');
            var data = opts.data;
            this._childs = [];
            this.active = true;
            if (data instanceof ObsList) {
                this._factory = opts.factory || _defaultFactory;
                var _handleObsListData = handleObsListData.bind(this);
                data.on('change', _handleObsListData);
            } else if (data instanceof Cell) {
                var _handleCellData = handleCellData.bind(this);
                data.on('change', _handleCellData, this);
                el.innerHTML = data.get();
            } else if (data) {
                el.innerHTML = data;
            }
            var attrs = opts.attrs || Object.create(null);
            if (attrs instanceof ObsMap) {
                var _handleObsMapAttrs = handleObsMapAttrs.bind(this);
                attrs.on('change', _handleObsMapAttrs);
            } else {
                for (var k in attrs) {
                    this._setAttr(k, attrs[k]);
                }
            }
        },
        _setAttr: function(k, v) {
            var cbAttr = this._cbAttr = this._cbAttr || {};
            var cb = cbAttr[k] || (cbAttr[k] = (function(evt) {
                if (!this.active) return;
                this._setAttrVal(k, evt.value);
                return true;
            }).bind(this));
            var cellAttr = this._cellAttr = this._cellAttr || {};
            if (k in cellAttr) {
                cellAttr[k].off(cb);
                delete cellAttr[k];
            }
            if (v instanceof Cell) {
                v.on('change', cb);
                this._setAttrVal(k, v.get());
                cellAttr[k] = v;
            } else {
                this._setAttrVal(k, v);
            }
        },
        _setAttrVal: function(k, v) {
            if (k == 'value') {
                this.el.value = v;
                return;
            }
            if (!v) {
                this.el.removeAttribute(k);
                return;
            }
            this.el.setAttribute(k, v);
        },
        deactivate: function() {
            var childs = this._childs;
            for (var i = 0, l = childs.length; i < l; i++) {
                childs[i].deactivate();
            }
            this._childs = [];
            this.active = false;
        }
    };
});
export default Node;