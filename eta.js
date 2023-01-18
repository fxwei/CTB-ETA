// extended from routeList.js and natsort



// ** Get the routes of a bus company **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route/${company}

// ** Get the name of a bus stop **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/stop/${stop}

// ** Get the bus stops of a route **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route-stop/${company}/${route}/${dir}

// ** Get the ETA of a route at a bus stop**
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/${company}/${stop}/${route}

var active="";

var list = {};

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
            let segments = stop['data']['name_tc'].split(',');
            let road="";
            if(segments.length>1)
                road=`<b>${segments[1]}</b>`;
            row.innerHTML = `<td><button onclick='enquire("${item}");'>${road} ${segments[0]}</button></td><td></td><td></td><td></td>`;
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

function enquire(item=""){
    /*if (item=="")
        item = active;
    if (item=="")
        return;*/
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
                    let t = [`0${(T.getHours())%24}`.slice(-2),`0${T.getMinutes()}`.slice(-2), `0${T.getSeconds()}`.slice(-2)]
                    row.children[i].innerHTML=`${t[0]}:${t[1]}`;
                    //row.children[i].innerHTML=`${t[0]}:${t[1]}<b> ${t[2]}</b>`;
                    row.children[i].classList.add("selected");
                    i=i+1;
                }
            }
        }).then(()=>{
            genTimestamp();
        })
}


function writeDisplay(route, dir){
    let board = document.getElementById("routeNo");
    let display = document.getElementById("display");
    let timestamp = document.getElementById("timestamp");
    let orig = routeList[route]["orig"], dest = routeList[route]["dest"];
    let theme = routeList[route]["theme"];
    if (route[route.length - 1].toLowerCase()!=route[route.length - 1].toUpperCase()){
        board.innerHTML = route.slice(0,-1)+`<b>${route[route.length - 1]}</b>`;
    } else {
        board.innerHTML=route;
    }
    timestamp.innerHTML = "--:--<b> --</b>";

    if(dir=="outbound")
        display.innerHTML = `${orig} → ${dest}`;
    else if(dir=="inbound")
        display.innerHTML = `${dest} → ${orig}`;

    board.style.backgroundColor=theme;
    board.style.borderColor=theme;
    display.style.borderColor=theme;
    display.style.color=theme;
}

function genTimestamp(){
    let time = new Date(); 
    timestamp.innerHTML = `${('0' + time.getHours()).slice(-2)}:${('0' + time.getMinutes()).slice(-2)}<b> ${('0' + time.getSeconds()).slice(-2)}</b>`;
}

function genRoute(){
    let sortedKeys = Object.keys(routeList);
    sortedKeys.sort(natsort());
    let td = document.createElement("td");
    td.setAttribute("colspan", "4");
    td.style.maxWidth = "inherit";
    for(let rt of sortedKeys){
        let r = document.createElement("button");
        r.setAttribute("class", `route`);
        r.setAttribute("onclick",`window.location.search = 'route=${rt}';`)
        r.style.backgroundColor=routeList[rt]["theme"];
        if (rt[rt.length - 1].toLowerCase()!=rt[rt.length - 1].toUpperCase()){
            r.innerHTML = rt.slice(0,-1)+`<b>${rt[rt.length - 1]}</b>`;
        } else {
            r.innerHTML = rt;
        }
        td.appendChild(r);
    }
    select.appendChild(td);
}

function genDir(route){
    writeDisplay(route, "");
    let orig = routeList[route]["orig"], dest = routeList[route]["dest"];
    let td = document.createElement("td");
        td.setAttribute("colspan", "4");
    for(dir of ["outbound","inbound"]){
        let but= document.createElement("button");
        but.setAttribute("class", `dir`);
        but.setAttribute("onclick",`window.location.search = 'route=${route}&dir=${dir}';`)
        but.innerHTML=dir;
        if(dir=="outbound")
            but.innerText = `${orig} → ${dest}`;
        else if(dir=="inbound")
            but.innerText = `${dest} → ${orig}`;
        td.appendChild(but);
    }
    select.appendChild(td);

}

function genTable(route, dir){
    company = routeList[route]["company"];
    select.style.display = "none";
    table.style.display = "initial";
    switcher.style.display = "inline-block";
    writeDisplay(route, dir);
    var dict = getList(company, route, dir).then(res => {
        writeList(res, company, route, dir);
    });
}

function reset(){
    window.location.search = "";
}

function switchDir(){
    let sw = {"outbound":"inbound","inbound":"outbound"};
    window.location.search = `route=${route}&dir=${sw[dir]}`;
}