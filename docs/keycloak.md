# [Keycloak](https://www.keycloak.org)

Keycloak is an "open source identity and access management" application using OpenID Connect and SAML 2.0 protocols.
Stager has OpenID Connect authentication support as well as support for back-channel logout with Keycloak.

## [Identity Brokering with Keycloak](https://www.keycloak.org/docs/latest/server_admin/#_identity_broker)

Keycloak has the ability to act as an identity broker for other identity providers.
This means that users who are redirected from Stager to the Keycloak sign-in page will
have the option to choose from a pre-determined list of third-party providers to sign in with.
The user then signs in with the third-party provider, Keycloak handles the authentication request
from the provider, and provides a token to the user so that they may sign into Stager.

From Stager's perspective, the user is logging in with Keycloak, regardless of which provider
they used to sign in. That is, the issuer-subject claims provided to Stager by Keycloak will
always correspond to users in Keycloak, not the issuer-subject claims produced by the third-party
provider.

### Setting up Identity Brokering with Keycloak

What you will need to get started:

-   A running instance of Keycloak 14.0.0+ with admin access
-   A realm that isn't the default Master realm ([`docker-compose.oidc.yaml`](../docker-compose.oidc.yaml) creates a "ccm" realm for you)
-   Admin access to a third-party identity provider with OpenID Connect support (eg. Auth0, Google, etc.)
