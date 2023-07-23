from flask import Flask, request
from flask_restful import Api, Resource
from sqlalchemy.orm import sessionmaker
from sqlSchema import User, engine
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
api = Api(app)

# Configure Session
Session = sessionmaker(bind=engine)

class UserResource(Resource):
    def get(self):
        session = Session()
        users = session.query(User).all()
        data = {'users': [{'username': user.username, 'score': user.score} for user in users]}
        session.close()
        return data

    def post(self):
        data = request.json
        username = data.get('username')
        score = data.get('score')

        if not username or not score:
            return {'message': 'Invalid data'}, 400

        session = Session()
        user = User(username=username, score=score)
        session.add(user)
        session.commit()
        session.close()

        return {'message': 'User created successfully'}, 201

api.add_resource(UserResource, '/users')

if __name__ == '__main__':
    app.run(debug=True)
