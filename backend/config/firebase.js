const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccountKey.json'); // Adjust path if needed

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });

  console.log('✅ Firebase Admin SDK initialized using serviceAccountKey.json');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  throw error;
}

const db = admin.firestore();
module.exports = { admin, db };
