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
-   `REACT_APP_API_ENDPOINT` - Full URL of backend API. Should match the proxy in `react/package.json`

## Adding or Updating Stager Users for OIDC

Stager maintains a database containing all users who are authorized to use the application, even if we use OAuth for authentication. In order to associate a user from OAuth with a user in Stager, Stager users in `mysql` have "issuer" and "subject" columns. These are used to uniquely identify a user by the OpenID Connect standard. In your Identity provider, "subject" may refer to a user's unique `user_id` or similar, and "issuer" refers to the Identity provider's host URL.

Currently, adding new users via the `POST /api/users` endpoint will set the "issuer" and "subject" columns as `None`.

Stager provides a CLI command for updating existing users' OAuth fields. Attach a shell to the running app container and run the command as follows:

```
docker-compose exec app flask update-user --issuer={ISSUER} --subject={SUBJECT} {USERNAME}
```

Ideally, the user's username in your Identity Provider should match their username in Stager, but this is not enforced.

## Testing OIDC in development

To start the backend stack for testing OIDC endpoints, run:

```bash
docker-compose -f docker-compose.oidc.yaml up --build
```

This launches the same backend stack as `docker-compose.yaml`, but with a dedicated Keycloak container and other key changes:

-   The entrypoint script for the `mysql` container is overwritten by `./init`, which sets up two distinct databases in the same `mysql` container; one for Stager and one for Keycloak.
-   The entrypoint for the `app` container is replaced by a longer entrypoint that waits for both `mysql` and `keycloak` services to become ready before running Flask.
-   Hard-coded OIDC-specific environment variables (like those above) are passed to `app` which are needed for setting up Keycloak with default data on build.

OIDC Support is enabled if and only if the backend stack is run using the `docker-compose.oidc.yaml` compose file, or if environment variable `ENABLE_OIDC` is set and non-empty.

## Single Sign-Out

Currently, OpenID Connect specifications for single sign-out are not yet finalized ([front-channel](https://openid.net/specs/openid-connect-frontchannel-1_0.html), [back-channel](https://openid.net/specs/openid-connect-backchannel-1_0.html), [session management](https://openid.net/specs/openid-connect-session-1_0.html)). This feature of signing out of an OAuth session is not always implemented by OIDC-compliant OAuth providers, and some who do implement it may not use these draft specifications.

Stager's implementation supports signing out of Auth0 and Keycloak OAuth sessions. Each of these OAuth providers expose a logout url that the user's browser may be redirected to in order to sign them out of their OAuth session. When logging out of Stager, a logout URL may be returned as response text. React then uses this URL to redirect the browser to that URL so that the user is signed out of both Stager and Auth0/Keycloak.

For single sign-out to work correctly with Auth0 or Keycloak, ensure that the environment variable `OIDC_PROVIDER` is set to `auth0` or `keycloak` respectively.

## Creating OAuth clients with client credentials grant

To give third-party applications (such as pipeline runners, minio) access to Stager resources, we can create a new Keycloak client and a corresponding Stager user with the appropriate group permissions.

To create a client, do the following in the Keycloak admin GUI:

-   select the appropriate realm (e.g., ccm)
-   select "Clients" from the left-hand-side menu
-   select "create"
-   name the client and save
-   on the "Settings" tab, set "access type" to "Confidential" and set "Service Accounts" to "enabled" (Service accounts are typically for machine-to-machine authentication and aren't associated with a specific user in the realm, though a subject id is created). The other settings, besides "enabled", can be switched off.

You can get an access token using the client id and secret listed in the "Credentials" tab in the client menu. For example:

```code
curl --location --request POST '<keycloakhost>/auth/realms/ccm/protocol/openid-connect/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'client_id=pipeline-client-1' \
--data-urlencode 'client_secret=<paste secret here>'

```

To get information about the service account user, you can hit the userinfo endpoint with the token in the header:

```code
curl --location --request GET '<keycloak host>/auth/realms/ccm/protocol/openid-connect/userinfo' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--header 'Authorization: Bearer <paste access token here>'

```

Before the new client can communicate with Stager, a Stager user must be created with the subject id of the service account "user".

## Possible issues

> GET /api/login responds with 500 Internal Server Error with response: `{"error": "Missing \"authorize_url\" value"}`

This is due to the OAuth provider rejecting the redirect_uri provided in the request parameters. When testing with Keycloak, this may be caused by your frontend url or port not matching the default `http://localhost:3000`. To fix this, add the following line to `.env` with your React frontend host and port before building the backend stack.

```
FRONTEND_HOST=http://{YOUR_FRONTEND_HOST}:{PORT}
```

If you would prefer not to rebuild the backend stack and the `mysql` directory, and you are testing with Keycloak, then you can instead add your frontend host and port to Keycloak manually through the admin console at `http://localhost:8080/auth/admin`. Navigate to the CCM realm -> Clients -> `ccm-stager` and add `http://{YOUR_FRONTEND_HOST}:{PORT}/*` to "Valid Redirect URIs" with your React frontend host and port.

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
