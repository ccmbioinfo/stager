"""
Helper functions for adding users to Keycloak alongside
the Stager DB. Uses the Keycloak Admin REST API.

These functions should only be used in development for
testing and demonstration purposes.
"""

import os
import time
import click
import requests
from typing import Any
from flask import current_app as app, g
from flask.cli import with_appcontext

from .models import User
from .utils import stager_is_keycloak_admin

keycloak_host = os.getenv("KEYCLOAK_HOST", "http://keycloak:8080")


def set_g(name: str, default: Any = None):
    """
    Helper function. Overwrite the given key name in g with default.

    Requires an application context.
    """
    # Flask's g object is like a dict in every way except this
    if name in g:
        g.pop(name)
    g.setdefault(name, default=default)


def fetch_admin_well_known(realm: str = "master"):
    """
    Fetch and return the openid-configuration json object from
    the Keycloak admin realm. Can also specify a different realm.

    Requires an application context.
    """
    # we can cache it in app context to reuse in other functions
    cache_key = f"_{realm}_well_known"
    cached = g.get(cache_key)
    if cached is not None:
        return cached
    url = keycloak_host + f"/auth/realms/{realm}/.well-known/openid-configuration"
    response = requests.get(url)
    print(f"Well-known endpoint fetched at {url}")
    if response.ok:
        # https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
        endpoints = dict(response.json())
        set_g(cache_key, default=(endpoints))
        return endpoints
    app.logger.error(
        f"Well-known endpoint fetch failed: {response.status_code} - {response.text}"
    )
    g.setdefault(cache_key, default=(None))
    return None


def obtain_admin_token():
    """
    Sign into the Token Endpoint for the Keycloak Admin-CLI client,
    and return the response object.

    Requires an application context.
    """
    # Check if we still have a fresh access token
    if g.get("_access_token") and time.time() < g.get("_access_expire_time"):
        print("Reusing previous access token.")
        return g.get("_access_token")

    # No fresh token, fetch a new one
    endpoints = fetch_admin_well_known()
    if endpoints:
        # Use a refresh token if we have a fresh one
        if g.get("_refresh_token") and time.time() < g.get("_refresh_expire_time"):
            print("Fetching fresh access token using refresh token...")
            payload = {
                "refresh_token": g.get("_refresh_token"),
                "client_id": "admin-cli",
                "grant_type": "refresh_token",
            }
        else:
            print("Fetching fresh access token using admin credentials...")
            payload = {
                "username": os.getenv("KEYCLOAK_USER", "admin"),
                "password": os.getenv("KEYCLOAK_PASSWORD", "hackerman"),
                "client_id": "admin-cli",
                "grant_type": "password",
            }
        url = endpoints["token_endpoint"]
        response = requests.post(url, data=payload)
        if response.ok:
            # https://openid.net/specs/openid-connect-core-1_0.html#TokenEndpoint
            res_json = response.json()
            access_token = res_json["access_token"]
            set_g("_access_token", default=access_token)
            expires_in = res_json["expires_in"]
            set_g("_access_expire_time", default=(time.time() + expires_in))

            # Hold onto refresh token for requesting future access tokens
            refresh_token = res_json["refresh_token"]
            set_g("_refresh_token", default=refresh_token)
            # Not sure if this is standard, but Keycloak provides it
            expires_in = res_json["refresh_expires_in"]
            set_g("_refresh_expire_time", default=(time.time() + expires_in))
            print("Access token successfully obtained from token endpoint.")
            return access_token
        app.logger.error(
            f"ERROR: Failed to fetch access token: {response.status_code} - {response.text}"
        )
        return None

    return None


def add_keycloak_realm(access_token: str):
    """
    Using the given admin access token, create the "ccm" realm in
    Keycloak, if it does not already exist.
    """
    print("Creating CCM realm in Keycloak...")
    url = keycloak_host + "/auth/admin/realms/"
    # https://www.keycloak.org/docs-api/12.0/rest-api/index.html#_realmrepresentation
    new_realm = {
        "realm": "ccm",
        "enabled": True,
    }
    response = requests.post(
        url, json=new_realm, headers={"Authorization": f"Bearer {access_token}"}
    )
    if response.ok:
        print("CCM realm added successfully.")
        return True
    elif response.status_code == 409:
        print("CCM realm already exists. Skipping...")
        return True
    app.logger.error(
        f"ERROR: Failed to create CCM realm: {response.status_code} - {response.text}"
    )
    return False


def add_keycloak_client(access_token: str):
    """
    Using the given admin access token, create the "ccm-stager" client in
    the "ccm" realm in Keycloak, if it does not already exist.

    Requires an application context.
    """
    print("Adding Stager client to Keycloak...")
    app_url = "http://app:5000"
    url = keycloak_host + "/auth/admin/realms/ccm/clients"
    # https://www.keycloak.org/docs-api/12.0/rest-api/index.html#_clientrepresentation
    new_client = {
        "adminUrl": app_url,
        "baseUrl": app_url,
        "clientId": app.config.get("OIDC_CLIENT_ID"),
        "name": "Stager",
        # We set our own client secret instead of letting Keycloak make one
        "secret": app.config.get("OIDC_CLIENT_SECRET"),
        "redirectUris": [
            app_url + "/*",
            "http://localhost:5000/*",
            "http://localhost:3000/*",
        ],
        "webOrigins": ["+"],
    }
    response = requests.post(
        url, json=new_client, headers={"Authorization": f"Bearer {access_token}"}
    )
    if response.ok:
        print("Stager client added successfully.")
        return True
    elif response.status_code == 409:
        print("Stager client already exists. Skipping...")
        return True
    app.logger.error(
        f"ERROR: Failed to add Stager client: {response.status_code} - {response.text}"
    )
    return False


def add_keycloak_user(access_token: str, user: User, password: str = None):
    """
    Using the given admin access token, create a new user based on the
    given user object.

    Update the provided user with issuer, subject fields and return True if successful.
    Return False if unsuccessful.
    """
    print(f"Adding user {user.username} to Keycloak...")
    url = keycloak_host + "/auth/admin/realms/ccm/users"
    # If a password is provided, then we create a user with that password
    # Otherwise, we specify that this user must set a password themselves
    # and they login the first time with their username
    if password:
        user_credentials = {"type": "password", "value": password, "temporary": False}
    else:
        user_credentials = {
            "type": "password",
            "value": user.username,
            "temporary": True,
        }

    # https://www.keycloak.org/docs-api/12.0/rest-api/index.html#_userrepresentation
    new_user = {
        "email": user.email,
        "emailVerified": True,
        "enabled": not user.deactivated,
        "username": user.username,
        "credentials": [user_credentials],
    }
    post_response = requests.post(
        url, json=new_user, headers={"Authorization": f"Bearer {access_token}"}
    )
    if post_response.ok:
        print(f"User {user.username} added successfully.")
        # We need to fetch the ID that keycloak assigned to this user so we can store it
        params = {
            "username": user.username,
            "exact": True,
        }
        get_response = requests.get(
            url, params=params, headers={"Authorization": f"Bearer {access_token}"}
        )
        if get_response.ok:
            # Returns array of UserRepresentations
            found_users = get_response.json()
            if len(found_users) != 1:
                app.logger.error(f"ERROR: Added user {user.username} not found ???")
                return False

            added_user = found_users[0]
            print(f"Found user in Keycloak: {added_user}")
            endpoints = fetch_admin_well_known("ccm")
            issuer = endpoints["issuer"]
            subject = added_user["id"]
            user.set_oidc_fields(issuer, subject)
            print(f"User {user.username} successfully updated with OIDC fields.")
            return True
        app.logger.error(
            f"ERROR: Failed to find {user.username}: {get_response.status_code} - {get_response.text}"
        )
        return False
    app.logger.error(
        f"ERROR: Failed to add user {user.username} to Keycloak: {post_response.status_code} - {post_response.text}"
    )
    return False


def setup_keycloak():
    """
    Setup the Keycloak realm and client for Stager.
    Must be called before adding default data so that
    the Stager client exists to add users to.
    """
    if not stager_is_keycloak_admin():
        print("OIDC support disabled. Keycloak setup skipped.")
        return

    print("OIDC support enabled. Setting up Keycloak...")
    access_token = obtain_admin_token()
    if access_token:
        # Check if it's already setup
        client_id = app.config.get("OIDC_CLIENT_ID")
        url = keycloak_host + f"/auth/admin/realms/ccm/clients/{client_id}"
        response = requests.get(
            url, headers={"Authorization": f"Bearer {access_token}"}
        )
        if response.ok and response.json()["id"] == client_id:
            print("Keycloak is already set up. Skipping setup...")
            return True
        if add_keycloak_realm(access_token):
            success = add_keycloak_client(access_token)
            if success:
                print("Keycloak successfully set up.")
            else:
                app.logger.error("Failed to setup Keycloak.")
            return success
        return False
    return False