const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.id).update({
      isRead: true,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

router.put('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const batch = db.batch();
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .where('isRead', '==', false)
      .get();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        isRead: true,
        updatedAt: admin.firestore.Timestamp.now()
      });
    });
    
    await batch.commit();
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

module.exports = router;