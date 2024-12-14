import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from 'date-fns';
import { Send, Smile, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '@/utils/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ChatDialog = ({ isOpen, onClose, roomId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);
  const messageSound = new Audio('/notif.mp3');
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (roomId) {
      fetchMessages();
      fetchChatPartner();
      // Poll for new messages every 3 seconds
      pollingInterval.current = setInterval(fetchMessages, 3000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [roomId]);

  // Add useEffect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatPartner = async () => {
    try {
      const response = await api.get(`/api/chat/${roomId}/info`);
      setChatPartner(response.data.partner);
    } catch (error) {
      console.error('Error fetching chat partner:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/api/chat/${roomId}/messages`);
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/api/chat/${roomId}/messages`, {
        content: newMessage
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
      messageSound.play();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/api/chat/${roomId}/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg.message_uuid !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex-row items-center gap-3 pb-4 border-b">
          {chatPartner && (
            <>
              <img
                src={chatPartner.shop_logo || '/default-avatar.jpg'}
                alt={chatPartner.business_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <DialogTitle>{chatPartner.business_name}</DialogTitle>
                <p className="text-sm text-gray-500">{chatPartner.business_owner}</p>
              </div>
            </>
          )}
        </DialogHeader>
        <div className="flex flex-col h-[500px]">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.message_uuid}
                  className={cn(
                    'flex items-start gap-2',
                    message.sender_uuid === user?.user_uuid ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <img
                    src={message.sender_profile_image || '/default-avatar.jpg'}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div
                    className={cn(
                      'group relative max-w-[70%] rounded-lg p-3',
                      message.sender_uuid === user?.user_uuid
                        ? 'bg-brand-yellow text-black'
                        : 'bg-muted'
                    )}
                  >
                    {message.sender_uuid === user?.user_uuid && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 p-1 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMessage(message.message_uuid)}
                            className="text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <p className="break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {format(new Date(message.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    type="button"
                    className="h-9 w-9"
                  >
                    <Smile className="h-5 w-5 text-gray-500 hover:text-gray-600" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-full p-0 border-none" 
                  side="top" 
                  align="start"
                >
                  <Picker 
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    previewPosition="none"
                  />
                </PopoverContent>
              </Popover>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog; 