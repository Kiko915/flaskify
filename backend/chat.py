from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, ChatRoom, ChatMessage, Shop, SellerInfo, Users
from datetime import datetime

chat = Blueprint('chat', __name__)

@chat.route('/shops/<string:shop_uuid>/chat', methods=['POST'])
@login_required
def create_chat_room(shop_uuid):
    try:
        # Get the shop and seller info
        shop = Shop.query.get_or_404(shop_uuid)
        seller = SellerInfo.query.get_or_404(shop.seller_id)
        
        # Don't allow seller to chat with themselves
        if seller.user_id == current_user.user_uuid:
            return jsonify({"message": "Cannot create chat with your own shop"}), 400
            
        # Check if chat room already exists
        existing_chat = ChatRoom.query.filter(
            ((ChatRoom.user1_uuid == current_user.user_uuid) & (ChatRoom.user2_uuid == seller.user_id)) |
            ((ChatRoom.user1_uuid == seller.user_id) & (ChatRoom.user2_uuid == current_user.user_uuid))
        ).first()
        
        if existing_chat:
            return jsonify({"room_uuid": existing_chat.room_uuid})
            
        # Create new chat room
        chat_room = ChatRoom(
            user1_uuid=current_user.user_uuid,
            user2_uuid=seller.user_id
        )
        
        db.session.add(chat_room)
        db.session.commit()
        
        return jsonify({"room_uuid": chat_room.room_uuid})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@chat.route('/chat/<string:room_uuid>/messages', methods=['GET'])
@login_required
def get_messages(room_uuid):
    try:
        # Verify user has access to this chat room
        chat_room = ChatRoom.query.get_or_404(room_uuid)
        if current_user.user_uuid not in [chat_room.user1_uuid, chat_room.user2_uuid]:
            return jsonify({"message": "Access denied"}), 403
            
        # Get messages
        messages = ChatMessage.query.filter_by(room_uuid=room_uuid).order_by(ChatMessage.created_at.asc()).all()
        
        # Mark unread messages as read
        unread_messages = ChatMessage.query.filter_by(
            room_uuid=room_uuid,
            is_read=False
        ).filter(ChatMessage.sender_uuid != current_user.user_uuid).all()
        
        for message in unread_messages:
            message.is_read = True
        
        db.session.commit()
        
        # Get seller info for shop logo
        seller_uuid = chat_room.user2_uuid if chat_room.user1_uuid == current_user.user_uuid else chat_room.user1_uuid
        seller = SellerInfo.query.filter_by(user_id=seller_uuid).first()
        shop = Shop.query.filter_by(seller_id=seller.seller_id).first() if seller else None
        
        return jsonify({
            "messages": [{
                "message_uuid": msg.message_uuid,
                "content": msg.content,
                "sender_uuid": msg.sender_uuid,
                "created_at": msg.created_at.isoformat(),
                "is_read": msg.is_read,
                "sender_profile_image": (
                    shop.shop_logo if shop and msg.sender_uuid == seller_uuid
                    else msg.sender.profile_image_url if msg.sender
                    else None
                )
            } for msg in messages]
        })
        
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@chat.route('/chat/<string:room_uuid>/messages', methods=['POST'])
@login_required
def send_message(room_uuid):
    try:
        # Verify user has access to this chat room
        chat_room = ChatRoom.query.get_or_404(room_uuid)
        if current_user.user_uuid not in [chat_room.user1_uuid, chat_room.user2_uuid]:
            return jsonify({"message": "Access denied"}), 403
            
        data = request.get_json()
        content = data.get('content')
        
        if not content or not content.strip():
            return jsonify({"message": "Message content cannot be empty"}), 400
            
        # Create new message
        message = ChatMessage(
            room_uuid=room_uuid,
            sender_uuid=current_user.user_uuid,
            content=content
        )
        
        # Update chat room's last message timestamp
        chat_room.last_message_at = datetime.utcnow()
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            "message_uuid": message.message_uuid,
            "content": message.content,
            "sender_uuid": message.sender_uuid,
            "created_at": message.created_at.isoformat(),
            "is_read": message.is_read
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@chat.route('/chat/rooms', methods=['GET'])
@login_required
def get_chat_rooms():
    try:
        # Get all chat rooms for the current user
        chat_rooms = ChatRoom.query.filter(
            (ChatRoom.user1_uuid == current_user.user_uuid) |
            (ChatRoom.user2_uuid == current_user.user_uuid)
        ).order_by(ChatRoom.last_message_at.desc()).all()
        
        rooms_data = []
        for room in chat_rooms:
            # Get the other user's info
            other_user_uuid = room.user2_uuid if room.user1_uuid == current_user.user_uuid else room.user1_uuid
            other_user = SellerInfo.query.filter_by(user_id=other_user_uuid).first()
            other_user_details = Users.query.get(other_user_uuid)
            
            # Get shop info if other user is a seller
            shop = None
            if other_user:
                shop = Shop.query.filter_by(seller_id=other_user.seller_id).first()
            
            # Get last message
            last_message = ChatMessage.query.filter_by(room_uuid=room.room_uuid).order_by(ChatMessage.created_at.desc()).first()
            
            # Get unread count
            unread_count = ChatMessage.query.filter_by(
                room_uuid=room.room_uuid,
                is_read=False
            ).filter(ChatMessage.sender_uuid != current_user.user_uuid).count()

            # Determine display name and profile image
            if other_user and shop:  # If other user is a seller
                display_name = other_user.business_name
                profile_image = shop.shop_logo
            else:  # If other user is a buyer
                display_name = f"{other_user_details.first_name} {other_user_details.last_name}"
                profile_image = other_user_details.profile_image_url if other_user_details else None
            
            rooms_data.append({
                "room_uuid": room.room_uuid,
                "other_user": {
                    "user_uuid": other_user_uuid,
                    "business_name": other_user.business_name if other_user else None,
                    "business_owner": other_user.business_owner if other_user else display_name,
                    "profile_image_url": profile_image or '/default-avatar.png'
                },
                "last_message": {
                    "content": last_message.content if last_message else None,
                    "created_at": last_message.created_at.isoformat() if last_message else None,
                    "is_read": last_message.is_read if last_message else True
                } if last_message else None,
                "unread_count": unread_count
            })
            
        return jsonify({"rooms": rooms_data})
        
    except Exception as e:
        print(f"Error in get_chat_rooms: {str(e)}")  # Add debug logging
        return jsonify({"message": str(e)}), 500

@chat.route('/chat/<string:room_uuid>/info', methods=['GET'])
@login_required
def get_chat_info(room_uuid):
    try:
        # Verify user has access to this chat room
        chat_room = ChatRoom.query.get_or_404(room_uuid)
        if current_user.user_uuid not in [chat_room.user1_uuid, chat_room.user2_uuid]:
            return jsonify({"message": "Access denied"}), 403
            
        # Get the other user's info
        partner_uuid = chat_room.user2_uuid if chat_room.user1_uuid == current_user.user_uuid else chat_room.user1_uuid
        
        # Get seller info and shop details
        seller = SellerInfo.query.filter_by(user_id=partner_uuid).first()
        shop = Shop.query.filter_by(seller_id=seller.seller_id).first() if seller else None
        partner_user = Users.query.get(partner_uuid)
        
        if not partner_user:
            return jsonify({"message": "Partner not found"}), 404
            
        return jsonify({
            "partner": {
                "user_uuid": partner_uuid,
                "business_name": shop.business_name if shop else None,
                "business_owner": seller.business_owner if seller else f"{partner_user.first_name} {partner_user.last_name}",
                "shop_logo": shop.shop_logo if shop else partner_user.profile_image_url,
                "is_seller": bool(seller)
            }
        })
        
    except Exception as e:
        return jsonify({"message": str(e)}), 500 

@chat.route('/chat/<string:room_uuid>/messages/<string:message_uuid>', methods=['DELETE'])
@login_required
def delete_message(room_uuid, message_uuid):
    try:
        # Verify user has access to this chat room
        chat_room = ChatRoom.query.get_or_404(room_uuid)
        if current_user.user_uuid not in [chat_room.user1_uuid, chat_room.user2_uuid]:
            return jsonify({"message": "Access denied"}), 403
            
        # Get the message
        message = ChatMessage.query.get_or_404(message_uuid)
        
        # Verify the user is the sender of the message
        if message.sender_uuid != current_user.user_uuid:
            return jsonify({"message": "You can only delete your own messages"}), 403
            
        # Delete the message
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({"message": "Message deleted successfully"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500 