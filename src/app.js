'use strict';
import Cell from './Cell';
import global from './js/global';
import fetch from './js/fetch';
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
addEventListener.call(document, 'DOMContentLoaded', function() {
    var pos = new Cell();
    var ttt = new Cell('z');
    var attrs = new ObsMap();
    var view = new Node({
        data: pos,
        attrs: attrs
    });
    var a = new ObsList();
    //------
    //------
    var container = new Node({
        data: [
            view,
            new Node({
                tag: 'button',
                data: 'btnAdd11',
                props: {
                    onclick: function() {
                        // var r = Math.random();
                        var c = new Cell(function() {
                            return ttt.get() + ':' + pos.get();
                        });
                        a.push(c);
                    }
                }
            }),
            new Node({
                tag: 'button',
                data: 'btnRemove11',
                props: {
                    onclick: function() {
                        a.remove(0);
                    }
                }
            }),
            new Node({
                tag: 'button',
                data: 'btnZZZ11',
                props: {
                    onclick: function() {
                        a.change([456, 678, 446]);
                    }
                }
            }),
            new Node({
                data: a,
                factory: function(val) {
                    var n = new Node({
                        tag: 'input',
                        attrs: {
                            'class': 'inp221'
                        },
                        props: {
                            value: ttt.get(),
                            onkeyup: function() {
                                ttt.set(this.value);
                            },
                            onchange: function() {
                                ttt.set(this.value);
                            }
                        }
                    });
                    ttt.on('change', function(evt) {
                        n.el.value = evt.value;
                        return true;
                    });
                    var root = new Node({
                        data: [n, val]
                    });
                    return root;
                }
            })
        ]
    });
    document.body.appendChild(container.el);
    addEventListener.call(document, 'mousemove', function(evt) {
        pos.set(evt.x);
        attrs.set('class', 'cl' + evt.y);
    });
});