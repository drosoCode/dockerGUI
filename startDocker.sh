#!/bin/bash


/usr/bin/docker run \
 -v /var/run/docker.sock:/var/run/docker.sock \
 -v /app/docker/run/:/app/docker/run/ \
 --gpus=all \
 --network=host \
 -d dockergui