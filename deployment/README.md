# VT-Digital-Assessment

## >> Getting Started << PLEASE READ THIS BEFORE USING THE DOCKER SCRIPT!

`NOTE`: When utilizing this Docker Deployment Script, there are several important features to know before using this script:

- Please have your `.env` files configured correctly!
- When typing the letter or the phrase, `CASE-SENSITIVITY MATTERS`!!!

`OPTIONS`:
- `ls` OR `list`: Lists all of the current Docker Processes. Identical to `docker ps`.
- `deploy-local`: Deploys the application locally into `Development` Docker containers.
- `stop-and-remove`: Takes down `Development` Docker containers and any running Docker images.
- `re-deploy-local`: Re-deploys the application locally into `Development` Docker containers, which is great for quickly checking development changes in a containerized enviornment without having to move into `Production`.
- `push` (OR `p`): Pushes the Docker images to `Production` Docker containers on the GitLab (GIT.CS.VT.EDU) Container Registry.
- `system-clean`: Removes stopped `Development` Docker containers and any running Docker images.
- `clear`: Clears the window. Uses the Linux `clear` command.
- `exit` (OR `e`) OR `quit` (OR `q`): Leaves the Docker Deployment Script.

`COMMON USE-CASES OF THE DOCKER DEPLOYMENT LINUX BASH SCRIPT`:

`[1] DEPLOY LOCALLY TO STAGING CONTAINERS`: 

```shell
cd deployment/
sh docker_deployment.sh
deploy-local # [TYPE THIS]
```

## Useful Development Links (LOCAL ONLY):

- Frontend: https://vt-digital-assessment.localhost.devcom.vt.edu/
OR http://localhost:5001/
- Backend: https://vt-digital-assessment-server.localhost.devcom.vt.edu/ OR http://localhost:3001/
- Traefik Dashboard: http://localhost:8000/dashboard/#/

`[2] TAKE DOWN STAGING CONTAINER ENVIORNMENT AND REMOVE ALL DOCKER IMAGES (AND REMAINING DAEMONS AND DANGLING OBJECTS):`: 

```shell
cd deployment/
sh docker_deployment.sh
# ASSUMING THAT EXISTING DOCKER DEPLOYMENT ALREADY EXISTS IN DEVELOPEMENT CONTAINERS HERE...
stop-and-remove # [TYPE THIS]
system-clean # [TYPE THIS]
```

`[3] RE-DEPLOY LOCALLY (ASSUMING EXISTING DOCKER DEPLOYMENT ALREADY EXISTS IN STAGED CONTAINERS)`: 

```shell
cd deployment/
sh docker_deployment.sh
# ASSUMING THAT EXISTING DOCKER DEPLOYMENT ALREADY EXISTS IN DEVELOPEMENT CONTAINERS HERE...
stop-and-remove # [TYPE THIS]
system-clean # [TYPE THIS]
re-deploy-local # [TYPE THIS]
```

`[4] PUSH DOCKER DEPLOYMENT TO PRODUCTION ENVIORNMENT (ON GIT.CS.VT.EDU)`:

```shell
cd deployment/
sh docker_deployment.sh
# ASSUMING THAT EXISTING DOCKER DEPLOYMENT ALREADY EXISTS IN DEVELOPEMENT CONTAINERS HERE (IF NOT, STILL GOOD TO CLEAN OUT DEVELOPMENT ENVIORNMENT AND NOT LEAVE IT RUNNING)...
stop-and-remove # [TYPE THIS]
system-clean # [TYPE THIS]
push (or p) # [TYPE THIS]
```

- Assuming you are added to both the `Discovery` and `Endeavour` Clusters...

`DISCOVERY:`
- Go to https://cloud.cs.vt.edu/. 
- Login.
- Click on `discovery` in the top menu.
- Click on the `vt-digital-assessment` under `Projects in discovery` menu that pops out on the right.
- `NOTE:` Please re-deploy the `server-wl` first then the `client-wl` because the frontend is dependent on the backend in both the DEV and PROD `YML` files.
- Click on `server-wl`. Press the `-` (minus) button next to the `Config Scale` and scale down the pods from `1 => 0`. Wait until no pods are running (Teal message of `Removing` has disappeared). Then, press the `+` (plus) button next to the `Config Scale` and scale up the pods from `0 => 1`. Wait until the Pod has the Red message of `Unavailable` has disappeared and Green message of `Running` is showing.
- Click on `client-wl`. Press the `-` (minus) button next to the `Config Scale` and scale down the pods from `1 => 0`. Wait until no pods are running (Teal message of `Removing` has disappeared). Then, press the `+` (plus) button next to the `Config Scale` and scale up the pods from `0 => 1`. Wait until the Pod has the Red message of `Unavailable` has disappeared and Green message of `Running` is showing.
- Now, you should be good to go to see your changes in production on the `Discovery` links!

`ENDEAVOUR:`
- Go to https://launch.cs.vt.edu/.
- Login.
- Under `Clusters`, click on `endeavour`.
- On the left side menu, click on `Workloads`.
- Under `server-wl-endeavour`, click on the `Green` dropdown menu. Similarly to CS Cloud on `Discovery`, press the `-` (minus) button and see the `Terminating` status and the formerly green status bar go yellow. Wait until the progress bar goes gray. Then, press the `+` (plus) button and see the `ContainerCreating` status. Wait until the formerly gray status bar becomes green. 
- Under `client-wl-endeavour`, click on the `Green` dropdown menu. Similarly to CS Cloud on `Discovery`, press the `-` (minus) button and see the `Terminating` status and the formerly green status bar go yellow. Wait until the progress bar goes gray. Then, press the `+` (plus) button and see the `ContainerCreating` status. Wait until the formerly gray status bar becomes green. 
- Now, you should be good to go to see your changes in production on the `Endeavour` links!

## Useful Production Links:

- VT CS Cloud Website (`Discovery` Cluster) - Frontend: https://vt-digital-assessment.discovery.cs.vt.edu/
- VT CS Cloud Website (`Discovery` Cluster) - Backend: https://vt-digital-assessment-server.discovery.cs.vt.edu/
- VT CS Cloud Website (`Endeavour` Cluster) - Frontend: https://vt-digital-assessment.endeavour.cs.vt.edu/
- VT CS Cloud Website (`Endeavour` Cluster) - Backend: https://vt-digital-assessment-server.endeavour.cs.vt.edu/

