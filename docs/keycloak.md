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

For your third-party ID provider, Keycloak will need to be added as a Client, meaning that you will
need to provide Keycloak with its client ID and secret.

### Setting up Identity Brokering with Keycloak

What you will need to get started:

-   A running instance of Keycloak 14.0.0+ with admin access
-   A realm that isn't the default Master realm ([`docker-compose.oidc.yaml`](../docker-compose.oidc.yaml) creates a "ccm" realm for you)
-   Admin access to a third-party identity provider with OpenID Connect v1.0 support (eg. Auth0)

1. Access the **Identity Providers screen** in the Keycloak Admin Console and **add an OpenID Connect v1.0 provider**

    - Log into the Keycloak Admin Console
    - Navigate to your non-master realm from the top-left dropdown menu
    - Navigate to the Identity Providers screen from the left-hand menu
    - Open the "Add Provider..." dropdown menu in the centre of the screen
    - Select "OpenID Connect v1.0" from the dropdown menu, under "User-Defined"
        - (If your provider is listed under Social, then select that option instead.
          For this setup, we assume that social ID providers will not be used.)

1. In a different tab/window, login to your **third-party provider** and **add Keycloak as a Client**

    - (This process varies depending on the provider used, so the steps below are generalized)
    - Login to your third-party ID provider's Admin or Management page
    - Create a new Client or Application for Keycloak
        - This process should be the same as though you were setting up authentication for a webapp
    - For your newly-created Client, take note of the _Client ID_, _Client Secret_,
      _Client Authentication Method_ and the _OpenID Configuration_ endpoint.
        - _OpenID Configuration_ refers to the OIDC Discovery endpoint which provides
          metadata for setting up OIDC on the Client. This endpoint typically exists at
          `{HOST}/.well-known/openid-configuration`
        - If this endpoint isn't available, instead make note of the following endpoints
            - _Authorization Endpoint_
            - _Token Endpoint_

1. Fill out the Keycloak Provider form with your provider's client credentials

    - Fill out the _Client ID_, _Client Secret_, and _Client Authentication Method_ fields
      in the Keycloak form with those from your ID provider
    - Copy-paste your provider's _OpenID Configuration_ URL to the "Import from
      URL" field at the bottom of the form and click "Import"
        - If your provider doesn't have this URL, instead fill out the
          "Authorization URL" and "Token URL" fields with those from your
          provider
        - If importing from URL fails, and you can access the _OpenID
          Configuration_ URL directly, try visiting the URL and save the entire
          JSON response to a `.json` file. From there, use the "Import from File"
          button to import the metadata
    - Click "Save" at the bottom of the form

1. Link third-party providers to your Keycloak users
    - Navigate to the Users screen from the left-hand menu
    - Choose a user to edit and click "Edit"
    - Navigate to the "Identity Provider Links" tab
    - Click "Create"
    - Fill out the form with the Identity Provider name, User ID and
      Username for that user
        - User ID corresponds to the subject claim that the identity provider would
          provide for this user
        - If there is no username for this user for whatever reason, simply enter the
          User ID in the username field too
    - Click "Save" at the bottom of the form

After completing all these steps, your users should now be able to sign into Stager via Keycloak,
using login credentials from whichever provider that you make available to them.
