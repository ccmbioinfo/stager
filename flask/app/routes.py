import json

from flask import request

from app import app


@app.route('/')
def index():
    return json.dumps({})
