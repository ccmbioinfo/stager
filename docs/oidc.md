# OpenID Connect

Stager supports authentication using OpenID Connect. If you use an Identity Provider (IdP) such as auth0 or Keycloak that supports OIDC, then you can use that for authenticating Stager users.

## Setting up Stager as a client

Stager uses a library extension for Flask called [Flask-OIDC](https://flask-oidc.readthedocs.io/en/latest/) to handle OpenID Connect authentication. Important notes in this section are copied from the Flask-OIDC docs.

In order to get running, the extension requires that you generate a `client_secrets.json` that contains the `client_secret`, as well as other information from the `.well-known/openid-configuration` endpoint. Here is an example of `client_secrets.json` with Keycloak endpoints.

```json
{
    "web": {
        "client_id": "my-client-id",
        "client_secret": "a1b2c3d4-1234-5678-90ab-cdef01234567",
        "auth_uri": "http://${hostname}:8080/auth/realms/${realm}/protocol/openid-connect/auth",
        "token_uri": "http://${hostname}:8080/auth/realms/${realm}/protocol/openid-connect/token",
        "userinfo_uri": "http://${hostname}:8080/auth/realms/${realm}/protocol/openid-connect/userinfo",
        "issuer": "http://${hostname}:8080/auth/realms/${realm}",
        "redirect_uris": ["http://${hostname}:3000"]
    }
}
```

-   All other keys are contained under the `web` key.
-   Keys `auth_uri`, `token_uri`, `userinfo_uri`, `issuer` are found in the `.well-known/openid-configuration` endpoint for your IdP. They are endpoints required by Flask-OIDC to make grant requests, ask for tokens, and gain user information with an ID token.
-   Keys `client_id` and `client_secret` are usually provided in the admin panel or console for your IdP when you create a new client for Stager.
-   `redirect_uris` are the valid redirect URLs that you set in your IdP's admin panel. They indicate URLs that Flask-OIDC is allowed to send to your IdP when making a grant request.
