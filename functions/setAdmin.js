const admin = require('firebase-admin');

// Replace with the path to your service account key file
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userEmail = process.argv[2]; // Get user email from command line argument

if (!userEmail) {
  console.log('Usage: node setAdmin.js <user_email>');
  process.exit(1);
}

async function setAdminClaim() {
  try {
    const user = await admin.auth().getUserByEmail(userEmail);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'Manager' });
    console.log(`Successfully set custom claim for user ${userEmail} to role: Manager`);
    // Optionally, update Firestore document as well for consistency
    const db = admin.firestore();
    await db.collection('users').doc(user.uid).update({ role: 'Manager' });
    console.log(`Successfully updated Firestore document for user ${userEmail}`);
  } catch (error) {
    console.error('Error setting custom claim:', error);
  }
  process.exit();
}

setAdminClaim();