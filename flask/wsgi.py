#!/usr/bin/env python3
from app import config, create_app

app = create_app(config.Config)

if __name__ == "__main__":
    app.run()
