# [Docker](https://docs.docker.com/engine/install/) and [Compose](https://docs.docker.com/compose/install/)

Stager's application server is deployed as a Docker container, though it can be developed without it.
It is convenient to at least run the supporting development MySQL database and MinIO object store in
Docker containers for easy setup and [cleanup](#resetting-bind-mounts). Follow the links above to
install Docker and Compose, and read their documentation to learn more about these tools.

Copy `sample.env` to `.env` and edit it to add your choice of credentials for the local servers.
These can be overridden by your environment variables and are used by Compose when starting a stack
of containers from any of the `docker-compose*.yaml` in the project root.

To start the backend stack for development, run:

```bash
docker-compose up --build
```

Optionally, you can pass the `-d` or `--detach` flag so this does not occupy an entire terminal.
This builds a `ccmbio/st2020` image with the Python dependencies and mounts the `flask` directory
to watch for live changes.

You can also specify only the services you want to bring up. For example, if you want to develop the
backend outside of Docker, you can just bring up the supporting containers instead:

```bash
docker-compose up -d mysql minio
```

To stop and remove all the containers, run:

```bash
docker-compose down
```

## Updating your images

Generally in development, because the entire `flask` source code directory is bind mounted into the
`app` container, you do not need to rebuild the image on every startup or switching between
branches. That is, the `--build` flag can frequently be foregone. Docker uses a build cache unless
instructed otherwise so this doesn't concern time-to-live. The only time when the image must be
rebuilt is if dependencies change, i.e. the `requirements*` or `Dockerfile` in the `flask` tree
are modified.

If the base `python:3.7-slim` or `minio/mc` images are updated, `docker-compose up --build` will not
check for updates and will continue to use your local tags. To use the latest base image from Docker
Hub, run:

```bash
docker-compose build --pull
```

Sometimes updates are pushed for the supporting MySQL and MinIO images as well. To pull these:

```bash
docker-compose pull
```

To update your running containers, run `docker-compose up` again.

## Resetting bind mounts

Docker containers are ephemeral. When they are removed, any container-local filesystem changes do
not persist. In our setup, MySQL and MinIO persist storage to host bind mounts, which are in essence
shared folders between your hosting machine and the container. If you haven't changed the default in
your `.env`, these should be the `mysql` and `minio` directories respectively.

Should you ever have problems with switching between app versions that expect different schemas
or need to clean up a development test, you can simply delete these directories while the containers
are stopped and then recreate the containers.

## Cleaning up orphaned images and layers

When you pull or build new images, the tag is updated to refer to the new image, but the layers for
the old image remain on your disk. Over time this can eat up a lot of disk space and add a lot of
clutter to `docker image ls`, so it's recommended to regularly prune them from the Docker Desktop
GUI on Windows or Mac or the following command:

```bash
docker image prune
```

You can also remove a specific tag with `docker image rm`.

