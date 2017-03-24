'use strict';
import Cell from './Cell';
import ObsList from './ObsList';
import ObsMap from './ObsMap';
import {
    Node,m
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

   
    var container = m('', [
        m('button.zzz', 'btnAdd11', {
            onclick: function() {
                // var r = Math.random();
                var c = new Cell(function() {
                    return ttt.get() + ':' + pos.get();
                });
                a.push(c);
            }
        }),
        m('button', 'btnRemove11', {
            onclick: function() {
                a.remove(0);
            }
        }),
        m('button', 'btnZzzzz', {
            onclick: function() {
                a.change([456, 678, 446]);
            }
        }),
        m('', a, {}, function(val) {
            var n = m('input.inp221','', {
                value: ttt.get(),
                onkeydown: function() {
                    var _this = this;
                    setTimeout(function() {
                        ttt.set(_this.value);
                    }, 1);
                }
            });
            ttt.on('change', function(evt) {
                n.el.value = evt.value;
                return true;
            });
            return m('', [n, val]);
        })
    ]);
 
    document.body.appendChild(container.el);
    addEventListener.call(document, 'mousemove', function(evt) {
        pos.set(evt.clientX);
        attrs.set('class', 'cl' + evt.clientY);
    });
});