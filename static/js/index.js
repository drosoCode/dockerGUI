function httpGet(url, async=false)
{    
    if(url.indexOf("?") >= 0)
        url += "&time="+new Date().getTime()
    else
        url += "?time="+new Date().getTime()
        
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, async); // false for synchronous request
    xmlHttp.send( null );        
    return xmlHttp.responseText;
}


function makeContainerCards()
{
    let data = JSON.parse(httpGet("api/getContainers"));
    let html = "";
    let ids = 0;
    data.forEach(c => {
        html += '<div class="col-xl-3 col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-3"><div class="card text-center bg-dark text-white">';
        if(c["status"])
            html += '<div class="card-header bg-success" id="h'+ids+'">';
        else
            html += '<div class="card-header bg-danger" id="h'+ids+'">';
        html += c["name"];
        html += '</div><div class="card-body">';
        html += '<button type="button" class="btn btn-secondary" onclick="switchContainer(\''+ids+'\',\''+c["imageName"]+'\',\''+c["id"]+'\')"><i class="fas fa-power-off"></i></button>&nbsp;&nbsp;&nbsp;';
        html += '<img src="static/icons/'+c["icon"]+'" width="100px" height="100px"/>';
        html += '&nbsp;&nbsp;&nbsp;<button type="button" class="btn btn-secondary" onclick="getLogs(\''+c["id"]+'\')"><i class="fas fa-server"></i></button>';
        html += '</div><div class="card-footer bg-secondary">'+c["ports"]+'&nbsp;##&nbsp;'+c["startDate"]+'</div></div></div>';
        ids++;
    });
    document.querySelector("#containers").innerHTML = html;
}

function updateStats()
{
    let data = JSON.parse(httpGet("api/getStatistics"));
    let cpu = "";
    data["cpu"].forEach(c => {
        cpu += c+"% ";
    });
    document.querySelector("#stat_cpu").textContent = cpu;
    document.querySelector("#stat_ram").textContent = data["ram"]+"%";
    document.querySelector("#stat_gpu").textContent = "LOAD: "+data["gpu"]["load"]+"% | MEM: "+data["gpu"]["memory"]+"% | TEMP: "+data["gpu"]["temperature"]+"°C";
    document.querySelector("#stat_net").textContent = "IN: "+data["network"]["in"]+" GB | OUT: "+data["network"]["out"]+" GB";
}

function switchContainer(headID, imageName, id)
{
    let el = document.querySelector('#h'+headID);
    if(el.classList.contains("bg-success"))
    {
        if(httpGet("api/stopContainer?id="+id) == 'true')
        {
            el.classList.remove("bg-success");
            el.classList.add("bg-danger");
        }
    }
    else
    {
        if(httpGet("api/startContainer?imageName="+imageName) == 'true')
        {
            el.classList.remove("bg-danger");
            el.classList.add("bg-success");
        }
    }
}

function getLogs(id)
{
    if(id != "-1")
    {
        document.querySelector("#logs").textContent = "";
        document.querySelector("#logs").textContent = httpGet("api/getLogs?id="+id);
        $('#logsModal').modal('show');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    makeContainerCards();
    updateStats();
});

setInterval(function(){ 
    updateStats();
}, 10000);
