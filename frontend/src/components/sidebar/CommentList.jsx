//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\sidebar\CommentList.jsx
//================================================================================

import React, { useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { Send } from 'lucide-react';

const commentsSelector = (state) => state.selectedNodeComments;

const CommentItem = ({ comment }) => {
  return (
    <div className="p-2 rounded-md">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm text-accent">
          {comment.userId?.username || 'User'}
        </span>
        <span className="text-xs text-foreground-secondary">
          {new Date(comment.createdAt).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-foreground">{comment.text}</p>
    </div>
  );
};

const CommentList = ({ tripId, nodeId, socket }) => {
  const comments = useTripStore(commentsSelector);
  const [newCommentText, setNewCommentText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !socket) return;
    
    socket.emit('createComment', {
      tripId,
      nodeId,
      text: newCommentText.trim(),
    }, (createdComment) => {
      if (createdComment && !createdComment.error) {
        setNewCommentText('');
      }
    });
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex-1 space-y-2 overflow-y-auto mb-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        ) : (
          <p className="text-sm text-foreground-secondary text-center py-4">
            Be the first to comment!
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-auto flex gap-2">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="p-2 bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default CommentList;