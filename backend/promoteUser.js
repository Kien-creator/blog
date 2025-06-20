const admin = require('firebase-admin');
const serviceAccount = require('./config/firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function promoteUserToAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log(`Successfully promoted user ${uid} to admin`);
    
    // Also update user document in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      role: 'admin'
    });
    console.log(`Updated user document for ${uid}`);
  } catch (error) {
    console.error('Error promoting user:', error);
  }
}

// Replace with actual UID
const userUID = 'YOUR_USER_UID_HERE';
promoteUserToAdmin(userUID).then(() => {
  console.log('Done');
  process.exit(0);
});