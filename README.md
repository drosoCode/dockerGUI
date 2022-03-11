# dockerGUI
Very simple GUI to manage docker containers

## Installation
 - Clone this repo
 - add your icons in static/icons
 - edit the config.json file
 - build the container
 - customize the startDocker.sh script and run the container using this script

## Configuration
 - (see config.sample.json)
 - system/interface is the network interface to monitor
 - system/imagesBaseDir is the directory used to do the docker-compose commands like this: imagesBaseDir+modeConfig
 - system/enableGPU is to enable gpu status
 - containers is the list of your containers
 - the containers attr in containers is a list of possible names for your containers (for example in compose mode, you can run multiple containers)
 - startMode is eighter "compose" to use docker-compose or "command" to run a command
 - modeConfig is the folder containing the docker-compose.yml for compose mode, and the command to run for command mode
