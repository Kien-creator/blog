const express = require('express');
const { auth, db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.put('/:id/lock', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { isLocked } = req.body;
    await db.collection('users').doc(req.params.id).update({ isLocked });
    res.json({ message: 'User lock status updated' });
  } catch (error) {
    console.error('Error toggling lock:', error);
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
});

// Update user role
router.put('/:id/role', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    await db.collection('users').doc(req.params.id).update({ 
      role,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });
    
    res.json({ message: 'User role updated' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: error.message || 'Failed to update user role' });
  }
});

router.put('/:id/profile', verifyToken, async (req, res) => {
  try {
    if (req.user.uid !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { displayName, bio } = req.body;
    await db.collection('users').doc(req.params.id).update({ displayName, bio });
    res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
});

router.put('/:id/avatar', verifyToken, async (req, res) => {
  try {
    if (req.user.uid !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { avatar } = req.body;
    await db.collection('users').doc(req.params.id).update({ avatar });
    res.json({ message: 'Avatar updated' });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: error.message || 'Failed to update avatar' });
  }
});

module.exports = router;