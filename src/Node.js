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
//==============================================
function handleObsMapSetter(setter, evt) {
    if (!this.active) return;
    var el = this.el;
    switch (evt.method) {
        case 'change':
            var oldValue = evt.oldValue;
            var attrs = evt.value;
            for (var k in oldValue) {
                if (!(k in value)) {
                    setter(k);
                }
            }
            for (var k in attrs) {
                setter(k, attrs[k]);
            }
            break;
        case 'set':
            setter(evt.key, evt.value);
            break;
    }
    return true;
}
var setPropFns = {};

function setPropFactory(t) {
    var setter = '_set' + t + 'Val';
    return setPropFns[t] || (setPropFns[t] = function(k, v) {
        var mapD = this._mapd || (this._mapd = {});
        var mapData = mapD[t] || (mapD[t] = {
            cbs: {},
            cls: {}
        });
        var cbs = mapData.cbs;
        var cb = cbs[k] || (cbs[k] = (function(evt) {
            if (!this.active) return;
            this[setter](k, evt.value);
            return true;
        }).bind(this));
        var cls = mapData.cls;
        if (k in cls) {
            cls[k].off(cb);
            delete cls[k];
        }
        if (v instanceof Cell) {
            v.on('change', cb);
            this[setter](k, v.get());
            cls[k] = v;
        } else {
            this[setter](k, v);
        }
    });
}
var bindMapFns = {}

function bindMapFactory(name) {
    var setProp = setPropFactory(name)
    return bindMapFns[name] || (bindMapFns[name] = function(map) {
        if (!map) return;
        var _setProp = setProp.bind(this);
        if (map instanceof ObsMap) {
            var _handleObsMapAttrs = handleObsMapSetter.bind(this, _setProp);
            map.on('change', _handleObsMapAttrs);
        } else {
            for (var k in map) {
                _setProp(k, map[k]);
            }
        }
    })
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
            } else if (data instanceof Array) {
                this._childs = data;
                for (var i = 0, l = data.length; i < l; i++) {
                    el.appendChild(data[i].el);
                }
            } else if (data instanceof Cell) {
                var _handleCellData = handleCellData.bind(this);
                data.on('change', _handleCellData, this);
                el.innerHTML = data.get();
            } else if (data) {
                el.innerHTML = data;
            }
            bindMapFactory('Attr').call(this, opts.attrs);
            bindMapFactory('Prop').call(this, opts.props);
            bindMapFactory('Style').call(this, opts.style);
        },
        _setAttrVal: function(k, v) {
            if (!v) {
                this.el.removeAttribute(k);
                return;
            }
            this.el.setAttribute(k, v);
        },
        _setPropVal: function(k, v) {
            this.el[k] = v;
        },
        _setStyleVal: function(k, v) {
            this.el.style[k] = v;
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