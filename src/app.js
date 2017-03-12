'use strict';
import Cell from './Cell';
//import ObsArray from './ObsArray';
import {
    createElement,
    appendChild,
    addEventListener,
    document
} from './utils/doc';
//-------------------------
var pos = new Cell();
var ed = new Cell();
var ed2 = new Cell();
var press = new Cell();
var txt = new Cell(function() {
    return ' pos:' + (pos.get() || 'rr') + ' press:' + (press.get() || 'zzz');
});
var txt2 = new Cell(function() {
    return 'ed:' + ed.get() + ' txt2:' + txt.get() + ' double:' + (pos.get() * 2);
});
var txt3 = new Cell(function() {
    return 'ed2:' + ed2.get() + ' txt2at:' + txt2.get();
});
//-------------------------
addEventListener.call(document, 'DOMContentLoaded', function() {
    var body = document.body;
    var div = createElement('div');
    var bodyAppend = appendChild.bind(body);
    bodyAppend(div);
    var div2 = createElement('div');
    bodyAppend(div2);
    var div3 = createElement('div');
    bodyAppend(div3);
    var div4 = createElement('div');
    bodyAppend(div4);
    div4.className = 'zzzz';
    var ted = createElement('input');
    bodyAppend.call(div4, ted);
    ted.onkeyup = function() {
        ed.set(ted.value);
    };
    var ted2 = createElement('input');
    bodyAppend(ted2);
    ted2.onkeyup = function() {
        ed2.set(ted2.value);
    };
    txt.on('change', function() {
        div.innerHTML = txt.get();
    });
    txt2.on('change', function() {
        div2.innerHTML = txt2.get();
    });
    txt3.on('change', function() {
        div3.innerHTML = txt3.get();
    });
    addEventListener.call(document, 'mousemove', function(evt) {
        //div.innerHTML = evt.x + ':' + evt.y;
        pos.set(evt.x);
    });
    addEventListener.call(document, 'mousedown', function() {
        press.set('KU');
        ///div2.innerHTML = 'down';
    });
    addEventListener.call(document, 'mouseup', function() {
        //div2.innerHTML = 'up2';
        press.set('UPpp');
    });
});
