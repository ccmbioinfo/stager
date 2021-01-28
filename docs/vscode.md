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
