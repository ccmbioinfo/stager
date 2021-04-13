# [OAuth](https://oauth.net) and [OpenID Connect](https://openid.net)

Stager supports authentication using OpenID Connect. If you use an Identity Provider (IdP) such as [auth0](https://auth0.com/#!) or [Keycloak](https://www.keycloak.org) that supports OIDC, then you can use that for authenticating Stager users.

## Setting up Stager as an OIDC client

Stager uses a Python library called [authlib](https://github.com/lepture/authlib/) that provides OAuth and OpenID Connect support, and integration with Flask.

OIDC support in Stager can be enabled by setting the `ENABLE_OIDC` `.env` variable to anything other than a blank string (eg. `ENABLE_OIDC=true`). If the variable is unset, or if the value is blank, then OIDC support will be disabled.

Additionally, the following `.env` variables must be set after registering Stager as a client in your Identity Provider:

-   `OIDC_CLIENT_ID` - Stager's unique ID in the Identity Provider.
-   `OIDC_CLIENT_SECRET` - The client_secret provided by the Identity Provider.
-   `OIDC_WELL_KNOWN` - The URL for the .well-known/openid-configuration endpoint.
-   `OIDC_PROVIDER` - Name of the Identity Provider (eg. keycloak, auth0), for internal use.

## Testing OIDC in development

To start the backend stack for testing OIDC endpoints, run:

```bash
docker-compose -f docker-compose.oidc.yaml up --build
```

This launches the same backend stack as `docker-compose.yaml`, but with a dedicated Keycloak container and other key changes:

-   The entrypoint script for the `mysql` container is overwritten by `./init`, which sets up two distinct databases in the same `mysql` container; one for Stager and one for Keycloak.
-   The entrypoint for the `app` container is replaced by a longer entrypoint that waits for both `mysql` and `keycloak` services to become ready before running Flask.
-   Hard-coded OIDC-specific environment variables (like those above) are passed to `app` which are needed for setting up Keycloak with default data on build.

### Possible issues

> `User with username 'admin' already added to '/opt/jboss/keycloak/standalone/configuration/keycloak-add-user.json'`

This error occurs when building the Keycloak container with `docker-compose -f docker-compose.oidc.yaml up --build` after having built it once already. Keycloak errors and closes if you attempt to add default admin credentials that are already present.

Steps for dealing with this (taken from [this StackOverflow thread](https://stackoverflow.com/questions/59599620/keycloak-8-user-with-username-admin-already-added))

1. Stop all containers (`docker-compose down`, or CTRL-C if attached to shell)
1. Comment out the following two lines:

```docker
services:
  keycloak:
    ...
    environment:
      ...
      # KEYCLOAK_USER: "${KEYCLOAK_USER}"
      # KEYCLOAK_PASSWORD: "${KEYCLOAK_PASSWORD}"
```

3. Start all containers (`docker-compose up`)
1. Wait until the keycloak container has successfully started.
1. Stop all containers again
1. Un-comment the two lines from step 2:

```docker
services:
  keycloak:
    ...
    environment:
      ...
      KEYCLOAK_USER: "${KEYCLOAK_USER}"
      KEYCLOAK_PASSWORD: "${KEYCLOAK_PASSWORD}"
```

7. Start all containers

Alternatively, if you intend to rebuild the whole project, then you can delete the keycloak container with `docker rm keycloak`, and rebuild the project with `docker-compose up --build`. This clears everything in the keycloak container including stored admin credentials, thus resolving the issue.

###
