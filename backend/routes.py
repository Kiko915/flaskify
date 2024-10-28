from flask import Blueprint, jsonify, request
from __init__ import db, mail, Users
from flask_mail import Message
import random
import string

main = Blueprint('main', __name__)

@main.route('/')
def hello_world():
    return 'Hello World!'


@main.route('/check_email', methods=['POST'])
def check_email():
    data = request.json
    email = data.get('email')
    user = Users.query.filter_by(email=email).first()
    if user:
        return jsonify({'message': 'Email already exists'}), 400
    return jsonify({'message': 'Email is available'}), 200


@main.route('/check_username', methods=['POST'])
def check_username():
    data = request.json
    username = data.get('username')
    user = Users.query.filter_by(username=username).first()
    if user:
        return jsonify({'message': 'Username already exists'}), 400
    return jsonify({'message': 'Username is available'}), 200