const express = require('express');
const { db, auth } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('posts').where('status', '==', 'published').get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .orderBy('views', 'desc')
      .limit(10)
      .get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/reaction', verifyToken, async (req, res) => {
  try {
    const reactionDoc = await db.collection('reactions')
      .where('userId', '==', req.user.uid)
      .where('postId', '==', req.params.id)
      .get();
    
    const reaction = reactionDoc.empty ? null : reactionDoc.docs[0].data().type;
    res.json({ reaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/react', verifyToken, async (req, res) => {
  try {
    const { reaction } = req.body;
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const postData = postDoc.data();
    const reactionQuery = await db.collection('reactions')
      .where('userId', '==', req.user.uid)
      .where('postId', '==', req.params.id)
      .get();
    
    let likes = postData.likes || 0;
    let dislikes = postData.dislikes || 0;
    
    if (!reactionQuery.empty) {
      const oldReaction = reactionQuery.docs[0].data().type;
      if (oldReaction === 'like') likes--;
      if (oldReaction === 'dislike') dislikes--;
      await reactionQuery.docs[0].ref.delete();
    }
    
    if (reaction) {
      await db.collection('reactions').add({
        userId: req.user.uid,
        postId: req.params.id,
        type: reaction,
        createdAt: new Date()
      });
      if (reaction === 'like') likes++;
      if (reaction === 'dislike') dislikes++;
      
      // Create notification for post author if it's not the same user
      if (postData.authorId !== req.user.uid) {
        await db.collection('notifications').add({
          userId: postData.authorId,
          type: reaction,
          message: `${req.user.name || req.user.email} ${reaction}d your post "${postData.title}"`,
          senderName: req.user.name || req.user.email,
          senderAvatar: req.user.picture || null,
          postId: req.params.id,
          createdAt: new Date(),
          isRead: false
        });
      }
    }
    
    await postRef.update({ likes, dislikes });
    res.json({ message: 'Reaction updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ id: postDoc.id, ...postDoc.data() });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, status, image, readingTime } = req.body;
    
    // Check for bad words in title and content
    const hasBadWordsInTitle = await checkPostContent(title);
    const hasBadWordsInContent = await checkPostContent(content);
    
    // If post contains bad words and user is not admin, set to pending
    let finalStatus = status || 'published';
    if ((hasBadWordsInTitle || hasBadWordsInContent) && req.user.role !== 'admin') {
      finalStatus = 'pending';
    }
    
    const postData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      category: category || '',
      tags: tags || [],
      image: image || '',
      authorId: req.user.uid,
      authorName: req.user.name || req.user.email,
      createdAt: new Date(),
      status: finalStatus,
      likes: 0,
      dislikes: 0,
      views: 0,
      comments: 0,
      readingTime: readingTime || Math.ceil(content.split(' ').length / 200),
      flagged: hasBadWordsInTitle || hasBadWordsInContent
    };
    
    const postRef = await db.collection('posts').add(postData);
    res.json({ id: postRef.id, ...postData });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const postData = postDoc.data();
    if (postData.authorId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // If only status is being updated (e.g. publishing a draft)
    if (Object.keys(req.body).length === 1 && req.body.status) {
      await postRef.update({ 
        status: req.body.status,
        updatedAt: new Date()
      });
      return res.json({ 
        id: postRef.id, 
        status: req.body.status,
        message: `Post ${req.body.status === 'published' ? 'published' : 'status updated'}`
      });
    }
    
    // Full post update
    const { title, content, excerpt, category, tags, status, image, readingTime } = req.body;
    const updatedData = {
      title,
      content,
      excerpt: excerpt || (content ? content.substring(0, 150) + '...' : ''),
      category: category || '',
      tags: tags || [],
      image: image || '',
      status: status || postData.status,
      readingTime: readingTime || (content ? Math.ceil(content.split(' ').length / 200) : 5),
      updatedAt: new Date(),
    };
    
    await postRef.update(updatedData);
    res.json({ id: postRef.id, ...updatedData });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await db.collection('posts').doc(req.params.id).update({ 
      status: 'published',
      approvedBy: req.user.uid,
      approvedAt: new Date()
    });
    
    res.json({ message: 'Post approved' });
  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/feature', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { isFeatured } = req.body;
    await db.collection('posts').doc(req.params.id).update({ 
      isFeatured,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });
    
    res.json({ message: 'Feature status updated' });
  } catch (error) {
    console.error('Error featuring post:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/like', async (req, res) => {
  try {
    const user = await auth.verifyIdToken(req.headers.authorization.split('Bearer ')[1]);
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const postData = postDoc.data();
    const likes = postData.likes || [];
    const dislikes = postData.dislikes || [];
    if (likes.includes(user.uid)) {
      await postRef.update({ likes: likes.filter(id => id !== user.uid) });
    } else {
      await postRef.update({
        likes: [...likes, user.uid],
        dislikes: dislikes.filter(id => id !== user.uid),
      });
    }
    res.json({ message: 'Like updated' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/dislike', async (req, res) => {
  try {
    const user = await auth.verifyIdToken(req.headers.authorization.split('Bearer ')[1]);
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const postData = postDoc.data();
    const likes = postData.likes || [];
    const dislikes = postData.dislikes || [];
    if (dislikes.includes(user.uid)) {
      await postRef.update({ dislikes: dislikes.filter(id => id !== user.uid) });
    } else {
      await postRef.update({
        dislikes: [...dislikes, user.uid],
        likes: likes.filter(id => id !== user.uid),
      });
    }
    res.json({ message: 'Dislike updated' });
  } catch (error) {
    console.error('Error disliking post:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/view', async (req, res) => {
  try {
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await postRef.update({ views: (postDoc.data().views || 0) + 1 });
    res.json({ message: 'View count updated' });
  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check post content for bad words
const checkPostContent = async (content) => {
  try {
    const settingsDoc = await db.collection('settings').doc('content').get();
    const badWords = settingsDoc.exists ? (settingsDoc.data().badWords || []) : [];
    
    if (badWords.length > 0) {
      const lowerContent = content.toLowerCase();
      return badWords.some(word => lowerContent.includes(word.toLowerCase()));
    }
    return false;
  } catch (error) {
    console.error('Error checking content:', error);
    return false;
  }
};



module.exports = router;