#!/bin/bash

echo "|-------- Beginning of Running Docker Deployment Script --------|"

echo "Attempting to login to 'docker.cs.vt.edu':"
docker login docker.cs.vt.edu

cd ..
continue_running=true
while [ "$continue_running" = true ]; do
    echo "Here are the following options:"
    echo "[1] Type ['list' or 'ls'] to List Current Docker Processes"
    echo "[2] Type ['deploy'] to Deploy the Application Fresh"
    echo "[3] Type ['stop-and-remove'] to Stop and Remove the Deployed & Running Application Containers"
    echo "[4] Type ['re-deploy'] to Re-Deploy the Application (Currently Running) -- Useful for Applying New Changes"
    echo "[5] Type ['system-clean'] to Un-Deploy the Application & Clear all Docker Containers, Images, Orphan-Processes, or other Objects from Docker Desktop"
    echo "[6] Type ['clear'] to Clear and Re-Display the Menu Again"
    echo "[7] Type ['exit', 'quit', 'e', or 'q'] to Exit this Deployment Script"
    echo "NOTE: If you press any other key, then the script will just exit."

    read userInput
    clear
    userInputLowercase=$(echo "$userInput" | tr '[:upper:]' '[:lower:]')
    echo "You entered \"$userInputLowercase\"."

    if [ -z "$userInputLowercase" ]; then
        echo "You didn't enter anything...the script will now just exit."
        exit 1
    elif [ "$userInputLowercase" == "list" ] || [ "$userInputLowercase" == "ls" ]; then
        docker ps
        docker images
    elif [ "$userInputLowercase" == "deploy" ]; then
        docker ps
        docker images
        docker rmi $(docker images -q)
        docker compose -f ./vt-digital-assessment-deployment.yml up -d --build
        docker ps
    elif [ "$userInputLowercase" == "stop-and-remove" ]; then
        docker ps
        docker compose -f ./vt-digital-assessment-deployment.yml stop
        docker compose -f ./vt-digital-assessment-deployment.yml rm
        docker ps
    elif [ "$userInputLowercase" == "re-deploy" ]; then
        docker ps
        docker compose -f ./vt-digital-assessment-deployment.yml down
        docker compose -f ./vt-digital-assessment-deployment.yml up -d --build
        docker ps
    elif [ "$userInputLowercase" == "system-clean" ]; then
        docker ps
        docker compose -f ./vt-digital-assessment-deployment.yml down
        docker rmi $(docker images -q)
        docker system prune -a
        docker images
        docker ps
    elif [ "$userInputLowercase" == "clear" ]; then
        clear
    elif [ "$userInputLowercase" == "exit" ] || [ "$userInputLowercase" == "e" ] || [ "$userInputLowercase" == "quit" ] || [ "$userInputLowercase" == "q" ]; then
        echo "Safely exiting this deployment script..."
        echo "Thank you! Have a great rest of your day."
        continue_running=false
    else
        echo "Invalid Input - You entered something else: $userInput"
        echo "Try again..."
    fi 
done

echo "|-------- End of Running Docker Deployment Script --------|"
