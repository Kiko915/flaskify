import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import ChatDialog from '@/components/chat/ChatDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin', { state: { from: '/messages' } });
      return;
    }
    fetchChatRooms();
  }, [user, navigate]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      {chatRooms.length === 0 ? (
        <div className="bg-background rounded-lg shadow-sm p-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Messages Yet</h2>
          <p className="text-muted-foreground mb-4">
            Start chatting with sellers by visiting their product pages
          </p>
          <Button onClick={() => navigate('/')}>
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="bg-background rounded-lg shadow-sm divide-y divide-border">
          {chatRooms.map((room) => (
            <div
              key={room.room_uuid}
              className={cn(
                'p-4 hover:bg-accent cursor-pointer transition-colors',
                selectedRoomId === room.room_uuid && 'bg-accent'
              )}
              onClick={() => handleChatClick(room.room_uuid)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{room.other_user.business_name}</h3>
                  {room.last_message && (
                    <>
                      <p className="text-muted-foreground text-sm mt-1">
                        {room.last_message.content}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {formatDistanceToNow(new Date(room.last_message.created_at), { addSuffix: true })}
                      </p>
                    </>
                  )}
                </div>
                {room.unread_count > 0 && (
                  <div className="bg-brand-yellow text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {room.unread_count}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ChatDialog
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          fetchChatRooms(); // Refresh the list when chat is closed
        }}
        roomId={selectedRoomId}
      />
    </div>
  );
};

export default Messages; 