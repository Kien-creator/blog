const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get bad words list
router.get('/bad-words', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const settingsDoc = await db.collection('settings').doc('content').get();
    if (!settingsDoc.exists) {
      return res.json({ words: [] });
    }
    
    res.json({ words: settingsDoc.data().badWords || [] });
  } catch (error) {
    console.error('Error fetching bad words list:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update bad words list
router.put('/bad-words', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const { words } = req.body;
    if (!Array.isArray(words)) {
      return res.status(400).json({ message: 'Words must be an array' });
    }
    
    await db.collection('settings').doc('content').set({
      badWords: words,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    }, { merge: true });
    
    res.json({ message: 'Bad words list updated' });
  } catch (error) {
    console.error('Error updating bad words list:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;