from flask import Flask

from .misc import routes
from .families import family_blueprint
from .datasets import datasets_blueprint
from .participants import participants_blueprint
from .tissue_samples import tissue_blueprint
from .analyses import analyses_blueprint
from .genes import genes_blueprint
from .variants import variants_blueprint
from .unlinked import bucket_blueprint
from .groups import groups_blueprint
from .users import users_blueprint
from .error_handler import error_blueprint

def register_blueprints(app: Flask) -> None:
    app.register_blueprint(routes)

    app.register_blueprint(family_blueprint)
    app.register_blueprint(datasets_blueprint)
    app.register_blueprint(participants_blueprint)
    app.register_blueprint(tissue_blueprint)
    app.register_blueprint(analyses_blueprint)
    app.register_blueprint(genes_blueprint)
    app.register_blueprint(variants_blueprint)

    app.register_blueprint(bucket_blueprint)
    app.register_blueprint(groups_blueprint)
    app.register_blueprint(users_blueprint)

    app.register_blueprint(error_blueprint)
