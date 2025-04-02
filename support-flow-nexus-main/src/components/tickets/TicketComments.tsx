
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/contexts/TicketContext';
import { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TicketCommentsProps {
  ticket: Ticket;
}

const TicketComments: React.FC<TicketCommentsProps> = ({ ticket }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { addComment } = useTickets();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(ticket.id, comment);
      setComment('');
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'There was an error adding your comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Discussion</h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          required
        />
        <Button
          type="submit"
          disabled={isSubmitting || !comment.trim()}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
      
      {/* Comments list */}
      <div className="space-y-4 mt-6">
        {ticket.comments && ticket.comments.length > 0 ? (
          ticket.comments.map((comment) => (
            <div key={comment.id} className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{comment.userName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                </div>
                {user && user.id === comment.userId && (
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-line">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">No comments yet</p>
        )}
      </div>
    </div>
  );
};

export default TicketComments;
