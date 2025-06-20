const express = require('express');
const { admin, db } = require('../config/firebase');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, username, displayName } = req.body;
    console.log('Registration request:', { email, username, displayName });


    if (!email || !password || !username || !displayName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (username.length < 3 || displayName.length < 3) {
      return res.status(400).json({ message: 'Username and displayName must be at least 3 characters' });
    }

    const usernameQuery = await db.collection('users').where('username', '==', username).get();
    if (!usernameQuery.empty) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({ message: 'Email already in use' });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    const userRecord = await admin.auth().createUser({ email, password, displayName });
    console.log('Created Firebase user:', userRecord.uid);

    await db.collection('users').doc(userRecord.uid).set({
      email,
      username,
      displayName,
      role: 'user',
      isLocked: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Stored user data for UID:', userRecord.uid);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ message: 'Password is too weak' });
    }
    if (error.code === 'permission-denied') {
      return res.status(403).json({ message: 'Permission denied. Check Firestore rules' });
    }
    res.status(500).json({ message: `Registration failed: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login request:', { email });
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = await admin.auth().createCustomToken(userRecord.uid);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User data not found' });
    }
    if (userDoc.data().isLocked) {
      return res.status(403).json({ message: 'Account is locked' });
    }

    res.json({
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userDoc.data().displayName,
        username: userDoc.data().username,
        role: userDoc.data().role,
        isLocked: userDoc.data().isLocked,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(401).json({ message: `Login failed: ${error.message}` });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    await admin.auth().generatePasswordResetLink(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error.message, error.stack);
    res.status(500).json({ message: `Failed to send reset email: ${error.message}` });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    const userData = userDoc.data();
    
    res.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: userData.displayName,
      username: userData.username,
      role: userData.role,
      isLocked: userData.isLocked,
      avatar: userData.avatar || null,
      bio: userData.bio || null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;