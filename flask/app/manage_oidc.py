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


def get_host():
    """
    Helper function. Return Keycloak admin host url.
    """
    return os.getenv("KEYCLOAK_ADMIN_URL", "http://keycloak:8080/auth/admin/realms")


def set_g(name: str, default: Any = None):
    """
    Helper function. Overwrite the given key name in g with default.
    """
    # Flask's g object is like a dict in every way except this
    if name in g:
        g.pop(name)
    g.setdefault(name, default=default)


def fetch_admin_well_known():
    """
    Fetch and return the openid-configuration json object from
    the Keycloak admin realm.
    """
    # we can cache it in app context to reuse in other functions
    cached = g.get("_admin_well_known")
    if cached is not None:
        return cached
    url = os.getenv(
        "KEYCLOAK_ADMIN_WELL_KNOWN",
        "http://keycloak:8080/auth/realms/master/.well-known/openid-configuration",
    )
    response = requests.get(url)
    print(f"Well-known endpoint fetched at {url}")
    if response.ok:
        # https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
        endpoints = dict(response.json())
        set_g("_admin_well_known", default=(endpoints))
        return endpoints
    print(
        f"ERROR: Well-known endpoint fetch failed: {response.status_code} - {response.text}"
    )
    g.setdefault("_admin_well_known", default=(None))
    return None


def obtain_admin_token():
    """
    Sign into the Token Endpoint for the Keycloak Admin-CLI client,
    and return the response object.
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
        print(
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
    url = get_host() + "/"
    # https://www.keycloak.org/docs-api/12.0/rest-api/index.html#_realmrepresentation
    new_realm = {"realm": "ccm"}
    response = requests.post(
        url, json=new_realm, headers={"Authorization": f"Bearer {access_token}"}
    )
    if response.ok:
        print("CCM realm added successfully.")
        return True
    elif response.status_code == 409:
        print("CCM realm already exists. Skipping...")
        return True
    print(
        f"ERROR: Failed to create CCM realm: {response.status_code} - {response.text}"
    )
    return False


def add_keycloak_client(access_token: str):
    """
    Using the given admin access token, create the "ccm-stager" client in
    the "ccm" realm in Keycloak, if it does not already exist.
    """
    print("Adding Stager client to Keycloak...")
    app_url = "http://app:5000"
    url = get_host() + "/ccm/clients"
    # https://www.keycloak.org/docs-api/12.0/rest-api/index.html#_clientrepresentation
    new_client = {
        "adminUrl": app_url,
        "baseUrl": app_url,
        "clientId": app.config.get("OIDC_CLIENT_ID"),
        "name": "Stager",
        # We set our own client secret instead of letting Keycloak make one
        "secret": app.config.get("OIDC_CLIENT_SECRET"),
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
    print(
        f"ERROR: Failed to add Stager client: {response.status_code} - {response.text}"
    )
    return False


def add_keycloak_user(access_token: str, user: User):
    """
    Using the given admin access token, create a new user based on the
    given user object.

    Update the provided user with issuer, subject fields and return True if successful.
    Return False if unsuccessful.
    """
    print(f"Adding user {user.username} to Keycloak...")
    url = get_host() + "/ccm/users"
    # https://www.keycloak.org/docs-api/12.0/rest-api/index.html#_userrepresentation
    new_user = {
        "email": user.email,
        "emailVerified": True,
        "enabled": not user.deactivated,
        "username": user.username,
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
                print(f"ERROR: Added user {user.username} not found ???")
                return False

            added_user = found_users[0]
            endpoints = fetch_admin_well_known()
            user.issuer = endpoints["issuer"]
            user.subject = added_user["id"]
            print(f"User {user.username} successfully updated with OIDC fields.")
            return True
        print(
            f"ERROR: Failed to find {user.username}: {get_response.status_code} - {get_response.text}"
        )
        return False
    print(
        f"ERROR: Failed to add user {user.username} to Keycloak: {post_response.status_code} - {post_response.text}"
    )
    return False


def setup_keycloak():
    """
    Setup the Keycloak realm and client for Stager.
    Must be called before adding default data so that
    the Stager client exists to add users to.
    """
    print("Setting up Keycloak...")
    access_token = obtain_admin_token()
    if access_token:
        # Check if it's already setup
        client_id = app.config.get("OIDC_CLIENT_ID")
        url = get_host() + f"/ccm/clients/{client_id}"
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
                print("Failed to setup Keycloak.")
            return success
        return False
    return False