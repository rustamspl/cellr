//-------------
export var is = Object.is || function is(a, b) {
    if (a === 0 && b === 0) {
        return 1 / a == 1 / b;
    }
    return a === b || (a != a && b != b);
};
//-------------
export var hasOwn = Object.prototype.hasOwnProperty;
//-------------
export function extend(dst, src) {
    for (var i in src)
        if (src.hasOwnProperty(i)) dst[i] = src[i];
    return dst;
}
//-------------
export function Class(_super, _factory) {
    var _proto = _factory(_super);
    var _constructor = _proto._constructor;
    delete _proto._constructor;
    _constructor.prototype = _super.prototype ? extend(Object.create(_super.prototype), _proto) : _proto;
    return _constructor;
}
//-------------