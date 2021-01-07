# Stager

For more developer documentation, see [`docs/`](https://github.com/ccmbioinfo/stager/tree/master/docs/)

## Tech stack

- [MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/)
- [MinIO](https://docs.min.io/)
- Python 3.7/[Flask](https://flask.palletsprojects.com/)
- [TypeScript](https://www.typescriptlang.org/docs)/[Create React App](https://create-react-app.dev/docs/getting-started/)

## Tools and editors

- [Git](https://git-scm.com/doc)
- [Docker](https://docs.docker.com/engine/install/) and [Compose](https://docs.docker.com/compose/install/)
- [Visual Studio Code](https://code.visualstudio.com/) or [PyCharm](https://www.jetbrains.com/pycharm/)
### Web frontend
You will need a recent Node.js and Yarn (`npm install -g yarn`).
1. Switch to the `react` directory.
1. Create a `.env` with these parameters that you can change as needed.
   ```
   REACT_APP_NAME=Stager
   REACT_APP_MINIO_URL=http://localhost:9000/
   ```
2. Install dependencies with `yarn`.
3. Start a development server in watch mode with `yarn start`.

You can build the static bundles for production with `yarn build`.

