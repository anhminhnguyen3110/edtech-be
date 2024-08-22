#!/bin/bash

# Open new Git Bash windows and run each command
start mintty -e bash -c "yarn run start:dev; exec bash"
start mintty -e bash -c "yarn run start:dev quiz; exec bash"
start mintty -e bash -c "yarn run start:dev assignment; exec bash"
start mintty -e bash -c "yarn run start:dev background-job; exec bash"
start mintty -e bash -c "yarn run start:dev chat; exec bash"
start mintty -e bash -c "yarn run start:dev common; exec bash"