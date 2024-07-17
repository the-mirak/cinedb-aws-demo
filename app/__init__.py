from flask import Flask

def create_app():
    app = Flask(__name__, template_folder='app/templates', static_folder='app/static')

    from .app import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app

app = create_app()
