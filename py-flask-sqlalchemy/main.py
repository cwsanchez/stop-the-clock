from flask import Flask, request
from flask_restful import Resource, Api
from flask_sqlalchemy import SQLAlchemy
from models import Score 

app = Flask(__name__)
api = Api(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stc-data.db'
db = SQLAlchemy(app)

class ScoreResource(Resource):
    def get(self):
        users = Score.query.all()
        return {
          'users' : [
            {'username': user.username, 'score': user.score} for user in users
          ]
        }

    def post(self):
        data = request.json
        username = data.get('username')
        score = data.get('score')

        if not username or not score:
            return {'message': 'Invalid data'}, 400

        user = User(username=username, score=score)
        db.session.add(user)
        db.session.commit()

        return {'message': 'User created successfully'}, 201

api.add_resource(UserResource, '/users')

if not db.engine.dialect.has_table(db.engine, Highscores.__tablename__):
    db.create_all()
