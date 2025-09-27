import admin from 'firebase-admin';

// Debug environment variables
console.log('Firebase Config Debug:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  // Validate required fields
  if (!serviceAccount.projectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is required');
  }
  if (!serviceAccount.privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
  }
  if (!serviceAccount.clientEmail) {
    throw new Error('FIREBASE_CLIENT_EMAIL environment variable is required');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();

export default admin;
