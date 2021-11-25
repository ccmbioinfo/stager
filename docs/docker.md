# [Docker](https://docs.docker.com/engine/install/) and [Compose](https://docs.docker.com/compose/install/)

Stager's application server is deployed as a Docker container, though it can be developed without it.
It is convenient to at least run the supporting development MySQL database and MinIO object store in
Docker containers for easy setup and [cleanup](#resetting-bind-mounts). Follow the links above to
install Docker and Compose, and read their documentation to learn more about these tools.

Copy `sample.env` to `.env` and edit it to add your choice of credentials for the local servers.
Set ```ENABLE_OIDC=``` to blank (empty). These can be overridden by your environment variables and
are used by Compose when starting a stack of containers from any of the `docker-compose*.yaml` in the project root.

To start the backend stack for development, run:

```bash
docker-compose up
```

Optionally, you can pass the `-d` or `--detach` flag so this does not occupy an entire terminal.
This pulls all images from Docker Hub or GitHub Container Registry the first time and mounts the
`flask` directory to watch for live changes.
This builds the `ghcr.io/ccmbioinfo/stager:dev` image with the Python dependencies, pulls other
dependent images the first time, and mounts the `flask` directory to watch for live changes.

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

The only first-party image in the stack is our `ghcr.io/ccmbioinfo/stager:dev` image with Flask.
Generally in development, because the entire `flask` source code directory is bind mounted into the
`app` container, you do not often need to rebuild the image, even when switching branches.

**The only time when the image must be rebuilt is if any dependencies change**,
i.e. the `requirements*` or `Dockerfile` in the `flask` directory are modified.

If you need to do this, you should instead use:

```bash
docker-compose up --build
```

If the base `python:3.7-slim` or `minio/mc` images are updated, this will not check for updates and
will continue to use your local tags. To use the latest base image from Docker Hub, instead run:

```bash
docker-compose build --pull
```

Sometimes updates are pushed for the supporting MySQL and MinIO images as well. To pull these:

```bash
docker-compose pull
```

To update your running containers in the latter cases, run `docker-compose up` again.

## [GitHub Container Registry](https://docs.github.com/en/packages/guides/about-github-container-registry)

This is a registry for Docker images like Docker Hub but associated with GitHub.
We use GitHub Actions to automatically build development and production images for Stager and push
them to this registry at [ghcr.io/ccmbioinfo/stager](ghcr.io/ccmbioinfo/stager).

If you want to push to the registry from your machine, you will need to create a personal access token
with access to `write:packages` in your [Developer settings](https://github.com/settings/tokens).

Login to registry on your command-line and paste in the generated token when prompted.

```bash
docker login ghcr.io -u GITHUB_USERNAME --password-stdin
```

Now, the first time you run `docker-compose up`, a development image will be pulled from GitHub
instead of being built locally, and you no longer need to rebuild the application image yourself
unless your work specifically relates to modifying dependencies or how the image is built itself.
You can always get the latest development image with `docker-compose pull`.

This information is also available in the GitHub Container Registry documentation linked above.

## Bind mounts

Docker containers are ephemeral. When they are removed, any container-local filesystem changes do
not persist. Persistent storage is solved by [volumes](https://docs.docker.com/storage/volumes/) and
[bind mounts](https://docs.docker.com/storage/bind-mounts/).

In our setup, MySQL and MinIO persist storage to host bind mounts, which are in essence
shared folders between your hosting machine and the container. If you haven't changed the default in
your `.env`, these should be the `mysql` and `minio` directories respectively.

Should you ever have problems with switching between app versions that expect different schemas
or need to clean up a development test, you can simply delete these directories while the containers
are stopped and then recreate the containers.

Furthermore, on Linux, we actually care about the user ID and group ID the container runs as for
filesystem permissions. This is not a concern on Windows and macOS because Docker Desktop internally
runs a Linux virtual machine for the Docker Engine and mounts your entire filesystem into that VM,
and thus the permissions do not matter between operating systems. On Linux, Docker runs natively and
uses the kernel's capabilities for isolation. In our setup, all containers run with `root` uid and
should not have trouble writing files, but you may need to use `sudo` or `chown` on files created by
the container process to work with them from the host, since they are created by `root`. If the
containers run as a different user, then we need to ensure that the filesystem permissions on the
bind mount allow that user to access it. This means we would have to create the directories first
ourselves and `chown` them, since the Docker daemon runs as root and would create them owned by root.

## Cleaning up orphaned images and layers

When you pull or build new images, the tag is updated to refer to the new image, but the layers for
the old image remain on your disk. Over time this can eat up a lot of disk space and add a lot of
clutter to `docker image ls`, so it's recommended to regularly prune them from the Docker Desktop
GUI on Windows or Mac or the following command:

```bash
docker image prune
```

You can also remove a specific tag with `docker image rm`.

You can clean up all untagged images, stopped containers, unused volumes, and unused networks with:

```bash
docker system prune
```
