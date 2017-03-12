'use strict';
import Cell from './Cell';
import ObsArray from './ObsArray';
//-------------------------
var posAtom = new Cell();
var edAtom = new Cell();
var ed2Atom = new Cell();
var pressAtom = new Cell();
var txtAtom = new Cell(function() {
    return ' pos:' + (posAtom.get() || 'rr') + ' press:' + (pressAtom.get() || 'zzz');
});
var txt2Atom = new Cell(function() {
    return 'ed:' + edAtom.get() + ' txt2:' + txtAtom.get() + ' double:' + (posAtom.get() * 2);
});
var txt3Atom = new Cell(function() {
    return 'ed2:' + ed2Atom.get() + ' txt2at:' + txt2Atom.get();
});
//-------------------------
document.addEventListener('DOMContentLoaded', function(evt) {
    var div = document.createElement('div');
    document.body.appendChild(div);
    var div2 = document.createElement('div');
    document.body.appendChild(div2);
    var div3 = document.createElement('div');
    document.body.appendChild(div3);
    var ed = document.createElement('input');
    document.body.appendChild(ed);
    ed.onkeyup = function() {
        edAtom.set(ed.value);
    };
    var ed2 = document.createElement('input');
    document.body.appendChild(ed2);
    ed2.onkeyup = function() {
        ed2Atom.set(ed2.value);
    };
    txtAtom.on('change', function(v) {
        div.innerHTML = txtAtom.get();
    });
    txt2Atom.on('change', function(v) {
        div2.innerHTML = txt2Atom.get();
    });
    txt3Atom.on('change', function(v) {
        div3.innerHTML = txt3Atom.get();
    });
    document.addEventListener('mousemove', function(evt) {
        //div.innerHTML = evt.x + ':' + evt.y;
        posAtom.set(evt.x);
    });
    document.addEventListener('mousedown', function(evt) {
        pressAtom.set('KU');
        ///div2.innerHTML = 'down';
    });
    document.addEventListener('mouseup', function(evt) {
        //div2.innerHTML = 'up2';
        pressAtom.set('UPpp');
    });
});