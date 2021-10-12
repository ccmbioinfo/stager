# [React](https://reactjs.org/) single-page application frontend

The Stager frontend is bootstrapped with [Create React App](https://create-react-app.dev/).
It is a static site served by Nginx in production.

We are using [TypeScript](https://www.typescriptlang.org/docs).

You will need a recent version of [Node.js](https://nodejs.org) and
[Yarn package manager](https://yarnpkg.com/getting-started) (quickly install
with `npm install -g yarn` if not available).

The backend should be available for API calls and the easiest way to bring it
up in the background if you are only developing the frontend is through
[Docker](https://github.com/ccmbioinfo/stager/blob/master/docs/docker.md):

```bash
docker-compose up -d --build
```

1. Switch to the `react` directory.
2. Create a `.env` with these parameters that you can change as needed.

   ```
   REACT_APP_NAME=Stager
   REACT_APP_MINIO_URL=http://localhost:9000/
   ```

3. Set ```ENABLE_OIDC=``` to blank (empty).
4. Install dependencies with `yarn`.
5. Start a development server in watch mode with `yarn start`.

You can build the static bundles for production with `yarn build`.

These environment variables are fixed at build-time. To incorporate changes, you
will need to restart the development server or rebuild the static bundles.

Use a comma-delimited list of columns for the `REACT_APP_DEFAULT_OPTIONAL_COLUMNS`
environment variable to control which optional columns are enabled by default on
the Add Datasets page.
