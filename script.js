const urlParams = new URLSearchParams(window.location.search);

var route = urlParams.get('route');
var dir= urlParams.get('dir');
var timestamp = document.getElementById("timestamp");
var company = routeList[route]["company"];
var active="";

var list = {};

// ** Get the routes of a bus company **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route/${company}

// ** Get the name of a bus stop **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/stop/${stop}

// ** Get the bus stops of a route **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route-stop/${company}/${route}/${dir}

// ** Get the ETA of a route at a bus stop**
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/${company}/${stop}/${route}

function getList(company, route, dir){
    return fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route-stop/${company}/${route}/${dir}`)
    .then(res => {
        return res.json();
        }).then(resJSON => {
            list = [];
            for (stopInfo of resJSON['data']) {
                list.push(stopInfo['stop']);
            }
            return list;
        });
}

async function writeList(list, company, route, dir){
    let table = document.getElementById("rows");
    dir = ({"inbound":"I", "outbound":"O"})[dir];
    let flag=0;
    for(item of list){
        await fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/stop/${item}`)
        .then(res => {
            return res.json();
            })
        .then(stop=>{
            let row = document.createElement("tr");
            row.setAttribute("id", `tr${item}`);
            row.innerHTML = `<td><button onclick='enquire("${item}");'>${stop['data']['name_tc'].split(',')[0]}</button></td><td></td><td></td><td></td>`;
            table.appendChild(row);
        });
        /*
        await fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/${company}/${item}/${route}`)
        .then(res => {
            //console.log(`updateETA starts:${company},${route},${item},${dir}`);
            return res.json();
            })
        .then(stop=>{
            let row = document.getElementById(`tr${item}`);
            let i=1;
            for(s of stop['data']){
                //console.log(row);
                if (dir==s["dir"]){
                    let T = new Date(s['eta']);
                    let t = [`0${(T.getHours())%24}`.slice(-2),`0${T.getMinutes()}`.slice(-2)]
                    row.children[i].innerHTML=`${t[0]}:${t[1]}`;
                    i=i+1;
                }
            }
        })
        */
    }
    genTimestamp();

}

function enquire(item){
    fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/${company}/${item}/${route}`)
        .then(res => {
            return res.json();
            })
        .then(stop=>{
            if(active!=""){
                let erase = document.getElementById(`tr${active}`);
                for(i of [1,2,3]){
                    erase.children[i].innerHTML="";
                    erase.children[i].classList.remove("selected");
                } 
                erase.children[0].classList.remove("selected");
            }
            active = item;
            return stop;
            })
        .then(stop=>{
            let row = document.getElementById(`tr${item}`);
            row.children[0].classList.add("selected");
            //console.log(row,dir);
            let i=1;
            for(s of stop['data']){
                //console.log(row);
                if (({"inbound":"I", "outbound":"O"})[dir]==s["dir"]){
                    let T = new Date(s['eta']);
                    let t = [`0${(T.getHours())%24}`.slice(-2),`0${T.getMinutes()}`.slice(-2)]
                    row.children[i].innerHTML=`${t[0]}:${t[1]}`;
                    row.children[i].classList.add("selected");
                    i=i+1;
                }
            }
        }).then(()=>genTimestamp())
}

function writeDisplay(route, dir){
    let board = document.getElementById("routeNo");
    let display = document.getElementById("display");
    let orig = routeList[route]["orig"], dest = routeList[route]["dest"];
    let theme = routeList[route]["theme"];
    board.innerText=route;

    if(dir=="outbound")
        display.innerText = `${orig} → ${dest}`;
    else
        display.innerText = `${dest} → ${orig}`;

    board.style.backgroundColor=theme;
    board.style.borderColor=theme;
    display.style.borderColor=theme;
    display.style.color=theme;
}

function genTimestamp(){
    let time = new Date(); 
    timestamp.innerHTML = `${('0' + time.getHours()).slice(-2)}:${('0' + time.getMinutes()).slice(-2)}:${('0' + time.getSeconds()).slice(-2)}`;
}

writeDisplay(route, dir);
var dict = getList(company, route, dir).then(res => {
    writeList(res, company, route, dir);
});