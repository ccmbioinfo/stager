#!/bin/bash
# initializes database for keycloak
# based on https://donlalicon.dev/blog/mysql-docker-container-with-multiple-databases

set -eo pipefail

mysql_note "Initializing..."

# username password
_create_user() {
    mysql_note "Creating user $1"
    docker_process_sql --database=mysql <<<"CREATE USER '$1'@'%' IDENTIFIED BY '$2'"
}

# name username
_create_database() {
    mysql_note "Creating database $1"
    docker_process_sql --database=mysql <<-EOSQL
        CREATE DATABASE \`$1\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        GRANT ALL PRIVILEGES ON \`$1\`.* TO '$2'@'%';
EOSQL
}

_create_user "${KEYCLOAK_DB_USER}" "${KEYCLOAK_DB_PASSWORD}"
_create_database "${KEYCLOAK_DATABASE}" "${KEYCLOAK_DB_USER}"

mysql_note "Finished initializing!"
