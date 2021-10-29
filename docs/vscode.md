# [Visual Studio Code](https://code.visualstudio.com/)

VS Code is a popular editor for web developers with an extensive extension ecosystem and also an all
around good code editor. The following extensions are recommended for this project:

-   [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
-   [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
-   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
-   [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
-   [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
-   [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv)

You may also find the following extensions helpful:

-   [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug)
-   [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)
-   [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
-   [yarn](https://marketplace.visualstudio.com/items?itemName=gamunu.vscode-yarn)
-   [vscode-icons](https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons)
-   [export-index](https://marketplace.visualstudio.com/items?itemName=BrunoLM.export-index)

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
    "python.testing.pytestArgs": ["flask"],
    "python.testing.unittestEnabled": false,
    "python.testing.nosetestsEnabled": false,
    "python.testing.pytestEnabled": true,
    "python.formatting.provider": "black",
    "python.formatting.blackPath": "flask/venv/bin/black",
    "python.linting.pylintEnabled": true,
    "python.linting.enabled": true
}
```

## VSCode debugger for flask

VSCode debugger: [https://code.visualstudio.com/docs/editor/debugging]
VSCode & remote containers: [https://code.visualstudio.com/docs/remote/containers]

To set up a development environment with Flask, Docker and VSCode when the docker context points to the local machine, see the steps below. If the Flask application container is running on the VM, an additional step is required to set the local docker context to point to the VM.

To start a Docker development that supports debugging in the container:

-   Step 1: `docker-compose -p stager-debug -f docker-compose.debug.yaml up`
-   Step 2, Click on remote connection icon in VSCode, choose "Attach to running container".
-   Step 3, When the prompt "Select the container to the attach VS Code" comes up,
-   choose "/stager-debug_app_1"
-   Step 4, In the VSCode window that runs in the app container, use F5 to launch the debugger.

Explanation:

-   Debugpy extension is already added to `requirements-dev.txt` and `requirements.in`.
-   In `docker-compose.debug.yaml`, the entrypoint specifies that we first run debugpy that starts listening to the port 5678 and then, we run the flask application. The listener is used to connect the container with the VSCode.

# Other explored options:

### Option 2: Reopen the VSCode in container, starting the flask app only when the debugger session starts in the container.

Conor's working solution.
Set the entrypoint to `tail -f /dev/null` in `./devcontainer/docker-compose.yml` such that the flask app is not started when we reopen the VSCode session in the container. When we launch the debugger, the app is started using the `launch` request in `.vscode/launch.json`.

Install the necessary extensions for the container in `.vscode/extensions.json`.

### Option 3: Attach to a running container, kill the flask app right before the debugger is launched.

This is an ideal solution. We don't have a working version of it yet. Here's the proposed workflow:
1, All the containers are up and running.
2, Use "attach to a running container" command in vscode to attach to the flask app.
3, Start the debugger session.

To achieve this, one idea is to add a prelaunch command in `.vscode/launch.json` such that the app is killed when the debugger starts. The debugger is responsible for launching the app.

The debugger will fail if the app is already running and listening at the port 5000. We need to restart the app via VSCode's debugger.

### Option 4: Using VSCode to launch a debugger while simultaneously launching a Docker container and attaching the debugger to the container.

Note that in this option, when we start the debugger in VSCode, the image is rebuilt and the new container is launched.
[https://code.visualstudio.com/docs/containers/debug-common]

So far, I have not managed to get a working version of this. What needs to be done is to mount a volume to the appropriate directory in the container. The entrypoint should be flask/wsgi.py.

In this setting, VSCode would build an image according to stager/Dockerfile, but the container isn't started with docker-compose, it is rather started with the configurations in `tasks.json`.
