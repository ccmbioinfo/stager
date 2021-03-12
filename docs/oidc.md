# OpenID Connect

Stager supports authentication using OpenID Connect. If you use an Identity Provider (IdP) such as auth0 or Keycloak that supports OIDC, then you can use that for authenticating Stager users.

## Setting up Stager as a client

Stager uses a Python library called [authlib](https://github.com/lepture/authlib/) that provides OAuth and OpenID Connect support, and integration with Flask.

The following `.env` variables must be set for `authlib` to register properly:

-   `OIDC_CLIENT_ID` - Stager's unique ID in the Identity Provider.
-   `OIDC_CLIENT_SECRET` - The client_secret provided by the Identity Provider.
-   `OIDC_WELL_KNOWN` - The URL for the .well-known/openid-configuration endpoint.
-   `OIDC_PROVIDER` - Name of the Identity Provider (eg. keycloak, auth0) (may not be required).

## Possible issues

### Keycloak container closes with exit code 1

-   `User with username 'admin' already added to '/opt/jboss/keycloak/standalone/configuration/keycloak-add-user.json'`

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

###
