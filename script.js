const urlParams = new URLSearchParams(window.location.search);

var route = urlParams.get('route');
var dir= urlParams.get('dir');
var company;
var active="";

// ** Get the routes of a bus company **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route/${company}

// ** Get the name of a bus stop **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/stop/${stop}

// ** Get the bus stops of a route **
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route-stop/${company}/${route}/${dir}

// ** Get the ETA of a route at a bus stop**
// https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/${company}/${stop}/${route}

function getCompany(route){
    return fetch(`https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/NWFB/${route}`)
        .then(res => {
            return res.json();
            }).then(resJSON => {
                if(Object.keys(resJSON['data']).length === 0)
                    return "CTB";
                else
                    return "NWFB";
            });
    }

function getRoutes(company){
    return fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route/${company}`)
        .then(res => {
            return res.json();
            }).then(resJSON => {
                list = [];
                for (routeInfo of resJSON['data']) {
                    list.push({
                        "route": routeInfo['route'],
                        "company": company
                        /*
                        "orig": routeInfo['orig_tc'],
                        "dest": routeInfo['dest_tc']*/
                    });
                }
                return list;
            });
    }


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
        })
}

function writeDisplay(company, route, dir){
    let board = document.getElementById("routeNo");
    let display = document.getElementById("display");
    board.innerText=route;
    fetch(`https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/${company}/${route}`)
    .then(res => {
        return res.json();
        }).then(resJSON => {
            if(dir=="outbound")
                display.innerText = `${resJSON['data']['orig_tc']} → ${resJSON['data']['dest_tc']}`;
            else
                display.innerText = `${resJSON['data']['dest_tc']} → ${resJSON['data']['orig_tc']}`;
        });
}
var dict = getCompany(route).then(comp => {
    company = comp;
    writeDisplay(comp, route, dir);
    return getList(comp, route, dir);
}).then(res => {
    writeList(res, company, route, dir);
});