// extended from eta.js 

const urlParams = new URLSearchParams(window.location.search);

var route = urlParams.get('route');
var dir= urlParams.get('dir');
var timestamp = document.getElementById("timestamp");
var company;
var select = document.getElementById("ETAselect");
var table = document.getElementById("ETAtable");
var switcher = document.getElementById("switch");

if(route == null || !(route in routeList)){
    genRoute();
} else if (dir == null || (dir != 'inbound' && dir != 'outbound')){
    genDir(route);
} else {
    genTable(route, dir);
}
