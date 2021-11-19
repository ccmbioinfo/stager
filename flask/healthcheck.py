#!/usr/bin/env python3

# "curl -f" healthcheck in Python since curl isn't included in python:slim images
# Explicit timeout since Docker healthcheck doesn't kill processes that take too long
import requests

if __name__ == "__main__":
    assert requests.get("http://localhost:5000/api", timeout=1)
