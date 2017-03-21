'use strict';
import Cell from './Cell';
import ObsList from './ObsList';
import ObsMap from './ObsMap';
import Node from './Node';
import {
    createElement,
    appendChild,
    addEventListener,
    document
} from './utils/doc';
//-------------------------
// var ed = new Cell();
// var ed2 = new Cell();
// var press = new Cell();
// var txt = new Cell(function() {
//     return ' pos:' + (pos.get() || 'rr') + ' press:' + (press.get() || 'zzz');
// });
// var txt2 = new Cell(function() {
//     return 'ed:' + ed.get() + ' txt2:' + txt.get() + ' double:' + (pos.get() * 2);
// });
// var txt3 = new Cell(function() {
//     return 'ed2:' + ed2.get() + ' txt2at:' + txt2.get();
// });
//-------------------------
//-------------------------


addEventListener.call(document, 'DOMContentLoaded', function() {
    var bodyAppend = appendChild.bind(document.body);
    var pos = new Cell();

    var attrs=new ObsMap();

    var view = new Node({
        data: pos,
        attrs:attrs
    });
    bodyAppend(view.el);
    var a = new ObsList();
    //------
    var btnAdd = createElement('button');
    btnAdd.innerHTML = 'btnAdd';
    bodyAppend(btnAdd);
    btnAdd.onclick = function() {
        var r = Math.random();
        var c = new Cell(function() {
            return r + ':' + pos.get();
        });
        a.push(c);
    };
    //------
    var btnRemove = createElement('button');
    btnRemove.innerHTML = 'btnRemove';
    bodyAppend(btnRemove);
    btnRemove.onclick = function() {
        a.remove(0);
    };
    //-----
    //------
    var btnRemove1 = createElement('button');
    btnRemove1.innerHTML = 'btnZZZ11';
    bodyAppend(btnRemove1);
    btnRemove1.onclick = function() {
        a.change([456, 678, 446]);
    };
    //-----
    var view2 = new Node({
        data: a,
        factory: function(val) {
            return new Node({
                tag: 'input',
                props: {
                    value: val,
                    className:'inp1'
                }
            });
        }
    });
    bodyAppend(view2.el);
    addEventListener.call(document, 'mousemove', function(evt) {
        //div.innerHTML = evt.x + ':' + evt.y;
        pos.set(evt.x);
        attrs.set('class','cl'+evt.y);
    });
    // 
    // 
    // var div3 = createElement('div');
    // bodyAppend(div3);
    // var div4 = createElement('div');
    // bodyAppend(div4);
    // div4.className = 'zzzz';
    // var ted = createElement('input');
    // bodyAppend.call(div4, ted);
    // ted.onkeyup = function() {
    //     ed.set(ted.value);
    // };
    // var ted2 = createElement('input');
    // bodyAppend(ted2);
    // ted2.onkeyup = function() {
    //     ed2.set(ted2.value);
    // };
    // txt.on('change', function() {
    //     div.innerHTML = txt.get();
    // });
    // txt2.on('change', function() {
    //     div2.innerHTML = txt2.get();
    // });
    // txt3.on('change', function() {
    //     div3.innerHTML = txt3.get();
    // });
    // addEventListener.call(document, 'mousemove', function(evt) {
    //     //div.innerHTML = evt.x + ':' + evt.y;
    //     pos.set(evt.x);
    // });
    // addEventListener.call(document, 'mousedown', function() {
    //     press.set('KU');
    //     ///div2.innerHTML = 'down';
    // });
    // addEventListener.call(document, 'mouseup', function() {
    //     //div2.innerHTML = 'up2';
    //     press.set('UPpp');
    // });

   
});