# [PyCharm](https://www.jetbrains.com/pycharm/)

The choice IDE for Python developers that's more useful for debugging the backend outside of Docker.
Comes with Git and EditorConfig support out of the box.

If the root of the repository is used as the workspace, you'll want to configure the `flask`
directory as the source and working directory for the Python interpreter, so that the virtualenv is
created there. Then, add run configurations for a Flask server and Python tests appropriately.
