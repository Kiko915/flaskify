import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/utils/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ChatDialog from '@/components/chat/ChatDialog';

const SellerChats = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchChatRooms();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchChatRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchChatRooms = async () => {
    try {
      const response = await api.get('/api/chat/rooms');
      setChatRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast.error('Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (roomId) => {
    setSelectedRoomId(roomId);
    setIsChatOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Chat Management</h1>
      
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-4 text-center">Loading chats...</div>
        ) : chatRooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chat rooms found</div>
        ) : (
          <div className="divide-y">
            {chatRooms.map((room) => (
              <div
                key={room.room_uuid}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleChatClick(room.room_uuid)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12">
                    <img
                      src={room.other_user?.profile_image_url || '/default-avatar.jpg'}
                      alt={room.other_user?.business_name || room.other_user?.business_owner || 'User'}
                      className="w-12 h-12 rounded-full object-cover bg-gray-100"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {room.other_user?.business_name || room.other_user?.business_owner || 'Unknown User'}
                    </h3>
                    {room.last_message && (
                      <p className="text-sm text-gray-500 truncate">
                        {room.last_message.content}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {room.last_message && format(new Date(room.last_message.created_at), 'MMM d, h:mm a')}
                    </div>
                    {room.unread_count > 0 && (
                      <div className="mt-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 inline-block">
                        {room.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        roomId={selectedRoomId}
      />
    </div>
  );
};

export default SellerChats; 