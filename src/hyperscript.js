var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}


function compileSelector(selector) {
    var match, tag = "div", classes = [], attrs = {}
    while (match = selectorParser.exec(selector)) {
        var type = match[1], value = match[2]
        if (type === "" && value !== "") tag = value
        else if (type === "#") attrs.id = value
        else if (type === ".") classes.push(value)
        else if (match[3][0] === "[") {
            var attrValue = match[6]
            if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
            if (match[4] === "class") classes.push(attrValue)
            else attrs[match[4]] = attrValue || true
        }
    }
    if (classes.length > 0) attrs.className = classes.join(" ")
    return selectorCache[selector] = {tag: tag, attrs: attrs}
}
