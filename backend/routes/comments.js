const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Create comment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { postId, content, parentId } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }
    
    // Get post title for notifications
    let postTitle = '';
    const postDoc = await db.collection('posts').doc(postId).get();
    if (postDoc.exists) {
      postTitle = postDoc.data().title || '';
    }
    
    // Check for bad words
    const settingsDoc = await db.collection('settings').doc('content').get();
    const badWords = settingsDoc.exists ? (settingsDoc.data().badWords || []) : [];
    
    let flagged = false;
    
    if (badWords.length > 0) {
      const lowerContent = content.toLowerCase();
      flagged = badWords.some(word => lowerContent.includes(word.toLowerCase()));
    }
    
    // Create comment
    const commentData = {
      postId,
      postTitle,
      content,
      authorId: req.user.uid,
      authorName: req.user.name || req.user.email,
      authorAvatar: req.user.picture || null,
      createdAt: new Date(),
      parentId: parentId || null,
      likes: 0,
      flagged
    };
    const commentRef = await db.collection('comments').add(commentData);
    const newComment = { id: commentRef.id, ...commentData };
    
    // Get post details to create notification
    if (postDoc.exists) {
      const postData = postDoc.data();
      
      // Don't notify yourself
      if (postData.authorId !== req.user.uid) {
        // Create notification for post author
        await db.collection('notifications').add({
          userId: postData.authorId,
          type: 'comment',
          message: `${req.user.name || req.user.email} commented on your post "${postData.title}"`,
          senderName: req.user.name || req.user.email,
          senderAvatar: req.user.picture || null,
          postId,
          commentId: commentRef.id,
          createdAt: new Date(),
          isRead: false
        });
      }
      
      // If this is a reply, notify parent comment author too
      if (parentId) {
        const parentCommentDoc = await db.collection('comments').doc(parentId).get();
        if (parentCommentDoc.exists) {
          const parentComment = parentCommentDoc.data();
          
          // Don't notify yourself
          if (parentComment.authorId !== req.user.uid) {
            await db.collection('notifications').add({
              userId: parentComment.authorId,
              type: 'reply',
              message: `${req.user.name || req.user.email} replied to your comment`,
              senderName: req.user.name || req.user.email,
              senderAvatar: req.user.picture || null,
              postId,
              commentId: commentRef.id,
              createdAt: new Date(),
              isRead: false
            });
          }
        }
      }
      
      // Update comment count on post
      await db.collection('posts').doc(postId).update({
        comments: (postData.comments || 0) + 1
      });
    }
    
    res.json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update comment
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const commentRef = db.collection('comments').doc(req.params.id);
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const commentData = commentDoc.data();
    if (commentData.authorId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Check for bad words
    const settingsDoc = await db.collection('settings').doc('content').get();
    const badWords = settingsDoc.exists ? (settingsDoc.data().badWords || []) : [];
    
    const content = req.body.content;
    let flagged = false;
    
    if (badWords.length > 0) {
      const lowerContent = content.toLowerCase();
      flagged = badWords.some(word => lowerContent.includes(word.toLowerCase()));
    }
    
    await commentRef.update({
      content,
      flagged,
      updatedAt: new Date()
    });
    
    res.json({ message: 'Comment updated' });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve flagged comment
router.put('/:id/approve', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const commentRef = db.collection('comments').doc(req.params.id);
    await commentRef.update({
      flagged: false,
      approvedBy: req.user.uid,
      approvedAt: new Date()
    });
    
    res.json({ message: 'Comment approved' });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const commentRef = db.collection('comments').doc(req.params.id);
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const commentData = commentDoc.data();
    if (commentData.authorId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update post comment count
    const postRef = db.collection('posts').doc(commentData.postId);
    const postDoc = await postRef.get();
    if (postDoc.exists) {
      await postRef.update({
        comments: Math.max(0, (postDoc.data().comments || 1) - 1)
      });
    }
    
    await commentRef.delete();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user liked a comment
router.get('/:id/like', verifyToken, async (req, res) => {
  try {
    const likeQuery = await db.collection('commentLikes')
      .where('commentId', '==', req.params.id)
      .where('userId', '==', req.user.uid)
      .get();
    
    res.json({ liked: !likeQuery.empty });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike a comment
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const commentRef = db.collection('comments').doc(req.params.id);
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const commentData = commentDoc.data();
    const likeQuery = await db.collection('commentLikes')
      .where('commentId', '==', req.params.id)
      .where('userId', '==', req.user.uid)
      .get();
    
    let likes = commentData.likes || 0;
    
    if (likeQuery.empty) {
      // Add like
      await db.collection('commentLikes').add({
        commentId: req.params.id,
        userId: req.user.uid,
        createdAt: new Date()
      });
      likes++;
      
      // Create notification if not liking your own comment
      if (commentData.authorId !== req.user.uid) {
        await db.collection('notifications').add({
          userId: commentData.authorId,
          type: 'commentLike',
          message: `${req.user.name || req.user.email} liked your comment`,
          senderName: req.user.name || req.user.email,
          senderAvatar: req.user.picture || null,
          postId: commentData.postId,
          commentId: req.params.id,
          createdAt: new Date(),
          isRead: false
        });
      }
    } else {
      // Remove like
      await likeQuery.docs[0].ref.delete();
      likes = Math.max(0, likes - 1);
    }
    
    // Update comment likes count
    await commentRef.update({ likes });
    
    res.json({ likes });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;