'use strict';
import Cell from './Cell';
import ObsList from './ObsList';
import ObsMap from './ObsMap';
import {
    Node
} from './Node';
import {
    createElement,
    appendChild,
    addEventListener,
    document
} from './utils/doc';
import nextTick from './utils/nextTick';
import Promise from './js/promise';
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
                            onkeydown: function() {
                               var _this=this;
                                setTimeout(function(){
                                   ttt.set(_this.value); 
                                },1);
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
        pos.set(evt.clientX);
        attrs.set('class', 'cl' + evt.clientY);
    });
});