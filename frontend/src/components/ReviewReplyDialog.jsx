import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { API_URL } from '../config';
import toast from 'react-hot-toast';
import { useAuth } from '../utils/AuthContext';

const ReviewReplyDialog = ({ isOpen, onClose, reviewUuid, onReplySubmitted }) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    if (!user?.seller?.seller_id) {
      toast.error('Only sellers can reply to reviews');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/reviews/${reviewUuid}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          reply: replyText
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit reply');
      }

      toast.success('Reply submitted successfully');
      onReplySubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error(error.message || 'Failed to submit reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reply to Review</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Write your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !user?.seller?.seller_id}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Reply'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewReplyDialog; 