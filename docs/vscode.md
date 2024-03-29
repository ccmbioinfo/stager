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

To enable the debugger functionality:

1. Create a file `launch.json` in `stager/.vscode` directory:

```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Remote Attach",
            "type": "python",
            "request": "attach",
            "connect": {
                "host": "localhost",
                "port": 5678
            },
            "pathMappings": [
                {
                    "localRoot": "${workspaceFolder}/flask",
                    "remoteRoot": "."
                }
            ]
        }
    ]
}
```

2. `docker-compose rm -sf app` (if the Flask app container is running)
3. `docker-compose up app_debug`
4. In the VSCode window, press F5 to launch the debugger or use VSCode "Run and Debug" extension.

Explanation:

`debugpy` has been added to dev requirements. `app_debug` is a separate service in the Compose file. By assigning it a profile, it will only be started when targeted. If there is a running `app` container, it must be stopped and removed before the service `app_debug` is brought up because otherwise, the host port binding conflicts with the regular `app` container.

Troubleshooting:

In the scenario where VSCode does not automatically attach to `Flask (stager)` and instead a drop down menu is prompted, without the `Flask (stager)` option, you will need to add `/usr/src/stager` as a folder to the Explorer on the left and open a `.py` file for the appropriate option to appear.

Make sure VSCode version is up-to-date.
