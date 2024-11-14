from flask import request, jsonify, Blueprint

shops = Blueprint('shop', __name__)

@shops.route('/products', methods=['GET'])
def get_products():
    return jsonify({'message': 'Products page'}), 200