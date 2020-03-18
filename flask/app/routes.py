import json

from flask import request

from app import app, models


@app.route('/')
def index():
    return json.dumps({})
