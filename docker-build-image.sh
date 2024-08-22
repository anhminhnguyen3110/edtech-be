#!/bin/bash

docker build -f apps/api/Dockerfile -t minhanh3110/edtech-assistant-api .
docker push minhanh3110/edtech-assistant-api
docker build -f apps/assignment/Dockerfile -t minhanh3110/edtech-assistant-assignment .
docker push minhanh3110/edtech-assistant-assignment
docker build -f apps/background-job/Dockerfile -t minhanh3110/edtech-assistant-background-job .
docker push minhanh3110/edtech-assistant-background-job
docker build -f apps/chat/Dockerfile -t minhanh3110/edtech-assistant-chat .
docker push minhanh3110/edtech-assistant-chat
docker build -f apps/quiz/Dockerfile -t minhanh3110/edtech-assistant-quiz .
docker push minhanh3110/edtech-assistant-quiz