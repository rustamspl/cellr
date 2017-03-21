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
            var attrs = evt.value;
            for (var k in oldValue) {
                if (!(k in value)) {
                    this._setAttr(k);
                }
            }
            for (var k in attrs) {
                this._setAttr(k, attrs[k]);
            }
            return;
        case 'set':
            this._setAttr(evt.key, evt.value);
            return;
    }
}
var Node = Class(Object.create(null), function(_super) {
    return {
        _constructor: function(opts) {
            var opts = opts || Object.create(null);
            var el = this.el = createElement(opts.tag || 'div');
            var data = opts.data;
            this._emitters = [];
            if (data instanceof ObsList) {
                this._factory = opts.factory || _defaultFactory;
                data.on('change', _handleObsListData, this);
            } else if (data instanceof Cell) {
                data.on('change', _handleCellData, this);
                el.innerHTML = data.get();
            } else if (data) {
                el.innerHTML = data;
            }
            var attrs = opts.attrs || Object.create(null);
            if (attrs instanceof ObsMap) {
                attrs.on('change', _handleObsMapAttrs, this);
            } else {
                for (var k in attrs) {
                    this._setAttr(k, attrs[k]);
                }
            }
        },
        _setAttr: function(k, v) {
            var old = this._cellAttr[k];
            if (old) {
                old.v.off(old.cb, this);
            }
            if (v instanceof Cell) {
                var cb = function(evt) {
                    this._setAttrVal(k, evt.value);
                };
                v.on('change', cb, this);
                this._setAttrVal(k, v.get());
                this._cellAttr[k] = {
                    v: v,
                    vb: cb
                };
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
        addEmitter: function(emitter) {
            var ind, emitters = this._emitters;
            if ((ind = emitters.indexOf(emitter)) != -1) {
                return;
            }
            this._emitters.push(emitter);
        },
        removeEmitter: function(emitter) {
            var ind, emitters = this._emitters;
            if ((ind = emitters.indexOf(emitter)) != -1) {
                emitters.splice(ind, 1);
            }
        }
        offEmitters: function() {
            var emitters = this._emitters;
            for (var i = 0, l = emitters.length; i < l; i++) {
                emitters[i].offCtx(this);
            }
            this._emitters = [];
        }
    };
});
export default Node;