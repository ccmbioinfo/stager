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

## Debugging in the Flask container

-   [Debugging in VSCode](https://code.visualstudio.com/docs/editor/debugging)
-   [Remote - Containers extension](https://code.visualstudio.com/docs/remote/containers)
-   [Using profiles with Compose](https://docs.docker.com/compose/profiles/)

To directly enter a Docker development that supports debugging in the container and launch the debugger:

1. `docker-compose up -d app_debug`
2. Click on remote connection icon in VSCode, choose "Attach to running container".
3. When the prompt "Select the container to the attach VS Code" comes up, choose "/stager-app_debug_1".
4. In the VSCode window that runs in the app container, use F5 to launch the debugger.

To start the Docker development without debugging functionality enabled, and later enable the debugger functionality:

1. `docker-compose up`
2. `docker-compose rm -sf app`
3. `docker-compose up app_debug`
4. Click on remote connection icon in VSCode, choose "Attach to running container".
5. When the prompt "Select the container to the attach VS Code" comes up, choose "/stager-app_debug_1".
6. In the VSCode window that runs in the app container, use F5 to launch the debugger.

Explanation:

-   Debugpy extension is already added in `requirements-dev.txt` and `requirements-dev.in`.
-   `app_debug` is a service added in `docker-compose.yaml`. By using profile, this service is only started when it is targeted.
