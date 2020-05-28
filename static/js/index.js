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

var containersData;

function makeContainerCards()
{
    containersData = JSON.parse(httpGet("api/getContainers"));
    let html = "";
    for(let i=0; i<containersData.length; i++) 
    {
        let c = containersData[i]
        html += '<div class="col-xl-3 col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-3"><div class="card text-center bg-dark text-white">';
        if(c["containers_running"] == c["containers_total"])
            html += '<div class="card-header bg-success" id="h_'+i+'">';
        else
            html += '<div class="card-header bg-danger" id="h_'+i+'">';
        html += c["name"];
        html += '</div><div class="card-body">';
        html += '<button type="button" class="btn btn-secondary" onclick="switchContainer(\''+i+'\',\''+c["imageName"]+'\',\''+c["id"]+'\')"><i class="fas fa-power-off"></i></button>&nbsp;&nbsp;&nbsp;';
        html += '<img src="static/icons/'+c["icon"]+'" width="100px" height="100px"/>';
        html += '&nbsp;&nbsp;&nbsp;<button type="button" class="btn btn-secondary" onclick="getDetails(\''+i+'\')">'+c["containers_running"]+' / '+c["containers_total"]+'</button>';
        html += '</div><div class="card-footer bg-secondary">Ports: '+c["ports"]+'&nbsp;|&nbsp; Date: '+c["startDate"]+'</div></div></div>';
    };
    document.querySelector("#containers").innerHTML = html;
}

function getDetails(id)
{
    let d = containersData[id];
    let html = '<table class="table table-striped table-hover"><thead class="thead-dark"><th scope="col">Name</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col">Ports</th><th scope="col">Logs</th></tr></thead><tbody>'
    for(let i=0; i<d['containers'].length; i++)
    {
        let s = '<span class="badge badge-danger">STOPPED</span>';
        if(d['containers_status'][i])
            s = '<span class="badge badge-success">STARTED</span>';
        html += '<tr><td>'+d['containers'][i]+'</td><td>'+s+'</td><td>'+d['containers_date'][i]+'</td><td>'+d['containers_ports'][i]+'</td><td><button type="button" class="btn btn-secondary" onclick="getLogs('+id+')"><i class="fas fa-server"></i></button>'
    }
    html += '</tbody></table>';
    
    document.querySelector("#containersTable").innerHTML = html;
    $('#containersModal').modal('show');
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

function switchContainer(id)
{
    let el = document.querySelector('#h_'+id);
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
        if(httpGet("api/startContainer?id="+id) == 'true')
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
        $('#containersModal').modal('hide');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    makeContainerCards();
    updateStats();
});

setInterval(function(){ 
    updateStats();
}, 10000);
