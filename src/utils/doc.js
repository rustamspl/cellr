import global from '../js/global';
export var document = global.document;
export var createElement = document.createElement.bind(document);
export var appendChild = document.appendChild;
export var addEventListener = document.addEventListener;