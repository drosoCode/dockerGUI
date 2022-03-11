#!/usr/local/bin/python3

import os
import flask
from flask import request, jsonify, abort, render_template
from datetime import datetime
import docker
from GPUtil import getGPUs
import psutil
import json

client = docker.from_env()
with open(os.getenv("DGUI_CONF") or 'config.json') as f:
    data = json.load(f)

if data['system']['enableGPU']:
	from GPUtil import getGPUs

app = flask.Flask(__name__)
app.config["DEBUG"] = False

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/api/getContainers', methods=['GET'])
def getContainers():
	running = {}
	for c in client.containers.list():
		ports = []
		if "PortBindings" in c.attrs["HostConfig"] and c.attrs["HostConfig"]["PortBindings"] is not None:
			for p in c.attrs["HostConfig"]["PortBindings"].keys():
				ports.append(c.attrs["HostConfig"]["PortBindings"][p][0]["HostPort"])
		if ports == "":
			ports = None
		running[c.attrs["Name"][1:]] = {
			"status": c.attrs["State"]["Running"],
			"startDate": c.attrs["State"]["StartedAt"][0:c.attrs["State"]["StartedAt"].find(".")],
			"ports": ports
		}

	ret = []
	for package in data["containers"]:
		package["containers_running"] = 0
		package["startDate"] = -1
		package["ports"] = 0
		package["containers_total"] = len(package["containers"])
		package["containers_status"] = []
		package["containers_date"] = []
		package["containers_ports"] = []

		for container in package["containers"]:
			if container in running:
				package["containers_running"] += 1
				dat = running[container]
				if dat["ports"] is not None:
					package["ports"] += len(dat["ports"])
					package["containers_ports"].append(dat["ports"])
				else:
					package["containers_ports"].append('None')
				dt = datetime.strptime(dat["startDate"], '%Y-%m-%dT%H:%M:%S')
				if package["startDate"] == -1 or package["startDate"] < dt:
					package["startDate"] = dt
				package["containers_status"].append(True)
				package["containers_date"].append(dat["startDate"])
			else:
				package["containers_status"].append(False)
				package["containers_date"].append('Undefined')

		if package["startDate"] == -1:
			package["startDate"] = "Undefined"
		else:
			package["startDate"] = package["startDate"].strftime("%Y/%m/%d %H:%M:%S")
		ret.append(package)

	return jsonify(ret)

@app.route('/api/getLogs', methods=['GET'])
def getLogs():
	containers = data["containers"][int(request.args["id"])]["containers"]
	for c in client.containers.list():
		if c.attrs["Name"][1:] in containers:
			return c.logs()

@app.route('/api/stopContainer', methods=['GET'])
def stopContainer():
	containers = data["containers"][int(request.args["id"])]["containers"]
	for c in client.containers.list():
		if c.attrs["Name"][1:] in containers:
			c.stop()
	return 'true'

@app.route('/api/startContainer', methods=['GET'])
def startContainer():
	c = data["containers"][int(request.args["id"])]
	if c["startMode"] == "compose":
		os.system("cd "+data["system"]["imagesBaseDir"]+c["modeConfig"]+" && docker-compose up -d")
		return 'true'
	elif c["startMode"] == "command":
		os.system(c["modeConfig"])
		return 'true'
	return 'false'

@app.route('/api/getStatistics', methods=['GET'])
def getStatistics():
	net = psutil.net_io_counters(pernic=True)[data["system"]["interface"]]
	stats = {
		"cpu": psutil.cpu_percent(interval=1, percpu=True),
		"ram": psutil.virtual_memory()[2],
		"network": {
			"in": round(net[1]/1000000000),
			"out": round(net[0]/1000000000)
		}
	}
	if data['system']['enableGPU']:
		gpu = getGPUs()[0]
		stats['gpu'] = {
			"name": gpu.name,
			"temperature": gpu.temperature,
			"load": round(gpu.load*100, 1),
			"memory": round(gpu.memoryUtil*100, 1)
		}
	return jsonify(stats)

app.run(host='0.0.0.0', port=8080)
