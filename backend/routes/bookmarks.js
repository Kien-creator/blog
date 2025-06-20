const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { userId, postId } = req.query;
    let query = db.collection('bookmarks');
    
    if (userId) query = query.where('userId', '==', userId);
    if (postId) query = query.where('postId', '==', postId);
    
    const snapshot = await query.get();
    const bookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookmarks' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { postId } = req.body;
  try {
    const bookmark = {
      userId: req.user.uid,
      postId,
      createdAt: admin.firestore.Timestamp.now(),
    };
    const docRef = await db.collection('bookmarks').add(bookmark);
    res.status(201).json({ id: docRef.id, ...bookmark });
  } catch (error) {
    res.status(500).json({ message: 'Error adding bookmark' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const bookmarkRef = db.collection('bookmarks').doc(req.params.id);
    const bookmark = await bookmarkRef.get();
    if (!bookmark.exists || bookmark.data().userId !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await bookmarkRef.delete();
    res.status(200).json({ message: 'Bookmark removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing bookmark' });
  }
});

module.exports = router;