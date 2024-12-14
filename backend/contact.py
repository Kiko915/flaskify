from flask import Blueprint, request, jsonify
from models import db, Contact, Role, Users
from flask_login import login_required, current_user
from datetime import datetime

contact = Blueprint('contact', __name__)

@contact.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'message': f'{field.capitalize()} is required',
                    'status': 'error'
                }), 400

        # Create new contact message
        new_contact = Contact(
            name=data['name'],
            email=data['email'],
            subject=data['subject'],
            message=data['message']
        )
        
        db.session.add(new_contact)
        db.session.commit()
        
        return jsonify({
            'message': 'Message sent successfully',
            'status': 'success'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'status': 'error'
        }), 500

@contact.route('/api/admin/contacts', methods=['GET'])
@login_required
def get_contacts():
    try:
        if not current_user.has_role(Role.ADMIN):
            return jsonify({'message': 'Unauthorized access'}), 403
            
        # Get query parameters
        status = request.args.get('status')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Base query
        query = Contact.query.order_by(Contact.created_at.desc())
        
        # Apply status filter if provided
        if status:
            query = query.filter(Contact.status == status)
            
        # Paginate results
        contacts = query.paginate(page=page, per_page=per_page)
        
        return jsonify({
            'contacts': [contact.to_dict() for contact in contacts.items],
            'total': contacts.total,
            'pages': contacts.pages,
            'current_page': contacts.page
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': str(e),
            'status': 'error'
        }), 500

@contact.route('/api/admin/contacts/<contact_uuid>', methods=['PATCH'])
@login_required
def update_contact_status(contact_uuid):
    try:
        if not current_user.has_role(Role.ADMIN):
            return jsonify({'message': 'Unauthorized access'}), 403
            
        contact = Contact.query.get_or_404(contact_uuid)
        data = request.json
        
        if 'status' in data:
            contact.status = data['status']
            contact.updated_at = datetime.utcnow()
            
        db.session.commit()
        
        return jsonify({
            'message': 'Contact status updated successfully',
            'contact': contact.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'status': 'error'
        }), 500

@contact.route('/api/admin/contacts/<contact_uuid>', methods=['DELETE'])
@login_required
def delete_contact(contact_uuid):
    try:
        if not current_user.has_role(Role.ADMIN):
            return jsonify({'message': 'Unauthorized access'}), 403
            
        contact = Contact.query.get_or_404(contact_uuid)
        db.session.delete(contact)
        db.session.commit()
        
        return jsonify({
            'message': 'Contact message deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'status': 'error'
        }), 500 