#!/bin/bash

docker run -p 8080:8080 --name api minhanh3110/edtech-assistant-api
docker run -p 8081:8081 --name assignment minhanh3110/edtech-assistant-assignment
docker run -p 8082:8082 --name background-job minhanh3110/edtech-assistant-background-job
docker run -p 8083:8083 --name chat minhanh3110/edtech-assistant-chat
docker run -p 8084:8084 --name quiz minhanh3110/edtech-assistant-quiz