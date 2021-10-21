# [Visual Studio Code](https://code.visualstudio.com/)

VS Code is a popular editor for web developers with an extensive extension ecosystem and also an all
around good code editor. The following extensions are recommended for this project:

- [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
- [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv)

You may also find the following extensions helpful:

- [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug)
- [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- [yarn](https://marketplace.visualstudio.com/items?itemName=gamunu.vscode-yarn)
- [vscode-icons](https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons)
- [export-index](https://marketplace.visualstudio.com/items?itemName=BrunoLM.export-index)

The ESLint and Prettier integrations can be configured to fix and format your code on save.
The Python integration can be configured to use Black as a formatter and run checks with Pylint,
whether they are globally installed or in a virtualenv. Sample `.vscode/settings.json`:

```json
{
  "[typescript]": {
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.formatOnSave": true
  },
  "[python]": {
    "editor.formatOnSave": true
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": false
  },
  "python.testing.pytestArgs": [
    "flask"
  ],
  "python.testing.unittestEnabled": false,
  "python.testing.nosetestsEnabled": false,
  "python.testing.pytestEnabled": true,
  "python.formatting.provider": "black",
  "python.formatting.blackPath": "flask/venv/bin/black",
  "python.linting.pylintEnabled": true,
  "python.linting.enabled": true
}
```



VSCode debugger: [https://code.visualstudio.com/docs/editor/debugging]
VSCode & remote containers: [https://code.visualstudio.com/docs/remote/containers]

To set up a development environment with Flask, Docker and VSCode when the docker context points to the local machine, see the options below. If the Flask application container is running on the VM, an additional step is required to set the local docker context to point to the VM.


## Option 1: Use debugpy to connect the container with the VScode.

### Step 0: Add debugpy to the dependencies.

In `requirements-dev.txt`:
```
debugpy==1.5.0
    # via
    #   -r requirements.in
```

In `requirements.in`:
```
debugpy
```

### Step 1: Modify `stager/flask/Dockerfile`:

Line 3:
```
FROM python:3.7-slim as base
```

Append at the end:
```
FROM base as debug
ENV PYTHONDONTWRITEBYTECODE 1
# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED 1
```

### Step 2: Modify the app service in `stager/docker-compose.yaml`
Port 5678 is the debug port to connect with VSCode. As the entrypoint specifies, we first run debugpy that starts listening to the port 5678 and then, we run the flask application. The listener is used to connect the container with the VSCode.

```
app:
    build:
      context: flask
      target: debug
    image: ghcr.io/ccmbioinfo/stager:dev
    user: "${FLASK_UIDGID:-www-data}"
    environment:
      ST_SECRET_KEY: "${ST_SECRET_KEY}"
      ST_DATABASE_URI: "mysql+pymysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql/${MYSQL_DATABASE}"
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: "${MINIO_ACCESS_KEY}"
      MINIO_SECRET_KEY: "${MINIO_SECRET_KEY}"
      MINIO_REGION_NAME: "${MINIO_REGION_NAME}"
      ENABLE_OIDC: "${ENABLE_OIDC:-}"
      OIDC_CLIENT_ID: "${OIDC_CLIENT_ID}"
      OIDC_CLIENT_SECRET: "${OIDC_CLIENT_SECRET}"
      OIDC_WELL_KNOWN: "${OIDC_WELL_KNOWN}"
      OIDC_PROVIDER: "${OIDC_PROVIDER}"
      FLASK_DEBUG: 1
    ports:
      - "${FLASK_HOST_PORT}:5000"
      - "5678:5678"
    depends_on:
      - mysql
      - minio
    volumes:
      - ./flask:/usr/src/stager
    entrypoint:
      ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "-m", "flask", "run", "--host=0.0.0.0"]
```

### Step 3: Add launch file to attach the debugger to a running container.
Create `launch.json` in `stager/flask/.vscode`:

```
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Flask",
      "type": "python",
      "request": "attach",
      "port": 5678,
      "host": "0.0.0.0",
      "module": "flask",
      "env": {
        "FLASK_APP": "/usr/src/stager/wsgi.py",
        "FLASK_ENV": "development"
      },
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}",
          "remoteRoot": "/usr/src/stager"
        }
      ],
      "args": [
        "run",
        "--no-debugger"
      ],
      "jinja": false
    }
  ]
}
```

### Step 4: create `.devcontainer` so VSCode can attach to a running container.
https://code.visualstudio.com/docs/remote/containers

Uncomment "remoteUser":"vscode" in `devcontainer.json`.
In .env, FLASK_UIDGID=root:root

`docker-compose.yml` is used to override any configurations in `docker-compose.yaml`, there's nothing we want to override.


### To use the debugger for flask and docker, follow these steps:
1, docker-compose up --build (--build if it's the first time to run docker-compose after Dockerfile is modified)

2, Click on remote connection icon in VSCode, choose "Attach to running container".

3, When the prompt "Select the container to the attach VS Code" comes up,
choose "/stager_app_1"

4, In the VSCode window that runs in the app container, use F5 to launch the debugger.






## Option 2: Reopen the VSCode in container, starting the flask app only when the debugger session starts in the container.

Conor's working solution.
Set the entrypoint to `tail -f /dev/null` in `./devcontainer/docker-compose.yml` such that the flask app is not started when we reopen the VSCode session in the container. When we launch the debugger, the app is started using the `launch` request in `.vscode/launch.json`.

Install the necessary extensions for the container in `.vscode/extensions.json`.






## Option 3: Attach to a running container, kill the flask app right before the debugger is launched.

This is an ideal solution. We don't have a working version of it yet. Here's the proposed workflow:
1, All the containers are up and running.
2, Use "attach to a running container" command in vscode to attach to the flask app.
3, Start the debugger session.

To achieve this, one idea is to add a prelaunch command in `.vscode/launch.json` such that the app is killed when the debugger starts. The debugger is responsible for launching the app.

The debugger will fail if the app is already running and listening at the port 5000. We need to restart the app via VSCode's debugger.





## Option 4: Using VSCode to launch a debugger while simultaneously launching a Docker container and attaching the debugger to the container.

Note that in this option, when we start the debugger in VSCode, the image is rebuilt and the new container is launched.
[https://code.visualstudio.com/docs/containers/debug-common]

So far, I have not managed to get a working version of this. What needs to be done is to mount a volume to the appropriate directory in the container. The entrypoint should be flask/wsgi.py.

In this setting, VSCode would build an image according to stager/Dockerfile, but the container isn't started with docker-compose, it is rather started with the configurations in `tasks.json`.



