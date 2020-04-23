import os
import flask
from flask import request, jsonify, abort, render_template
import docker
from GPUtil import getGPUs
import psutil
import json

#pip3 install gputil psutil docker flask

client = docker.from_env()
with open('config.json') as f:
    data = json.load(f)

app = flask.Flask(__name__)
app.config["DEBUG"] = False

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/api/getContainers', methods=['GET'])
def getContainers():
	running = {}
	for c in client.containers.list():
		running[c.attrs["Config"]["Image"]] = {
			"id": c.attrs["Image"],
			"status": c.attrs["State"]["Running"],
			"startDate": c.attrs["State"]["StartedAt"],
			"ports": ' | '.join(c.attrs["HostConfig"]["PortBindings"].keys())
		}
	containers = data["containers"]
	for container in containers:
		if container["imageName"] in running:
			dat = running[container["imageName"]]
			container["id"] = dat["id"][7:]
			container["status"] = dat["status"]
			container["startDate"] = dat["startDate"][0:dat["startDate"].find(".")]
			container["ports"] = dat["ports"]
		else:
			container["id"] = -1
			container["status"] = False
			container["startDate"] = "Undefined"
			container["ports"] = "None"
	return jsonify(containers)

@app.route('/api/getLogs', methods=['GET'])
def getLogs():
	for c in client.containers.list():
		if c.attrs["Image"][7:] == request.args["id"]:
			return c.logs()

@app.route('/api/stopContainer', methods=['GET'])
def stopContainer():
	for c in client.containers.list():
		if c.attrs["Image"][7:] == request.args["id"]:
			c.stop()
			return 'true'
	return 'false'

@app.route('/api/startContainer', methods=['GET'])
def startContainer():
	for c in data["containers"]:
		if c["imageName"] == request.args["imageName"]:
			if c["startMode"] == "compose":
				os.system("cd "+data["system"]["imagesBaseDir"]+c["modeConfig"]+" && docker-compose up -d")
				return 'true'
			elif c["startMode"] == "command":
				os.system(c["modeConfig"])
				return 'true'
	return 'false'

@app.route('/api/getStatistics', methods=['GET'])
def getStatistics():
	gpu = getGPUs()[0]
	net = psutil.net_io_counters(pernic=True)[data["system"]["interface"]]
	print(net)
	stats = {
		"gpu": {
			"name": gpu.name,
			"temperature": gpu.temperature,
			"load": gpu.load*100,
			"memory": gpu.memoryUtil*100
		},
		"cpu": psutil.cpu_percent(interval=1, percpu=True),
		"ram": psutil.virtual_memory()[2],
		"network": {
			"in": round(net[1]/1000000000),
			"out": round(net[0]/1000000000)
		}
	}
	return jsonify(stats)

app.run(host='0.0.0.0', port=8080)
