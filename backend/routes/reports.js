const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get all reports
router.get('/', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const snapshot = await db.collection('reports')
      .orderBy('createdAt', 'desc')
      .get();
    
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new report
router.post('/', verifyToken, async (req, res) => {
  try {
    const { contentType, contentId, reason, contentExcerpt, postId } = req.body;
    
    if (!contentType || !contentId || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const reportData = {
      contentType, // 'post' or 'comment'
      contentId,
      postId: postId || contentId, // If reporting a post, postId is the same as contentId
      reason,
      contentExcerpt: contentExcerpt || '',
      reporterId: req.user.uid,
      reporterName: req.user.name || req.user.email,
      status: 'pending',
      createdAt: new Date()
    };
    
    const reportRef = await db.collection('reports').add(reportData);
    res.status(201).json({ id: reportRef.id, ...reportData });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: error.message });
  }
});

// Dismiss a report
router.put('/:id/dismiss', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await db.collection('reports').doc(req.params.id).update({
      status: 'dismissed',
      resolvedBy: req.user.uid,
      resolvedAt: new Date()
    });
    
    res.json({ message: 'Report dismissed' });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a report
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await db.collection('reports').doc(req.params.id).delete();
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;